FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (including pg_config support)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install psycopg2-binary for PostgreSQL support in production docker environments
RUN pip install --no-cache-dir psycopg2-binary==2.9.9
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
