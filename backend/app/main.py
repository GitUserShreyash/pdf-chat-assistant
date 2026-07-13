from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.routers import auth, documents, chat

import time
from sqlalchemy.exc import OperationalError

# Automatically create relational database tables (SQLite / PostgreSQL)
# Retrying connection to PostgreSQL if it is booting up in a cloud container network
max_retries = 10
for i in range(max_retries):
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables initialized successfully!")
        break
    except OperationalError as e:
        if i == max_retries - 1:
            raise e
        print(f"Database not ready yet (attempt {i+1}/{max_retries}). Retrying in 4 seconds...")
        time.sleep(4)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="A full-stack AI Chat application utilizing RAG over uploaded PDFs.",
    version="1.0.0"
)

# Setup CORS middleware
# In production, specify actual frontend domains instead of "*"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(chat.router, prefix="/api")

@app.get("/api/health")
def health_check():
    """Simple API health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "database": settings.DATABASE_URL.split("://")[0]
    }
