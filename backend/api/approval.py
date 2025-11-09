"""Approval API endpoints."""
import uuid
from flask import Blueprint, request, jsonify
from extensions import db
from models.approval import ApprovalHistory
from models.video import GeneratedVideo
from models.poster import GeneratedPoster
from utils.decorators import handle_errors

approval_bp = Blueprint('approval', __name__)

@approval_bp.route('/<content_type>/<content_id>/approve', methods=['POST'])
@handle_errors
def approve_content(content_type, content_id):
    """Approve a piece of content."""
    model = GeneratedVideo if content_type == 'video' else GeneratedPoster
    content = model.query.get_or_404(content_id)
    
    content.approval_status = 'approved'
    db.session.commit()
    
    history_entry = ApprovalHistory(
        id=str(uuid.uuid4()),
        content_type=content_type,
        content_id=content_id,
        action='approved'
    )
    db.session.add(history_entry)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Content approved'}), 200

@approval_bp.route('/<content_type>/<content_id>/reject', methods=['POST'])
@handle_errors
def reject_content(content_type, content_id):
    """Reject a piece of content."""
    data = request.get_json()
    rejection_reason = data.get('rejection_reason')
    
    model = GeneratedVideo if content_type == 'video' else GeneratedPoster
    content = model.query.get_or_404(content_id)
    
    content.approval_status = 'rejected'
    content.rejection_reason = rejection_reason
    db.session.commit()
    
    history_entry = ApprovalHistory(
        id=str(uuid.uuid4()),
        content_type=content_type,
        content_id=content_id,
        action='rejected',
        reason=rejection_reason
    )
    db.session.add(history_entry)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Content rejected'}), 200
