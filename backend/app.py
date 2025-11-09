"""Main application factory."""
import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import config
from extensions import db, init_supabase
from utils.logger import setup_logger


def create_app(config_name=None):
    """Create and configure the Flask application."""
    
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Setup logging
    setup_logger(app)
    
    # Initialize extensions
    db.init_app(app)
    init_supabase(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Register blueprints
    from api.poster import poster_bp
    from api.video import video_bp
    from api.critique import critique_bp
    from api.workflow import workflow_bp
    from api.health import health_bp
    from api.approval import approval_bp
    
    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(poster_bp, url_prefix='/api/poster')
    app.register_blueprint(video_bp, url_prefix='/api/video')
    app.register_blueprint(critique_bp, url_prefix='/api/critique')
    app.register_blueprint(workflow_bp, url_prefix='/api/workflow')
    app.register_blueprint(approval_bp, url_prefix='/api/approval')
    
    # Error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad request', 'message': str(error)}), 400
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found', 'message': str(error)}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f'Internal server error: {error}')
        return jsonify({'error': 'Internal server error'}), 500
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    app.logger.info(f'Application started in {config_name} mode')
    
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000)
