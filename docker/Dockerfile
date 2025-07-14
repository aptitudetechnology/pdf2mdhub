# Use a slim Python base image for a smaller footprint
FROM python:3.11-alpine

# Set environment variables
ENV PYTHONUNBUFFERED 1
ENV APP_HOME /app

# Create the application directory
WORKDIR $APP_HOME

# Install system dependencies
# poppler-utils provides pdftotext, which the client-side pdf2md might rely on or your backend might use
# npm is needed to install the client-side pdf2md package
# build-base provides common build tools like gcc, g++, and make, equivalent to build-essential
RUN apk update \
    && apk add --no-cache \
    poppler-utils \
    npm \
    build-base \
    && rm -rf /var/cache/apk/* # Clean up apk cache

# Copy backend requirements and install Python dependencies
# Use --no-cache-dir to keep the image smaller
COPY backend/requirements.txt $APP_HOME/backend/
RUN pip install --no-cache-dir -r $APP_HOME/backend/requirements.txt

# Copy the entire backend application
# The build context is the project root (pdf2md-docs), so we can copy from there
COPY backend $APP_HOME/backend/

# Copy the frontend static assets and templates (needed for Flask to serve them)
COPY frontend/static $APP_HOME/frontend/static/
COPY frontend/templates $APP_HOME/frontend/templates/

# --- Notes on client-side pdf2md library and npm ---
# As you've noted in your comments, "npm install pdf2md" is typically for the client-side
# library development and build, not usually for inclusion in a backend Flask container.
# If your Flask backend *does not* directly shell out to Node.js scripts or `npm` commands,
# you can likely remove `npm` from the `apk add` line to further reduce image size.
# `poppler-utils` (for `pdftotext`) is kept as you explicitly mentioned it. If your Flask
# app doesn't use `pdftotext` directly, you can remove that too.
# The `rm -rf /var/cache/apk/*` replaces `rm -rf /var/lib/apt/lists/*` for Alpine's package manager.

# Set the working directory for the Flask application
WORKDIR $APP_HOME/backend

# Expose the port your Flask application runs on
EXPOSE 5000

# Command to run the Flask application
# Use a production-ready WSGI server like Gunicorn in a production environment.
# For development, `python app.py` is fine, but for production, switch to:
# CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
# You'd also need `gunicorn` in your requirements.txt
CMD ["python", "app.py"]