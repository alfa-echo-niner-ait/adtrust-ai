"""Critique model."""
from datetime import datetime
from extensions import db
from sqlalchemy.dialects.postgresql import JSONB


class Critique(db.Model):
    """Model for content critiques."""
    
    __tablename__ = 'critiques'
    
    id = db.Column(db.String(36), primary_key=True)
    media_url = db.Column(db.String(500), nullable=False)
    media_type = db.Column(db.String(20), nullable=False)
    caption = db.Column(db.Text)
    brand_colors = db.Column(db.String(200))
    brand_fit_score = db.Column(db.Numeric(3, 2), default=0)
    visual_quality_score = db.Column(db.Numeric(3, 2), default=0)
    message_clarity_score = db.Column(db.Numeric(3, 2), default=0)
    tone_of_voice_score = db.Column(db.Numeric(3, 2), default=0)
    safety_score = db.Column(db.Numeric(3, 2), default=0)
    brand_validation = db.Column(JSONB)
    safety_breakdown = db.Column(JSONB)
    critique_summary = db.Column(db.Text)
    refinement_prompt = db.Column(db.Text)
    source_type = db.Column(db.String(20))
    source_id = db.Column(db.String(36))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert model to dictionary."""
        return {
            'id': self.id,
            'media_url': self.media_url,
            'media_type': self.media_type,
            'caption': self.caption,
            'brand_colors': self.brand_colors,
            'brand_fit_score': float(self.brand_fit_score) if self.brand_fit_score else 0,
            'visual_quality_score': float(self.visual_quality_score) if self.visual_quality_score else 0,
            'message_clarity_score': float(self.message_clarity_score) if self.message_clarity_score else 0,
            'tone_of_voice_score': float(self.tone_of_voice_score) if self.tone_of_voice_score else 0,
            'safety_score': float(self.safety_score) if self.safety_score else 0,
            'brand_validation': self.brand_validation,
            'safety_breakdown': self.safety_breakdown,
            'critique_summary': self.critique_summary,
            'refinement_prompt': self.refinement_prompt,
            'source_type': self.source_type,
            'source_id': self.source_id,
            'created_at': self.created_at.isoformat()
        }
