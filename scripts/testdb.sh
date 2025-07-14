#!/bin/bash

echo "=== PostgreSQL Container Info ==="
docker inspect postgres_postgres_1 | grep -A 10 -B 5 "Env"

echo -e "\n=== Testing common PostgreSQL connection strings ==="

# Common default combinations
DB_CONFIGS=(
    "postgresql://postgres:postgres@localhost:5432/postgres"
    "postgresql://postgres:password@localhost:5432/postgres"
    "postgresql://postgres:@localhost:5432/postgres"
    "postgresql://user:password@localhost:5432/postgres"
    "postgresql://postgres:postgres@localhost:5432/pdf2mdhub"
    "postgresql://postgres:password@localhost:5432/pdf2mdhub"
)

for db_url in "${DB_CONFIGS[@]}"; do
    echo -n "Testing: $db_url ... "
    if psql "$db_url" -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✓ SUCCESS"
        echo "Use this connection string: $db_url"
        exit 0
    else
        echo "✗ Failed"
    fi
done

echo -e "\n=== Manual connection test ==="
echo "Try connecting manually with:"
echo "docker exec -it postgres_postgres_1 psql -U postgres"