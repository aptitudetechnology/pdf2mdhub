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
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    poppler-utils \
    npm \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

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

# --- Install client-side pdf2md library ---
# The README states "npm install pdf2md" for client-side.
# We'll install it globally or in a place accessible to your static files.
# Assuming pdf2md.min.js from OpenGovSG's pdf2md library is then copied to frontend/static/lib/pdf2md.min.js
# This step might be redundant if frontend/static/lib/pdf2md.min.js is pre-built and copied in.
# If you build frontend assets within the container, you'd need a separate build step here.
# For now, we'll assume `pdf2md.min.js` is already in `frontend/static/lib` or will be placed there.
# If 'npm install pdf2md' directly creates assets your frontend uses, you might need to adjust this.
# For a typical Flask setup, pre-built static assets are simply copied.
# Let's ensure 'pdf2md' itself (the JS library) is installed if your build process needs it from node_modules.
# If your frontend is built separately and only the bundled JS is copied, you don't need npm install pdf2md here.
# Given the README: "lib/pdf2md.min.js # OpenGovSG pdf2md library", it implies it's a pre-built lib.
# Therefore, the `npm install pdf2md` might not be necessary *inside* this backend container unless
# the backend itself needs to interact with the npm package in some way, which is unlikely for a Flask app.
# I'll keep the `npm` install for `poppler-utils` (which you explicitly list) but omit `npm install pdf2md`
# for the backend image unless you clarify its necessity for the backend itself.
# If frontend build happens in *this* Dockerfile, then you would need `npm install` and likely
# a build step like `npm run build` within a dedicated frontend directory.

# Let's revisit the npm install pdf2md based on the README's client-side conversion.
# "npm install pdf2md" is for the *client-side* library. This generally means it's
# installed in the frontend development environment, and the resulting `pdf2md.min.js`
# is then copied to `frontend/static/lib`. So, the `npm install pdf2md` command itself
# is not typically run within the backend Dockerfile. The presence of `npm` and `poppler-utils`
# suggests the possibility of backend use, but `poppler-utils` is usually CLI tools.
# Let's assume you need `poppler-utils` for some reason on the backend, but `npm install pdf2md` is for frontend build.
# If your backend Flask app actually calls out to `npm` or needs the `pdf2md` Node.js package directly,
# please specify. Otherwise, the current `apt-get install npm` is enough if you're just putting `npm` on the system.

# The `README` implies that `poppler-utils` are system prerequisites, and `npm install pdf2md`
# is for the client-side. It then says "For Docker deployment, these dependencies are handled in the container build process."
# This could mean that `poppler-utils` *and* `npm` are installed in the backend container
# because the Flask app *might* shell out to `pdftotext` or run Node.js scripts.
# Given the "Client-side PDF to Markdown conversion", it's more likely `pdftotext` is used by the JS library in the browser.
# For safety, I'll keep `poppler-utils` and `npm` system installations in the backend image,
# as per your `README` stating they're "handled in the container build process."
# However, if your Flask app does NOT use `npm` or `pdftotext` directly, you can remove them for a smaller image.

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