from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Course, Exam, ExamAttempt, StudentAnswer, Question, AnswerOption, StudentCourse
from middleware import role_required
from datetime import datetime, timedelta
from services.exam_service import check_exam_time, can_start_exam, calculate_exam_score, get_random_questions
from services.question_service import get_exam_questions_randomized
from services.grade_service import calculate_course_grade, get_course_statistics
from sqlalchemy import and_
from utils.timezone import get_istanbul_now

student_bp = Blueprint('student', __name__)


@student_bp.route('/courses', methods=['GET'])
@jwt_required()
@role_required('student')
def get_my_courses():
    """Kayıtlı dersleri görüntüleme"""
    try:
        current_user_id_str = get_jwt_identity()
        current_user_id = int(current_user_id_str) if current_user_id_str else None
        
        enrollments = StudentCourse.query.filter_by(student_id=current_user_id).all()
        courses = [enrollment.course.to_dict() for enrollment in enrollments]
        
        return jsonify({
            'courses': courses
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@student_bp.route('/exams', methods=['GET'])
@jwt_required()
@role_required('student')
def get_active_exams():
    """Aktif sınavları görüntüleme"""
    try:
        current_user_id_str = get_jwt_identity()
        current_user_id = int(current_user_id_str) if current_user_id_str else None
        # İstanbul saatine göre kontrol et
        now = get_istanbul_now()
        
        # Öğrencinin kayıtlı olduğu dersler
        enrollments = StudentCourse.query.filter_by(student_id=current_user_id).all()
        course_ids = [enrollment.course_id for enrollment in enrollments]
        
        if not course_ids:
            return jsonify({'exams': [], 'upcoming_exams': []}), 200
        
        # Aktif sınavlar (zaman aralığında ve henüz girilmemiş) - İstanbul saatine göre
        active_exams = Exam.query.filter(
            Exam.course_id.in_(course_ids),
            Exam.start_time <= now,
            Exam.end_time >= now
        ).all()
        
        exam_list = []
        for exam in active_exams:
            # Daha önce giriş yapılmış mı?
            attempt = ExamAttempt.query.filter_by(
                exam_id=exam.id,
                student_id=current_user_id
            ).first()
            
            exam_data = exam.to_dict()
            exam_data['can_start'] = attempt is None
            exam_data['already_taken'] = attempt is not None and attempt.submitted_at is not None
            exam_data['in_progress'] = attempt is not None and attempt.submitted_at is None
            
            exam_list.append(exam_data)
        
        # Yaklaşan sınavlar (henüz başlamamış) - İstanbul saatine göre
        upcoming_exams = Exam.query.filter(
            Exam.course_id.in_(course_ids),
            Exam.start_time > now
        ).order_by(Exam.start_time.asc()).all()
        
        upcoming_list = []
        for exam in upcoming_exams:
            exam_data = exam.to_dict()
            exam_data['is_upcoming'] = True
            exam_data['can_start'] = False
            exam_data['already_taken'] = False
            exam_data['in_progress'] = False
            upcoming_list.append(exam_data)
        
        return jsonify({
            'exams': exam_list,
            'upcoming_exams': upcoming_list
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@student_bp.route('/exams/<int:exam_id>', methods=['GET'])
@jwt_required()
@role_required('student')
def get_exam_details(exam_id):
    """Sınav detayları ve sorular (rastgele sıralama)"""
    try:
        current_user_id_str = get_jwt_identity()
        current_user_id = int(current_user_id_str) if current_user_id_str else None
        
        exam = Exam.query.get(exam_id)
        if not exam:
            return jsonify({'error': 'Sınav bulunamadı'}), 404
        
        # Öğrenci bu derse kayıtlı mı?
        enrollment = StudentCourse.query.filter_by(
            student_id=current_user_id,
            course_id=exam.course_id
        ).first()
        
        if not enrollment:
            return jsonify({'error': 'Bu derse kayıtlı değilsiniz'}), 403
        
        # Sınav girişi var mı?
        attempt = ExamAttempt.query.filter_by(
            exam_id=exam_id,
            student_id=current_user_id
        ).first()
        
        if not attempt:
            return jsonify({'error': 'Sınava henüz giriş yapmadınız'}), 400
        
        # Soruları rastgele sırala (doğru cevapları gösterme)
        questions = get_exam_questions_randomized(exam_id, include_correct=False)
        
        # Öğrencinin cevaplarını ekle
        for question in questions:
            student_answer = StudentAnswer.query.filter_by(
                attempt_id=attempt.id,
                question_id=question['id']
            ).first()
            
            if student_answer:
                question['selected_option_id'] = student_answer.selected_option_id
        
        return jsonify({
            'exam': exam.to_dict(),
            'attempt': attempt.to_dict(),
            'questions': questions
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@student_bp.route('/exams/<int:exam_id>/start', methods=['POST'])
@jwt_required()
@role_required('student')
def start_exam(exam_id):
    """Sınav başlatma (zaman kontrolü)"""
    try:
        current_user_id_str = get_jwt_identity()
        current_user_id = int(current_user_id_str) if current_user_id_str else None
        
        exam = Exam.query.get(exam_id)
        if not exam:
            return jsonify({'error': 'Sınav bulunamadı'}), 404
        
        # Sınava başlayabilir mi?
        can_start, message = can_start_exam(exam, current_user_id)
        if not can_start:
            return jsonify({'error': message}), 400
        
        # Minimum 5 soru kontrolü
        question_count = Question.query.filter_by(exam_id=exam_id).count()
        if question_count < 5:
            return jsonify({'error': 'Sınavda yeterli soru yok (minimum 5 soru gereklidir)'}), 400
        
        # Yeni sınav girişi oluştur - İstanbul saatine göre
        now = get_istanbul_now()
        new_attempt = ExamAttempt(
            exam_id=exam_id,
            student_id=current_user_id,
            start_time=now
        )
        
        db.session.add(new_attempt)
        db.session.commit()
        
        # Soruları rastgele sırala
        questions = get_exam_questions_randomized(exam_id, include_correct=False)
        
        return jsonify({
            'message': 'Sınav başlatıldı',
            'exam': exam.to_dict(),
            'attempt': new_attempt.to_dict(),
            'questions': questions,
            'duration_minutes': exam.duration_minutes
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@student_bp.route('/exams/<int:exam_id>/submit', methods=['POST'])
@jwt_required()
@role_required('student')
def submit_exam(exam_id):
    """Sınav gönderme"""
    try:
        current_user_id_str = get_jwt_identity()
        current_user_id = int(current_user_id_str) if current_user_id_str else None
        
        exam = Exam.query.get(exam_id)
        if not exam:
            return jsonify({'error': 'Sınav bulunamadı'}), 404
        
        # Sınav girişini bul
        attempt = ExamAttempt.query.filter_by(
            exam_id=exam_id,
            student_id=current_user_id
        ).first()
        
        if not attempt:
            return jsonify({'error': 'Sınava henüz giriş yapmadınız'}), 400
        
        if attempt.submitted_at:
            return jsonify({'error': 'Bu sınav zaten gönderildi'}), 400
        
        # Zaman kontrolü - İstanbul saatine göre
        now = get_istanbul_now()
        exam_end_time = attempt.start_time + timedelta(minutes=exam.duration_minutes)
        
        if now > exam.end_time:
            # Sınav zamanı geçmiş, otomatik gönder
            pass
        elif now > exam_end_time:
            # Süre dolmuş
            pass
        
        # Cevapları kaydet
        data = request.get_json()
        answers = data.get('answers', [])  # [{question_id, selected_option_id}, ...]
        
        # Mevcut cevapları sil
        StudentAnswer.query.filter_by(attempt_id=attempt.id).delete()
        
        # Yeni cevapları kaydet
        for answer_data in answers:
            question_id = answer_data.get('question_id')
            selected_option_id = answer_data.get('selected_option_id')
            
            if not question_id:
                continue
            
            # Doğru cevabı kontrol et
            question = Question.query.get(question_id)
            if not question:
                continue
            
            is_correct = False
            points_earned = 0.0
            
            if selected_option_id:
                selected_option = AnswerOption.query.get(selected_option_id)
                if selected_option and selected_option.is_correct:
                    is_correct = True
                    points_earned = question.points
            
            student_answer = StudentAnswer(
                attempt_id=attempt.id,
                question_id=question_id,
                selected_option_id=selected_option_id,
                is_correct=is_correct,
                points_earned=points_earned
            )
            db.session.add(student_answer)
        
        # Puanı hesapla
        calculate_exam_score(attempt)
        
        # Gönderim zamanını kaydet
        attempt.submitted_at = now
        attempt.end_time = now
        
        db.session.commit()
        
        return jsonify({
            'message': 'Sınav başarıyla gönderildi',
            'attempt': attempt.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@student_bp.route('/exams/<int:exam_id>/result', methods=['GET'])
@jwt_required()
@role_required('student')
def get_exam_result(exam_id):
    """Kendi sonucu ve genel ortalama"""
    try:
        current_user_id_str = get_jwt_identity()
        current_user_id = int(current_user_id_str) if current_user_id_str else None
        
        exam = Exam.query.get(exam_id)
        if not exam:
            return jsonify({'error': 'Sınav bulunamadı'}), 404
        
        # Öğrencinin sınav girişi
        attempt = ExamAttempt.query.filter_by(
            exam_id=exam_id,
            student_id=current_user_id
        ).first()
        
        if not attempt or not attempt.submitted_at:
            return jsonify({'error': 'Sınav sonucu bulunamadı'}), 404
        
        # Öğrencinin puanı
        max_points = sum(q.points for q in exam.questions)
        student_percentage = (attempt.total_score / max_points * 100) if max_points > 0 else 0
        
        # Genel ortalama
        all_attempts = ExamAttempt.query.filter_by(exam_id=exam_id).filter(
            ExamAttempt.submitted_at.isnot(None)
        ).all()
        
        if all_attempts:
            total_scores = [a.total_score for a in all_attempts]
            average_score = sum(total_scores) / len(total_scores)
            average_percentage = (average_score / max_points * 100) if max_points > 0 else 0
        else:
            average_score = 0
            average_percentage = 0
        
        return jsonify({
            'exam': exam.to_dict(),
            'my_result': {
                'score': attempt.total_score,
                'max_score': max_points,
                'percentage': round(student_percentage, 2)
            },
            'statistics': {
                'average_score': round(average_score, 2),
                'average_percentage': round(average_percentage, 2),
                'total_participants': len(all_attempts)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

