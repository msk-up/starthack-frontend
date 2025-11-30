import json
import os
from contextlib import asynccontextmanager
from typing import Any

from dotenv import load_dotenv

from agents import NegotiationAgent

load_dotenv()

import asyncpg
import boto3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DATABASE_URL = os.environ["DB_URL"]
AWS_REGION = os.environ.get("AWS_REGION", "eu-west-1")
FRONTEND_ORIGINS = os.environ.get("FRONTEND_ORIGINS", "")

bedrock_client = boto3.client("bedrock-runtime", region_name=AWS_REGION)

pool: asyncpg.Pool | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global pool
    # Disable statement cache to avoid InvalidCachedStatementError when schema changes
    pool = await asyncpg.create_pool(DATABASE_URL, statement_cache_size=0)
    yield
    if pool:
        await pool.close()


app = FastAPI(title="Health API", version="0.1.0", lifespan=lifespan)

allowed_origins = [origin.strip() for origin in FRONTEND_ORIGINS.split(",") if origin.strip()] if FRONTEND_ORIGINS else ["http://localhost:8080", "http://localhost:5173", "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
    db = await get_pool()
    try:
        rows = await db.fetch(
            "SELECT * FROM product WHERE product_name ILIKE $1", f"%{product}%"
        )
        return [dict(row) for row in rows]
    except asyncpg.exceptions.InvalidCachedStatementError:
        # If cached statement is invalid, retry with a fresh connection
        async with db.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM product WHERE product_name ILIKE $1", f"%{product}%"
            )
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error in search query: {e}")
        import traceback
        traceback.print_exc()
        raise




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

    try :

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



async def crate_negotiation_agent(supplier_id: str,tactics: str, product: str)->str:

    db = await get_pool()

    row = await db.fetch("SELECT * FROM supplier WHERE supplier_name = $1 LIMIT 1", supplier_id)
    insights = row[0]['insights']
    prompt = f'''




    '''







class NegotiationRequest(BaseModel):
    product: str
    prompt: str
    tactics: str
    suppliers: list[str]

class CreateNegotiationRequest(BaseModel):
    prompt: str
    supplier_ids: list[str]
    modes: list[str] = []
    status: str = "pending"

@app.post("/negotiations")
async def create_negotiation(request: CreateNegotiationRequest) -> dict[str, Any]:
    """Create a new negotiation with a prompt"""
    db = await get_pool()
    try:
        # Insert negotiation record
        negotiation_id = await db.fetchval(
            """INSERT INTO negotiation (prompt, supplier_ids, modes, status, created_at) 
               VALUES ($1, $2, $3, $4, NOW()) 
               RETURNING negotiation_id""",
            request.prompt,
            request.supplier_ids,
            request.modes,
            request.status
        )
        return {"negotiation_id": negotiation_id, "status": "created"}
    except Exception as e:
        print(f"Error creating negotiation: {e}")
        import traceback
        traceback.print_exc()
        # If table doesn't exist, return error with instructions
        if "relation \"negotiation\" does not exist" in str(e):
            return {
                "error": "negotiation table does not exist",
                "message": "Please create the negotiation table in your database",
                "sql": """CREATE TABLE IF NOT EXISTS negotiation (
                    negotiation_id SERIAL PRIMARY KEY,
                    prompt TEXT NOT NULL,
                    supplier_ids TEXT[] NOT NULL,
                    modes TEXT[] DEFAULT '{}',
                    status VARCHAR(50) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );"""
            }
        raise

@app.get("/negotiations")
async def get_negotiations() -> list[dict[str, Any]]:
    """Get all negotiations"""
    db = await get_pool()
    try:
        rows = await db.fetch(
            "SELECT negotiation_id, prompt, supplier_ids, modes, status, created_at, updated_at FROM negotiation ORDER BY created_at DESC"
        )
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error fetching negotiations: {e}")
        import traceback
        traceback.print_exc()
        # If table doesn't exist, return empty list
        if "relation \"negotiation\" does not exist" in str(e):
            return []
        raise

@app.get("/negotiations/{negotiation_id}")
async def get_negotiation(negotiation_id: int) -> dict[str, Any]:
    """Get a specific negotiation by ID"""
    db = await get_pool()
    try:
        row = await db.fetchrow(
            "SELECT negotiation_id, prompt, supplier_ids, modes, status, created_at, updated_at FROM negotiation WHERE negotiation_id = $1",
            negotiation_id
        )
        if row:
            return dict(row)
        return {"error": "negotiation not found"}
    except Exception as e:
        print(f"Error fetching negotiation: {e}")
        import traceback
        traceback.print_exc()
        raise

@app.post("/negotiate")
async def trigger_negotiations(request: NegotiationRequest) -> dict[str, Any]:
    db = await get_pool()
    for supplier in request.suppliers:
        insights_row = await db.fetch("SELECT * FROM supplier WHERE supplier_name = $1 LIMIT 1", supplier)
        insights = insights_row[0]['insights']
        agent  = NegotiationAgent("",insights, request.product)









    return {"status": "not implemented"}


@app.get("/suppliers")
async def suppliers() -> dict[str, Any]:
    db = await get_pool()
    rows = await db.fetch("SELECT * FROM supplier")
    suppliers = [dict(row) for row in rows]
    return {"suppliers": suppliers}


def main() -> None:
    import uvicorn

    port = int(os.environ.get("PORT", "5147"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)


if __name__ == "__main__":
    main()