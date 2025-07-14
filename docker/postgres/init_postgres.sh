#!/bin/bash
# Script to initialize the PostgreSQL database using schema_postgres.sql

set -e

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-pdf2mdhub}
DB_USER=${DB_USER:-user}
DB_PASSWORD=${DB_PASSWORD:-password}
SCHEMA_FILE="$(dirname "$0")/schema_postgres.sql"

export PGPASSWORD="$DB_PASSWORD"

echo "Initializing PostgreSQL database $DB_NAME on $DB_HOST:$DB_PORT..."

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCHEMA_FILE"

echo "Database initialized using $SCHEMA_FILE."
