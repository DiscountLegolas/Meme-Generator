import random
import traceback
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import json
import os
from deep_translator import (GoogleTranslator)
from datetime import datetime
from Generate.caption_ai import generate_caption,build_meme_recommender,generate_captions_no_template
from Generate.meme_generator import create_meme,create_meme_from_file, describe_image
from Generate.describe import describe,uploadfile
from auth import token_required, update_user_meme_count, users_collection
from auth_routes import auth_bp
from admin_routes import admin_bp
from Generate.caption_point import generate_captions
from config import config
from pymongo import MongoClient
from PIL import Image
import base64
import tempfile
import uuid
import cv2
import numpy as np
try:
    # DeepFace is optional; endpoints will error clearly if missing
    from deepface import DeepFace
except Exception:
    DeepFace = None
from transformers import WhisperProcessor, WhisperForConditionalGeneration
from bson import ObjectId
import traceback
from flask_cors import CORS
from Generate.Helpers import load_templates
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "https://merry-cheesecake-96d2af.netlify.app"}})
# Load configuration
flask_env = os.environ.get('FLASK_ENV', 'default')
app.config.from_object(config[flask_env])

CORS(app)  # Enable CORS for React frontend

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(admin_bp, url_prefix='/api/admin')

# MongoDB connection for templates
try:
    mongo_client = MongoClient(app.config['MONGODB_URI'])
    mongo_db = mongo_client[app.config['MONGODB_DB']]
    meme_templates_collection = mongo_db['meme_templates']
    user_templates_collection = mongo_db['user_templates']
    memes_collection = mongo_db['memes']
except Exception as e:
    print(f"Failed to connect to MongoDB for meme_templates: {e}")
    meme_templates_collection = None
    user_templates_collection=None
    memes_collection=None




# --------------- Face utilities ---------------
def _resolve_template_image_path(template_identifier: str) -> str:
    """Resolve a template name or id to a local image path.

    - First checks built-in templates via load_templates() by key or by name
    - Then checks user templates collection by Mongo ObjectId
    Returns absolute path to the image if found, else empty string.
    """
    if not template_identifier:
        return ""

    # Built-in templates (Generate/templates.json or Mongo collection)
    try:
        templates = load_templates()
        if template_identifier in templates:
            path_candidate = templates[template_identifier].get("file", "")
            if path_candidate and os.path.exists(path_candidate):
                return os.path.abspath(path_candidate)
        # Try resolve by name match (case-insensitive)
        lower = template_identifier.lower()
        for tpl in templates.values():
            if str(tpl.get("name", "")).lower() == lower:
                path_candidate = tpl.get("file", "")
                if path_candidate and os.path.exists(path_candidate):
                    return os.path.abspath(path_candidate)
    except Exception:
        pass

    # User templates via Mongo id
    try:
        obj_id = ObjectId(template_identifier)
        if user_templates_collection is not None:
            doc = user_templates_collection.find_one({"_id": obj_id})
            if doc:
                file_path = doc.get("file", "")
                if file_path and os.path.exists(file_path):
                    return os.path.abspath(file_path)
                # Also try relative to project root
                candidate = os.path.abspath(os.path.join('.', file_path))
                if os.path.exists(candidate):
                    return candidate
    except Exception:
        # Not a valid ObjectId
        pass

    return ""


def _extract_faces_with_deepface(image_path: str):
    if DeepFace is None:
        raise RuntimeError("DeepFace is not installed. Please install 'deepface'.")
    results = DeepFace.extract_faces(img_path=image_path, enforce_detection=False)
    return results


