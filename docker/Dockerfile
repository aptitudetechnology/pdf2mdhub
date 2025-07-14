# Use a slim Python base image for a smaller footprint
FROM python:3.11-alpine

# Set environment variables
ENV PYTHONUNBUFFERED 1
ENV APP_HOME /app

# Create the application directory
WORKDIR $APP_HOME

# Install system dependencies
RUN apk update \
    && apk add --no-cache \
    poppler-utils \
    npm \
    build-base \
    && rm -rf /var/cache/apk/*

# Copy backend requirements and install Python dependencies
COPY backend/requirements.txt $APP_HOME/backend/
RUN pip install --no-cache-dir -r $APP_HOME/backend/requirements.txt

# Copy the entire backend application
COPY backend $APP_HOME/backend/

# Copy the frontend static assets and templates (needed for Flask to serve them)
COPY frontend/static $APP_HOME/frontend/static/
COPY frontend/templates $APP_HOME/frontend/templates/

# --- Notes on client-side pdf2md library and npm ---
## Both backend and frontend are now included in the same container.
## Flask will serve static files and templates from /app/frontend/static and /app/frontend/templates.

# Set the working directory for the Flask application
WORKDIR $APP_HOME/backend

# Expose the port your Flask application runs on
EXPOSE 5000

# Command to run the Flask application
CMD ["python", "app.py"]