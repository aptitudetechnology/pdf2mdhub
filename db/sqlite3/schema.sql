-- SQLite schema for PDF2MDHub
-- Converted from PostgreSQL schema

CREATE TABLE document (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_path VARCHAR(512),
    markdown_content TEXT,
    file_size INTEGER,
    upload_date DATETIME,
    processed_date DATETIME,
    status VARCHAR(32),
    notes TEXT
);

CREATE TABLE tag (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(64) UNIQUE NOT NULL
);

CREATE TABLE document_tag (
    document_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (document_id, tag_id),
    FOREIGN KEY (document_id) REFERENCES document(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE
);

CREATE TABLE metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    key VARCHAR(64) NOT NULL,
    value TEXT,
    FOREIGN KEY (document_id) REFERENCES document(id) ON DELETE CASCADE
);

-- Indexes for search and filtering
CREATE INDEX idx_document_upload_date ON document(upload_date);
CREATE INDEX idx_document_status ON document(status);
CREATE INDEX idx_tag_name ON tag(name);
CREATE INDEX idx_metadata_key ON metadata(key);

-- For full-text search in SQLite, you can use FTS5:
-- CREATE VIRTUAL TABLE document_fts USING fts5(
--     markdown_content,
--     content='document',
--     content_rowid='id'
-- );
-- 
-- -- Trigger to keep FTS table in sync
-- CREATE TRIGGER document_fts_insert AFTER INSERT ON document BEGIN
--     INSERT INTO document_fts(rowid, markdown_content) VALUES (new.id, new.markdown_content);
-- END;
-- 
-- CREATE TRIGGER document_fts_delete AFTER DELETE ON document BEGIN
--     INSERT INTO document_fts(document_fts, rowid, markdown_content) VALUES('delete', old.id, old.markdown_content);
-- END;
-- 
-- CREATE TRIGGER document_fts_update AFTER UPDATE ON document BEGIN
--     INSERT INTO document_fts(document_fts, rowid, markdown_content) VALUES('delete', old.id, old.markdown_content);
--     INSERT INTO document_fts(rowid, markdown_content) VALUES (new.id, new.markdown_content);
-- END;