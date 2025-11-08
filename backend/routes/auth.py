from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User
from datetime import datetime
from utils.timezone import get_istanbul_time

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    """Kullanıcı girişi - JWT token döner"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email ve şifre gereklidir'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Geçersiz email veya şifre'}), 401
        
        # JWT token oluştur - identity string olmalı
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={'role': user.role, 'email': user.email}
        )
        
        return jsonify({
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/register', methods=['POST'])
@jwt_required()
def register():
    """Admin için kullanıcı oluşturma"""
    try:
        current_user_id_str = get_jwt_identity()
        current_user_id = int(current_user_id_str) if current_user_id_str else None
        current_user = User.query.get(current_user_id)
        
        # Sadece admin kullanıcı oluşturabilir
        if not current_user or current_user.role != 'admin':
            return jsonify({'error': 'Bu işlem için admin yetkisi gereklidir'}), 403
        
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        role = data.get('role')
        
        if not email or not password or not role:
            return jsonify({'error': 'Email, şifre ve rol gereklidir'}), 400
        
        if role not in ['admin', 'department_head', 'instructor', 'student']:
            return jsonify({'error': 'Geçersiz rol'}), 400
        
        # Email kontrolü
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Bu email zaten kullanılıyor'}), 400
        
        # Yeni kullanıcı oluştur
        new_user = User(
            email=email,
            role=role
        )
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'Kullanıcı başarıyla oluşturuldu',
            'user': new_user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Mevcut kullanıcı bilgilerini döner"""
    try:
        current_user_id_str = get_jwt_identity()
        current_user_id = int(current_user_id_str) if current_user_id_str else None
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'Kullanıcı bulunamadı'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/time', methods=['GET'])
def get_istanbul_server_time():
    """İstanbul saatini döndürür (public endpoint)"""
    try:
        istanbul_time = get_istanbul_time()
        # datetime-local input formatı için: "YYYY-MM-DDTHH:mm"
        formatted_time = istanbul_time.strftime('%Y-%m-%dT%H:%M')
        # ISO format için de döndür
        iso_time = istanbul_time.isoformat()
        
        return jsonify({
            'istanbul_time': formatted_time,
            'istanbul_time_iso': iso_time,
            'timezone': 'Europe/Istanbul',
            'utc_offset': '+03:00'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

