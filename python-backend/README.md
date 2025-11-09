# AdTrust Python Backend

A comprehensive Flask-based backend for the AdTrust AI ad generation and critique platform.

## Features

- **Poster Generation**: AI-powered poster/image ad generation
- **Video Generation**: AI-powered video ad generation
- **Content Critique**: Multi-dimensional AI critique with brand validation
- **Multi-Agent Workflow**: Automated generation-critique-refinement loop
- **Approval System**: Human-in-the-loop content approval workflow

## Project Structure

```
python-backend/
├── app.py                 # Application factory
├── config.py              # Configuration management
├── extensions.py          # Flask extensions
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
│
├── models/               # Database models
│   ├── poster.py
│   ├── video.py
│   ├── critique.py
│   ├── workflow.py
│   └── approval.py
│
├── api/                  # API blueprints
│   ├── health.py
│   ├── poster.py
│   ├── video.py
│   ├── critique.py
│   └── workflow.py
│
├── services/             # Business logic
│   ├── poster_service.py
│   ├── video_service.py
│   ├── critique_service.py
│   └── workflow_service.py
│
├── utils/                # Utilities
│   ├── logger.py
│   ├── validation.py
│   └── decorators.py
│
└── tests/                # Test suite
    ├── conftest.py
    ├── test_api.py
    └── test_services.py
```

## Setup

1. **Install dependencies**:
```bash
pip install -r requirements.txt
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Initialize database**:
```bash
python -c "from app import create_app; from extensions import db; app = create_app(); app.app_context().push(); db.create_all()"
```

4. **Run the application**:
```bash
# Development
python app.py

# Production
gunicorn -w 4 -b 0.0.0.0:5000 app:create_app()
```

## API Endpoints

### Health Check
- `GET /api/health` - Health check endpoint

### Poster Generation
- `POST /api/poster/generate` - Generate new poster
- `GET /api/poster/<id>` - Get poster details
- `GET /api/poster/` - List all posters

### Video Generation
- `POST /api/video/generate` - Generate new video
- `GET /api/video/<id>` - Get video details
- `GET /api/video/` - List all videos

### Critique
- `POST /api/critique/analyze` - Analyze content
- `GET /api/critique/<id>` - Get critique details
- `GET /api/critique/` - List all critiques

### Workflow
- `POST /api/workflow/start` - Start multi-agent workflow
- `GET /api/workflow/<id>` - Get workflow status
- `GET /api/workflow/` - List all workflows

## Testing

Run the test suite:
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_api.py
```

## Configuration

Key environment variables:

- `FLASK_ENV`: Application environment (development/production)
- `DATABASE_URL`: PostgreSQL database URL
- `GOOGLE_API_KEY`: Google AI API key
- `LOVABLE_API_KEY`: Lovable AI API key
- `SECRET_KEY`: Flask secret key

## Logging

Logs are written to:
- Console (stdout)
- File (`app.log` with rotation)

Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL

## Error Handling

All API endpoints include comprehensive error handling:
- 400 Bad Request - Validation errors
- 404 Not Found - Resource not found
- 500 Internal Server Error - Server errors

## Architecture

### Blueprint Structure
The application uses Flask blueprints for modular organization:
- Each API domain has its own blueprint
- Blueprints are registered with URL prefixes
- Shared functionality via decorators and utilities

### Service Layer
Business logic is separated into service classes:
- Decoupled from API routes
- Easier to test and maintain
- Async operations via threading

### Database Models
SQLAlchemy ORM models with:
- Proper relationships
- JSON serialization methods
- Timestamp tracking

## Performance

- Async generation via threading
- Database connection pooling
- Request/response compression
- Configurable timeouts

## Security

- CORS configuration
- Input validation
- SQL injection prevention via ORM
- API key management
- Secure error messages

## Deployment

For production deployment:

1. Set `FLASK_ENV=production`
2. Use a production WSGI server (gunicorn)
3. Configure reverse proxy (nginx)
4. Enable SSL/TLS
5. Set up monitoring and logging
6. Configure database connection pooling
7. Use environment-specific secrets

## License

Proprietary - AdTrust Platform
