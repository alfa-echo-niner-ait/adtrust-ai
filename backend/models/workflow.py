"""Workflow Run model."""
from datetime import datetime
from extensions import db
from sqlalchemy.dialects.postgresql import JSONB


class WorkflowRun(db.Model):
    """Model for multi-agent workflow runs."""
    
    __tablename__ = 'workflow_runs'
    
    id = db.Column(db.String(36), primary_key=True)
    content_type = db.Column(db.String(20), nullable=False)
    prompt = db.Column(db.Text, nullable=False)
    brand_logo_url = db.Column(db.String(500))
    product_image_url = db.Column(db.String(500))
    brand_colors = db.Column(db.String(200))
    aspect_ratio = db.Column(db.String(10))
    status = db.Column(db.String(20), default='pending')
    current_step = db.Column(db.String(20))
    iteration_count = db.Column(db.Integer, default=0)
    generated_content_id = db.Column(db.String(36))
    critique_id = db.Column(db.String(36))
    final_scores = db.Column(JSONB)
    error_message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert model to dictionary."""
        return {
            'id': self.id,
            'content_type': self.content_type,
            'prompt': self.prompt,
            'brand_logo_url': self.brand_logo_url,
            'product_image_url': self.product_image_url,
            'brand_colors': self.brand_colors,
            'aspect_ratio': self.aspect_ratio,
            'status': self.status,
            'current_step': self.current_step,
            'iteration_count': self.iteration_count,
            'generated_content_id': self.generated_content_id,
            'critique_id': self.critique_id,
            'final_scores': self.final_scores,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
