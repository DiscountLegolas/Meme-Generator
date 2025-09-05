from flask import Blueprint, request, jsonify
from auth import (
    create_user, authenticate_user, generate_token, 
    validate_signup_data, validate_login_data
)

# Create Blueprint for authentication routes
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        print(data)
        # Validate input data
        is_valid, error_message = validate_signup_data(username, email, password)
        if not is_valid:
            return jsonify({'error': error_message}), 400
        
        # Create user
        user_id, error = create_user(username, email, password)
        if error:
            if "already exists" in error:
                return jsonify({'error': error}), 409
            return jsonify({'error': error}), 500
        
        return jsonify({
            'success': True,
            'message': 'User created successfully'
        }), 201
        
    except Exception as e:
        print(f"Signup error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        # Validate input data
        is_valid, error_message = validate_login_data(email, password)
        if not is_valid:
            return jsonify({'error': error_message}), 400
        
        # Authenticate user
        user, error = authenticate_user(email, password)
        if error:
            return jsonify({'error': error}), 401
        
        # Generate token
        token = generate_token(user['_id'])
        
        # Return user data (without password) and token
        user_data = {
            'id': str(user['_id']),
            'username': user['username'],
            'email': user['email'],
            'created_at': user['created_at'].isoformat(),
            'meme_count': user.get('meme_count', 0),
            'role':user.get('role', 'user')
        }
        
        return jsonify({
            'success': True,
            'token': token,
            'user': user_data
        }), 200
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
