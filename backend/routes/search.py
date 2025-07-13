# backend/routes/search.py
from flask import Blueprint, request, jsonify
#from backend.models.document import Document, Tag
from backend.models.document import Document
from backend.models.tag import Tag # Import Tag from its dedicated file
from sqlalchemy.orm import selectinload
import traceback

search_bp = Blueprint('search', __name__)

@search_bp.route('/api/search', methods=['GET'])
def search_documents():
    try:
        query = request.args.get('q', '').strip()
        tags_filter = request.args.getlist('tags')
        
        # Start with all documents and eager load tags to prevent DetachedInstanceError
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