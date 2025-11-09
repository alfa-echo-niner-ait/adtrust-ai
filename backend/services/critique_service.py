"""Critique service for content analysis."""
import json
import base64
import requests
from flask import current_app


class CritiqueService:
    """Service for content critique operations."""
    
    def critique_content(self, media_url: str, media_type: str, brand_colors: list, caption: str) -> dict:
        """Perform AI critique on content."""
        try:
            # Fetch media
            media_data = self._fetch_and_encode_media(media_url)
            mime_type = 'video/mp4' if media_type == 'video' else 'image/jpeg'
            
            # Build critique prompt
            prompt = self._build_critique_prompt(brand_colors, caption)
            
            # Call Google Gemini API
            api_key = current_app.config['GOOGLE_API_KEY']
            response = requests.post(
                f'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={api_key}',
                headers={'Content-Type': 'application/json'},
                json={
                    'contents': [{
                        'parts': [
                            {'text': prompt},
                            {
                                'inline_data': {
                                    'mime_type': mime_type,
                                    'data': media_data
                                }
                            }
                        ]
                    }],
                    'generationConfig': {
                        'temperature': 0.4,
                        'maxOutputTokens': 2048
                    }
                },
                timeout=60
            )
            
            if response.status_code != 200:
                raise Exception(f'Gemini API error: {response.text}')
            
            result = response.json()
            generated_text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
            
            # Parse JSON response
            cleaned_text = generated_text.replace('```json', '').replace('```', '').strip()
            critique_result = json.loads(cleaned_text)
            
            current_app.logger.info('Critique completed successfully')
            return critique_result
            
        except Exception as e:
            current_app.logger.error(f'Critique failed: {e}')
            raise
    
    def _fetch_and_encode_media(self, url: str) -> str:
        """Fetch media and encode to base64."""
        response = requests.get(url, timeout=60)
        return base64.b64encode(response.content).decode('utf-8')
    
    def _build_critique_prompt(self, brand_colors: list, caption: str) -> str:
        """Build comprehensive critique prompt."""
        colors = ', '.join(brand_colors) if brand_colors else 'Not specified'
        
        prompt = f"""You are an expert brand and creative director evaluating AI-generated ads.
Analyze the provided ad creative and provide a comprehensive critique based on these brand guidelines:

Brand Colors: {colors}
Caption/Message: {caption}

Evaluate the following aspects with precision:

1. BRAND ALIGNMENT (0-1): How well does the visual content match the provided brand colors? Does it use the correct logo? Is the overall aesthetic on-brand?

2. VISUAL QUALITY (0-1): Assess composition, clarity, professionalism, absence of artifacts, watermarks, or blurriness

3. MESSAGE CLARITY (0-1): Is the product/service obvious? Is the tagline/caption clear and correct? Can viewers immediately understand what's being advertised?

4. TONE OF VOICE (0-1): Does the messaging style, language, and overall communication match the expected brand voice? Is it appropriate for the target audience?

5. SAFETY & ETHICS (0-1): Check for harmful content, stereotypes, misleading claims, or any unsafe elements

6. BRAND VALIDATION: Compare the generated content against provided brand assets:
   - Calculate what percentage of the provided brand colors are actually present in the ad
   - Check if a logo is visible and appears correct
   - Assess overall brand consistency

7. SAFETY BREAKDOWN: Provide granular safety analysis:
   - Harmful content detection (violence, adult content, etc.)
   - Stereotype detection (racial, gender, age-based stereotypes)
   - Misleading claims detection (false promises, exaggerations)

Return ONLY a JSON object with this exact structure:
{{
  "BrandFit_Score": 0.85,
  "VisualQuality_Score": 0.92,
  "MessageClarity_Score": 0.88,
  "ToneOfVoice_Score": 0.90,
  "Safety_Score": 0.95,
  "BrandValidation": {{
    "color_match_percentage": 75,
    "logo_present": true,
    "logo_correct": true,
    "overall_consistency": 0.82
  }},
  "SafetyBreakdown": {{
    "harmful_content": 1.0,
    "stereotypes": 1.0,
    "misleading_claims": 0.9
  }},
  "Critique_Summary": "Detailed explanation covering all dimensions",
  "Refinement_Prompt_Suggestion": "Specific actionable suggestions explicitly mentioning brand colors: {colors}"
}}"""
        
        return prompt
