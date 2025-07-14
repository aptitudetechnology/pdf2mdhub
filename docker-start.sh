#!/bin/bash
# Minimal start-up script for PDF2MDHub in a Docker container
set -e # Exit immediately if a command exits with a non-zero status.

echo "Starting PDF2MDHub in Docker..."

# Navigate to the /app directory (your WORKDIR in Dockerfile)
# This ensures that '/app' is the current working directory,
# which is important for Python to find the 'backend' package correctly
cd /app

# --- 1. Export Flask app environment variables ---
# FLASK_APP should point to your app factory function within the 'backend' package.
# Assuming your app factory is `create_app()` in `app.py` inside the `backend` package.
export FLASK_APP="backend.app:create_app()"
export FLASK_ENV=production # Set to 'development' for debugging, 'production' for deployment.

# Ensure necessary directories exist at runtime
# These are used for uploads and Flask's instance configuration.
mkdir -p uploads
mkdir -p instance

# --- 2. Database Migration Step (Optional, if using Flask-Migrate) ---
# Uncomment and use if you need to apply database migrations on container start.
# This is typical for persistent databases (e.g., PostgreSQL, MySQL) managed with Flask-Migrate.
# If your database is ephemeral (e.g., SQLite inside the container that gets reset), you might not need this.
# echo "Applying database migrations (if configured)..."
# flask db upgrade

# --- 3. Starting Flask server with Gunicorn (Recommended for Production) ---
# Gunicorn is a production-ready WSGI HTTP Server for Python.
# Ensure 'gunicorn' is listed in your backend/requirements.txt file.
echo "Starting Flask server with Gunicorn..."
# Adjust --workers and --threads based on your server's CPU cores and workload.
gunicorn --bind 0.0.0.0:5050 "backend.app:create_app()"

# --- Alternative: Starting with Flask's built-in development server (NOT for Production) ---
# If you absolutely need to use 'flask run' for local testing within Docker, uncomment this.
# This is less robust for production environments.
# python -m flask run --host 0.0.0.0 --port 5050