# backend/models/document.py
from datetime import datetime
from backend.models import db
from sqlalchemy.orm.exc import DetachedInstanceError
import json
from backend.models.document_tag import document_tags

class Document(db.Model):
    __tablename__ = 'documents'

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False) # Path where the file is stored
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)

    # --- Document status tracking ---
    # e.g., 'uploaded', 'processing_ocr', 'processed', 'failed'
    status = db.Column(db.String(50), default='uploaded', nullable=False)

    # --- Metadata (for upload with metadata and update metadata) ---
    # Store metadata as JSON
    # For SQLite, JSON is stored as TEXT. For PostgreSQL, it's native JSONB.
    document_metadata = db.Column(db.JSON, default=lambda: {}) # Use a callable for mutable defaults

    # --- Search Indexing (for basic text search) ---
    search_text = db.Column(db.Text, default='') # Full text of the document for searching

    # --- User tracking (if authentication added) ---
    # user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) # Uncomment if User model exists
    # uploader = db.relationship('User', backref='uploaded_documents', lazy=True)

    # Tags relationship - using the association table defined above.
    tags = db.relationship('Tag', secondary=document_tags, back_populates='documents')

    def to_dict(self):
        """
        Converts the Document object to a dictionary for API responses.
        Handles DetachedInstanceError gracefully.
        """
        try:
            # Try to access tags normally
            tags = [tag.name for tag in self.tags]
        except DetachedInstanceError:
            # If detached, try to get tags from current session
            try:
                from flask import current_app
                with current_app.app_context():
                    # Re-merge the instance with current session
                    merged_doc = db.session.merge(self)
                    tags = [tag.name for tag in merged_doc.tags]
            except:
                # If all else fails, return empty tags
                tags = []
        except Exception:
            # Handle any other exceptions
            tags = []
        
        return {
            'id': self.id,
            'filename': self.filename,
            'upload_date': self.upload_date.isoformat() if self.upload_date else None,
            'status': self.status,
            'metadata': self.document_metadata,
            'search_text': self.search_text,
            'tags': tags,
            # 'user_id': self.user_id, # Uncomment if user tracking
            'file_url': f'/api/documents/{self.id}/download' # Example download URL
        }

    def __repr__(self):
        return f"<Document {self.id}: {self.filename}>"