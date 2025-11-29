# Troubleshooting Guide

## Frontend-Backend Connection Issues

### 1. Check if Backend is Running
```bash
# In the backend directory
python backend/main.py
# Or
cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Test Backend Health Endpoint
Open in browser or use curl:
```bash
curl http://localhost:8000/health
```
Should return: `{"status":"ok"}`

### 3. Test Search Endpoint
```bash
curl "http://localhost:8000/search?product=espresso"
```

### 4. Check Browser Console
Open browser DevTools (F12) and check:
- Network tab: Are requests to `/search` failing?
- Console tab: Any error messages?

### 5. Common Issues

**CORS Errors:**
- Make sure the backend has CORS middleware enabled
- Check that `http://localhost:5173` is in the allowed origins

**Connection Refused:**
- Backend not running
- Wrong port (check if backend is on port 8000)
- Firewall blocking the connection

**Empty Results:**
- Check database has products
- Check if `pg_trgm` extension is enabled: `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
- Try a simple search like "espresso" or "grinder"

**Type Errors:**
- Check browser console for TypeScript/JavaScript errors
- Verify API response matches expected format

### 6. Environment Variables
Create `.env` file in frontend root:
```
VITE_API_BASE_URL=http://localhost:8000
```

### 7. Database Setup
Make sure:
- PostgreSQL is running
- Database has `product` and `supplier` tables
- `pg_trgm` extension is enabled
- Tables have data

