"""File Upload API endpoint."""
import uuid
from flask import Blueprint, request, jsonify, current_app
from extensions import supabase
from utils.decorators import handle_errors

upload_bp = Blueprint('upload', __name__)

@upload_bp.route('/upload', methods=['POST'])
@handle_errors
def upload_file():
    """Upload a file to Supabase storage."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected for uploading'}), 400
        
    # Determine folder based on content type
    folder = 'images'
    if file.content_type.startswith('video/'):
        folder = 'videos'

    file_ext = file.filename.rsplit('.', 1)[1].lower()
    file_name = f"{folder}/{uuid.uuid4()}.{file_ext}"
    
    try:
        # Using the Supabase client to upload the file
        bucket_name = current_app.config['SUPABASE_STORAGE_BUCKET']
        
        # The `upload` method expects bytes, so we read the file.
        res = supabase.storage.from_(bucket_name).upload(
            path=file_name,
            file=file.read(),
            file_options={"content-type": file.content_type}
        )
        
        # Get the public URL of the uploaded file
        public_url = supabase.storage.from_(bucket_name).get_public_url(file_name)
        
        current_app.logger.info(f"File uploaded successfully: {public_url}")
        
        return jsonify({'url': public_url}), 201
        
    except Exception as e:
        current_app.logger.error(f"File upload to Supabase failed: {e}")
        return jsonify({'error': f'File upload failed: {str(e)}'}), 500
