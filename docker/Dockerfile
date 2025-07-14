FROM python:3.11-slim
WORKDIR /app

# --- Copy docker-start.sh and make it executable ---
# This script will be the entrypoint for your application in Docker.
COPY docker-start.sh /app/docker-start.sh
RUN chmod +x /app/docker-start.sh

COPY backend/ /app/backend/
COPY frontend/ /app/frontend/
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt
EXPOSE 5000

# --- Set the command to run when the container starts ---
# Execute the docker-start.sh script instead of directly running app.py
CMD ["/app/docker-start.sh"]