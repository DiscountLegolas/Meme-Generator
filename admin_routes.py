from flask import Blueprint, request, jsonify
from auth import token_required, users_collection
from functools import wraps
from pymongo import MongoClient
import os
from datetime import datetime
from config import config
import json
from werkzeug.utils import secure_filename
from Generate.Helpers import load_templates
# Create Blueprint for admin routes
admin_bp = Blueprint('admin', __name__)

# Get configuration
current_config = config[os.environ.get('FLASK_ENV', 'default')]

# MongoDB connection for memes collection
try:
    client = MongoClient(current_config.MONGODB_URI)
    db = client[current_config.MONGODB_DB]
    memes_collection = db['memes']
except Exception as e:
    print(f"Failed to connect to MongoDB for memes: {e}")
    memes_collection = None

def is_admin(user):
    """Check if user is admin"""
    return user.get('role') == 'admin'

def admin_required(f):
    """Decorator to require admin privileges"""
    @wraps(f)
    def decorated(*args, **kwargs):
        # This will be called by token_required first
        # The current_user will be passed as the first argument
        if len(args) > 0:
            current_user = args[0]
            if not is_admin(current_user):
                return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated

# MongoDB connection for templates
try:
    client_templates = MongoClient(current_config.MONGODB_URI)
    db_templates = client_templates[current_config.MONGODB_DB]
    meme_templates_collection = db_templates['meme_templates']
except Exception as e:
    print(f"Failed to connect to MongoDB for meme_templates: {e}")
    meme_templates_collection = None


# --- File upload helpers ---
ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

def is_allowed_image(filename):
    if not filename or "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in ALLOWED_IMAGE_EXTENSIONS

def ensure_memes_directory():
    memes_dir = os.path.join(os.getcwd(), "Memes")
    try:
        os.makedirs(memes_dir, exist_ok=True)
    except Exception as e:
        print(f"Failed to ensure Memes directory: {e}")
    return memes_dir

