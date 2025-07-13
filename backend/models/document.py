# backend/models/document.py

from datetime import datetime
from .__init__ import db # Import the db instance
import json

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
    metadata = db.Column(db.JSON, default=lambda: {}) # Use a callable for mutable defaults

    # --- Search Indexing (for basic text search) ---
    search_text = db.Column(db.Text, default='') # Full text of the document for searching

    # --- User tracking (if authentication added) ---
    # user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) # Uncomment if User model exists
    # uploader = db.relationship('User', backref='uploaded_documents', lazy=True)

    # Tags relationship
    tags = db.relationship('Tag', secondary='document_tags', backref=db.backref('documents', lazy=True))

    def to_dict(self):
        """Converts the Document object to a dictionary for API responses."""
        return {
            'id': self.id,
            'filename': self.filename,
            'upload_date': self.upload_date.isoformat(),
            'status': self.status,
            'metadata': self.metadata,
            'tags': [tag.name for tag in self.tags],
            # 'user_id': self.user_id, # Uncomment if user tracking
            'file_url': f'/api/documents/{self.id}/download' # Example download URL
        }

    def __repr__(self):
        return f"<Document {self.id}: {self.filename}>"

class Tag(db.Model):
    __tablename__ = 'tags'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

    def __repr__(self):
        return f"<Tag {self.name}>"

# Association table for many-to-many relationship between Document and Tag
document_tags = db.Table('document_tags',
    db.Column('document_id', db.Integer, db.ForeignKey('documents.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tags.id'), primary_key=True)
)

# Optional: backend/models/metadata.py could define additional metadata schemas
# if you plan to have a more complex, structured metadata system that isn't just
# stored as JSON in the Document model. For now, we'll keep it simple in Document.