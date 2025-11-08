from models import db, Exam, ExamAttempt, Course, StudentCourse
from sqlalchemy import func


def calculate_course_grade(student_id, course_id):
    """Ders başarı notunu hesapla (ağırlıklı ortalama)"""
    # Öğrencinin bu dersteki tüm sınav girişlerini al
    attempts = db.session.query(ExamAttempt).join(Exam).filter(
        ExamAttempt.student_id == student_id,
        Exam.course_id == course_id,
        ExamAttempt.submitted_at.isnot(None)
    ).all()
    
    if not attempts:
        return None
    
    # Her sınav tipi için puanları topla
    vize_score = 0.0
    final_score = 0.0
    vize_weight = 0.0
    final_weight = 0.0
    
    for attempt in attempts:
        exam = attempt.exam
        
        # Toplam puanı hesapla
        total_points = attempt.total_score
        max_points = sum(q.points for q in exam.questions)
        percentage = (total_points / max_points * 100) if max_points > 0 else 0
        
        if exam.exam_type == 'vize':
            vize_score = percentage
            vize_weight = exam.weight_percentage
        elif exam.exam_type == 'final':
            final_score = percentage
            final_weight = exam.weight_percentage
    
    # Ağırlıklı ortalama hesapla
    if vize_weight + final_weight > 0:
        final_grade = (vize_score * vize_weight + final_score * final_weight) / (vize_weight + final_weight)
    else:
        final_grade = (vize_score + final_score) / 2 if (vize_score > 0 or final_score > 0) else 0
    
    return {
        'vize_score': vize_score,
        'final_score': final_score,
        'vize_weight': vize_weight,
        'final_weight': final_weight,
        'final_grade': round(final_grade, 2)
    }


def get_course_statistics(course_id):
    """Ders istatistiklerini hesapla"""
    # Derse kayıtlı öğrenci sayısı
    student_count = StudentCourse.query.filter_by(course_id=course_id).count()
    
    # Sınav sayıları
    exams = Exam.query.filter_by(course_id=course_id).all()
    
    statistics = {
        'student_count': student_count,
        'exam_count': len(exams),
        'exams': []
    }
    
    for exam in exams:
        # Bu sınava giren öğrenci sayısı
        attempt_count = ExamAttempt.query.filter(
            ExamAttempt.exam_id == exam.id,
            ExamAttempt.submitted_at.isnot(None)
        ).count()
        
        # Ortalama puan
        avg_score = db.session.query(func.avg(ExamAttempt.total_score)).filter(
            ExamAttempt.exam_id == exam.id,
            ExamAttempt.submitted_at.isnot(None)
        ).scalar() or 0.0
        
        # Maksimum puan
        max_points = sum(q.points for q in exam.questions)
        
        statistics['exams'].append({
            'exam_id': exam.id,
            'exam_type': exam.exam_type,
            'attempt_count': attempt_count,
            'average_score': round(float(avg_score), 2),
            'max_score': max_points,
            'average_percentage': round((float(avg_score) / max_points * 100) if max_points > 0 else 0, 2)
        })
    
    return statistics


def get_class_statistics():
    """Sınıf ve genel istatistikler"""
    from models import User, Course
    
    total_students = User.query.filter_by(role='student').count()
    total_instructors = User.query.filter_by(role='instructor').count()
    total_courses = Course.query.count()
    
    return {
        'total_students': total_students,
        'total_instructors': total_instructors,
        'total_courses': total_courses
    }

