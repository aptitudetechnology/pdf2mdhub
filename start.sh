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

# --- 3. Create necessary directories if they don't exist ---
mkdir -p uploads
mkdir -p instance

# --- 4. Database Migration Step (if using Flask-Migrate) ---
# Ensure your Flask app is properly configured for Flask-Migrate (app.py)
echo "Applying database migrations (if configured)..."
# If you're running migrations via Flask-Migrate, you'd uncomment this
# flask db upgrade 

# --- 5. Starting Flask server ---
echo "Starting Flask server..."
# Directly run app.py, which contains the app.run() call with SSL context
python app.py