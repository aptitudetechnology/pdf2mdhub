# backend/models/__init__.py
from flask_sqlalchemy import SQLAlchemy

# Create the database instance
db = SQLAlchemy()

# Import all models here to ensure they are registered with db.metadata
from backend.models.tag import Tag
from backend.models.document import Document

# Only export db - models should be imported directly where needed
__all__ = ['db']