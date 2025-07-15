-- SQLite schema for PDF2MDHub
-- Converted from PostgreSQL schema

CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255),
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(512),
    upload_date DATETIME,
    markdown_filepath VARCHAR(512),
    status VARCHAR(32),
    document_metadata TEXT,
    search_text TEXT
);

CREATE TABLE tag (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(64) UNIQUE NOT NULL
);

CREATE TABLE document_tag (
    document_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (document_id, tag_id),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE
);

CREATE TABLE metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    key VARCHAR(64) NOT NULL,
    value TEXT,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Indexes for search and filtering
CREATE INDEX idx_document_upload_date ON documents(upload_date);
CREATE INDEX idx_document_status ON documents(status);
CREATE INDEX idx_tag_name ON tag(name);
CREATE INDEX idx_metadata_key ON metadata(key);

-- For full-text search in SQLite, you can use FTS5:
-- CREATE VIRTUAL TABLE document_fts USING fts5(
--     search_text,
--     content='documents',
--     content_rowid='id'
-- );
-- 
-- -- Trigger to keep FTS table in sync
-- CREATE TRIGGER document_fts_insert AFTER INSERT ON documents BEGIN
--     INSERT INTO document_fts(rowid, search_text) VALUES (new.id, new.search_text);
-- END;
-- 
-- CREATE TRIGGER document_fts_delete AFTER DELETE ON documents BEGIN
--     INSERT INTO document_fts(document_fts, rowid, search_text) VALUES('delete', old.id, old.search_text);
-- END;
-- 
-- CREATE TRIGGER document_fts_update AFTER UPDATE ON documents BEGIN
--     INSERT INTO document_fts(document_fts, rowid, search_text) VALUES('delete', old.id, old.search_text);
--     INSERT INTO document_fts(rowid, search_text) VALUES (new.id, new.search_text);
-- END;