import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
from pymongo import MongoClient
import os

from config import config
import os
from bson import ObjectId

# Get configuration
current_config = config[os.environ.get('FLASK_ENV', 'default')]
SECRET_KEY = current_config.SECRET_KEY
JWT_SECRET_KEY = current_config.JWT_SECRET_KEY
JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=current_config.JWT_ACCESS_TOKEN_EXPIRES)

# MongoDB connection
try:
    client = MongoClient(current_config.MONGODB_URI)
    db = client[current_config.MONGODB_DB]
    users_collection = db['users']
    print("Connected to MongoDB successfully!")
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")
    users_collection = None

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
            user_id_from_token = data.get('user_id')
            if not user_id_from_token:
                return jsonify({'error': 'Invalid token'}), 401
            try:
                object_id = ObjectId(user_id_from_token)
            except Exception:
                return jsonify({'error': 'Invalid token'}), 401
            current_user = users_collection.find_one({'_id': object_id})
            if not current_user:
                return jsonify({'error': 'Invalid token'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

# Helper functions
def generate_token(user_id):
    payload = {
        'user_id': str(user_id),
        'exp': datetime.utcnow() + JWT_ACCESS_TOKEN_EXPIRES,
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")

def hash_password(password):
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def verify_password(password, hashed_password):
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password)

def create_user(username, email, password, role='user'):
    """Create a new user in the database"""
    if users_collection is None:
        return None, "Database connection failed"
    
    # Check if username already exists
    if users_collection.find_one({'username': username}):
        return None, "Username already exists"
    
    # Check if email already exists
    if users_collection.find_one({'email': email}):
        return None, "Email already exists"
    
    # Hash password
    hashed_password = hash_password(password)
    
    # Create user
    user_data = {
        'username': username,
        'email': email,
        'password': hashed_password,
        'role': role,
        'created_at': datetime.utcnow(),
        'meme_count': 0
    }
    
    result = users_collection.insert_one(user_data)
    return result.inserted_id, None

def authenticate_user(email, password):
    """Authenticate a user and return user data if successful"""
    if users_collection is None:
        return None, "Database connection failed"
    
    # Find user by email
    user = users_collection.find_one({'email': email})
    if not user:
        return None, "Invalid email or password"
    
    # Check password
    if not verify_password(password, user['password']):
        return None, "Invalid email or password"
    
    return user, None

def get_user_by_id(user_id):
    """Get user by ID"""
    if users_collection is None:
        return None
    
    return users_collection.find_one({'_id': user_id})

def update_user_meme_count(user_id):
    """Increment user's meme count"""
    if users_collection is None:
        return False
    
    try:
        users_collection.update_one(
            {'_id': user_id},
            {'$inc': {'meme_count': 1}}
        )
        return True
    except Exception as e:
        print(f"Error updating meme count: {e}")
        return False

def validate_signup_data(username, email, password):
    """Validate signup data"""
    if not username or not email or not password:
        return False, "All fields are required"
    
    if len(username) < 3:
        return False, "Username must be at least 3 characters long"
    
    if len(password) < 6:
        return False, "Password must be at least 6 characters long"
    
    # Basic email validation
    if '@' not in email or '.' not in email:
        return False, "Please enter a valid email address"
    
    return True, None

def validate_login_data(email, password):
    """Validate login data"""
    if not email or not password:
        return False, "Email and password are required"
    
    return True, None
