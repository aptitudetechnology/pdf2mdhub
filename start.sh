#!/bin/bash
# Start-up script for PDF2MDHub
set -e  # Exit on any error

echo "Starting PDF2MDHub setup..."

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

# (Optional) Install Node.js dependencies if needed
# echo "Installing Node.js dependencies..."
# npm install

# Export Flask app environment variables
export FLASK_APP=backend/app.py
export FLASK_ENV=development
export PYTHONPATH="${SCRIPT_DIR}:$PYTHONPATH"

# Create necessary directories if they don't exist
mkdir -p uploads
mkdir -p instance

echo "Starting Flask server..."
# Run Flask server
python backend/app.py