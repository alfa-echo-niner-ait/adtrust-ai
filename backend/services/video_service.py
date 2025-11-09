"""Video generation service."""
import google.generativeai as genai
from flask import current_app
from extensions import db, supabase
from models.video import GeneratedVideo
from google.generativeai.types import GenerationConfig
import base64


class VideoService:
    """Service for video generation operations."""

    def __init__(self):
        """Initialize the service."""
        self.api_key = current_app.config.get('GOOGLE_API_KEY')
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY not configured")
        genai.configure(api_key=self.api_key)

    def generate(self, video_id: str, data: dict):
        """Generate video using Google AI service."""
        try:
            # Build enhanced prompt
            enhanced_prompt = self._build_prompt(data)

            # Call Google Video API - using a model capable of multimodal generation
            model = genai.GenerativeModel('gemini-1.5-pro-latest')

            response = model.generate_content(
                enhanced_prompt,
                generation_config=GenerationConfig(
                    response_mime_type="video/mp4",
                )
            )

            video_url = None
            video_part = None
            if response.candidates:
                if (response.candidates[0].content.parts):
                    video_part = response.candidates[0].content.parts[1]

                if (
                    video_part
                    and video_part.inline_data
                    and video_part.inline_data.mime_type.startswith("video/")
                ):
                    try:
                        video_data_b64 = video_part.inline_data.data
                        binary_video_data = base64.b64decode(video_data_b64)
                        current_app.logger.info(
                            f"Video decoded successfully. Size: {len(binary_video_data)} bytes."
                        )

                        # Upload to Supabase Storage
                        bucket_name = current_app.config['SUPABASE_STORAGE_BUCKET']
                        file_path = f'genVideos/{video_id}.mp4'

                        current_app.logger.info(
                            f"Uploading video to Supabase at {file_path}..."
                        )
                        # Upload to Supabase Storage
                        supabase.storage.from_(bucket_name).upload(
                            file=binary_video_data,
                            file_path=file_path,
                            file_options={'content-type': 'video/mp4'}
                        )
                        current_app.logger.info(
                            f"Video uploaded successfully to {video_id}."
                        )

                        # Get public URL
                        video_url = supabase.storage.from_(bucket_name).get_public_url(file_path)
                    except Exception as upload_e:
                        current_app.logger.error(
                                f"Video processing or upload failed for {video_id}: {upload_e}",
                                exc_info=True,
                            )
                        raise upload_e

            else:
                # Failure path: Log the full response object
                current_app.logger.error(
                    f"Video data not found in response for {video_id}. "
                    f"Logging full response for debugging: {response}"
                )

            # Update database
            video = GeneratedVideo.query.get(video_id)
            if video:
                video.video_url = video_url
                video.status = 'completed' if video_url else 'failed'
                db.session.commit()
                current_app.logger.info(f'Video generation completed: {video_id}')
                return video
            return None

        except Exception as e:
            current_app.logger.error(f'Video generation failed for {video_id}: {e}')
            video = GeneratedVideo.query.get(video_id)
            if video:
                video.status = 'failed'
                db.session.commit()
            raise e

    def _build_prompt(self, data: dict) -> str:
        """Build enhanced prompt for video generation."""
        prompt = f"Create a professional advertising video with these requirements:\n\n{data['prompt']}\n\nCRITICAL REQUIREMENTS:"

        if data.get('brandColors'):
            colors = data['brandColors'] if isinstance(data['brandColors'], str) else ', '.join(data['brandColors'])
            prompt += f"\n- PRIMARY REQUIREMENT: Use ONLY these exact brand colors: {colors}"

        if data.get('brandLogoUrl'):
            prompt += f"\n- CRITICAL: Incorporate the brand logo from this URL: {data['brandLogoUrl']}"

        if data.get('productImageUrl'):
            prompt += f"\n- CRITICAL: Feature the product from this URL as the focal point: {data['productImageUrl']}"

        prompt += f"\n\nVideo specifications:\n"
        prompt += f"- Aspect ratio: {data.get('aspectRatio', '16:9')}\n"
        prompt += f"- Style: Modern, professional, engaging\n"
        prompt += f"- Duration: 15-30 seconds\n"

        return prompt
