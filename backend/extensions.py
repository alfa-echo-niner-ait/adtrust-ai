"""Flask extensions initialization."""
from flask_sqlalchemy import SQLAlchemy
from supabase import create_client, Client

db = SQLAlchemy()

supabase: Client = None


def init_supabase(app):
    """Initialize Supabase client."""
    global supabase
    url = app.config.get("SUPABASE_URL")
    key = app.config.get("SUPABASE_SERVICE_ROLE_KEY")
    if url and key:
        supabase = create_client(url, key)
