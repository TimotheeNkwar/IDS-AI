# Backend — IDS-AI

FastAPI-based backend providing REST APIs and machine learning inference for the AI-powered Intrusion Detection System.

## Prerequisites

- Python >= 3.10
- pip

## Getting Started

```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the development server (http://localhost:8000)
uvicorn main:app --reload
```

Interactive API docs are available at `http://localhost:8000/docs`.

## Project Structure

```
backend/
├── main.py              # FastAPI application entry point
├── requirements.txt     # Python dependencies
└── README.md
```

## API Endpoints

| Method | Path          | Description                  |
|--------|---------------|------------------------------|
| GET    | /api/status   | System health check          |
| GET    | /api/alerts   | Retrieve recent IDS alerts   |

## Environment Variables

Create a `.env` file in this directory:

```
MONGO_URI=mongodb://localhost:27017/ids_ai
```
