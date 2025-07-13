# backend/models/tag.py
from backend.models import db
# CRITICAL: Import the association table directly from document.py
from backend.models.document import document_tags # Add this line

class Tag(db.Model):
    __tablename__ = 'tags'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)

    documents = db.relationship(
        'Document',
        secondary=document_tags,
        back_populates='tags'
    )

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }

    def __repr__(self):
        return f'<Tag {self.name}>'