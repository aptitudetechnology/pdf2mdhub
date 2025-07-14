FROM python:3.11-slim
WORKDIR /app
COPY backend/ /app/backend/
COPY frontend/ /app/frontend/
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt
EXPOSE 5000
CMD ["python", "/app/backend/app.py"]
