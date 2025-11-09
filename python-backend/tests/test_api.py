"""API endpoint tests."""
import json
import pytest


class TestHealthEndpoint:
    """Test health check endpoint."""
    
    def test_health_check(self, client):
        """Test health check returns 200."""
        response = client.get('/api/health')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
        assert 'service' in data


class TestPosterAPI:
    """Test poster generation API."""
    
    def test_generate_poster_missing_prompt(self, client):
        """Test poster generation with missing prompt."""
        response = client.post(
            '/api/poster/generate',
            json={}
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_generate_poster_invalid_aspect_ratio(self, client):
        """Test poster generation with invalid aspect ratio."""
        response = client.post(
            '/api/poster/generate',
            json={
                'prompt': 'Test poster for coffee brand',
                'aspectRatio': '21:9'
            }
        )
        assert response.status_code == 400
    
    def test_list_posters(self, client):
        """Test listing posters."""
        response = client.get('/api/poster/')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'posters' in data
        assert 'total' in data


class TestVideoAPI:
    """Test video generation API."""
    
    def test_generate_video_missing_prompt(self, client):
        """Test video generation with missing prompt."""
        response = client.post(
            '/api/video/generate',
            json={}
        )
        assert response.status_code == 400
    
    def test_list_videos(self, client):
        """Test listing videos."""
        response = client.get('/api/video/')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'videos' in data
        assert 'total' in data


class TestCritiqueAPI:
    """Test critique API."""
    
    def test_analyze_content_missing_media_url(self, client):
        """Test critique with missing media URL."""
        response = client.post(
            '/api/critique/analyze',
            json={'mediaType': 'image'}
        )
        assert response.status_code == 400
    
    def test_analyze_content_invalid_media_type(self, client):
        """Test critique with invalid media type."""
        response = client.post(
            '/api/critique/analyze',
            json={
                'mediaUrl': 'https://example.com/image.jpg',
                'mediaType': 'audio'
            }
        )
        assert response.status_code == 400


class TestWorkflowAPI:
    """Test workflow API."""
    
    def test_start_workflow_missing_content_type(self, client):
        """Test workflow with missing content type."""
        response = client.post(
            '/api/workflow/start',
            json={'prompt': 'Test workflow'}
        )
        assert response.status_code == 400
    
    def test_list_workflows(self, client):
        """Test listing workflows."""
        response = client.get('/api/workflow/')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'workflows' in data
        assert 'total' in data
