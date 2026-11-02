# Nexus

Nexus is a data-ingestion and database analysis application that combines a Flask API, SQLite-backed data management, Gemini-powered natural-language analysis, and a React/Vite interface.

The application is designed to help users explore structured datasets and ask questions about their data without writing SQL by hand.

## Core capabilities

- **Database management:** create and list local SQLite databases, inspect tables, query records, and manage table data.
- **Data ingestion:** upload CSV data and work with it through the database layer.
- **Natural-language analysis:** use Gemini function calling to translate questions into SQL and summarize query results.
- **Retrieval-assisted queries:** embed past questions and retrieve semantically similar examples using cosine similarity.
- **Analytics and reporting:** generate data summaries and analytical reports through the Flask API.
- **Web interface:** React 19, Vite, Tailwind CSS, and Recharts provide the frontend experience.

## Architecture

```text
React + Vite frontend
        |
        | /api requests (Vite proxy in development)
        v
Flask application
        |
        +-- Gemini API (model responses and embeddings)
        |
        +-- SQLite database manager
        |
        +-- RAG memory (query, SQL, embedding, feedback)
```

The frontend is in `frontend/`. The Flask backend and data-access modules are at the repository root.

## Technology stack

| Layer | Technologies |
| --- | --- |
| Backend | Python, Flask, Gunicorn |
| AI | Google Gemini API, function calling, text embeddings |
| Retrieval | NumPy cosine similarity, JSON-backed query memory |
| Data | SQLite, pandas, CSV/XLSX ingestion |
| Frontend | React, Vite, Tailwind CSS, Axios, Recharts |

## Requirements

- Python 3.11 (the Render configuration currently specifies Python 3.11)
- Node.js and npm for the frontend
- A Google AI Studio API key with access to the configured Gemini models
- A persistent `NEXUS_SECRET_KEY` for Flask sessions

## Local development

### 1. Configure the backend

From the repository root:

```bash
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate

pip install -r requirements-dev.txt
```

Create a local environment file:

```bash
# Windows
Copy-Item .env.example .env
# macOS / Linux
cp .env.example .env
```

Set `GOOGLE_API_KEY` and generate a persistent session secret:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Place the generated value in `NEXUS_SECRET_KEY`. Do not use a new random key on each application start; Flask sessions need a stable secret across restarts.

Start the backend:

```bash
python app.py
```

### 2. Configure and start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server proxies `/api` requests to the Flask backend at `http://127.0.0.1:5000`.

For production, deploy the frontend and backend with compatible API routing. The current `render.yaml` defines the Flask web service; it does not define a separate static frontend service.

## Configuration

| Variable | Purpose |
| --- | --- |
| `GOOGLE_API_KEY` | Google Gemini API credential |
| `NEXUS_SECRET_KEY` | Persistent Flask session-signing secret |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |
| `PYTHON_VERSION` | Python runtime used by the Render service |

Set secrets through the host's environment/secret manager. Never commit `.env` or paste API keys into source files.

## API overview

The Flask application currently defines endpoints for:

- Health checks and history retrieval
- Chat and feedback
- Data analysis and report generation
- CSV upload
- Database creation, listing, table inspection, and record queries
- Database optimization and deletion
- Clearing stored query memory

The exact request and response contracts are implemented in `app.py`.

## Security and data-handling notes

- The AI function-calling SQL path is read-only and opens SQLite in read-only mode. Database-changing operations should go through explicit application endpoints and user-authorized workflows. Database names are constrained to the configured local database directory.
- Do not expose the Flask development server directly to the public internet.
- Configure authentication and authorization before exposing database-management endpoints to untrusted users.
- Restrict CORS to known frontend origins when the frontend is hosted separately.
- Protect uploaded data and local SQLite files; they may contain user-provided business information.
- Configure persistent storage if the deployment platform uses ephemeral filesystems.

## Tests

Install test dependencies if not already present, then run:

```bash
pip install -r requirements-dev.txt
pytest -q
```

The read-only SQL regression tests are in `tests/test_readonly_sql.py`.

## Current limitations

- RAG memory is JSON-file based and is not a multi-user durable vector database.
- The default SQLite storage is local to the running service unless persistent storage is configured.
- The application should not be considered production-ready for multi-tenant or sensitive datasets without authentication, authorization, query limits, and deployment hardening.
