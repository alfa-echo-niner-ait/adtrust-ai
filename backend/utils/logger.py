"""Logging configuration."""
import logging
import sys
from logging.handlers import RotatingFileHandler


def setup_logger(app):
    """Configure application logging."""
    
    # Remove default handlers
    app.logger.handlers.clear()
    
    # Set log level
    log_level = getattr(logging, app.config.get('LOG_LEVEL', 'INFO'))
    app.logger.setLevel(log_level)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
    )
    console_handler.setFormatter(console_formatter)
    app.logger.addHandler(console_handler)
    
    # File handler
    if not app.config.get('TESTING'):
        file_handler = RotatingFileHandler(
            app.config.get('LOG_FILE', 'app.log'),
            maxBytes=10485760,  # 10MB
            backupCount=10
        )
        file_handler.setLevel(log_level)
        file_formatter = logging.Formatter(
            '[%(asctime)s] %(levelname)s [%(pathname)s:%(lineno)d] %(message)s'
        )
        file_handler.setFormatter(file_formatter)
        app.logger.addHandler(file_handler)
    
    app.logger.info('Logging configured successfully')
