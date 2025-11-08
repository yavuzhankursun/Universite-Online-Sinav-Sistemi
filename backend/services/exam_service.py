from datetime import datetime, timedelta
from models import db, Exam, ExamAttempt, StudentAnswer, Question, AnswerOption
from sqlalchemy import and_
from utils.timezone import get_istanbul_now


def check_exam_time(exam):
    """Sınav zamanı kontrolü - sınav aktif mi? (İstanbul saati UTC+3)"""
    # İstanbul saatine göre kontrol et
    now = get_istanbul_now()
    # Veritabanındaki zamanlar UTC olarak saklanıyor, karşılaştırma için UTC kullan
    return exam.start_time <= now <= exam.end_time


def can_start_exam(exam, student_id):
    """Öğrenci sınava başlayabilir mi?"""
    # Zaman kontrolü
    if not check_exam_time(exam):
        return False, "Sınav zamanı dışında"
    
    # Daha önce giriş yapılmış mı?
    existing_attempt = ExamAttempt.query.filter_by(
        exam_id=exam.id,
        student_id=student_id
    ).first()
    
    if existing_attempt:
        return False, "Bu sınava zaten giriş yaptınız"
    
    # Öğrenci bu derse kayıtlı mı?
    from models import StudentCourse
    enrollment = StudentCourse.query.filter_by(
        student_id=student_id,
        course_id=exam.course_id
    ).first()
    
    if not enrollment:
        return False, "Bu derse kayıtlı değilsiniz"
    
    return True, "OK"


def auto_submit_exam(attempt_id):
    """Sınavı otomatik olarak gönder (zaman dolduğunda - İstanbul saati)"""
    attempt = ExamAttempt.query.get(attempt_id)
    if not attempt or attempt.submitted_at:
        return
    
    exam = attempt.exam
    # İstanbul saatine göre kontrol et
    now = get_istanbul_now()
    
    # Sınav süresi dolmuş mu veya end_time geçmiş mi?
    exam_end_time = attempt.start_time + timedelta(minutes=exam.duration_minutes)
    if now >= exam_end_time or now >= exam.end_time:
        calculate_exam_score(attempt)
        attempt.submitted_at = now
        attempt.end_time = now
        db.session.commit()


def calculate_exam_score(attempt):
    """Sınav puanını hesapla"""
    total_points = 0.0
    max_points = 0.0
    
    # Tüm soruları al
    exam = attempt.exam
    questions = Question.query.filter_by(exam_id=exam.id).all()
    
    for question in questions:
        max_points += question.points
        
        # Öğrencinin cevabını bul
        student_answer = StudentAnswer.query.filter_by(
            attempt_id=attempt.id,
            question_id=question.id
        ).first()
        
        if student_answer and student_answer.is_correct:
            total_points += question.points
    
    # Toplam puanı güncelle
    attempt.total_score = total_points
    db.session.commit()
    
    return {
        'total_score': total_points,
        'max_score': max_points,
        'percentage': (total_points / max_points * 100) if max_points > 0 else 0
    }


def get_random_questions(exam_id):
    """Sınav sorularını rastgele sırala"""
    questions = Question.query.filter_by(exam_id=exam_id).all()
    import random
    random.shuffle(questions)
    return questions

