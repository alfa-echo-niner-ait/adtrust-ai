"""Poster generation service."""

import threading
import base64
import requests
from flask import current_app
from extensions import db, supabase
from models.poster import GeneratedPoster


class PosterService:
    """Service for poster generation operations."""

    def generate_async(self, poster_id: str, data: dict):
        """Trigger async poster generation."""
        thread = threading.Thread(target=self._generate_poster, args=(poster_id, data))
        thread.daemon = True
        thread.start()

    def _generate_poster(self, poster_id: str, data: dict):
        """Generate poster using AI service."""
        try:
            # Build enhanced prompt
            enhanced_prompt = self._build_prompt(data)

            # Call Google Image API
            api_key = current_app.config['GOOGLE_API_KEY']
            response = requests.post(
                f'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key={api_key}',
                headers={'Content-Type': 'application/json'},
                json={
                    'instances': [{
                        'prompt': enhanced_prompt,
                        'parameters': {
                            'sampleCount': 1,
                            'aspectRatio': data.get('aspectRatio', '1:1'),
                            'outputMimeType': 'image/png',
                            'mode': 'image'
                        }
                    }]
                },
                timeout=120
            )

            poster_url = None
            if response.status_code == 200:
                result = response.json()
                image_data_base64 = result.get('predictions', [{}])[0].get('bytesBase64Encoded')
                if image_data_base64:
                    image_data = base64.b64decode(image_data_base64)
                    
                    # Upload to Supabase Storage
                    bucket_name = current_app.config['SUPABASE_STORAGE_BUCKET']
                    file_path = f"images/{poster_id}.png"
                    
                    supabase.storage.from_(bucket_name).upload(
                        file=image_data,
                        path=file_path,
                        file_options={"content-type": "image/png"}
                    )
                    
                    # Get public URL
                    poster_url = supabase.storage.from_(bucket_name).get_public_url(file_path)
            else:
                current_app.logger.error(f"Poster generation API error: {response.status_code} {response.text}")

            # Update database
            poster = GeneratedPoster.query.get(poster_id)
            if poster:
                poster.poster_url = poster_url
                poster.status = "completed" if poster_url else "failed"
                db.session.commit()

                current_app.logger.info(f"Poster generation completed: {poster_id}")

        except Exception as e:
            current_app.logger.error(f"Poster generation failed: {e}")
            poster = GeneratedPoster.query.get(poster_id)
            if poster:
                poster.status = "failed"
                db.session.commit()

    def _build_prompt(self, data: dict) -> str:
        """Build enhanced prompt for poster generation."""
        prompt = f"Create a professional advertising poster with these requirements:\n\n{data['prompt']}\n\nCRITICAL REQUIREMENTS:\n"

        if data.get("brandColors"):
            colors = (
                data["brandColors"]
                if isinstance(data["brandColors"], str)
                else ", ".join(data["brandColors"])
            )
            prompt += (
                f"- PRIMARY REQUIREMENT: Use ONLY these exact brand colors: {colors}\n"
            )
        
        if data.get('brandLogo'):
            prompt += f"\n- CRITICAL: Incorporate the brand logo from this URL: {data['brandLogo']}"
        
        if data.get('productImage'):
            prompt += f"\n- CRITICAL: Feature the product from this URL as the focal point: {data['productImage']}"

        prompt += f"\n\nDesign specifications:\n"
        prompt += f"- Aspect ratio: {data.get('aspectRatio', '1:1')}\n"
        prompt += f"- Style: Modern, professional, eye-catching\n"
        prompt += f"- Quality: High-resolution, suitable for advertising\n"

        return prompt
