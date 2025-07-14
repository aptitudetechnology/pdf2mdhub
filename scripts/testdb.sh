#!/bin/bash

# Get database URL from environment variable or use default
DB_URL="${DATABASE_URL:-postgresql://user:password@localhost:5432/pdf2mdhub}"

echo "Connecting to PostgreSQL at: $DB_URL"

# Test connection
if ! psql "$DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "ERROR: Could not connect to PostgreSQL"
    exit 1
fi

echo "Connection successful."

# Check for expected tables
EXPECTED_TABLES=("documents" "tags" "document_tags")

echo "Checking for expected tables..."

# Get list of existing tables
EXISTING_TABLES=$(psql "$DB_URL" -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')

if [ $? -ne 0 ]; then
    echo "ERROR: Could not query schema"
    exit 1
fi

echo "Found tables:"
echo "$EXISTING_TABLES"

# Check for missing tables
MISSING_TABLES=()
for table in "${EXPECTED_TABLES[@]}"; do
    if ! echo "$EXISTING_TABLES" | grep -q "^$table$"; then
        MISSING_TABLES+=("$table")
    fi
done

if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
    echo "WARNING: Missing tables: ${MISSING_TABLES[*]}"
else
    echo "All expected tables are present."
fi