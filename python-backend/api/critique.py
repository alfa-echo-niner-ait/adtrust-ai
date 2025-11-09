"""Critique API endpoints."""
import uuid
from flask import Blueprint, request, jsonify, current_app
from extensions import db
from models.critique import Critique
from services.critique_service import CritiqueService
from utils.validation import validate_critique_request
from utils.decorators import handle_errors

critique_bp = Blueprint('critique', __name__)


@critique_bp.route('/analyze', methods=['POST'])
@handle_errors
def analyze_content():
    """Analyze and critique content."""
    data = request.get_json()
    
    # Validate request
    errors = validate_critique_request(data)
    if errors:
        return jsonify({'error': 'Validation failed', 'details': errors}), 400
    
    current_app.logger.info(f'Starting critique for media: {data.get("mediaUrl")}')
    
    # Perform critique
    critique_service = CritiqueService()
    result = critique_service.critique_content(
        media_url=data['mediaUrl'],
        media_type=data['mediaType'],
        brand_colors=data.get('brandColors', []),
        caption=data.get('caption', '')
    )
    
    # Save critique to database
    critique_id = str(uuid.uuid4())
    critique = Critique(
        id=critique_id,
        media_url=data['mediaUrl'],
        media_type=data['mediaType'],
        caption=data.get('caption', ''),
        brand_colors=','.join(data.get('brandColors', [])),
        brand_fit_score=result.get('BrandFit_Score', 0),
        visual_quality_score=result.get('VisualQuality_Score', 0),
        message_clarity_score=result.get('MessageClarity_Score', 0),
        tone_of_voice_score=result.get('ToneOfVoice_Score', 0),
        safety_score=result.get('Safety_Score', 0),
        brand_validation=result.get('BrandValidation'),
        safety_breakdown=result.get('SafetyBreakdown'),
        critique_summary=result.get('Critique_Summary', ''),
        refinement_prompt=result.get('Refinement_Prompt_Suggestion', '')
    )
    
    db.session.add(critique)
    db.session.commit()
    
    current_app.logger.info(f'Critique completed: {critique_id}')
    
    return jsonify({
        'critiqueId': critique_id,
        **result
    }), 200


@critique_bp.route('/<critique_id>', methods=['GET'])
@handle_errors
def get_critique(critique_id):
    """Get critique details."""
    critique = Critique.query.get_or_404(critique_id)
    return jsonify(critique.to_dict()), 200


@critique_bp.route('/', methods=['GET'])
@handle_errors
def list_critiques():
    """List all critiques."""
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    critiques = Critique.query\
        .order_by(Critique.created_at.desc())\
        .limit(limit)\
        .offset(offset)\
        .all()
    
    return jsonify({
        'critiques': [c.to_dict() for c in critiques],
        'total': Critique.query.count()
    }), 200
