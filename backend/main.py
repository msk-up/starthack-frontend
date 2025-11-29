import json
import os

from contextlib import asynccontextmanager
from typing import Any

from dotenv import load_dotenv

load_dotenv()

import asyncpg
import boto3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DATABASE_URL = os.environ["DB_URL"]
AWS_REGION = os.environ.get("AWS_REGION", "eu-west-1")

bedrock_client = boto3.client("bedrock-runtime", region_name=AWS_REGION)

pool: asyncpg.Pool | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global pool
    pool = await asyncpg.create_pool(DATABASE_URL)
    # Enable pg_trgm extension for fuzzy search
    async with pool.acquire() as conn:
        await conn.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
    yield
    if pool:
        await pool.close()

app = FastAPI(title="Procurement API", version="0.1.0", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_pool() -> asyncpg.Pool:
    if pool is None:
        raise RuntimeError("Database pool not initialized")
    return pool

@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}

@app.get("/suppliers")
async def list_suppliers() -> list[dict[str, Any]]:
    db = await get_pool()
    rows = await db.fetch("SELECT * FROM supplier")
    return [dict(row) for row in rows]

@app.get("/products")
async def list_products() -> list[dict[str, Any]]:
    db = await get_pool()
    rows = await db.fetch("SELECT * FROM product")
    return [dict(row) for row in rows]

@app.get("/search")
async def search_items(product: str) -> list[dict[str, Any]]:
    """
    Fuzzy search for products using PostgreSQL pg_trgm similarity.
    Returns products ordered by similarity score (highest first).
    """
    db = await get_pool()
    
    # First try with pg_trgm similarity (fuzzy search)
    # If that fails, fall back to simple ILIKE
    try:
        query = """
            SELECT DISTINCT
                p.product_id,
                p.product_name,
                p.supplier_id,
                COALESCE(s.supplier_name, 'Unknown Supplier') as supplier_name,
                GREATEST(
                    similarity(p.product_name, $1),
                    CASE WHEN p.product_name ILIKE '%' || $1 || '%' THEN 0.3 ELSE 0 END
                ) as similarity_score
            FROM product p
            LEFT JOIN supplier s ON p.supplier_id = s.supplier_id
            WHERE 
                similarity(p.product_name, $1) > 0.1
                OR p.product_name ILIKE '%' || $1 || '%'
            ORDER BY similarity_score DESC
            LIMIT 50
        """
        rows = await db.fetch(query, product)
    except Exception as e:
        # Fallback to simple ILIKE if pg_trgm fails
        print(f"Fuzzy search failed, using ILIKE fallback: {e}")
        query = """
            SELECT DISTINCT
                p.product_id,
                p.product_name,
                p.supplier_id,
                COALESCE(s.supplier_name, 'Unknown Supplier') as supplier_name,
                0.5 as similarity_score
            FROM product p
            LEFT JOIN supplier s ON p.supplier_id = s.supplier_id
            WHERE p.product_name ILIKE '%' || $1 || '%'
            LIMIT 50
        """
        rows = await db.fetch(query, product)
    
    return [dict(row) for row in rows]

class NegotiationRequest(BaseModel):
    product: int
    prompt: str
    tactics: str
    suppliers: list[str]

def call_bedrock(prompt: str, system_prompt: str = "") -> str:
    """Call Amazon Bedrock gpt-oss-120b model and return response text."""
    messages = [{"role": "user", "content": prompt}]
    if system_prompt:
        messages.insert(0, {"role": "system", "content": system_prompt})

    body = {
        "messages": messages,
        "max_tokens": 1024,
        "temperature": 0.7,
    }

    try:
        response = bedrock_client.invoke_model(
            modelId="openai.gpt-oss-120b-1:0",
            contentType="application/json",
            accept="application/json",
            body=json.dumps(body),
        )
    except Exception as e:
        return f"Bedrock service is currently unavailable. {e}"

    result = json.loads(response["body"].read())
    return result["choices"][0]["message"]["content"]

@app.get("/test")
async def test_bedrock() -> dict[str, Any]:
    """Test Bedrock integration with a simple prompt."""
    prompt = "Explain the benefits of using Amazon Bedrock for AI applications."
    response_text = call_bedrock(prompt)
    return {"response": response_text}

@app.post("/negotiations")
async def trigger_negotiations(request: NegotiationRequest) -> dict[str, Any]:
    return {"status": "not implemented"}

def main() -> None:
    import uvicorn
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)

if __name__ == "__main__":
    main()

