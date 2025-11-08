from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Course, Exam, Question, AnswerOption, ExamAttempt, StudentCourse
from middleware import role_required
from datetime import datetime
from services.grade_service import get_course_statistics
from sqlalchemy import and_
from utils.timezone import parse_istanbul_datetime, get_istanbul_now

instructor_bp = Blueprint('instructor', __name__)


@instructor_bp.route('/courses', methods=['GET'])
@jwt_required()
@role_required('instructor')
def get_my_courses():
    """Kendi derslerini görüntüleme"""
    try:
        current_user_id_str = get_jwt_identity()
        current_user_id = int(current_user_id_str) if current_user_id_str else None
        courses = Course.query.filter_by(instructor_id=current_user_id).all()
        
        return jsonify({
            'courses': [course.to_dict() for course in courses]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@instructor_bp.route('/courses/<int:course_id>/students', methods=['GET'])
@jwt_required()
@role_required('instructor')
def get_course_students(course_id):
    """Ders öğrencilerini görüntüleme"""
    try:
        current_user_id_str = get_jwt_identity()
        current_user_id = int(current_user_id_str) if current_user_id_str else None
        
        # Ders kontrolü - öğretim üyesinin dersi mi?
        course = Course.query.filter_by(id=course_id, instructor_id=current_user_id).first()
        if not course:
            return jsonify({'error': 'Ders bulunamadı veya yetkiniz yok'}), 404
        
        # Derse kayıtlı öğrenciler
        enrollments = StudentCourse.query.filter_by(course_id=course_id).all()
        students = [enrollment.student.to_dict() for enrollment in enrollments]
        
        return jsonify({
            'course': course.to_dict(),
            'students': students
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@instructor_bp.route('/exams', methods=['POST'])
@jwt_required()
@role_required('instructor')
def create_exam():
    """Test oluşturma (vize/final)"""
    try:
        current_user_id_str = get_jwt_identity()
        current_user_id = int(current_user_id_str) if current_user_id_str else None
        data = request.get_json()
        
        course_id = data.get('course_id')
        exam_type = data.get('exam_type')
        start_time_str = data.get('start_time')
        end_time_str = data.get('end_time')
        duration_minutes = data.get('duration_minutes', 10)
        weight_percentage = data.get('weight_percentage')
        
        if not course_id or not exam_type or not start_time_str or not end_time_str or weight_percentage is None:
            return jsonify({'error': 'Tüm alanlar gereklidir'}), 400
        
        if exam_type not in ['vize', 'final']:
            return jsonify({'error': 'Sınav tipi vize veya final olmalıdır'}), 400
        
        # Ders kontrolü
        course = Course.query.filter_by(id=course_id, instructor_id=current_user_id).first()
        if not course:
            return jsonify({'error': 'Ders bulunamadı veya yetkiniz yok'}), 404
        
        # Zaman parse - İstanbul saatine göre (frontend'den gelen zaman İstanbul saati olarak kabul edilir)
        try:
            # Frontend'den gelen zaman string'i İstanbul saati olarak parse et ve UTC'ye çevir
            start_time = parse_istanbul_datetime(start_time_str)
            end_time = parse_istanbul_datetime(end_time_str)
        except Exception as e:
            return jsonify({'error': f'Geçersiz tarih formatı: {str(e)}'}), 400
        
        # Geçmiş tarih kontrolü
        now = get_istanbul_now()
        if start_time < now:
            return jsonify({'error': 'Sınav başlangıç zamanı geçmiş bir tarih olamaz'}), 400
        
        if start_time >= end_time:
            return jsonify({'error': 'Bitiş zamanı başlangıç zamanından sonra olmalıdır'}), 400
        
        # Yeni sınav oluştur
        new_exam = Exam(
            course_id=course_id,
            instructor_id=current_user_id,
            exam_type=exam_type,
            start_time=start_time,
            end_time=end_time,
            duration_minutes=duration_minutes,
            weight_percentage=weight_percentage
        )
        
        db.session.add(new_exam)
        db.session.commit()
        
        # Bu ders için sınav sayısını kontrol et
        course_exams = Exam.query.filter_by(course_id=course_id).all()
        vize_count = sum(1 for e in course_exams if e.exam_type == 'vize')
        final_count = sum(1 for e in course_exams if e.exam_type == 'final')
        
        warnings = []
        if vize_count < 1:
            warnings.append('Her ders için en az bir vize sınavı gereklidir')
        if final_count < 1:
            warnings.append('Her ders için en az bir final sınavı gereklidir')
        
        return jsonify({
            'message': 'Sınav başarıyla oluşturuldu',
            'exam': new_exam.to_dict(),
            'vize_count': vize_count,
            'final_count': final_count,
            'warnings': warnings if warnings else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@instructor_bp.route('/exams/<int:exam_id>/questions', methods=['POST'])
@jwt_required()
@role_required('instructor')
def add_question(exam_id):
    """Soru ekleme (min 5 soru kontrolü)"""
    try:
        current_user_id_str = get_jwt_identity()
        current_user_id = int(current_user_id_str) if current_user_id_str else None
        
        # Sınav kontrolü
        exam = Exam.query.filter_by(id=exam_id, instructor_id=current_user_id).first()
        if not exam:
            return jsonify({'error': 'Sınav bulunamadı veya yetkiniz yok'}), 404
        
        data = request.get_json()
        question_text = data.get('question_text')
        points = data.get('points', 1.0)
        answer_options = data.get('answer_options', [])
        
        if not question_text or not answer_options:
            return jsonify({'error': 'Soru metni ve cevap seçenekleri gereklidir'}), 400
        
        if len(answer_options) < 2:
            return jsonify({'error': 'En az 2 cevap seçeneği gereklidir'}), 400
        
        # En az bir doğru cevap olmalı
        correct_count = sum(1 for opt in answer_options if opt.get('is_correct', False))
        if correct_count == 0:
            return jsonify({'error': 'En az bir doğru cevap seçeneği gereklidir'}), 400
        
        # Yeni soru oluştur
        new_question = Question(
            exam_id=exam_id,
            question_text=question_text,
            question_type='multiple_choice',
            points=points
        )
        
        db.session.add(new_question)
        db.session.flush()  # ID'yi almak için
        
        # Cevap seçeneklerini ekle
        for opt_data in answer_options:
            option = AnswerOption(
                question_id=new_question.id,
                option_text=opt_data.get('option_text'),
                is_correct=opt_data.get('is_correct', False)
            )
            db.session.add(option)
        
        db.session.commit()
        
        # Toplam soru sayısını kontrol et
        total_questions = Question.query.filter_by(exam_id=exam_id).count()
        
        return jsonify({
            'message': 'Soru başarıyla eklendi',
            'question': new_question.to_dict(include_correct=True),
            'total_questions': total_questions,
            'warning': 'En az 5 soru gereklidir' if total_questions < 5 else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@instructor_bp.route('/exams/<int:exam_id>/questions', methods=['GET'])
@jwt_required()
@role_required('instructor')
def get_exam_questions(exam_id):
    """Sınav sorularını listele"""
    try:
        current_user_id_str = get_jwt_identity()
        current_user_id = int(current_user_id_str) if current_user_id_str else None
        
        exam = Exam.query.filter_by(id=exam_id, instructor_id=current_user_id).first()
        if not exam:
            return jsonify({'error': 'Sınav bulunamadı veya yetkiniz yok'}), 404
        
        questions = Question.query.filter_by(exam_id=exam_id).all()
        
        return jsonify({
            'exam': exam.to_dict(),
            'questions': [q.to_dict(include_correct=True) for q in questions]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@instructor_bp.route('/questions/<int:question_id>', methods=['PUT'])
@jwt_required()
@role_required('instructor')
def update_question(question_id):
    """Soru güncelleme"""
    try:
        current_user_id_str = get_jwt_identity()
        current_user_id = int(current_user_id_str) if current_user_id_str else None
        
        question = Question.query.get(question_id)
        if not question:
            return jsonify({'error': 'Soru bulunamadı'}), 404
        
        # Sınav kontrolü
        exam = Exam.query.filter_by(id=question.exam_id, instructor_id=current_user_id).first()
        if not exam:
            return jsonify({'error': 'Sınav bulunamadı veya yetkiniz yok'}), 404
        
        data = request.get_json()
        question_text = data.get('question_text')
        points = data.get('points')
        answer_options = data.get('answer_options')
        
        if question_text:
            question.question_text = question_text
        if points is not None:
            question.points = points
        
        # Cevap seçeneklerini güncelle
        if answer_options:
            if len(answer_options) < 2:
                return jsonify({'error': 'En az 2 cevap seçeneği gereklidir'}), 400
            
            correct_count = sum(1 for opt in answer_options if opt.get('is_correct', False))
            if correct_count == 0:
                return jsonify({'error': 'En az bir doğru cevap seçeneği gereklidir'}), 400
            
            # Mevcut seçenekleri sil
            AnswerOption.query.filter_by(question_id=question_id).delete()
            
            # Yeni seçenekleri ekle
            for opt_data in answer_options:
                option = AnswerOption(
                    question_id=question_id,
                    option_text=opt_data.get('option_text'),
                    is_correct=opt_data.get('is_correct', False)
                )
                db.session.add(option)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Soru başarıyla güncellendi',
            'question': question.to_dict(include_correct=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@instructor_bp.route('/questions/<int:question_id>', methods=['DELETE'])
@jwt_required()
@role_required('instructor')
def delete_question(question_id):
    """Soru silme"""
    try:
        current_user_id_str = get_jwt_identity()
        current_user_id = int(current_user_id_str) if current_user_id_str else None
        
        question = Question.query.get(question_id)
        if not question:
            return jsonify({'error': 'Soru bulunamadı'}), 404
        
        # Sınav kontrolü
        exam = Exam.query.filter_by(id=question.exam_id, instructor_id=current_user_id).first()
        if not exam:
            return jsonify({'error': 'Sınav bulunamadı veya yetkiniz yok'}), 404
        
        # Minimum 5 soru kontrolü
        total_questions = Question.query.filter_by(exam_id=exam.id).count()
        if total_questions <= 5:
            return jsonify({'error': 'Minimum 5 soru gereklidir. Soru silinemez'}), 400
        
        db.session.delete(question)
        db.session.commit()
        
        return jsonify({
            'message': 'Soru başarıyla silindi',
            'remaining_questions': total_questions - 1
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@instructor_bp.route('/exams/<int:exam_id>', methods=['PUT'])
@jwt_required()
@role_required('instructor')
def update_exam(exam_id):
    """Sınav bilgilerini güncelle (ağırlık veya zaman)"""
    try:
        current_user_id_str = get_jwt_identity()
        current_user_id = int(current_user_id_str) if current_user_id_str else None
        
        exam = Exam.query.filter_by(id=exam_id, instructor_id=current_user_id).first()
        if not exam:
            return jsonify({'error': 'Sınav bulunamadı veya yetkiniz yok'}), 404
        
        data = request.get_json()
        weight_percentage = data.get('weight_percentage')
        start_time_str = data.get('start_time')
        end_time_str = data.get('end_time')
        duration_minutes = data.get('duration_minutes')
        
        updated_fields = []
        
        # Ağırlık güncelleme
        if weight_percentage is not None:
            if not (0 <= weight_percentage <= 100):
                return jsonify({'error': 'Ağırlık yüzdesi 0-100 arasında olmalıdır'}), 400
            exam.weight_percentage = weight_percentage
            updated_fields.append('ağırlık')
        
        # Zaman güncelleme
        if start_time_str and end_time_str:
            try:
                start_time = parse_istanbul_datetime(start_time_str)
                end_time = parse_istanbul_datetime(end_time_str)
            except Exception as e:
                return jsonify({'error': f'Geçersiz tarih formatı: {str(e)}'}), 400
            
            # Geçmiş tarih kontrolü
            from utils.timezone import get_istanbul_now
            now = get_istanbul_now()
            if start_time < now:
                return jsonify({'error': 'Sınav başlangıç zamanı geçmiş bir tarih olamaz'}), 400
            
            if start_time >= end_time:
                return jsonify({'error': 'Bitiş zamanı başlangıç zamanından sonra olmalıdır'}), 400
            
            exam.start_time = start_time
            exam.end_time = end_time
            updated_fields.append('zaman')
            
            if duration_minutes is not None:
                exam.duration_minutes = duration_minutes
                updated_fields.append('süre')
        
        if not updated_fields:
            return jsonify({'error': 'Güncellenecek alan belirtilmedi'}), 400
        
        db.session.commit()
        
        message = f'Sınav {", ".join(updated_fields)} başarıyla güncellendi'
        return jsonify({
            'message': message,
            'exam': exam.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@instructor_bp.route('/exams/<int:exam_id>/results', methods=['GET'])
@jwt_required()
@role_required('instructor')
def get_exam_results(exam_id):
    """Sınav sonuçları ve ortalamaları"""
    try:
        current_user_id_str = get_jwt_identity()
        current_user_id = int(current_user_id_str) if current_user_id_str else None
        
        exam = Exam.query.filter_by(id=exam_id, instructor_id=current_user_id).first()
        if not exam:
            return jsonify({'error': 'Sınav bulunamadı veya yetkiniz yok'}), 404
        
        # Tüm sınav girişlerini al
        attempts = ExamAttempt.query.filter_by(exam_id=exam_id).filter(
            ExamAttempt.submitted_at.isnot(None)
        ).all()
        
        # İstatistikler
        total_attempts = len(attempts)
        max_points = sum(q.points for q in exam.questions)
        
        if total_attempts > 0:
            total_scores = [attempt.total_score for attempt in attempts]
            average_score = sum(total_scores) / total_attempts
            average_percentage = (average_score / max_points * 100) if max_points > 0 else 0
        else:
            average_score = 0
            average_percentage = 0
        
        # Öğrenci sonuçları
        student_results = []
        for attempt in attempts:
            percentage = (attempt.total_score / max_points * 100) if max_points > 0 else 0
            student_results.append({
                'student': attempt.student.to_dict(),
                'score': attempt.total_score,
                'max_score': max_points,
                'percentage': round(percentage, 2),
                'submitted_at': attempt.submitted_at.isoformat() if attempt.submitted_at else None
            })
        
        return jsonify({
            'exam': exam.to_dict(),
            'statistics': {
                'total_attempts': total_attempts,
                'average_score': round(average_score, 2),
                'average_percentage': round(average_percentage, 2),
                'max_score': max_points
            },
            'student_results': student_results
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@instructor_bp.route('/exams', methods=['GET'])
@jwt_required()
@role_required('instructor')
def get_my_exams():
    """Kendi sınavlarını listele"""
    try:
        current_user_id_str = get_jwt_identity()
        current_user_id = int(current_user_id_str) if current_user_id_str else None
        exams = Exam.query.filter_by(instructor_id=current_user_id).all()
        
        return jsonify({
            'exams': [exam.to_dict() for exam in exams]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500



