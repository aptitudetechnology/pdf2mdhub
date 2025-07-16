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

# --- 3. Export Flask app environment variables ---
export FLASK_APP="backend.app:create_app()"
export FLASK_ENV=development
export PYTHONPATH="${SCRIPT_DIR}:$PYTHONPATH"

# --- 4. Create necessary directories if they don't exist ---
mkdir -p uploads
mkdir -p instance

# --- 5. Database Migration Step (if using Flask-Migrate) ---
echo "Applying database migrations (if configured)..."
# flask db upgrade # Uncomment if you use Flask-Migrate

# --- 6. Start Frontend Development Server (Parcel) in background ---
echo "Starting Frontend Development Server (Parcel)..."
# Navigate to the frontend directory and run its 'start' script
# The '&' sends this command to the background
(cd frontend && npm run start) &
FRONTEND_PID=$! # Capture the PID of the Parcel process

# --- 7. Starting Flask server in background ---
echo "Starting Flask server..."
# The '&' sends this command to the background
# Make sure your Flask app is configured to serve static files from 'frontend/static'
flask run --host=0.0.0.0 --port=5050 --cert=ssl/cert.pem --key=ssl/key.pem &
BACKEND_PID=$! # Capture the PID of the Flask process

# --- 8. Keep the script running and provide info ---
echo "---------------------------------------------------"
echo "PDF2MDHub services started:"
echo "  - Flask Backend: Running on https://0.0.0.0:5050 (PID: $BACKEND_PID)"
echo "  - Frontend Dev Server (Parcel): Running on http://localhost:1234 (PID: $FRONTEND_PID)"
echo "    (Note: Your Flask app serves the HTML, which then loads JS/CSS from Parcel's dev server)"
echo "---------------------------------------------------"
echo "To stop both services, you may need to manually kill their processes:"
echo "  - For Flask: kill $BACKEND_PID"
echo "  - For Parcel: kill $FRONTEND_PID"
echo "Or use 'killall node' and 'killall python' (use with caution if other node/python processes are running)."
echo "Press Ctrl+C to exit this script. This will NOT stop the background processes automatically."

# Wait for all background processes to finish (keeps the script alive)
wait