"""Workflow orchestration API endpoints."""
import uuid
from flask import Blueprint, request, jsonify, current_app
from extensions import db
from models.workflow import WorkflowRun
from services.workflow_service import WorkflowService
from utils.validation import validate_workflow_request
from utils.decorators import handle_errors

workflow_bp = Blueprint('workflow', __name__)


@workflow_bp.route('/start', methods=['POST'])
@handle_errors
def start_workflow():
    """Start a multi-agent workflow."""
    data = request.get_json()
    
    # Validate request
    errors = validate_workflow_request(data)
    if errors:
        return jsonify({'error': 'Validation failed', 'details': errors}), 400
    
    # Create workflow record
    workflow_id = str(uuid.uuid4())
    workflow = WorkflowRun(
        id=workflow_id,
        content_type=data['content_type'],
        prompt=data['prompt'],
        brand_logo_url=data.get('brand_logo_url'),
        product_image_url=data.get('product_image_url'),
        brand_colors=','.join(data.get('brand_colors', [])),
        aspect_ratio=data.get('aspect_ratio'),
        status='running',
        current_step='initializing'
    )
    
    db.session.add(workflow)
    db.session.commit()
    
    current_app.logger.info(f'Started workflow: {workflow_id}')
    
    # Trigger async workflow
    workflow_service = WorkflowService()
    workflow_service.run_async(workflow_id)
    
    return jsonify({
        'success': True,
        'workflowId': workflow_id,
        'message': 'Workflow started'
    }), 201


@workflow_bp.route('/<workflow_id>', methods=['GET'])
@handle_errors
def get_workflow(workflow_id):
    """Get workflow status and details."""
    workflow = WorkflowRun.query.get_or_404(workflow_id)
    return jsonify(workflow.to_dict()), 200


@workflow_bp.route('/', methods=['GET'])
@handle_errors
def list_workflows():
    """List all workflows."""
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    status = request.args.get('status')
    
    query = WorkflowRun.query
    
    if status:
        query = query.filter_by(status=status)
    
    workflows = query\
        .order_by(WorkflowRun.created_at.desc())\
        .limit(limit)\
        .offset(offset)\
        .all()
    
    return jsonify({
        'workflows': [w.to_dict() for w in workflows],
        'total': query.count()
    }), 200
