# Use a slim Python base image for a smaller footprint
FROM python:3.11-alpine

ENV PYTHONUNBUFFERED 1
ENV APP_HOME /app

WORKDIR $APP_HOME

RUN apk update \
    && apk add --no-cache \
    poppler-utils \
    npm \
    build-base \
    postgresql-dev \
    && rm -rf /var/cache/apk/*

COPY backend/requirements.txt $APP_HOME/backend/
RUN pip install --no-cache-dir -r $APP_HOME/backend/requirements.txt

COPY backend $APP_HOME/backend/
COPY frontend/static $APP_HOME/frontend/static/
COPY frontend/templates $APP_HOME/frontend/templates/

WORKDIR $APP_HOME/backend
EXPOSE 5000
CMD ["python", "app.py"]
