# IDS-AI

This project implements an Artificial Intelligence-based Intrusion Detection System (IDS) designed to detect malicious network activities using Machine Learning and Deep Learning techniques.

## Project Structure

```
IDS-AI/
├── frontend/        # React user interface
├── backend/         # Python / FastAPI REST API & ML logic
└── database/        # MongoDB configuration and data models
```

## Quick Start

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

API available at `http://localhost:8000` · Docs at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm start
```

UI available at `http://localhost:3000`

### Database

Start a local MongoDB instance (or configure a connection string in `backend/.env`):

```
MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=ids_ai
```

See each sub-folder's own `README.md` for detailed instructions.