def _crop_and_encode_faces(image_path: str, detections: list):
    """Given detections from DeepFace, crop faces and return temp paths and base64 strings."""
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError("Failed to read image with OpenCV")
    faces = []
    for idx, det in enumerate(detections):
        area = det.get('facial_area') or det.get('region') or {}
        x, y = int(area.get('x', 0)), int(area.get('y', 0))
        w, h = int(area.get('w', area.get('width', 0))), int(area.get('h', area.get('height', 0)))
        if w <= 0 or h <= 0:
            continue
        x2, y2 = x + w, y + h
        h_img, w_img = img.shape[:2]
        x, y = max(0, x), max(0, y)
        x2, y2 = min(w_img, x2), min(h_img, y2)
        crop = img[y:y2, x:x2]
        if crop.size == 0:
            continue
        # Save to a temp file
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, f"cropped_face_{uuid.uuid4().hex}.png")
        cv2.imwrite(temp_path, crop)
        # Encode base64
        _, buf = cv2.imencode('.png', crop)
        b64 = base64.b64encode(buf.tobytes()).decode('utf-8')
        faces.append({
            'index': idx,
            'bbox': {'x': x, 'y': y, 'w': x2 - x, 'h': y2 - y},
            'temp_path': temp_path,
            'base64': f"data:image/png;base64,{b64}",
        })
    return faces


def _overlay_face(target_img: np.ndarray, source_img: np.ndarray, x: int, y: int, w: int, h: int, alpha: float = 0.8):
    """Resize source to (w,h) and alpha-blend onto target at (x,y)."""
    if w <= 0 or h <= 0:
        return target_img
    h_t, w_t = target_img.shape[:2]
    x, y = max(0, x), max(0, y)
    x2, y2 = min(w_t, x + w), min(h_t, y + h)
    if x2 <= x or y2 <= y:
        return target_img
    region_w, region_h = x2 - x, y2 - y
    resized = cv2.resize(source_img, (region_w, region_h), interpolation=cv2.INTER_LINEAR)
    # Ensure 3 channels
    if resized.ndim == 2:
        resized = cv2.cvtColor(resized, cv2.COLOR_GRAY2BGR)
    roi = target_img[y:y2, x:x2].astype(np.float32)
    src = resized.astype(np.float32)
    blended = cv2.addWeighted(src, alpha, roi, 1.0 - alpha, 0)
    target_img[y:y2, x:x2] = blended.astype(np.uint8)
    return target_img


# Serve static files from React build
@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(f'frontend/build/{path}'):
        return send_file(f'frontend/build/{path}')
    return send_file('frontend/build/index.html')

