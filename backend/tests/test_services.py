"""Service layer tests."""
import pytest
from services.poster_service import PosterService
from services.video_service import VideoService
from utils.validation import validate_generation_request, validate_critique_request


class TestValidation:
    """Test validation utilities."""
    
    def test_validate_generation_request_valid(self):
        """Test validation with valid data."""
        data = {
            'prompt': 'Create a beautiful poster for our coffee brand',
            'aspectRatio': '1:1',
            'brandColors': ['#FF5733', '#33FF57']
        }
        errors = validate_generation_request(data)
        assert len(errors) == 0
    
    def test_validate_generation_request_missing_prompt(self):
        """Test validation with missing prompt."""
        data = {'aspectRatio': '1:1'}
        errors = validate_generation_request(data)
        assert len(errors) > 0
        assert any('Prompt' in error for error in errors)
    
    def test_validate_generation_request_short_prompt(self):
        """Test validation with short prompt."""
        data = {'prompt': 'Test'}
        errors = validate_generation_request(data)
        assert len(errors) > 0
    
    def test_validate_generation_request_invalid_color(self):
        """Test validation with invalid color format."""
        data = {
            'prompt': 'Create a beautiful poster',
            'brandColors': ['invalid-color']
        }
        errors = validate_generation_request(data)
        assert len(errors) > 0
    
    def test_validate_critique_request_valid(self):
        """Test critique validation with valid data."""
        data = {
            'mediaUrl': 'https://example.com/image.jpg',
            'mediaType': 'image',
            'brandColors': ['#FF5733']
        }
        errors = validate_critique_request(data)
        assert len(errors) == 0
    
    def test_validate_critique_request_invalid_media_type(self):
        """Test critique validation with invalid media type."""
        data = {
            'mediaUrl': 'https://example.com/image.jpg',
            'mediaType': 'invalid'
        }
        errors = validate_critique_request(data)
        assert len(errors) > 0


class TestPosterService:
    """Test poster service."""
    
    def test_build_prompt(self, app):
        """Test prompt building."""
        with app.app_context():
            service = PosterService()
            data = {
                'prompt': 'Coffee brand poster',
                'brandColors': ['#FF5733', '#33FF57'],
                'aspectRatio': '1:1'
            }
            prompt = service._build_prompt(data)
            assert 'Coffee brand poster' in prompt
            assert '#FF5733' in prompt
            assert '1:1' in prompt


class TestVideoService:
    """Test video service."""
    
    def test_build_prompt(self, app):
        """Test prompt building."""
        with app.app_context():
            service = VideoService()
            data = {
                'prompt': 'Coffee brand video',
                'brandColors': ['#FF5733'],
                'aspectRatio': '16:9'
            }
            prompt = service._build_prompt(data)
            assert 'Coffee brand video' in prompt
            assert '#FF5733' in prompt
            assert '16:9' in prompt
