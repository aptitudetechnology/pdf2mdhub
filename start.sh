#!/bin/bash
# Start-up script for PDF2MDHub on Replit

# Install Python dependencies
pip install -r backend/requirements.txt

# (Optional) Install Node.js dependencies if needed
# npm install

# Export Flask app environment variables
export FLASK_APP=backend/app.py
export FLASK_ENV=development

# Run Flask server on Replit-compatible host/port
python backend/app.py
