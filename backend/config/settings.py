# backend/config/settings.py

import os

class Config:
    # Database Configuration
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///documents.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # File Upload Configuration
    UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), '../../uploaded_pdfs') # Go up two dirs from config to project root, then into uploaded_pdfs
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB limit
    ALLOWED_EXTENSIONS = {'pdf'}

    # Other settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'a_very_secret_key_for_dev') # Change for production