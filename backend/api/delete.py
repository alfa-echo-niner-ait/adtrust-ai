"""File Deletion API endpoint."""
from flask import Blueprint, request, jsonify, current_app
from extensions import supabase
from utils.decorators import handle_errors

delete_bp = Blueprint('delete', __name__)

@delete_bp.route('/delete_file', methods=['POST'])
@handle_errors
def delete_file():
    """Delete a file from Supabase storage."""
    data = request.get_json()
    file_url = data.get('file_url')
    
    if not file_url:
        return jsonify({'error': 'No file URL provided'}), 400
        
    try:
        bucket_name = current_app.config['SUPABASE_STORAGE_BUCKET']
        file_path = file_url.split(f'{bucket_name}/')[1]
        
        res = supabase.storage.from_(bucket_name).remove([file_path])
        
        current_app.logger.info(f"File deleted successfully: {file_url}")
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        current_app.logger.error(f"File deletion from Supabase failed: {e}")
        return jsonify({'error': 'File deletion failed'}), 500
