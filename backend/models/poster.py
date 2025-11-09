"""Generated Poster model."""
from datetime import datetime
from extensions import db


class GeneratedPoster(db.Model):
    """Model for generated poster ads."""
    
    __tablename__ = 'generated_posters'
    
    id = db.Column(db.String(36), primary_key=True)
    prompt = db.Column(db.Text, nullable=False)
    poster_url = db.Column(db.String(500))
    brand_logo_url = db.Column(db.String(500))
    product_image_url = db.Column(db.String(500))
    brand_colors = db.Column(db.String(200))
    aspect_ratio = db.Column(db.String(10), default='1:1')
    status = db.Column(db.String(20), default='pending')
    approval_status = db.Column(db.String(20))
    approved_by = db.Column(db.String(36))
    approved_at = db.Column(db.DateTime)
    rejection_reason = db.Column(db.Text)
    critique_id = db.Column(db.String(36), db.ForeignKey('critiques.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    critique = db.relationship('Critique', backref='poster', lazy=True)
    
    def to_dict(self):
        """Convert model to dictionary."""
        return {
            'id': self.id,
            'prompt': self.prompt,
            'poster_url': self.poster_url,
            'brand_logo_url': self.brand_logo_url,
            'product_image_url': self.product_image_url,
            'brand_colors': self.brand_colors,
            'aspect_ratio': self.aspect_ratio,
            'status': self.status,
            'approval_status': self.approval_status,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'rejection_reason': self.rejection_reason,
            'critique_id': self.critique_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
