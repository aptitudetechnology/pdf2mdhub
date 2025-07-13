# backend/routes/__init__.py

from flask import Blueprint

# Create a main blueprint for all API routes (optional, but good for organization)
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Import and register your specific route blueprints
from .upload import upload_bp
from .documents import documents_bp
from .search import search_bp

api_bp.register_blueprint(upload_bp)
api_bp.register_blueprint(documents_bp)
api_bp.register_blueprint(search_bp)