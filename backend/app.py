from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Extensions
    db.init_app(app)
    jwt = JWTManager(app)
    CORS(app, 
         resources={r"/api/*": {
             "origins": "*",
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"]
         }},
         supports_credentials=True)
    
    # JWT Error Handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token süresi dolmuş. Lütfen tekrar giriş yapın.'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        import traceback
        print(f"=== INVALID TOKEN ERROR ===")
        print(f"Error: {error}")
        print(f"Request headers: {request.headers}")
        print(f"Authorization header: {request.headers.get('Authorization', 'NOT FOUND')}")
        traceback.print_exc()
        return jsonify({'error': f'Geçersiz token: {str(error)}'}), 422
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        from flask import request
        print(f"=== MISSING TOKEN ERROR ===")
        print(f"Error: {error}")
        print(f"Request headers: {request.headers}")
        print(f"Authorization header: {request.headers.get('Authorization', 'NOT FOUND')}")
        return jsonify({'error': f'Token bulunamadı: {str(error)}'}), 422
    
    @jwt.needs_fresh_token_loader
    def token_not_fresh_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token yenilenmeli. Lütfen tekrar giriş yapın.'}), 401
    
    # Register blueprints
    from routes.auth import auth_bp
    from routes.admin import admin_bp
    from routes.instructor import instructor_bp
    from routes.student import student_bp
    from routes.department_head import department_head_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(instructor_bp, url_prefix='/api/instructor')
    app.register_blueprint(student_bp, url_prefix='/api/student')
    app.register_blueprint(department_head_bp, url_prefix='/api/department-head')
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)

