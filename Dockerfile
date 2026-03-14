# syntax=docker/dockerfile:1.7

# Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Runtime image with Python + Playwright deps/browser for scraper fallback
FROM mcr.microsoft.com/playwright/python:v1.50.0-jammy

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY . .

# Inject built frontend artifacts for FastAPI root serving
COPY --from=frontend-builder /frontend/dist /app/frontend/dist

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
