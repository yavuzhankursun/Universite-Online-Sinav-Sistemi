from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Course, Department, StudentCourse, Exam
from middleware import role_required
from datetime import datetime

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/users', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_user():
    """Öğrenci/öğretim üyesi/bölüm başkanı ekleme"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        role = data.get('role')
        name = data.get('name', '')  # İsim alanı (opsiyonel ama önerilir)
        
        if not email or not password or not role:
            return jsonify({'error': 'Email, şifre ve rol gereklidir'}), 400
        
        if role not in ['student', 'instructor', 'department_head']:
            return jsonify({'error': 'Geçersiz rol. Sadece student, instructor veya department_head olabilir'}), 400
        
        # Email kontrolü
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Bu email zaten kullanılıyor'}), 400
        
        # Yeni kullanıcı oluştur
        new_user = User(email=email, role=role, name=name if name else None)
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        # Toplam sayıları kontrol et
        total_students = User.query.filter_by(role='student').count()
        total_instructors = User.query.filter_by(role='instructor').count()
        
        warnings = []
        if role == 'student' and total_students < 10:
            warnings.append(f'Minimum 10 öğrenci gereklidir (Şu an: {total_students})')
        if role == 'instructor' and total_instructors < 2:
            warnings.append(f'Minimum 2 öğretim üyesi gereklidir (Şu an: {total_instructors})')
        
        return jsonify({
            'message': 'Kullanıcı başarıyla oluşturuldu',
            'user': new_user.to_dict(),
            'total_students': total_students,
            'total_instructors': total_instructors,
            'warnings': warnings if warnings else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_users():
    """Tüm kullanıcıları listeleme"""
    try:
        role_filter = request.args.get('role')
        
        query = User.query
        if role_filter:
            query = query.filter_by(role=role_filter)
        
        users = query.all()
        
        return jsonify({
            'users': [user.to_dict() for user in users]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/departments', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_department():
    """Departman oluşturma"""
    try:
        data = request.get_json()
        name = data.get('name')
        code = data.get('code')
        
        if not name or not code:
            return jsonify({'error': 'İsim ve kod gereklidir'}), 400
        
        # Kod kontrolü
        if Department.query.filter_by(code=code).first():
            return jsonify({'error': 'Bu kod zaten kullanılıyor'}), 400
        
        new_department = Department(name=name, code=code)
        db.session.add(new_department)
        db.session.commit()
        
        return jsonify({
            'message': 'Departman başarıyla oluşturuldu',
            'department': new_department.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/courses', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_course():
    """Ders oluşturma"""
    try:
        data = request.get_json()
        code = data.get('code')
        name = data.get('name')
        department_id = data.get('department_id')
        instructor_id = data.get('instructor_id')
        
        if not code or not name or not department_id or not instructor_id:
            return jsonify({'error': 'Kod, isim, departman ve öğretim üyesi gereklidir'}), 400
        
        # Kod kontrolü
        if Course.query.filter_by(code=code).first():
            return jsonify({'error': 'Bu ders kodu zaten kullanılıyor'}), 400
        
        # Öğretim üyesi kontrolü
        instructor = User.query.get(instructor_id)
        if not instructor or instructor.role != 'instructor':
            return jsonify({'error': 'Geçersiz öğretim üyesi'}), 400
        
        # Departman kontrolü
        if not Department.query.get(department_id):
            return jsonify({'error': 'Geçersiz departman'}), 400
        
        new_course = Course(
            code=code,
            name=name,
            department_id=department_id,
            instructor_id=instructor_id
        )
        
        db.session.add(new_course)
        db.session.commit()
        
        # Toplam ders sayısını kontrol et
        total_courses = Course.query.count()
        
        return jsonify({
            'message': 'Ders başarıyla oluşturuldu',
            'course': new_course.to_dict(),
            'total_courses': total_courses,
            'warning': 'Minimum 4 ders gereklidir' if total_courses < 4 else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/assignments', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_assignment():
    """Ders atamaları (öğrenci-ders, öğretim üyesi-ders)"""
    try:
        data = request.get_json()
        assignment_type = data.get('type')  # 'student_course' veya 'instructor_course'
        
        if assignment_type == 'student_course':
            student_id = data.get('student_id')
            course_id = data.get('course_id')
            
            if not student_id or not course_id:
                return jsonify({'error': 'Öğrenci ve ders ID gereklidir'}), 400
            
            # Öğrenci kontrolü
            student = User.query.get(student_id)
            if not student or student.role != 'student':
                return jsonify({'error': 'Geçersiz öğrenci'}), 400
            
            # Ders kontrolü
            if not Course.query.get(course_id):
                return jsonify({'error': 'Geçersiz ders'}), 400
            
            # Zaten atanmış mı?
            if StudentCourse.query.filter_by(student_id=student_id, course_id=course_id).first():
                return jsonify({'error': 'Bu öğrenci zaten bu derse kayıtlı'}), 400
            
            new_assignment = StudentCourse(
                student_id=student_id,
                course_id=course_id
            )
            
            db.session.add(new_assignment)
            db.session.commit()
            
            # Öğrencinin toplam ders sayısını kontrol et
            student_course_count = StudentCourse.query.filter_by(student_id=student_id).count()
            
            return jsonify({
                'message': 'Öğrenci derse başarıyla atandı',
                'assignment': new_assignment.to_dict(),
                'student_course_count': student_course_count,
                'warning': 'Her öğrenci minimum 2 derse kayıtlı olmalıdır' if student_course_count < 2 else None
            }), 201
        
        elif assignment_type == 'instructor_course':
            instructor_id = data.get('instructor_id')
            course_id = data.get('course_id')
            
            if not instructor_id or not course_id:
                return jsonify({'error': 'Öğretim üyesi ve ders ID gereklidir'}), 400
            
            # Öğretim üyesi kontrolü
            instructor = User.query.get(instructor_id)
            if not instructor or instructor.role != 'instructor':
                return jsonify({'error': 'Geçersiz öğretim üyesi'}), 400
            
            # Ders kontrolü ve güncelleme
            course = Course.query.get(course_id)
            if not course:
                return jsonify({'error': 'Geçersiz ders'}), 400
            
            course.instructor_id = instructor_id
            db.session.commit()
            
            # Öğretim üyesinin toplam ders sayısını kontrol et
            instructor_course_count = Course.query.filter_by(instructor_id=instructor_id).count()
            
            return jsonify({
                'message': 'Öğretim üyesi derse başarıyla atandı',
                'course': course.to_dict(),
                'instructor_course_count': instructor_course_count,
                'warning': 'Her öğretim üyesine minimum 2 ders atanmalıdır' if instructor_course_count < 2 else None
            }), 200
        
        else:
            return jsonify({'error': 'Geçersiz atama tipi'}), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/departments', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_departments():
    """Tüm departmanları listele"""
    try:
        departments = Department.query.all()
        return jsonify({
            'departments': [dept.to_dict() for dept in departments]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/courses', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_courses():
    """Tüm dersleri listele"""
    try:
        courses = Course.query.all()
        return jsonify({
            'courses': [course.to_dict() for course in courses]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_user(user_id):
    """Kullanıcı silme (minimum sayı kontrolü ile)"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Kullanıcı bulunamadı'}), 404
        
        # Admin silinemez
        if user.role == 'admin':
            return jsonify({'error': 'Admin kullanıcısı silinemez'}), 400
        
        role = user.role
        
        # Minimum sayı kontrolü
        if role == 'student':
            total_students = User.query.filter_by(role='student').count()
            if total_students <= 10:
                return jsonify({
                    'error': f'Minimum 10 öğrenci gereklidir. Şu an {total_students} öğrenci var. Silme işlemi yapılamaz.'
                }), 400
        
        elif role == 'instructor':
            total_instructors = User.query.filter_by(role='instructor').count()
            if total_instructors <= 2:
                return jsonify({
                    'error': f'Minimum 2 öğretim üyesi gereklidir. Şu an {total_instructors} öğretim üyesi var. Silme işlemi yapılamaz.'
                }), 400
            
            # Öğretim üyesinin dersleri varsa kontrol et
            instructor_courses = Course.query.filter_by(instructor_id=user_id).all()
            if instructor_courses:
                return jsonify({
                    'error': f'Bu öğretim üyesinin {len(instructor_courses)} dersi var. Önce dersleri başka bir öğretim üyesine atayın.'
                }), 400
        
        # Öğrenci ise ders kayıtlarını sil
        if role == 'student':
            StudentCourse.query.filter_by(student_id=user_id).delete()
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            'message': 'Kullanıcı başarıyla silindi',
            'remaining_count': User.query.filter_by(role=role).count()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/courses/<int:course_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_course(course_id):
    """Ders silme (minimum sayı kontrolü ile)"""
    try:
        course = Course.query.get(course_id)
        if not course:
            return jsonify({'error': 'Ders bulunamadı'}), 404
        
        # Minimum ders sayısı kontrolü
        total_courses = Course.query.count()
        if total_courses <= 4:
            return jsonify({
                'error': f'Minimum 4 ders gereklidir. Şu an {total_courses} ders var. Silme işlemi yapılamaz.'
            }), 400
        
        # Derse kayıtlı öğrenciler varsa kontrol et
        student_count = StudentCourse.query.filter_by(course_id=course_id).count()
        if student_count > 0:
            return jsonify({
                'error': f'Bu derse {student_count} öğrenci kayıtlı. Önce öğrenci kayıtlarını kaldırın.'
            }), 400
        
        # Dersin sınavları varsa kontrol et
        exam_count = Exam.query.filter_by(course_id=course_id).count()
        if exam_count > 0:
            return jsonify({
                'error': f'Bu dersin {exam_count} sınavı var. Önce sınavları silin.'
            }), 400
        
        db.session.delete(course)
        db.session.commit()
        
        return jsonify({
            'message': 'Ders başarıyla silindi',
            'remaining_courses': Course.query.count()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/departments/<int:department_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_department(department_id):
    """Departman silme"""
    try:
        department = Department.query.get(department_id)
        if not department:
            return jsonify({'error': 'Departman bulunamadı'}), 404
        
        # Departmana bağlı dersler varsa kontrol et
        course_count = Course.query.filter_by(department_id=department_id).count()
        if course_count > 0:
            return jsonify({
                'error': f'Bu departmana {course_count} ders bağlı. Önce dersleri silin veya başka bir departmana taşıyın.'
            }), 400
        
        db.session.delete(department)
        db.session.commit()
        
        return jsonify({
            'message': 'Departman başarıyla silindi'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/assignments/<int:assignment_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_assignment(assignment_id):
    """Öğrenci-ders atamasını silme"""
    try:
        assignment = StudentCourse.query.get(assignment_id)
        if not assignment:
            return jsonify({'error': 'Atama bulunamadı'}), 404
        
        student_id = assignment.student_id
        
        # Minimum ders sayısı kontrolü
        student_course_count = StudentCourse.query.filter_by(student_id=student_id).count()
        if student_course_count <= 2:
            return jsonify({
                'error': f'Her öğrenci minimum 2 derse kayıtlı olmalıdır. Şu an {student_course_count} ders var. Silme işlemi yapılamaz.'
            }), 400
        
        db.session.delete(assignment)
        db.session.commit()
        
        return jsonify({
            'message': 'Atama başarıyla silindi',
            'remaining_courses': StudentCourse.query.filter_by(student_id=student_id).count()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

