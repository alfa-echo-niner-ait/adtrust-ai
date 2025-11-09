"""Critique service for content analysis."""
import json
import io
import requests
import google.generativeai as genai
from google.generativeai.types import GenerationConfig
from flask import current_app
from PIL import Image


class CritiqueService:
    """Service for content critique operations."""

    def __init__(self):
        """Initialize the service."""
        self.api_key = current_app.config.get('GOOGLE_API_KEY')
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY not configured")
        genai.configure(api_key=self.api_key)
    
    def critique_content(self, media_url: str, media_type: str, brand_colors: list, caption: str) -> dict:
        """Perform AI critique on content."""
        try:
            # Fetch media
            media_content = self._fetch_media(media_url)
            
            # Build critique prompt
            prompt = self._build_critique_prompt(brand_colors, caption)
            
            # Define the JSON schema for the desired output
            json_schema = {
                "type": "object",
                "properties": {
                    "BrandFit_Score": {"type": "number", "description": "Score from 0 to 1 for brand alignment."},
                    "VisualQuality_Score": {"type": "number", "description": "Score from 0 to 1 for visual quality."},
                    "MessageClarity_Score": {"type": "number", "description": "Score from 0 to 1 for message clarity."},
                    "ToneOfVoice_Score": {"type": "number", "description": "Score from 0 to 1 for tone of voice."},
                    "Safety_Score": {"type": "number", "description": "Score from 0 to 1 for safety and ethics."},
                    "BrandValidation": {
                        "type": "object",
                        "properties": {
                            "color_match_percentage": {"type": "integer", "description": "Percentage of brand colors present."},
                            "logo_present": {"type": "boolean", "description": "Is the logo present?"},
                            "logo_correct": {"type": "boolean", "description": "Is the logo correct?"},
                            "overall_consistency": {"type": "number", "description": "Overall brand consistency score from 0 to 1."}
                        },
                        "required": ["color_match_percentage", "logo_present", "logo_correct", "overall_consistency"]
                    },
                    "SafetyBreakdown": {
                        "type": "object",
                        "properties": {
                            "harmful_content": {"type": "number", "description": "Score from 0 to 1 for harmful content."},
                            "stereotypes": {"type": "number", "description": "Score from 0 to 1 for stereotypes."},
                            "misleading_claims": {"type": "number", "description": "Score from 0 to 1 for misleading claims."}
                        },
                        "required": ["harmful_content", "stereotypes", "misleading_claims"]
                    },
                    "Critique_Summary": {"type": "string", "description": "Detailed explanation covering all dimensions."},
                    "Refinement_Prompt_Suggestion": {"type": "string", "description": "Actionable suggestions for prompt refinement."}
                },
                "required": ["BrandFit_Score", "VisualQuality_Score", "MessageClarity_Score", "ToneOfVoice_Score", "Safety_Score", "BrandValidation", "SafetyBreakdown", "Critique_Summary", "Refinement_Prompt_Suggestion"]
            }

            # Call Google Gemini API
            model = genai.GenerativeModel('gemini-1.5-flash-latest')
            
            # Prepare content for API
            content_parts = [prompt]
            if media_type == 'image':
                img = Image.open(io.BytesIO(media_content))
                content_parts.append(img)
            else: # video
                video_part = genai.types.Part.from_data(media_content, mime_type='video/mp4')
                content_parts.append(video_part)

            response = model.generate_content(
                content_parts,
                generation_config=GenerationConfig(response_mime_type="application/json", response_schema=json_schema)
            )
            
            # The response text should be a valid JSON string
            critique_result = json.loads(response.text)
            
            current_app.logger.info('Critique completed successfully')
            return critique_result
            
        except Exception as e:
            current_app.logger.error(f'Critique failed: {e}')
            raise
    
    def _fetch_media(self, url: str) -> bytes:
        """Fetch media content."""
        response = requests.get(url, timeout=60)
        response.raise_for_status()
        return response.content
    
    def _build_critique_prompt(self, brand_colors: list, caption: str) -> str:
        """Build comprehensive critique prompt."""
        colors = ', '.join(brand_colors) if brand_colors else 'Not specified'
        
        return f"""You are an expert brand and creative director.
Analyze the provided ad creative based on these brand guidelines:
- Brand Colors: {colors}
- Caption/Message: {caption}
Evaluate the ad and provide a comprehensive critique. Return the analysis in the specified JSON format.
"""
