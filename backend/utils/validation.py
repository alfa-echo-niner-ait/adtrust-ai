"""Request validation utilities."""
from typing import List, Dict, Any


def validate_generation_request(data: Dict[str, Any]) -> List[str]:
    """Validate generation request data."""
    errors = []
    
    if not data.get('prompt'):
        errors.append('Prompt is required')
    elif len(data['prompt']) < 10:
        errors.append('Prompt must be at least 10 characters')
    elif len(data['prompt']) > 10000:
        errors.append('Prompt must not exceed 10000 characters')
    
    if data.get('aspectRatio') and data['aspectRatio'] not in ['1:1', '3:4', '4:3', '9:16', '16:9']:
        errors.append('Invalid aspect ratio')
    
    if data.get('brandColors'):
        processed_colors = []
        
        if isinstance(data['brandColors'], str):
            colors = [c.strip() for c in data['brandColors'].split(',')]
        else:
            colors = data['brandColors']

        for color in colors:
            color = color.strip()
            if color.startswith('#'):
                processed_colors.append(color[:7])
        
        data['brandColors'] = processed_colors
    
    return errors


def validate_critique_request(data: Dict[str, Any]) -> List[str]:
    """Validate critique request data."""
    errors = []
    
    if not data.get('mediaUrl'):
        errors.append('Media URL is required')
    
    if not data.get('mediaType') or data['mediaType'] not in ['image', 'video']:
        errors.append('Valid media type is required (image or video)')
    
    if data.get('brandColors'):
        if not isinstance(data['brandColors'], list):
            errors.append('Brand colors must be an array')
        else:
            processed_colors = []
            for color in data['brandColors']:
                if isinstance(color, str):
                    color = color.strip()
                    if color.startswith('#'):
                        processed_colors.append(color[:7])
            data['brandColors'] = processed_colors
    
    return errors


def validate_workflow_request(data: Dict[str, Any]) -> List[str]:
    """Validate workflow request data."""
    errors = []
    
    if not data.get('contentType') or data['contentType'] not in ['poster', 'video']:
        errors.append('Valid content type is required (poster or video)')
    
    if not data.get('prompt'):
        errors.append('Prompt is required')
    elif len(data['prompt']) < 10:
        errors.append('Prompt must be at least 10 characters')
        
    if data.get('brandLogoUrl') and not data['brandLogoUrl'].startswith('http'):
        errors.append('Invalid brand logo URL')
        
    if data.get('productImageUrl') and not data['productImageUrl'].startswith('http'):
        errors.append('Invalid product image URL')
    
    return errors
