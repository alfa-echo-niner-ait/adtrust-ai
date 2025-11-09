"""Poster generation API endpoints."""
import uuid
from flask import Blueprint, request, jsonify, current_app
from extensions import db
from models.poster import GeneratedPoster
from services.poster_service import PosterService
from utils.validation import validate_generation_request
from utils.decorators import handle_errors

poster_bp = Blueprint('poster', __name__)


@poster_bp.route('/generate', methods=['POST'])
@handle_errors
def generate_poster():
    """Generate a new poster ad."""
    data = request.get_json()
    
    # Validate request
    errors = validate_generation_request(data)
    if errors:
        return jsonify({'error': 'Validation failed', 'details': errors}), 400
    
    # Create poster record
    poster_id = str(uuid.uuid4())
    poster = GeneratedPoster(
        id=poster_id,
        prompt=data['prompt'],
        brand_logo_url=data.get('brandLogo'),
        product_image_url=data.get('productImage'),
        brand_colors=data.get('brandColors'),
        aspect_ratio=data.get('aspectRatio', '1:1'),
        status='pending'
    )
    
    db.session.add(poster)
    db.session.commit()
    
    current_app.logger.info(f'Created poster generation request: {poster_id}')
    
    # Trigger async generation
    poster_service = PosterService()
    poster_service.generate_async(poster_id, data)
    
    return jsonify({
        'success': True,
        'posterId': poster_id,
        'status': 'pending'
    }), 201


@poster_bp.route('/<poster_id>', methods=['GET'])
@handle_errors
def get_poster(poster_id):
    """Get poster generation status and details."""
    poster = GeneratedPoster.query.get_or_404(poster_id)
    return jsonify(poster.to_dict()), 200


@poster_bp.route('/', methods=['GET'])
@handle_errors
def list_posters():
    """List all poster generations."""
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    posters = GeneratedPoster.query\
        .order_by(GeneratedPoster.created_at.desc())\
        .limit(limit)\
        .offset(offset)\
        .all()
    
    return jsonify({
        'posters': [p.to_dict() for p in posters],
        'total': GeneratedPoster.query.count()
    }), 200
