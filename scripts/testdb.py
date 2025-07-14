import os
import sys
import psycopg2

def get_db_url():
    return os.getenv(
        "DATABASE_URL",
        "postgresql://user:password@localhost:5432/pdf2mdhub"
    )

def main():
    db_url = get_db_url()
    print(f"Connecting to PostgreSQL at: {db_url}")
    
    try:
        conn = psycopg2.connect(db_url)
    except Exception as e:
        print(f"ERROR: Could not connect to PostgreSQL: {e}")
        sys.exit(1)
    
    print("Connection successful.")
    
    expected_tables = {"documents", "tags", "document_tags"}
    
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public';
            """)
            tables = set(row[0] for row in cur.fetchall())
            print(f"Found tables: {tables}")
            
            missing = expected_tables - tables
            if missing:
                print(f"WARNING: Missing tables: {missing}")
            else:
                print("All expected tables are present.")
                
    except Exception as e:
        print(f"ERROR: Could not query schema: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    main()