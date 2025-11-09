"""Approval History model."""
from datetime import datetime
from extensions import db


class ApprovalHistory(db.Model):
    """Model for tracking approval history."""
    
    __tablename__ = 'approval_history'
    
    id = db.Column(db.String(36), primary_key=True)
    content_type = db.Column(db.String(20), nullable=False)
    content_id = db.Column(db.String(36), nullable=False)
    action = db.Column(db.String(20), nullable=False)
    approved_by = db.Column(db.String(36))
    reason = db.Column(db.Text)
    previous_status = db.Column(db.String(20))
    new_status = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert model to dictionary."""
        return {
            'id': self.id,
            'content_type': self.content_type,
            'content_id': self.content_id,
            'action': self.action,
            'approved_by': self.approved_by,
            'reason': self.reason,
            'previous_status': self.previous_status,
            'new_status': self.new_status,
            'created_at': self.created_at.isoformat()
        }
