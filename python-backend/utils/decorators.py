"""Custom decorators for API endpoints."""
import functools
from flask import jsonify, current_app
from werkzeug.exceptions import HTTPException


def handle_errors(f):
    """Decorator to handle errors in API endpoints."""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except HTTPException as e:
            # Re-raise HTTP exceptions
            raise
        except ValueError as e:
            current_app.logger.warning(f'Validation error: {e}')
            return jsonify({'error': 'Validation error', 'message': str(e)}), 400
        except Exception as e:
            current_app.logger.error(f'Unexpected error: {e}', exc_info=True)
            return jsonify({'error': 'Internal server error', 'message': str(e)}), 500
    
    return decorated_function
