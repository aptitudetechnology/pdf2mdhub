-- PostgreSQL schema for PDF2MDHub
-- Generated from SQLAlchemy models (step 1.1)

CREATE TABLE document (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_path VARCHAR(512),
    markdown_content TEXT,
    file_size INTEGER,
    upload_date TIMESTAMP,
    processed_date TIMESTAMP,
    status VARCHAR(32),
    notes TEXT
);

CREATE TABLE tag (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL
);

CREATE TABLE document_tag (
    document_id INTEGER NOT NULL REFERENCES document(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, tag_id)
);

CREATE TABLE metadata (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES document(id) ON DELETE CASCADE,
    key VARCHAR(64) NOT NULL,
    value TEXT
);

-- Indexes for search and filtering
CREATE INDEX idx_document_upload_date ON document(upload_date);
CREATE INDEX idx_document_status ON document(status);
CREATE INDEX idx_tag_name ON tag(name);
CREATE INDEX idx_metadata_key ON metadata(key);

-- For full-text search, consider adding a tsvector column and GIN index:
-- ALTER TABLE document ADD COLUMN markdown_tsv tsvector;
-- CREATE INDEX idx_document_markdown_tsv ON document USING GIN (markdown_tsv);
