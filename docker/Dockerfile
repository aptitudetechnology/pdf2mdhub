FROM python:3.11-slim
WORKDIR /app

# Copy docker-start.sh (it's now copied from the 'docker' context)
COPY docker-start.sh /app/docker-start.sh
RUN chmod +x /app/docker-start.sh

# ADJUSTED COPY PATHS: Backend and Frontend are one level UP from the Dockerfile's location
COPY ../backend/ /app/backend/
COPY ../frontend/ /app/frontend/

# Copy requirements.txt (also one level up)
COPY ../backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

EXPOSE 5000

CMD ["/app/docker-start.sh"]