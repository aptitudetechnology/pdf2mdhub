# PostgreSQL Migration Plan for PDF2MDHub

This guide outlines the steps to migrate the PDF2MDHub backend from SQLite to PostgreSQL, ensuring robust production-ready database support and leveraging advanced features like full-text search and improved concurrency.

## 1. Preparation
### 1.1 Review SQLAlchemy Models
- [ ] Open each model file in `backend/models/` (e.g., `document.py`, `metadata.py`, `tag.py`, `document_tag.py`).
- [ ] Check for SQLite-specific data types (e.g., `db.JSON`, `db.Text`, `db.DateTime`).
- [ ] Ensure all relationships use explicit foreign keys and indexes where needed.
- [ ] Confirm that constraints (unique, nullable, default) are compatible with PostgreSQL.
- [ ] Note any custom types or fields that may require migration adjustments.

### 1.2 Review Dependencies

#### Findings:
- `backend/requirements.txt` currently includes `Flask-SQLAlchemy` (required for ORM/database access).
- `psycopg2-binary` (PostgreSQL driver) is not present and will need to be added for PostgreSQL support.
- Alembic is not present; adding it is recommended for managing migrations and schema changes.
- All other listed packages are compatible with PostgreSQL and do not require changes.

**Action:**
- Add `psycopg2-binary` to `backend/requirements.txt` in step 2.
- Add `alembic` to `backend/requirements.txt` for migration management.
- Ensure `Flask-SQLAlchemy` is updated to the latest version for best compatibility.

### 1.3 Backup Existing Data
- [ ] If you have production or test data in SQLite, back up the database file (usually `pdf2md.db`).
- [ ] Use tools like `sqlite3` CLI or custom scripts to export data if needed.
- [ ] Document the backup location and process for future reference.

---
**Action:** Complete this checklist before proceeding to dependency and configuration changes. Document any model or dependency issues found here for later migration steps.

## 2. Update Dependencies
- Add `psycopg2-binary` to `backend/requirements.txt` for PostgreSQL support.
- Optionally, add `alembic` for migrations.

## 3. Update Configuration
- In `.env.example` and `.env`, change the `DATABASE_URL` to:
  ```env
  DATABASE_URL=postgresql://user:password@localhost:5432/pdf2mdhub
  ```
- Update `backend/config/settings.py` to read the new environment variable.

## 4. Docker Integration
- Update `docker-compose.yml` to include a `postgres` service:
  ```yaml
  services:
    backend:
      ...existing config...
    postgres:
      image: postgres:16
      environment:
        POSTGRES_DB: pdf2mdhub
        POSTGRES_USER: user
        POSTGRES_PASSWORD: password
      ports:
        - "5432:5432"
      volumes:
        - pgdata:/var/lib/postgresql/data
  volumes:
    pgdata:
  ```
- Ensure backend connects to the `postgres` service using the correct host and credentials.

## 5. Model Adjustments
- Change any SQLite-specific types (e.g., `db.JSON` or `db.Text`) to PostgreSQL-compatible types if needed.
- For full-text search, consider using PostgreSQL's `TSVECTOR` and SQLAlchemy's `sqlalchemy-searchable` or custom queries.

## 6. Migration Scripts
- Use Alembic to generate and apply migration scripts:
  ```bash
  alembic init migrations
  alembic revision --autogenerate -m "Initial migration"
  alembic upgrade head
  ```
- Alternatively, use `db.create_all()` for initial setup (not recommended for production).

## 7. Update Application Logic
- Update any raw SQL queries to use PostgreSQL syntax (e.g., `ILIKE` for case-insensitive search).
- Test tag and date filtering logic for compatibility.

## 8. Testing
- Run all backend and API tests against the PostgreSQL database.
- Validate search, tag, and date filtering functionality.
- Check for performance improvements and edge cases.

## 9. Data Migration (Optional)
- If migrating existing data, use tools like `pgloader` or custom scripts to transfer from SQLite to PostgreSQL.

## 10. Documentation
- Update all setup instructions in `README.md` and related docs to reflect PostgreSQL usage.
- Document environment variables, connection strings, and migration steps.

## 11. Rollout
- Deploy updated containers and verify production readiness.
- Monitor logs and database health after migration.

---

**Summary:**
Migrating to PostgreSQL will provide better scalability, reliability, and advanced search capabilities for PDF2MDHub. Follow this plan to ensure a smooth transition and robust backend support.
postgres-migration.md