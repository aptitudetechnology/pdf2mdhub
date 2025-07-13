# backend/models/tag.py
from backend.models import db
from backend.models.document_tag import document_tags

class Tag(db.Model):
    __tablename__ = 'tags'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

    documents = db.relationship(
        'Document',
        secondary=document_tags,
        back_populates='tags'
    )

    def __repr__(self):
        return f"<Tag {self.name}>"

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }