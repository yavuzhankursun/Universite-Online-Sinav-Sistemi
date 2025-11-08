from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import bcrypt

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False)  # admin, department_head, instructor, student
    name = db.Column(db.String(200), nullable=True)  # Türkçe isim
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    courses_taught = db.relationship('Course', backref='instructor', lazy=True, foreign_keys='Course.instructor_id')
    student_courses = db.relationship('StudentCourse', backref='student', lazy=True)
    exam_attempts = db.relationship('ExamAttempt', backref='student', lazy=True)
    exams_created = db.relationship('Exam', backref='instructor', lazy=True)
    
    def set_password(self, password):
        """Şifreyi hash'le ve kaydet"""
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        """Şifreyi kontrol et"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'role': self.role,
            'name': self.name,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Department(db.Model):
    __tablename__ = 'departments'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    
    courses = db.relationship('Course', backref='department', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code
        }


class Course(db.Model):
    __tablename__ = 'courses'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    instructor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    student_courses = db.relationship('StudentCourse', backref='course', lazy=True, cascade='all, delete-orphan')
    exams = db.relationship('Exam', backref='course', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'department_id': self.department_id,
            'instructor_id': self.instructor_id,
            'department': self.department.to_dict() if self.department else None,
            'instructor': self.instructor.to_dict() if self.instructor else None
        }


class StudentCourse(db.Model):
    __tablename__ = 'student_courses'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    enrollment_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('student_id', 'course_id', name='unique_student_course'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'course_id': self.course_id,
            'enrollment_date': self.enrollment_date.isoformat() if self.enrollment_date else None,
            'course': self.course.to_dict() if self.course else None,
            'student': self.student.to_dict() if self.student else None
        }


class Exam(db.Model):
    __tablename__ = 'exams'
    
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    instructor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    exam_type = db.Column(db.String(20), nullable=False)  # vize, final
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    duration_minutes = db.Column(db.Integer, default=10, nullable=False)
    weight_percentage = db.Column(db.Float, nullable=False)  # 0-100 arası
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    questions = db.relationship('Question', backref='exam', lazy=True, cascade='all, delete-orphan')
    attempts = db.relationship('ExamAttempt', backref='exam', lazy=True)
    
    def to_dict(self):
        # UTC zamanlarını ISO formatında UTC olarak gönder (timezone bilgisi ile)
        def format_utc_datetime(dt):
            if dt is None:
                return None
            # Naive datetime ise UTC olarak kabul et ve 'Z' ekle
            if dt.tzinfo is None:
                return dt.isoformat() + 'Z'
            # Timezone'lu datetime ise UTC'ye çevir
            from datetime import timezone
            if dt.tzinfo != timezone.utc:
                dt = dt.astimezone(timezone.utc)
            return dt.isoformat().replace('+00:00', 'Z')
        
        return {
            'id': self.id,
            'course_id': self.course_id,
            'instructor_id': self.instructor_id,
            'exam_type': self.exam_type,
            'start_time': format_utc_datetime(self.start_time),
            'end_time': format_utc_datetime(self.end_time),
            'duration_minutes': self.duration_minutes,
            'weight_percentage': self.weight_percentage,
            'created_at': format_utc_datetime(self.created_at),
            'course': self.course.to_dict() if self.course else None
        }


class Question(db.Model):
    __tablename__ = 'questions'
    
    id = db.Column(db.Integer, primary_key=True)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(50), default='multiple_choice', nullable=False)
    points = db.Column(db.Float, default=1.0, nullable=False)
    
    answer_options = db.relationship('AnswerOption', backref='question', lazy=True, cascade='all, delete-orphan')
    student_answers = db.relationship('StudentAnswer', backref='question', lazy=True)
    
    def to_dict(self, include_correct=False):
        data = {
            'id': self.id,
            'exam_id': self.exam_id,
            'question_text': self.question_text,
            'question_type': self.question_type,
            'points': self.points,
            'answer_options': [opt.to_dict(include_correct=include_correct) for opt in self.answer_options]
        }
        return data


class AnswerOption(db.Model):
    __tablename__ = 'answer_options'
    
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
    option_text = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, default=False, nullable=False)
    
    student_answers = db.relationship('StudentAnswer', backref='selected_option', lazy=True)
    
    def to_dict(self, include_correct=False):
        data = {
            'id': self.id,
            'question_id': self.question_id,
            'option_text': self.option_text
        }
        if include_correct:
            data['is_correct'] = self.is_correct
        return data


class ExamAttempt(db.Model):
    __tablename__ = 'exam_attempts'
    
    id = db.Column(db.Integer, primary_key=True)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=True)
    submitted_at = db.Column(db.DateTime, nullable=True)
    total_score = db.Column(db.Float, default=0.0, nullable=False)
    
    __table_args__ = (db.UniqueConstraint('exam_id', 'student_id', name='unique_exam_student'),)
    
    student_answers = db.relationship('StudentAnswer', backref='attempt', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'exam_id': self.exam_id,
            'student_id': self.student_id,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'total_score': self.total_score,
            'exam': self.exam.to_dict() if self.exam else None,
            'student': self.student.to_dict() if self.student else None
        }


class StudentAnswer(db.Model):
    __tablename__ = 'student_answers'
    
    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.Integer, db.ForeignKey('exam_attempts.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
    selected_option_id = db.Column(db.Integer, db.ForeignKey('answer_options.id'), nullable=True)
    is_correct = db.Column(db.Boolean, default=False, nullable=False)
    points_earned = db.Column(db.Float, default=0.0, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'attempt_id': self.attempt_id,
            'question_id': self.question_id,
            'selected_option_id': self.selected_option_id,
            'is_correct': self.is_correct,
            'points_earned': self.points_earned
        }

