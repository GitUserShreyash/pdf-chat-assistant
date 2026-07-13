# AI PDF Chat with RAG Pipeline

A production-ready full-stack AI application that enables users to upload PDF documents, extract text, chunk content, generate vector embeddings using Google Gemini Embeddings API, store them in a local ChromaDB, and hold grounded chats with the document content using the Gemini LLM. The system outputs responses with page-specific source citations.

---

## Tech Stack

- **Backend**: FastAPI (Python), SQLAlchemy ORM, SQLite (local) / PostgreSQL (production/docker), PyPDF (pure python parser), ChromaDB (in-memory persistent vector store).
- **Frontend**: React, TypeScript, Vite, Tailwind CSS (modern dark-mode glassmorphic theme), Lucide Icons.
- **AI Engine**: Google Gen AI SDK (Gemini 2.5 Flash for RAG, text-embedding-004 for search index).
- **Orchestration**: Docker & Docker Compose.

---

## System Architecture

```
                       ┌──────────────────────┐
                       │  React SPA Frontend   │
                       └──────────┬───────────┘
                                  │ (JWT Auth & REST)
                                  ▼
                       ┌──────────────────────┐
                       │   FastAPI Backend    │
                       └────┬───────────┬─────┘
                            │           │
             (Relational DB)│           │(Vector DB & API calls)
                            ▼           ▼
                     ┌──────────┐  ┌───────────┐
                     │SQLite/PG │  │ ChromaDB  │ ◄───► Google Gemini API
                     └──────────┘  └───────────┘       (LLM & Embeddings)
```

---

## Quick Start (Local Development)

### Prerequisite
1. **Python 3.11+** installed.
2. **Node.js 18+** installed.
3. **Google Gemini API Key** (Get one from Google AI Studio).

---

### Step 1: Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv .venv
   # Windows:
   .\.venv\Scripts\activate
   # Linux/MacOS:
   source .venv/bin/activate
   ```

3. Install python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure your environment:
   Create a `.env` file from the example:
   ```bash
   copy .env.example .env
   ```
   Open the `.env` file and insert your Google Gemini API key:
   ```env
   GEMINI_API_KEY=AIzaSy...your-actual-api-key...
   ```

5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend API will run at `http://localhost:8000`. You can inspect the interactive Swagger API documentation at `http://localhost:8000/docs`.

---

### Step 2: Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install node dependencies:
   ```bash
   npm install
   ```

3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   The frontend UI will run at `http://localhost:5173`. Open this URL in your web browser.

---

## Running with Docker Compose (PostgreSQL Production Setup)

You can run the entire stack (PostgreSQL Database, FastAPI Backend, React Frontend served via Nginx) using Docker Compose.

1. Ensure Docker Desktop is installed and running.
2. From the project root folder, export/set your Gemini API key in your terminal session, or write it directly into the root `docker-compose.yml` environment section.
   - On Windows (PowerShell):
     ```powershell
     $env:GEMINI_API_KEY="your-gemini-key"
     ```
   - On Linux/MacOS:
     ```bash
     export GEMINI_API_KEY="your-gemini-key"
     ```
3. Run docker-compose:
   ```bash
   docker-compose up --build
   ```
4. Access the React app at `http://localhost`. The Nginx reverse proxy will automatically forward `/api` requests to the backend service container, avoiding CORS errors.

---

## Core API Reference

- `POST /api/auth/register` - Create a new user account.
- `POST /api/auth/login` - Authenticate credentials and receive a JWT.
- `POST /api/documents/upload` - Upload PDF file, parse page text, chunk, generate embeddings, and store in index.
- `GET /api/documents` - Fetch current user's uploaded documents.
- `POST /api/documents/{id}/summary` - Generate/Retrieve an AI executive summary for a document.
- `POST /api/chat/ask` - Send a prompt query, search ChromaDB, construct RAG prompt, call Gemini model, record chat context, return response with citation metadata.
- `GET /api/chat/history` - Load history of conversations.
