# backend/models/__init__.py
from flask_sqlalchemy import SQLAlchemy

# Create the database instance
db = SQLAlchemy()

# Import all models to ensure they're registered with SQLAlchemy
from .document import Document, Tag

# Export everything that should be available when importing from backend.models
__all__ = ['db', 'Document', 'Tag']