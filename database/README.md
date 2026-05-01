# Database — IDS-AI

MongoDB data layer for the AI-powered Intrusion Detection System.

## Technology

- **Database:** MongoDB
- **Python driver:** Motor async client
- **Schema validation:** Pydantic v2

## Prerequisites

- MongoDB running locally or remotely
- Python dependencies installed from `backend/requirements.txt`

## Configuration

Set the following environment variables, or add them to `backend/.env`:

| Variable        | Default                              | Description                           |
|-----------------|--------------------------------------|---------------------------------------|
| `MONGO_ENABLED` | `true`                               | Disable MongoDB persistence with `false` |
| `MONGO_URI`     | `mongodb://localhost:27017/ids_ai`   | MongoDB connection URI                |
| `DATABASE_NAME` | `ids_ai`                             | MongoDB database name                 |

## Collections

| Collection        | Model            | Description                              |
|-------------------|------------------|------------------------------------------|
| `alerts`          | `Alert`          | Persisted IDS alerts and workflow status |
| `network_traffic` | `NetworkTraffic` | Raw traffic records for ML inference     |

## Files

```text
database/
├── __init__.py
├── alerts.py     # Alert repository: create, list, update status
├── config.py     # MongoDB connection, health, and indexes
├── models.py     # Pydantic document schemas
├── traffic.py    # Network traffic repository: create, list
└── README.md
```

## Alert Workflow

Each `POST /analyze` call is saved to `network_traffic` when MongoDB is connected. An anomaly is also saved to `alerts`. The frontend reads recent alerts from `GET /api/alerts`.

Alert statuses:

- `open`
- `reviewing`
- `resolved`
- `false_positive`

Update a status through:

```http
PATCH /api/alerts/{id}/status
```

```json
{ "status": "reviewing" }
```
