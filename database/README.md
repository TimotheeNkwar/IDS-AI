# Database — IDS-AI

MongoDB database configuration and data models for the AI-powered Intrusion Detection System.

## Technology

- **Database:** MongoDB
- **Python driver:** Motor (async) via `motor`
- **Schema validation:** Pydantic v2

## Prerequisites

- MongoDB >= 6.0 running locally or a [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- Python >= 3.10 (dependencies installed from `backend/requirements.txt`)

## Configuration

Set the following environment variables (or add them to `backend/.env`):

| Variable        | Default                         | Description              |
|-----------------|---------------------------------|--------------------------|
| `MONGO_URI`     | `mongodb://localhost:27017`     | MongoDB connection string |
| `DATABASE_NAME` | `ids_ai`                        | Database name             |

## Collections

| Collection         | Model                  | Description                              |
|--------------------|------------------------|------------------------------------------|
| `alerts`           | `AlertModel`           | Detected intrusion alerts                |
| `network_traffic`  | `NetworkTrafficModel`  | Raw network traffic records for ML       |

## Files

```
database/
├── config.py    # Database connection helpers (Motor async client)
├── models.py    # Pydantic data models for collections
└── README.md
```
