# backend/models/__init__.py

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Import your models here so they are known to SQLAlchemy
from .document import Document, Tag, document_tags
# from .metadata import Metadata # If metadata needs its own table, otherwise it's part of Document