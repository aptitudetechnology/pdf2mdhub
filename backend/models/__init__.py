# backend/models/__init__.py
from flask_sqlalchemy import SQLAlchemy

# Create the database instance
db = SQLAlchemy()

# DON'T import models here - this causes circular imports
# The models will import db from this module instead

# Only export db - models should be imported directly where needed
__all__ = ['db']