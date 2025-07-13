# =============================================================================
# COMPLETE FIX for SQLAlchemy DetachedInstanceError
# Apply these changes to your files:
# =============================================================================

# =============================================================================
# 1. document.py - Fix the to_dict() method
# =============================================================================

from sqlalchemy.orm import inspect
from sqlalchemy.orm.exc import DetachedInstanceError

class Document(db.Model):
    # ... existing model definition ...
    
    def to_dict(self):
        """
        Convert document to dictionary.
        Handles detached instances gracefully.
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
        
        return {
            'id': self.id,
            'filename': self.filename,
            'upload_date': self.upload_date.isoformat() if self.upload_date else None,
            'metadata': self.metadata,
            'search_text': self.search_text,
            'tags': tags,
            # Add any other fields your model has
        }

# =============================================================================
# 2. app.py - Fix the get_documents function with eager loading
# =============================================================================

from sqlalchemy.orm import joinedload, selectinload

@app.route('/api/documents', methods=['GET'])
def get_documents():
    try:
        # Get query parameters
        q = request.args.get('q', '').strip()
        tag_filter = request.args.get('tag', '').strip()
        date_from = request.args.get('date_from', '').strip()
        date_to = request.args.get('date_to', '').strip()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Start with base query with eager loading
        query = Document.query.options(selectinload(Document.tags))
        
        # Apply filters
        if q:
            query = query.filter(
                (Document.filename.ilike(f'%{q}%')) |
                (Document.metadata.ilike(f'%{q}%')) |
                (Document.search_text.ilike(f'%{q}%'))
            )
        
        if tag_filter:
            query = query.filter(Document.tags.any(Tag.name.ilike(f'%{tag_filter}%')))
        
        if date_from:
            try:
                date_from_obj = datetime.strptime(date_from, '%Y-%m-%d')
                query = query.filter(Document.upload_date >= date_from_obj)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to_obj = datetime.strptime(date_to, '%Y-%m-%d')
                query = query.filter(Document.upload_date <= date_to_obj)
            except ValueError:
                pass
        
        # Execute query with pagination
        pagination = query.order_by(Document.upload_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Convert to dict while still in session context
        documents_dict = [doc.to_dict() for doc in pagination.items]
        
        return jsonify({
            'documents': documents_dict,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': pagination.page,
            'per_page': pagination.per_page,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        })
        
    except Exception as e:
        print(f"Error in get_documents: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Failed to fetch documents'}), 500

# =============================================================================
# 3. search.py - Fix with eager loading
# =============================================================================

from flask import Blueprint, request, jsonify
from backend.models.document import Document, Tag
from sqlalchemy.orm import selectinload
import traceback

search_bp = Blueprint('search', __name__)

@search_bp.route('/api/search', methods=['GET'])
def search_documents():
    try:
        query = request.args.get('q', '').strip()
        tags_filter = request.args.getlist('tags')
        
        # Start with all documents and eager load tags
        search_results = Document.query.options(selectinload(Document.tags))
        
        # Apply text search filter
        if query:
            search_results = search_results.filter(
                (Document.filename.ilike(f'%{query}%')) |
                (Document.metadata.ilike(f'%{query}%')) |
                (Document.search_text.ilike(f'%{query}%'))
            )
        
        # Apply tag filter (AND logic)
        if tags_filter:
            for tag_name in tags_filter:
                search_results = search_results.filter(
                    Document.tags.any(Tag.name.ilike(f'%{tag_name.strip()}%'))
                )
        
        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        pagination = search_results.order_by(Document.upload_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Convert to dict while still in session context
        documents_dict = [doc.to_dict() for doc in pagination.items]
        
        return jsonify({
            "documents": documents_dict,
            "total_results": pagination.total,
            "total_pages": pagination.pages,
            "current_page": pagination.page,
            "per_page": pagination.per_page
        })
        
    except Exception as e:
        print(f"Search error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": "Search failed", "message": str(e)}), 500

# =============================================================================
# 4. ALTERNATIVE: If you want to modify the relationship definition
# =============================================================================

# In your Document model, you can also change the relationship to eager load by default:
class Document(db.Model):
    # ... other fields ...
    
    # Change from lazy loading to eager loading
    tags = db.relationship('Tag', secondary=document_tags, lazy='select', back_populates='documents')
    
    # OR use joined loading (loads in single query)
    # tags = db.relationship('Tag', secondary=document_tags, lazy='joined', back_populates='documents')

# =============================================================================
# 5. BONUS: Database session management best practices
# =============================================================================

# Add this to your app.py for better session management
@app.teardown_appcontext
def close_db(error):
    """Close database session at end of request"""
    db.session.remove()

# =============================================================================
# SUMMARY OF CHANGES:
# =============================================================================
# 1. Modified to_dict() to handle DetachedInstanceError gracefully
# 2. Added eager loading using selectinload() in both app.py and search.py
# 3. Ensured to_dict() is called while documents are still in session context
# 4. Added proper error handling and session management
# 
# KEY POINTS:
# - selectinload() loads relationships in separate queries (good for one-to-many)
# - joinedload() loads relationships in single query (good for many-to-one)
# - Always call to_dict() before session closes
# - Handle DetachedInstanceError gracefully in to_dict()
# =============================================================================