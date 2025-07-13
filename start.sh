#!/bin/bash
# Start-up script for PDF2MDHub
set -e # Exit on any error

echo "Starting PDF2MDHub setup..."

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# --- 1. Virtual Environment Setup ---
VENV_DIR="venv"

if [ ! -d "$VENV_DIR" ]; then
    echo "Virtual environment not found. Creating..."
    python3 -m venv "$VENV_DIR"
fi

echo "Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# --- 2. Install Python dependencies ---
echo "Installing Python dependencies into virtual environment..."
# Check if requirements.txt exists and install
if [ -f "backend/requirements.txt" ]; then
    pip install -r backend/requirements.txt
else
    echo "Warning: backend/requirements.txt not found. Skipping dependency installation."
fi

# (Optional) Install Node.js dependencies if needed
# echo "Installing Node.js dependencies..."
# npm install

# --- 3. Export Flask app environment variables ---
# FLASK_APP should be a Python import path, not a file path.
# Assuming your app factory is `create_app()` in `backend/app.py`
export FLASK_APP="backend.app:create_app()"
export FLASK_ENV=development

# PYTHONPATH is already handled by activating the venv and being in SCRIPT_DIR
# But explicitly adding SCRIPT_DIR is a good safeguard for some complex setups.
export PYTHONPATH="${SCRIPT_DIR}:$PYTHONPATH"

# --- 4. Create necessary directories if they don't exist ---
mkdir -p uploads
mkdir -p instance

# --- 5. Database Migration Step (if using Flask-Migrate) ---
# Ensure your Flask app is properly configured for Flask-Migrate (app.py)
echo "Applying database migrations (if configured)..."
flask db upgrade # Use 'flask' command from venv

# --- 6. Starting Flask server ---
echo "Starting Flask server..."
# Use 'flask run' which correctly sets up the application context
# Add --host 0.0.0.0 to make it accessible from outside localhost.
# Add --port 5050 if you want a specific port (default is 5000)
flask run --host 0.0.0.0 --port 5050