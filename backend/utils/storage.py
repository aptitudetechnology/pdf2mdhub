# backend/utils/storage.py

import os
from werkzeug.utils import secure_filename
from flask import current_app # To access UPLOAD_FOLDER from app config

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def save_file(file):
    if not file:
        return None, "No file provided"
    if file.filename == '':
        return None, "No selected file"
    if not allowed_file(file.filename):
        return None, f"Invalid file type. Only {', '.join(current_app.config['ALLOWED_EXTENSIONS'])} are allowed."

    filename = secure_filename(file.filename)
    upload_folder = current_app.config['UPLOAD_FOLDER']
    
    # Ensure the upload directory exists
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)

    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)
    return filepath, None

def delete_file(filepath):
    if os.path.exists(filepath):
        try:
            os.remove(filepath)
            return True, None
        except Exception as e:
            return False, f"Failed to delete file from storage: {str(e)}"
    return False, "File not found on disk."