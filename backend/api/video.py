"""Video generation API endpoints."""
import uuid
from flask import Blueprint, request, jsonify, current_app
from extensions import db
from models.video import GeneratedVideo
from services.video_service import VideoService
from utils.validation import validate_generation_request
from utils.decorators import handle_errors

video_bp = Blueprint('video', __name__)


@video_bp.route('/generate', methods=['POST'])
@handle_errors
def generate_video():
    """Generate a new video ad."""
    data = request.get_json()
    
    # Validate request
    errors = validate_generation_request(data)
    if errors:
        return jsonify({'error': 'Validation failed', 'details': errors}), 400
        
    # Create video record
    video_id = str(uuid.uuid4())
    video = GeneratedVideo(
        id=video_id,
        prompt=data['prompt'],
        brand_logo_url=data.get('brandLogoUrl'),
        product_image_url=data.get('productImageUrl'),
        brand_colors=','.join(data.get('brandColors', [])),
        aspect_ratio=data.get('aspectRatio', '16:9'),
        status='pending'
    )
    db.session.add(video)
    db.session.commit()
    
    current_app.logger.info(f'Starting video generation request: {video_id}')
    
    try:
        # Trigger sync generation
        video_service = VideoService()
        generated_video = video_service.generate(video_id, data)
        
        if not generated_video:
            raise Exception("Video generation returned no result.")

        current_app.logger.info(f'Finished video generation request: {video_id}')
        
        return jsonify(generated_video.to_dict()), 201
    except Exception as e:
        current_app.logger.error(f"Video generation failed for {video_id}: {e}")
        return jsonify({'error': 'Video generation failed', 'details': str(e)}), 500


@video_bp.route('/<video_id>', methods=['GET'])
@handle_errors
def get_video(video_id):
    """Get video generation status and details."""
    video = GeneratedVideo.query.get_or_404(video_id)
    return jsonify(video.to_dict()), 200


@video_bp.route('/', methods=['GET'])
@handle_errors
def list_videos():
    """List all video generations."""
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    videos = GeneratedVideo.query\
        .order_by(GeneratedVideo.created_at.desc())\
        .limit(limit)\
        .offset(offset)\
        .all()
    
    return jsonify({
        'videos': [v.to_dict() for v in videos],
        'total': GeneratedVideo.query.count()
    }), 200