# API endpoint to generate memes
@app.route('/api/generate-meme', methods=['POST'])
@token_required
def generate_meme(current_user):
    try:
        data = request.get_json()
        topic = data.get('topic')
        language = data.get('lang','en')
        print(language)
        template_key = data.get('template')
        language="tr" if language=="tr-TR" else "en"
        if not topic:
            return jsonify({'error': 'Missing topic'}), 400
        print(language)
        templates = load_templates()
        
        if template_key not in templates:
            template=random.choice(list(templates.values()))
        else:
            template = templates[template_key]
        topiclang=GoogleTranslator(source='auto', target=language).translate(text=topic)
        # Generate captions using your existing AI
        caption_count = len(template.get("captions", {}))
        captions = generate_caption(topiclang,template, template["tags"], template["name"], num_captions=caption_count,lang=language)
        
        # Create the meme using your existing generator
        output_path = create_meme(template, captions)
        
        if output_path and os.path.exists(output_path):
            # Update user's meme count
            update_user_meme_count(current_user['_id'])
            
            # Store meme in database
            from admin_routes import memes_collection
            if memes_collection is not None:
                meme_data = {
                    'user_id': str(current_user['_id']),
                    'username': current_user['username'],
                    'topic': topic,
                    'template': template['name'],
                    'file_path': output_path,
                    'created_at': datetime.utcnow()
                }
                memes_collection.insert_one(meme_data)
            
            # Return the path to the generated meme
            return jsonify({
                'success': True,
                'meme_path': output_path,
                'topic': topic,
                'template': template['name']
            })
        else:
            return jsonify({'error': 'Failed to generate meme'}), 500
            
    except Exception as e:
        traceback.print_exc()
        print(f"Error generating meme: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# Serve generated memes
@app.route('/generated/<filename>')
def serve_generated_meme(filename):
    return send_file(f'GeneratedMemes/{filename}')

# Serve meme template images
@app.route('/Memes/<filename>')
def serve_meme_template(filename):
    return send_file(f'Memes/{filename}')

# API endpoint to get available templates
@app.route('/api/templates')
def get_templates():
    try:
        templates = load_templates()
        # Simplify template data for frontend
        simplified_templates = {}
        for key, template in templates.items():
            simplified_templates[key] = {
                'name': template['name'],
                'file': f'/Memes/{os.path.basename(template["file"])}',
                'description': template.get('explanation', ''),
                'tags': template.get('tags', [])
            }
        return jsonify(simplified_templates)
    except Exception as e:
        return jsonify({'error': 'Failed to load templates'}), 500

@app.route('/api/templatesfront')
def get_templates_front():
    try:
        templates ={}
        with open("Generate/templatesfront.json", "r") as f:
            templates= json.load(f)
        # Simplify template data for frontend
        simplified_templates = {}
        for key, template in templates.items():
            simplified_templates[key] = {
                'name': template['name'],
                'file': f'/Memes/{os.path.basename(template["file"])}',
                'description': template.get('description', ''),
                'tags': template.get('tags', [])
            }
        return jsonify(simplified_templates)
    except Exception as e:
        return jsonify({'error': 'Failed to load templates'}), 500

@app.route('/api/templatestr')
def get_templates_front_tr():
    try:
        templates ={}
        with open("Generate/templatesfront.tr-TR.json", "r") as f:
            templates= json.load(f)
        # Simplify template data for frontend
        simplified_templates = {}
        for key, template in templates.items():
            simplified_templates[key] = {
                'name': template['name'],
                'file': f'/Memes/{os.path.basename(template["file"])}',
                'description': template.get('description', ''),
                'tags': template.get('tags', [])
            }
        return jsonify(simplified_templates)
    except Exception as e:
        return jsonify({'error': 'Failed to load templates'}), 500

# --------- Face Detection & Swap Endpoints ---------
@app.route('/api/detect_faces', methods=['POST'])
@token_required
def detect_faces(current_user):
    try:
        template_identifier = request.form.get('template') or request.json.get('template') if request.is_json else None
        if not template_identifier:
            return jsonify({'error': 'Missing template identifier'}), 400

        image_path = _resolve_template_image_path(template_identifier)
        if not image_path or not os.path.exists(image_path):
            return jsonify({'error': 'Template image not found'}), 404

        detections = _extract_faces_with_deepface(image_path)
        if not detections:
            return jsonify({'error': 'No faces detected'}), 404

        faces = _crop_and_encode_faces(image_path, detections)
        if not faces:
            return jsonify({'error': 'No valid face crops produced'}), 404

        return jsonify({'success': True, 'faces': faces})
    except RuntimeError as re:
        return jsonify({'error': str(re)}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/swap_faces', methods=['POST'])
@token_required
def swap_faces(current_user):
    try:
        # Accept template id/name
        template_identifier = request.form.get('template')
        if not template_identifier:
            return jsonify({'error': 'Missing template identifier'}), 400

        image_path = _resolve_template_image_path(template_identifier)
        if not image_path or not os.path.exists(image_path):
            return jsonify({'error': 'Template image not found'}), 404

        # Parse indices JSON optional
        indices_raw = request.form.get('indices')
        indices = None
        if indices_raw:
            try:
                indices = json.loads(indices_raw)
                if not isinstance(indices, list):
                    indices = None
            except Exception:
                indices = None

        # Collect uploaded source faces (one or more files under key 'sources')
        # Support 'source1','source2',... or 'sources' as multiple
        source_files = []
        if 'sources' in request.files:
            for f in request.files.getlist('sources'):
                if f and f.filename:
                    source_files.append(f)
        else:
            # Fallback to numbered keys
            i = 1
            while True:
                key = f'source{i}'
                if key not in request.files:
                    break
                f = request.files[key]
                if f and f.filename:
                    source_files.append(f)
                i += 1

        if not source_files:
            return jsonify({'error': 'No source face images uploaded'}), 400

        # Load target image and face detections
        target_img = cv2.imread(image_path)
        if target_img is None:
            return jsonify({'error': 'Failed to read template image'}), 500
        detections = _extract_faces_with_deepface(image_path)
        if not detections:
            return jsonify({'error': 'No faces detected in target image'}), 404

        # Prepare source images as numpy arrays
        source_np_images = []
        for f in source_files:
            # Read file bytes into numpy via cv2.imdecode
            bytes_data = f.read()
            arr = np.frombuffer(bytes_data, dtype=np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is not None:
                source_np_images.append(img)
        if not source_np_images:
            return jsonify({'error': 'Failed to decode any source images'}), 400

        # Iterate over target faces and overlay
        src_idx = 0
        for det_idx, det in enumerate(detections):
            if indices is not None and det_idx not in indices:
                continue
            area = det.get('facial_area') or det.get('region') or {}
            x, y = int(area.get('x', 0)), int(area.get('y', 0))
            w = int(area.get('w', area.get('width', 0)))
            h = int(area.get('h', area.get('height', 0)))
            if w <= 0 or h <= 0:
                continue
            source_img = source_np_images[src_idx % len(source_np_images)]
            target_img = _overlay_face(target_img, source_img, x, y, w, h, alpha=0.85)
            src_idx += 1

        # Write final image to a temp file in GeneratedMemes
        os.makedirs('Memes', exist_ok=True)
        out_path = os.path.join('Memes', f"swapped_{uuid.uuid4().hex}.png")
        cv2.imwrite(out_path, target_img)
        return send_file(out_path, mimetype='image/png')
    except RuntimeError as re:
        return jsonify({'error': str(re)}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500

# API endpoint to search templates with AI-powered suitability ranking
@app.route('/api/search-templates', methods=['POST'])
@token_required
def search_templates(current_user):
    try:
        data = request.get_json()
        query = data.get('query', '').lower().strip()
        
        if not query:
            return jsonify({'error': 'Missing search query'}), 400
        querylang=GoogleTranslator(source='auto', target="en").translate(text=query)
        templates = load_templates()
        find_memes = build_meme_recommender(templates)
        scored_templates=find_memes(querylang)
        return jsonify({
            'success': True,
            'templates': scored_templates,
            'query': query
        })
        
    except Exception as e:
        print(f"Error searching templates: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# API endpoint to generate meme from uploaded image
@app.route('/api/template-to-meme', methods=['POST'])
@token_required
def template_to_meme(current_user):
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        topic = request.form.get('topic', '').strip()
        user_id = current_user['_id']
        if not topic:
            return jsonify({'error': 'Missing topic'}), 400
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save uploaded image temporarily
        import tempfile
        import uuid
        uidd=uuid.uuid4()
        # Create unique filename
        filename = f"{uidd}.png"
        temp_path = os.path.join('Memes', filename)
        
        # Save the uploaded image
        file.save(temp_path)
        image = Image.open(temp_path)
        width, height = image.size

        # Get additional template information
        template_name = request.form.get('name', f"{uidd}")
        template_description = request.form.get('description', '')
        original_template = request.form.get('original_template', '')
        if original_template != '':
            templates = load_templates()
            template = templates[original_template]
            meme_doc = {
                "userid": user_id,
                "name": template_name,
                "file": f"Memes/{filename}",
                "tags": template.get('tags', []),
                "captions": template.get('captions', {}),
                "explanation": template_description,
                "explanationfg":template.get('explanation', ''),
                "examples": template.get('examples', []),
                "usageCount":0,
                "createdAt":datetime.utcnow(),
                "original_template": original_template,
            }
            result = user_templates_collection.insert_one(meme_doc)
            return jsonify({
                'success': True,
                'image_path': f'/Memes/{filename}',
                'mongo_id': str(result.inserted_id)
            })
        # Check if caption points were provided in the request
        caption_points = request.form.get('captionPoints')
        if caption_points:
            try:
                caption_points = json.loads(caption_points)
                # Use custom caption points if provided
                captions = {
                    "caption1": caption_points[0] if len(caption_points) > 0 else generate_captions(width, height, 150, 150)["captions"]["caption1"],
                    "caption2": caption_points[1] if len(caption_points) > 1 else generate_captions(width, height, 150, 150)["captions"]["caption2"],
                }
                for i in range(2, len(caption_points)):
                    key=f"caption{i+1}"
                    captions[key] = caption_points[i]

            except:
                # Fallback to default caption points
                captions = generate_captions(width, height, 150, 150)
        else:
            # Use default caption points
            captions = generate_captions(width, height, 150, 150)
            
        user_id = current_user['_id'] # Replace with real user id from auth/session
        describeforgenerating=describe(f"https://www.meme-generator-backend.com/Memes/{filename}")
        meme_doc = {
            "userid": user_id,
            "name": template_name,
            "file": f"Memes/{filename}",
            "tags": [
                "choice",
                "reject",
                "approve",
                "comparison",
                "preference"
            ],
            **captions,
            "explanation": template_description,
            "explanationfg":describeforgenerating,
            "examples": [],
            "usageCount":0,
            "createdAt":datetime.utcnow(),
        }
        result = user_templates_collection.insert_one(meme_doc)
        return jsonify({
            'success': True,
            'image_path': f'/Memes/{filename}',
            'mongo_id': str(result.inserted_id)
        })
        
    except Exception as e:
        print(f"Error in template-to-meme: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# API endpoint to get user's custom templates
@app.route('/api/my-templates', methods=["GET","DELETE"])
@token_required
def get_my_templates(current_user):
    try:
        user_memes_cursor = user_templates_collection.find({'userid': current_user['_id']})
        user_memes = []
        for meme in user_memes_cursor:
            captions_array = [
                {"label": key, **value}
                for key, value in meme["captions"].items()
            ]
            user_memes.append({
            'id': str(meme.get('_id')),
            'name': meme.get('name'),
            'description': meme.get('explanation', ''),
            'imageUrl': meme.get('file'),
            'createdAt': str(meme.get('createdAt', '')),
            'usageCount': meme.get('usageCount', 0),
            'captionPoints':captions_array
        })
        
        return jsonify({'success': True, 'memes': user_memes})
        
    except Exception as e:
        print(f"Error getting user templates: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# API endpoint to update user template
@app.route('/api/update-template', methods=['PUT'])
@token_required
def update_template(current_user):
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        caption_points = data.get('captionPoints', [])
        template_id = data.get('template_id', '').strip()
        
        
        # Update the template in the database
        update_data = {}
        if name:
            update_data['name'] = name
        if description:
            update_data['explanation'] = description
        if caption_points is not None:
                # Use custom caption points if provided
            captions = { }
            for i in range(0, len(caption_points)):
                key=f"caption{i+1}"
                captions[key] = caption_points[i]
            update_data['captions'] = captions
        
        if update_data:
            result = user_templates_collection.update_one(
                {'_id': ObjectId(template_id), 'userid': current_user['_id']},
                {'$set': update_data}
            )
            
            if result.modified_count > 0:
                return jsonify({
                    'success': True,
                    'message': 'Template updated successfully'
                })
            else:
                return jsonify({'error': 'Template not found or no changes made'}), 404
        
        return jsonify({
            'success': True,
            'message': 'No changes to update'
        })
        
    except Exception as e:
        print(f"Error updating template: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# API endpoint to delete user template
@app.route('/api/my-templates/<string:template_id>',methods=["DELETE"])
@token_required
def delete_template(current_user, template_id):
    try:
        # Delete the template from the database
        result = user_templates_collection.delete_one({
            '_id': ObjectId(template_id), 
            'userid': current_user['_id']
        })
        
        if result.deleted_count > 0:
            return jsonify({
                'success': True,
                'message': 'Template deleted successfully'
            })
        else:
            return jsonify({'error': 'Template not found'}), 404
        
    except Exception as e:
        print(f"Error deleting template: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# API endpo3 to get user profile
@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    try:
        template_count = user_templates_collection.count_documents({"userid": current_user['_id']})
        meme_count = memes_collection.count_documents({"user_id": str(current_user['_id'])})


        user_memes = list(
            memes_collection.find({"user_id":str(current_user['_id'])})
            .sort("createdAt", -1)
        )
        profile = {
            'id': str(current_user['_id']),
            'username': current_user['username'],
            'email': current_user['email'],
            'bio': current_user.get('bio', 'I love creating hilarious memes!'),
            'role': current_user.get('role', 'user'),
            'createdAt': str(current_user.get('createdAt', datetime.utcnow())),
            'memeCount': meme_count,
            'templateCount': template_count
        }
        # Build titles with numbering when there are duplicates (including Untitled Meme)
        base_title_counts = {}
        for meme in user_memes:
            base_title = meme.get("topic") or "Untitled Meme"
            base_title_counts[base_title] = base_title_counts.get(base_title, 0) + 1

        seen_title_occurrences = {}
        memes = []
        for meme in user_memes:
            base_title = meme.get("topic") or "Untitled Meme"
            total_for_title = base_title_counts.get(base_title, 1)
            if total_for_title > 1:
                seen = seen_title_occurrences.get(base_title, 0) + 1
                seen_title_occurrences[base_title] = seen
                display_title = f"{base_title} {seen}"
            else:
                display_title = base_title
            memes.append({
                "id": str(meme["_id"]),
                "title": display_title,
                "imageUrl": meme.get("file_path"),
                "createdAt": str(meme.get("createdAt", datetime.utcnow())),
            })
        
        return jsonify({
            'success': True,
            'profile': profile,
            'memes': memes
        })
        
    except Exception as e:
        print(f"Error getting profile: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# API endpoint to update user profile
@app.route('/api/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        bio = data.get('bio', '').strip()
        
        if not username:
            return jsonify({'error': 'Username is required'}), 400

        # Ensure database is available
        if users_collection is None:
            return jsonify({'error': 'Database connection failed'}), 500

        # Prevent changing email: ignore any provided email field

        # Check if username is taken by another user
        if username != current_user.get('username'):
            existing = users_collection.find_one({
                'username': username,
                '_id': { '$ne': current_user['_id'] }
            })
            if existing:
                return jsonify({'error': 'Username already taken'}), 400

        # Build update payload
        update_fields = {
            'username': username,
            'bio': bio
        }

        users_collection.update_one(
            { '_id': current_user['_id'] },
            { '$set': update_fields }
        )

        return jsonify({
            'success': True,
            'message': 'Profile updated successfully'
        })
        
    except Exception as e:
        print(f"Error updating profile: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# Health check endpoint
@app.route('/api/health')
def health_check():
    return jsonify({'status': 'healthy'})

@app.route('/api/generate-template-to-meme', methods=['POST'])
@token_required
def generate_template_to_meme(current_user):
    try:
        language = request.form.get('lang','en')
        language="tr" if language=="tr-TR" else "en"
        topic = request.form.get('topic')
        caption_points_str = request.form.get('captionPoints') 
        caption_points = json.loads(caption_points_str)
        if not topic:
            return jsonify({'error': 'Missing topic'}), 400
        link=uploadfile(request.files['image'])
        caption=describe(link)
        caption_count = len(caption_points)
        topiclang=GoogleTranslator(source='auto', target=language).translate(text=topic)
        captionlang=GoogleTranslator(source='auto', target=language).translate(text=caption)
        captions = generate_captions_no_template(topiclang,captionlang, num_captions=caption_count,lang=language)
        output_path = create_meme_from_file(request.files['image'], captions, caption_points)
        
        if output_path and os.path.exists(output_path):
            # Update user's meme count
            update_user_meme_count(current_user['_id'])
            
            # Store meme in database
            if memes_collection is not None:
                meme_data = {
                    'user_id': str(current_user['_id']),
                    'username': current_user['username'],
                    'topic': topic,
                    'template': 'User Template',
                    'file_path': output_path,
                    'created_at': datetime.utcnow()
                }
                memes_collection.insert_one(meme_data)
            
            # Return the path to the generated meme
            return jsonify({
                'success': True,
                'meme_path': output_path,
                'topic': topic,
                'template': 'User Template'
            })
        else:
            return jsonify({'error': 'Failed to generate meme'}), 500
            
    except Exception as e:
        print(f"Error generating meme: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/generate-from-user-template', methods=['POST'])
@token_required
def generate_from_user_template(current_user):
    try:
        data = request.get_json()
        topic = data.get('topic', '').strip()
        template_id = data.get('template_id', '').strip()
        language = data.get('lang','en')
        language="tr" if language=="tr-TR" else "en"
        if not topic:
            return jsonify({'error': 'Missing topic'}), 400
        if not template_id:
            return jsonify({'error': 'Missing template_id'}), 400

        # Load the user's template
        tmpl = user_templates_collection.find_one({
            '_id': ObjectId(template_id),
            'userid': current_user['_id']
        })
        if not tmpl:
            return jsonify({'error': 'Template not found'}), 404

        template_file = tmpl.get('file')
        blip_caption=tmpl.get('explanationfg','')
        caption_boxes = tmpl.get('captions', {})
        if not template_file or not caption_boxes:
            return jsonify({'error': 'Template is missing image or captions'}), 400

        # Describe the template image to guide caption generation
        try:
            if blip_caption=='':
                blip_caption = describe_image(template_file)
        except Exception:
            blip_caption = ''

        num_captions = len(caption_boxes)
        if num_captions <= 0:
            return jsonify({'error': 'Template has no caption points'}), 400
        topiclang=GoogleTranslator(source='auto', target=language).translate(text=topic)
        captionlang=GoogleTranslator(source='auto', target=language).translate(text=blip_caption)
        original_template=tmpl.get('original_template','')
        # Generate captions without predefined template metadata
        captions = generate_captions_no_template(topiclang, captionlang, num_captions=num_captions,lang=language,original_template=original_template)

        # Create a meme image using the stored template image and caption boxes
        template_struct = {
            'file': template_file,
            'captions': caption_boxes
        }
        output_path = create_meme(template_struct, captions)

        if output_path and os.path.exists(output_path):
            # Update user's meme count
            update_user_meme_count(current_user['_id'])

            # Store meme in database
            if memes_collection is not None:
                meme_data = {
                    'user_id': str(current_user['_id']),
                    'username': current_user['username'],
                    'topic': topic,
                    'template': tmpl.get('name', 'User Template'),
                    'file_path': output_path,
                    'created_at': datetime.utcnow()
                }
                memes_collection.insert_one(meme_data)

            return jsonify({
                'success': True,
                'meme_path': output_path,
                'topic': topic,
                'template': tmpl.get('name', 'User Template')
            })
        else:
            return jsonify({'error': 'Failed to generate meme'}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500

# Helper to safely delete a file only inside the GeneratedMemes directory
def _delete_generated_file_safely(file_path: str) -> bool:
    try:
        if not file_path:
            return False
        # Normalize path
        abs_path = os.path.abspath(file_path)
        generated_dir = os.path.abspath('GeneratedMemes')
        # If stored path is like "GeneratedMemes/filename.png", ensure absolute
        if not abs_path.startswith(generated_dir):
            # Try to join if a relative like "GeneratedMemes/xxx.png"
            candidate = os.path.abspath(os.path.join('.', file_path))
            if candidate.startswith(generated_dir):
                abs_path = candidate
        # Final guard
        if abs_path.startswith(generated_dir) and os.path.exists(abs_path):
            os.remove(abs_path)
            return True
        return False
    except Exception as e:
        print(f"Failed to delete file '{file_path}': {e}")
        return False

# Bulk delete memes
@app.route('/api/memes/bulk-delete', methods=['POST'])
@token_required
def bulk_delete_memes(current_user):
    try:
        data = request.get_json(force=True, silent=True) or {}
        meme_ids = data.get('meme_ids') or data.get('ids') or []
        if not isinstance(meme_ids, list) or not meme_ids:
            return jsonify({'error': 'meme_ids must be a non-empty list'}), 400

        deleted = 0
        not_found = []
        for mid in meme_ids:
            try:
                obj_id = ObjectId(mid)
            except Exception:
                not_found.append(mid)
                continue
            meme = memes_collection.find_one({
                '_id': obj_id,
                'user_id': str(current_user['_id'])
            })
            if not meme:
                not_found.append(mid)
                continue
            _delete_generated_file_safely(meme.get('file_path'))
            res = memes_collection.delete_one({'_id': obj_id})
            if getattr(res, 'deleted_count', 0) > 0:
                deleted += 1

        return jsonify({
            'success': True,
            'deleted': deleted,
            'notFound': not_found
        })
    except Exception as e:
        print(f"Error bulk deleting memes: {e}")
        return jsonify({'error': 'Internal server error'}), 500

