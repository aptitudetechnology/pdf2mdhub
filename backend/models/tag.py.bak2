# backend/models/tag.py
from backend.models import db # Import the db instance

class Tag(db.Model):
    __tablename__ = 'tags'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)

    # *** ADD THIS RELATIONSHIP DEFINITION ***
    documents = db.relationship(
        'Document',             # The name of the related model class
        secondary='document_tags', # The string name of the association table defined in document.py
        back_populates='tags'   # The name of the relationship on the Document model
    )

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }

    def __repr__(self):
        return f'<Tag {self.name}>'