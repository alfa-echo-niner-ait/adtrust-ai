import google.generativeai as genai
from google.generativeai.types import GenerationConfig
from flask import current_app
from extensions import db, supabase
from models.poster import GeneratedPoster
import base64


class PosterService:
    """Service for poster generation operations."""

    def __init__(self):
        """Initialize the service."""
        self.api_key = current_app.config.get("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY not configured")
        genai.configure(api_key=self.api_key)

    def generate(self, poster_id: str, data: dict):
        """Generate poster using AI service and return the updated poster object."""
        try:
            enhanced_prompt = self._build_prompt(data)

            model = genai.GenerativeModel("gemini-2.5-flash-image")

            current_app.logger.info(
                f"Attempting generation for {poster_id} with prompt: {enhanced_prompt[:50]}..."
            )

            response = model.generate_content(enhanced_prompt)

            current_app.logger.info(
                f"Received response for {poster_id}. Candidates count: {len(response.candidates)}"
            )

            poster_url = None
            image_part = None
            if response.candidates:
                if (response.candidates[0].content.parts):
                    image_part = response.candidates[0].content.parts[1]

                # Check for inline image data
                if (
                    image_part
                    and image_part.inline_data
                    and image_part.inline_data.mime_type.startswith("image/")
                ):
                    try:
                        # Success path: Decode Base64 data and upload
                        image_data_b64 = image_part.inline_data.data
                        binary_image_data = base64.b64decode(image_data_b64)
                        current_app.logger.info(
                            f"Image decoded successfully. Size: {len(binary_image_data)} bytes."
                        )

                        # Upload to Supabase Storage
                        bucket_name = current_app.config["SUPABASE_STORAGE_BUCKET"]
                        file_path = f"genPosters/{poster_id}.png"

                        current_app.logger.info(
                            f"Starting Supabase upload to path: {file_path}"
                        )
                        supabase.storage.from_(bucket_name).upload(
                            file=binary_image_data,
                            path=file_path,
                            file_options={"content-type": "image/png"},
                        )
                        current_app.logger.info(
                            f"Supabase upload successful for {poster_id}."
                        )

                        # Get public URL
                        poster_url = supabase.storage.from_(bucket_name).get_public_url(
                            file_path
                        )

                    except Exception as upload_e:
                        current_app.logger.error(
                            f"Image processing or upload failed for {poster_id}: {upload_e}",
                            exc_info=True,
                        )
                        raise upload_e

                else:
                    # Failure path: Log the full response object
                    current_app.logger.error(
                        f"Image data not found in response for {poster_id}. "
                        f"Logging full response for debugging: {response}"
                    )

            # Update database
            poster = GeneratedPoster.query.get(poster_id)
            if poster:
                poster.poster_url = poster_url
                poster.status = "completed" if poster_url else "failed"
                db.session.commit()
                current_app.logger.info(f"Poster generation completed: {poster_id}")
                return poster
            return None

        except Exception as e:
            # Main error handling block
            current_app.logger.error(
                f"Poster generation failed for {poster_id}: {e}", exc_info=True
            )
            poster = GeneratedPoster.query.get(poster_id)
            if poster:
                poster.status = "failed"
                db.session.commit()
            raise e

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

        if data.get("brandLogoUrl"):
            prompt += f"\n- CRITICAL: Incorporate the brand logo from this URL: {data['brandLogoUrl']}"

        if data.get("productImageUrl"):
            prompt += f"\n- CRITICAL: Feature the product from this URL as the focal point: {data['productImageUrl']}"

        prompt += f"\n\nDesign specifications:\n"
        prompt += f"- Aspect ratio: {data.get('aspectRatio', '1:1')}\n"
        prompt += f"- Style: Modern, professional, eye-catching\n"
        prompt += f"- Quality: High-resolution, suitable for advertising\n"

        return prompt
