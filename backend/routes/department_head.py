from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Course, Exam, ExamAttempt, StudentCourse, Department
from middleware import role_required
from services.grade_service import get_course_statistics, get_class_statistics
from sqlalchemy import func

department_head_bp = Blueprint('department_head', __name__)


@department_head_bp.route('/courses', methods=['GET'])
@jwt_required()
@role_required('department_head')
def get_all_courses():
    """Tüm dersleri görüntüleme"""
    try:
        courses = Course.query.all()
        
        return jsonify({
            'courses': [course.to_dict() for course in courses]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@department_head_bp.route('/students', methods=['GET'])
@jwt_required()
@role_required('department_head')
def get_all_students():
    """Tüm öğrencileri görüntüleme"""
    try:
        students = User.query.filter_by(role='student').all()
        
        return jsonify({
            'students': [student.to_dict() for student in students]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@department_head_bp.route('/statistics', methods=['GET'])
@jwt_required()
@role_required('department_head')
def get_statistics():
    """Sınıf ve ders ortalamaları"""
    try:
        # Genel istatistikler
        general_stats = get_class_statistics()
        
        # Tüm dersler için istatistikler
        courses = Course.query.all()
        course_statistics = []
        
        for course in courses:
            stats = get_course_statistics(course.id)
            course_statistics.append({
                'course': course.to_dict(),
                'statistics': stats
            })
        
        # Sınıf ortalamaları (tüm öğrenciler için)
        all_students = User.query.filter_by(role='student').all()
        student_grades = []
        
        for student in all_students:
            # Öğrencinin kayıtlı olduğu dersler
            enrollments = StudentCourse.query.filter_by(student_id=student.id).all()
            course_grades = []
            
            for enrollment in enrollments:
                from services.grade_service import calculate_course_grade
                grade_info = calculate_course_grade(student.id, enrollment.course_id)
                if grade_info:
                    course_grades.append({
                        'course': enrollment.course.to_dict(),
                        'grade': grade_info
                    })
            
            if course_grades:
                # Öğrencinin genel ortalaması
                avg_grade = sum(g['grade']['final_grade'] for g in course_grades) / len(course_grades)
                student_grades.append({
                    'student': student.to_dict(),
                    'courses': course_grades,
                    'overall_average': round(avg_grade, 2)
                })
        
        # Genel sınıf ortalaması
        if student_grades:
            overall_class_average = sum(s['overall_average'] for s in student_grades) / len(student_grades)
        else:
            overall_class_average = 0
        
        return jsonify({
            'general_statistics': general_stats,
            'course_statistics': course_statistics,
            'student_grades': student_grades,
            'overall_class_average': round(overall_class_average, 2)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@department_head_bp.route('/courses/<int:course_id>/statistics', methods=['GET'])
@jwt_required()
@role_required('department_head')
def get_course_statistics_detail(course_id):
    """Belirli bir ders için detaylı istatistikler"""
    try:
        course = Course.query.get(course_id)
        if not course:
            return jsonify({'error': 'Ders bulunamadı'}), 404
        
        stats = get_course_statistics(course_id)
        
        # Derse kayıtlı öğrenciler ve notları
        enrollments = StudentCourse.query.filter_by(course_id=course_id).all()
        student_details = []
        
        for enrollment in enrollments:
            from services.grade_service import calculate_course_grade
            grade_info = calculate_course_grade(enrollment.student_id, course_id)
            
            student_details.append({
                'student': enrollment.student.to_dict(),
                'grade': grade_info
            })
        
        return jsonify({
            'course': course.to_dict(),
            'statistics': stats,
            'student_details': student_details
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

