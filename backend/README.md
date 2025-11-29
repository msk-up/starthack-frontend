# Backend API Setup

## Prerequisites
- Python 3.9+
- PostgreSQL with `pg_trgm` extension enabled
- AWS credentials configured (for Bedrock)

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables in `.env`:
```
DB_URL=postgresql://user:password@localhost:5432/dbname
AWS_REGION=eu-west-1
PORT=8000
```

3. Ensure PostgreSQL has the `pg_trgm` extension:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

## Running the Server

```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

- `GET /health` - Health check
- `GET /search?product=<query>` - Fuzzy search for products
- `GET /suppliers` - List all suppliers
- `GET /products` - List all products
- `POST /negotiations` - Trigger negotiations (not implemented)

## Fuzzy Search

The `/search` endpoint uses PostgreSQL's `pg_trgm` extension for fuzzy matching. It:
- Matches products even with typos
- Returns results ordered by similarity score
- Includes both fuzzy matching and ILIKE fallback for better coverage

