# AML-Suspicious-Activity-Detection-Agent

Stub FastAPI backend for the Sentinel AI AML Risk Detection System.

## Features

- FastAPI backend
- Stub API for frontend development
- Swagger documentation
- Ready to replace with real AML detection logic

## Setup

Create and activate a virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the server:

```bash
uvicorn main:app --reload --port 8000
```

## API Documentation

Swagger UI:

```
http://127.0.0.1:8000/docs
```

## Current Endpoints

- POST `/analyze`
- POST `/chat`
- GET `/customer/{customer_id}`
- GET `/report/{entity_id}`
- GET `/`

## Notes

This is currently a **stub backend** returning mock AML analysis data.

The response formats are defined in `API_CONTRACT.md` and should remain stable so the frontend can be developed independently.