-- Create negotiation table to store negotiation prompts and related data
CREATE TABLE IF NOT EXISTS negotiation (
    negotiation_id SERIAL PRIMARY KEY,
    prompt TEXT NOT NULL,
    supplier_ids TEXT[] NOT NULL,
    modes TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_negotiation_created_at ON negotiation(created_at DESC);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_negotiation_status ON negotiation(status);

