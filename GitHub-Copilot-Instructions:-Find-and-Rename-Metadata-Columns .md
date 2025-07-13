# GitHub Copilot Instructions: Find and Rename Metadata Columns

## Task Overview
Find all files in the codebase that contain database columns named `metadata` and rename them to `document_metadata` to avoid SQLAlchemy reserved keyword conflicts.

## Step 1: Search for Metadata Column Definitions

Please search the entire codebase for the following patterns:

```python
# SQLAlchemy column definitions
metadata = db.Column(
metadata = Column(
'metadata'
"metadata"
```

Look specifically in:
- `backend/models/` directory
- Any `.py` files containing SQLAlchemy model definitions
- Files with `db.Model` or `Model` class definitions

## Step 2: Identify File Locations

For each match found, provide:
1. **File path** (e.g., `backend/models/document.py`)
2. **Line number** where `metadata` appears
3. **Context** (show 2-3 lines before and after)

## Step 3: Rename Metadata to Document_Metadata

For each file identified, make the following changes:

### A. Column Definition Changes
**Before:**
```python
metadata = db.Column(db.Text)
```

**After:**
```python
document_metadata = db.Column(db.Text)
```

### B. Constructor/Init Changes
**Before:**
```python
def __init__(self, title, filename, metadata=None):
    self.metadata = metadata
```

**After:**
```python
def __init__(self, title, filename, document_metadata=None):
    self.document_metadata = document_metadata
```

### C. Method References
**Before:**
```python
def to_dict(self):
    return {
        'metadata': self.metadata
    }
```

**After:**
```python
def to_dict(self):
    return {
        'document_metadata': self.document_metadata
    }
```

### D. Query References
**Before:**
```python
Document.query.filter_by(metadata=some_value)
```

**After:**
```python
Document.query.filter_by(document_metadata=some_value)
```

## Step 4: Update API References

Also search for and update any references in:

### Route/Controller Files
- `backend/routes/` directory
- `app.py` or main application file

**Before:**
```python
new_document.metadata = request.json.get('metadata')
```

**After:**
```python
new_document.document_metadata = request.json.get('document_metadata')
```

### Frontend/API Contract Updates
- Any JavaScript/TypeScript files referencing `metadata`
- API documentation mentioning `metadata` field
- Frontend forms or components using `metadata`

## Step 5: Database Migration Considerations

If this is a production system, note that you'll need to:
1. Create a database migration to rename the column
2. Update any existing data references
3. Consider backward compatibility if APIs are public

## Step 6: Test Coverage

After renaming, verify:
1. All model imports work without SQLAlchemy errors
2. Database operations (create, read, update, delete) function correctly
3. API endpoints return correct field names
4. Frontend still displays data properly

## Example Complete Transformation

**Original problematic code:**
```python
class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255))
    metadata = db.Column(db.Text)  # PROBLEM: conflicts with SQLAlchemy
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'metadata': self.metadata
        }
```

**Fixed code:**
```python
class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255))
    document_metadata = db.Column(db.Text)  # FIXED: no conflict
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'document_metadata': self.document_metadata
        }
```

## Priority Files to Check

Focus on these common locations first:
1. `backend/models/document.py`
2. `backend/models/__init__.py`
3. `backend/app.py`
4. `backend/routes/` (all route files)
5. Any database migration files

Please execute this search and provide a report of all files that need to be updated.