from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from models import User


def role_required(*roles):
    """Rol bazlı erişim kontrolü decorator"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask import request
            try:
                # Debug: Token'ı kontrol et
                auth_header = request.headers.get('Authorization', '')
                print(f"=== ROLE REQUIRED DEBUG ===")
                print(f"Endpoint: {request.path}")
                print(f"Authorization header: {auth_header[:50] if auth_header else 'NOT FOUND'}")
                
                verify_jwt_in_request()
                current_user_id_str = get_jwt_identity()
                # Token'da string olarak saklanıyor, integer'a çevir
                current_user_id = int(current_user_id_str) if current_user_id_str else None
                user = User.query.get(current_user_id)
                
                if not user or user.role not in roles:
                    return jsonify({'error': 'Bu işlem için yetkiniz yok'}), 403
                
                return f(*args, **kwargs)
            except Exception as e:
                import traceback
                error_msg = str(e)
                print(f"=== MIDDLEWARE ERROR ===")
                print(f"Error: {error_msg}")
                print(f"Authorization header: {request.headers.get('Authorization', 'NOT FOUND')}")
                traceback.print_exc()
                if 'token' in error_msg.lower() or 'authorization' in error_msg.lower():
                    return jsonify({'error': 'Token bulunamadı veya geçersiz. Lütfen giriş yapın.'}), 401
                return jsonify({'error': f'Kimlik doğrulama hatası: {error_msg}'}), 401
        return decorated_function
    return decorator

