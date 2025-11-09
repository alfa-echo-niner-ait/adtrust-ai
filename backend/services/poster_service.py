"""Poster generation service."""
import threading
import base64
import requests
from flask import current_app
from extensions import db
from models.poster import GeneratedPoster


class PosterService:
    """Service for poster generation operations."""
    
    def generate_async(self, poster_id: str, data: dict):
        """Trigger async poster generation."""
        thread = threading.Thread(
            target=self._generate_poster,
            args=(poster_id, data)
        )
        thread.daemon = True
        thread.start()
    
    def _generate_poster(self, poster_id: str, data: dict):
        """Generate poster using AI service."""
        try:
            # Build enhanced prompt
            enhanced_prompt = self._build_prompt(data)
            
            # Prepare content parts with images
            content_parts = [{'type': 'text', 'text': enhanced_prompt}]
            
            # Add brand logo if provided
            if data.get('brandLogo'):
                logo_data = self._fetch_and_encode_image(data['brandLogo'])
                content_parts.append({
                    'type': 'image_url',
                    'image_url': {'url': logo_data}
                })
                content_parts.append({
                    'type': 'text',
                    'text': '- CRITICAL: Include the brand logo shown above prominently.'
                })
            
            # Add product image if provided
            if data.get('productImage'):
                product_data = self._fetch_and_encode_image(data['productImage'])
                content_parts.append({
                    'type': 'image_url',
                    'image_url': {'url': product_data}
                })
                content_parts.append({
                    'type': 'text',
                    'text': '- CRITICAL: Feature the product shown above as the focal point.'
                })
            
            # Call AI API
            api_key = current_app.config['LOVABLE_API_KEY']
            response = requests.post(
                'https://ai.gateway.lovable.dev/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'google/gemini-2.5-flash-image-preview',
                    'messages': [{
                        'role': 'user',
                        'content': content_parts
                    }],
                    'modalities': ['image', 'text']
                },
                timeout=120
            )
            
            if response.status_code != 200:
                raise Exception(f'API error: {response.text}')
            
            result = response.json()
            poster_url = result.get('choices', [{}])[0].get('message', {}).get('images', [{}])[0].get('image_url', {}).get('url')
            
            # Update database
            poster = GeneratedPoster.query.get(poster_id)
            if poster:
                poster.poster_url = poster_url
                poster.status = 'completed' if poster_url else 'failed'
                db.session.commit()
                
                current_app.logger.info(f'Poster generation completed: {poster_id}')
            
        except Exception as e:
            current_app.logger.error(f'Poster generation failed: {e}')
            poster = GeneratedPoster.query.get(poster_id)
            if poster:
                poster.status = 'failed'
                db.session.commit()
    
    def _build_prompt(self, data: dict) -> str:
        """Build enhanced prompt for poster generation."""
        prompt = f"Create a professional advertising poster with these requirements:\n\n{data['prompt']}\n\nCRITICAL REQUIREMENTS:\n"
        
        if data.get('brandColors'):
            colors = data['brandColors'] if isinstance(data['brandColors'], str) else ', '.join(data['brandColors'])
            prompt += f"- PRIMARY REQUIREMENT: Use ONLY these exact brand colors: {colors}\n"
        
        prompt += f"\nDesign specifications:\n"
        prompt += f"- Aspect ratio: {data.get('aspectRatio', '1:1')}\n"
        prompt += f"- Style: Modern, professional, eye-catching\n"
        prompt += f"- Quality: High-resolution, suitable for advertising\n"
        
        return prompt
    
    def _fetch_and_encode_image(self, url: str) -> str:
        """Fetch image and encode to base64."""
        response = requests.get(url, timeout=30)
        encoded = base64.b64encode(response.content).decode('utf-8')
        content_type = response.headers.get('content-type', 'image/png')
        return f'data:{content_type};base64,{encoded}'