# User Management Routes
@admin_bp.route('/users', methods=['GET'])
@token_required
@admin_required
def get_users(current_user):
    """Get all users"""
    try:
        if users_collection is None:
            return jsonify({'error': 'Database connection failed'}), 500
        
        # Get query parameters for pagination and filtering
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        search = request.args.get('search', '')
        
        # Build query
        query = {}
        if search:
            query = {
                '$or': [
                    {'username': {'$regex': search, '$options': 'i'}},
                    {'email': {'$regex': search, '$options': 'i'}}
                ]
            }
        
        # Get total count
        total_users = users_collection.count_documents(query)
        
        # Get users with pagination
        skip = (page - 1) * limit
        users = list(users_collection.find(query, {'password': 0}).skip(skip).limit(limit).sort('created_at', -1))
        
        # Convert ObjectId to string for JSON serialization
        for user in users:
            user['_id'] = str(user['_id'])
            if 'created_at' in user:
                user['created_at'] = user['created_at'].isoformat()
        
        return jsonify({
            'users': users,
            'total': total_users,
            'page': page,
            'limit': limit,
            'pages': (total_users + limit - 1) // limit
        })
        
    except Exception as e:
        print(f"Error getting users: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/users', methods=['POST'])
@token_required
@admin_required
def create_user_admin(current_user):
    """Create a new user (admin only)."""
    try:
        if users_collection is None:
            return jsonify({'error': 'Database connection failed'}), 500

        data = request.get_json() or {}
        username = (data.get('username') or '').strip()
        email = (data.get('email') or '').strip().lower()
        password = data.get('password')
        role = data.get('role', 'user')

        if not username or not email or not password:
            return jsonify({'error': 'username, email, password are required'}), 400

        # Uniqueness checks
        if users_collection.find_one({'username': username}):
            return jsonify({'error': 'Username already exists'}), 409
        if users_collection.find_one({'email': email}):
            return jsonify({'error': 'Email already exists'}), 409

        import bcrypt
        from datetime import datetime
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        user_doc = {
            'username': username,
            'email': email,
            'password': hashed_password,
            'role': role,
            'created_at': datetime.utcnow(),
            'meme_count': 0
        }
        result = users_collection.insert_one(user_doc)
        created = users_collection.find_one({'_id': result.inserted_id}, {'password': 0})
        created['_id'] = str(created['_id'])
        if 'created_at' in created:
            created['created_at'] = created['created_at'].isoformat()
        return jsonify({'success': True, 'user': created}), 201
    except Exception as e:
        print(f"Error creating user: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/users/<user_id>', methods=['GET'])
@token_required
@admin_required
def get_user(current_user, user_id):
    """Get specific user by ID"""
    try:
        if users_collection is None:
            return jsonify({'error': 'Database connection failed'}), 500
        
        from bson import ObjectId
        user = users_collection.find_one({'_id': ObjectId(user_id)}, {'password': 0})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user['_id'] = str(user['_id'])
        if 'created_at' in user:
            user['created_at'] = user['created_at'].isoformat()
        
        return jsonify(user)
        
    except Exception as e:
        print(f"Error getting user: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/users/<user_id>', methods=['PUT'])
@token_required
@admin_required
def update_user(current_user, user_id):
    """Update user information"""
    try:
        if users_collection is None:
            return jsonify({'error': 'Database connection failed'}), 500
        
        data = request.get_json()
        from bson import ObjectId
        
        # Fields that can be updated
        update_data = {}
        if 'username' in data:
            update_data['username'] = data['username'].strip()
        if 'email' in data:
            update_data['email'] = data['email'].strip().lower()
        if 'role' in data:
            update_data['role'] = data['role']
        if 'meme_count' in data:
            update_data['meme_count'] = int(data['meme_count'])
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        # Check for duplicate username/email if updating those fields
        if 'username' in update_data:
            existing_user = users_collection.find_one({
                'username': update_data['username'],
                '_id': {'$ne': ObjectId(user_id)}
            })
            if existing_user:
                return jsonify({'error': 'Username already exists'}), 409
        
        if 'email' in update_data:
            existing_user = users_collection.find_one({
                'email': update_data['email'],
                '_id': {'$ne': ObjectId(user_id)}
            })
            if existing_user:
                return jsonify({'error': 'Email already exists'}), 409
        
        # Update user
        result = users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'success': True, 'message': 'User updated successfully'})
        
    except Exception as e:
        print(f"Error updating user: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user(current_user, user_id):
    """Delete user"""
    try:
        if users_collection is None:
            return jsonify({'error': 'Database connection failed'}), 500
        
        from bson import ObjectId
        
        # Don't allow admin to delete themselves
        if str(current_user['_id']) == user_id:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        # Delete user
        result = users_collection.delete_one({'_id': ObjectId(user_id)})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'User not found'}), 404
        
        # Also delete user's memes
        if memes_collection is not None:
            memes_collection.delete_many({'user_id': user_id})
        
        return jsonify({'success': True, 'message': 'User deleted successfully'})
        
    except Exception as e:
        print(f"Error deleting user: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# Meme Management Routes
@admin_bp.route('/memes', methods=['GET'])
@token_required
@admin_required
def get_memes(current_user):
    """Get all memes"""
    try:
        if memes_collection is None:
            return jsonify({'error': 'Database connection failed'}), 500
        
        # Get query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        search = request.args.get('search', '')
        user_id = request.args.get('user_id', '')
        
        # Build query
        query = {}
        if search:
            query['topic'] = {'$regex': search, '$options': 'i'}
        if user_id:
            query['user_id'] = user_id
        
        # Get total count
        total_memes = memes_collection.count_documents(query)
        
        # Get memes with pagination
        skip = (page - 1) * limit
        memes = list(memes_collection.find(query).skip(skip).limit(limit).sort('created_at', -1))
        
        # Convert ObjectId to string
        for meme in memes:
            meme['_id'] = str(meme['_id'])
            if 'created_at' in meme:
                meme['created_at'] = meme['created_at'].isoformat()
        print(memes)
        print(total_memes)
        return jsonify({
            'memes': memes,
            'total': total_memes,
            'page': page,
            'limit': limit,
            'pages': (total_memes + limit - 1) // limit
        })
        
    except Exception as e:
        print(f"Error getting memes: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/memes', methods=['POST'])
@token_required
@admin_required
def create_meme_admin(current_user):
    """Insert a meme record (admin). Does not generate image, just stores metadata."""
    try:
        if memes_collection is None:
            return jsonify({'error': 'Database connection failed'}), 500
        data = request.get_json() or {}
        required = ['user_id', 'username', 'topic', 'template', 'file_path']
        missing = [k for k in required if not data.get(k)]
        if missing:
            return jsonify({'error': f"Missing fields: {', '.join(missing)}"}), 400
        from datetime import datetime
        doc = {
            'user_id': data['user_id'],
            'username': data['username'],
            'topic': data['topic'],
            'template': data['template'],
            'file_path': data['file_path'],
            'created_at': datetime.utcnow()
        }
        result = memes_collection.insert_one(doc)
        created = memes_collection.find_one({'_id': result.inserted_id})
        created['_id'] = str(created['_id'])
        if 'created_at' in created:
            created['created_at'] = created['created_at'].isoformat()
        return jsonify({'success': True, 'meme': created}), 201
    except Exception as e:
        print(f"Error creating meme: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/memes/<meme_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_meme(current_user, meme_id):
    """Delete meme"""
    try:
        if memes_collection is None:
            return jsonify({'error': 'Database connection failed'}), 500
        
        from bson import ObjectId
        
        # Get meme info before deletion
        meme = memes_collection.find_one({'_id': ObjectId(meme_id)})
        if not meme:
            return jsonify({'error': 'Meme not found'}), 404
        
        # Delete meme from database
        result = memes_collection.delete_one({'_id': ObjectId(meme_id)})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Meme not found'}), 404
        
        # Delete meme file if it exists
        if 'file_path' in meme:
            try:
                import os
                if os.path.exists(meme['file_path']):
                    os.remove(meme['file_path'])
            except Exception as e:
                print(f"Error deleting meme file: {e}")
        
        return jsonify({'success': True, 'message': 'Meme deleted successfully'})
        
    except Exception as e:
        print(f"Error deleting meme: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# Template Management Routes
@admin_bp.route('/templates', methods=['GET'])
@token_required
@admin_required
def get_templates(current_user):
    """Get all meme templates"""
    try:
        templates = load_templates()
        return jsonify(templates)
    except Exception as e:
        print(f"Error getting templates: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/templates/upload', methods=['POST'])
@token_required
@admin_required
def upload_template_image(current_user):
    """Upload a template image to Memes/ and return its stored path.

    Returns JSON { success: True, file: 'Memes/<filename>', filename: '<filename>' }
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part in the request'}), 400
        file_storage = request.files['file']
        if file_storage.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        original_name = secure_filename(file_storage.filename)
        if not is_allowed_image(original_name):
            return jsonify({'error': 'Unsupported file type'}), 400

        memes_dir = ensure_memes_directory()

        # Create a unique filename to avoid collisions
        name_root, name_ext = os.path.splitext(original_name)
        safe_root = name_root[:80] if len(name_root) > 80 else name_root
        unique_suffix = datetime.utcnow().strftime('%Y%m%d%H%M%S%f')
        stored_filename = f"{safe_root}_{unique_suffix}{name_ext}"
        stored_path = os.path.join(memes_dir, stored_filename)

        file_storage.save(stored_path)

        # Return relative path expected by the rest of the app
        return jsonify({
            'success': True,
            'file': f"Memes/{stored_filename}",
            'filename': stored_filename
        }), 201
    except Exception as e:
        print(f"Error uploading template image: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/templates', methods=['POST'])
@token_required
@admin_required
def create_template_admin(current_user):
    """Create a new template entry keyed by provided template_key."""
    try:
        if meme_templates_collection is None:
            return jsonify({'error': 'Database connection failed'}), 500
        data = request.get_json() or {}
        template_key = (data.get('key') or '').strip()
        name = (data.get('name') or '').strip()
        file_path = (data.get('file') or '').strip()
        tags = data.get('tags') or []
        explanation = data.get('explanation') or ''
        examples = data.get('examples') or []
        # Enforce examples to be a list with maximum of 10 items
        if not isinstance(examples, list):
            return jsonify({'error': 'examples must be an array'}), 400
        # Normalize: keep objects as objects; trim strings; skip empty
        normalized_examples = []
        for item in examples[:10]:
            if item is None:
                continue
            if isinstance(item, dict):
                cleaned_obj = {}
                for k, v in item.items():
                    # preserve keys; coerce values to trimmed strings
                    if v is None:
                        continue
                    cleaned_obj[str(k)] = str(v).strip()
                if len(cleaned_obj) > 0:
                    normalized_examples.append(cleaned_obj)
            elif isinstance(item, str):
                trimmed = item.strip()
                if trimmed:
                    normalized_examples.append(trimmed)
            else:
                # fallback: stringify non-dict, non-string
                s = str(item).strip()
                if s:
                    normalized_examples.append(s)
        examples = normalized_examples
        if not template_key or not name or not file_path:
            return jsonify({'error': 'key, name, file are required'}), 400
        # Upsert a doc that contains this key
        # Ensure key not already present
        existing = meme_templates_collection.find_one({template_key: {'$exists': True}})
        if existing:
            return jsonify({'error': 'Template key already exists'}), 409
        template = {
            'name': name,
            'file': file_path,
            'tags': tags,
            'explanation': explanation,
            'examples': examples
        }
        meme_templates_collection.update_one(
            {template_key: {'$exists': True}},
            {'$set': {template_key: template}},
            upsert=True
        )
        return jsonify({'success': True, 'template': {template_key: template}}), 201
    except Exception as e:
        print(f"Error creating template: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/templates/<template_key>', methods=['PUT'])
@token_required
@admin_required
def update_template(current_user, template_key):
    """Update template information"""
    try:
        data = request.get_json()
        templates = load_templates()
        
        if template_key not in templates:
            return jsonify({'error': 'Template not found'}), 404
        
        # Update template fields
        template = templates[template_key]
        if 'name' in data:
            template['name'] = data['name']
        if 'tags' in data:
            template['tags'] = data['tags']
        if 'explanation' in data:
            template['explanation'] = data['explanation']
        if 'examples' in data:
            incoming = data.get('examples') or []
            if not isinstance(incoming, list):
                return jsonify({'error': 'examples must be an array'}), 400
            normalized_examples = []
            for item in incoming[:10]:
                if item is None:
                    continue
                if isinstance(item, dict):
                    cleaned_obj = {}
                    for k, v in item.items():
                        if v is None:
                            continue
                        cleaned_obj[str(k)] = str(v).strip()
                    if len(cleaned_obj) > 0:
                        normalized_examples.append(cleaned_obj)
                elif isinstance(item, str):
                    trimmed = item.strip()
                    if trimmed:
                        normalized_examples.append(trimmed)
                else:
                    s = str(item).strip()
                    if s:
                        normalized_examples.append(s)
            template['examples'] = normalized_examples
        
        # Persist to MongoDB
        if meme_templates_collection is None:
            return jsonify({'error': 'Database connection failed'}), 500
        # We store each key in its own document for simpler updates
        from bson import ObjectId
        # Upsert per key: {key: {...template...}}
        meme_templates_collection.update_one(
            {template_key: {'$exists': True}},
            {'$set': {template_key: template}},
            upsert=True
        )
        
        return jsonify({'success': True, 'message': 'Template updated successfully'})
        
    except Exception as e:
        print(f"Error updating template: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# Statistics Routes
@admin_bp.route('/stats', methods=['GET'])
@token_required
@admin_required
def get_stats(current_user):
    """Get admin statistics"""
    try:
        if users_collection is None or memes_collection is None:
            return jsonify({'error': 'Database connection failed'}), 500
        
        # Get basic counts
        total_users = users_collection.count_documents({})
        total_memes = memes_collection.count_documents({})
        
        # Get recent activity
        from datetime import datetime, timedelta
        last_24h = datetime.utcnow() - timedelta(days=1)
        new_users_24h = users_collection.count_documents({'created_at': {'$gte': last_24h}})
        new_memes_24h = memes_collection.count_documents({'created_at': {'$gte': last_24h}})
        
        # Get top users by meme count
        top_users = list(users_collection.find(
            {}, 
            {'username': 1, 'meme_count': 1, 'email': 1}
        ).sort('meme_count', -1).limit(5))
        
        for user in top_users:
            user['_id'] = str(user['_id'])
        
        # Get top templates
        pipeline = [
            {'$group': {'_id': '$template', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
            {'$limit': 5}
        ]
        top_templates = list(memes_collection.aggregate(pipeline))
        
        return jsonify({
            'total_users': total_users,
            'total_memes': total_memes,
            'new_users_24h': new_users_24h,
            'new_memes_24h': new_memes_24h,
            'top_users': top_users,
            'top_templates': top_templates
        })
        
    except Exception as e:
        print(f"Error getting stats: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
