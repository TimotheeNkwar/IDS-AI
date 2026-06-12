# IDS-AI — Backend

FastAPI backend for the AI-powered Intrusion Detection System (ML + LLM).

---

## Prerequisites

| Tool                   | Version | Download                                               |
| ---------------------- | ------- | ------------------------------------------------------ |
| Python                 | >= 3.10 | https://python.org                                     |
| MongoDB                | any     | https://www.mongodb.com/try/download/community         |
| Ollama                 | any     | https://ollama.com/download                            |
| uv                     | any     | https://docs.astral.sh/uv/getting-started/installation |
| Npcap _(Windows only)_ | any     | https://npcap.com/#download                            |

> **Windows** — When installing Npcap, check **"WinPcap API-compatible mode"**.

---

## Installation & Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd IDS-AI/backend

# 2. Install dependencies
uv sync

# 3. Create your .env file
cp .env.example .env
# Edit .env with your settings (see Environment Variables section below)

# 4. Start MongoDB
mongod                        # Windows (if not running as a service)
sudo systemctl start mongod   # Linux

# 5. Start Ollama and pull the model (in a separate terminal)
ollama serve
#best for cyber security
ollama pull phi3

# 6. Seed the database (creates the default admin user)
uv run python -m database.seed

# 7. Train the ML model
uv run python ml/train.py

# 8. Start the server
uv run python main.py
```

API available at **http://localhost:8000**  
Interactive docs at **http://localhost:8000/docs**

---

## Environment Variables

Create a `.env` file in `backend/`:

```env
# MongoDB
MONGO_ENABLED=true
MONGO_URI=mongodb://localhost:27017
MONGO_DB=ids-ai

# LLM
LLM_PROVIDER=ollama
LLM_MODEL_NAME=phi3
OLLAMA_BASE_URL=http://localhost:11434
LLM_ENABLED=true

# Auth
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
CORS_ORIGINS=http://localhost:5173
```

---

## Default Credentials

| Field    | Value          |
| -------- | -------------- |
| Email    | admin@test.com |
| Password | admin123       |

> Change these after first login.

---

## Network Capture _(optional)_

To analyze real-time network traffic, run the capture script.
It automatically detects your OS and active network interface.

### Setup

1. Rename `network_capture copy.py` to `network_capture.py`
2. Make sure all dependencies are installed:

```bash
uv sync
```

3. **Windows only** — Find your network interface by running:

```bash
python -c "from scapy.all import get_if_list, get_if_addr; [print(i, '->', get_if_addr(i)) for i in get_if_list()]"
choose the one that contain your IP
```

Then update this line in `network_capture.py` with your interface:

```python
INTERFACE = r"\Device\NPF_{YOUR-GUID-HERE}"
```

### Run

```bash
# Windows — open your terminal as Administrator inside the project folder
cd G:\programming\IDS-AI\backend
.venv\Scripts\activate
uv run python network_capture.py

# Linux — run with sudo
sudo uv run python network_capture.py
```

---

## API Endpoints

| Method | Path                    | Description                        |
| ------ | ----------------------- | ---------------------------------- |
| POST   | /api/analyze            | Analyze a network event (ML + LLM) |
| GET    | /api/alerts             | List recent alerts                 |
| PATCH  | /api/alerts/{id}/status | Update alert status                |
| GET    | /api/traffic            | List analyzed traffic              |
| GET    | /api/health             | System health check                |
| POST   | /api/users/             | Create a user                      |
| POST   | /api/users/login        | Login (returns JWT)                |
| GET    | /api/users/me           | Current user profile               |

---

## Project Structure

```
backend/
├── main.py                 # FastAPI entry point
├── network_capture.py      # Real-time network capture (Windows + Linux)
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (create from .env.example)
├── config/
│   └── config.py           # Global settings
├── database/
│   ├── __init__.py         # MongoDB connection + collections
│   ├── alerts.py           # Alerts repository
│   ├── traffic.py          # Traffic repository
│   ├── models.py           # Pydantic MongoDB schemas
│   └── seed.py             # Database seeding (admin user)
├── ml/
│   ├── detector.py         # ML pipeline
│   ├── model.py            # LLM pipeline
│   └── train.py            # Model training
├── router/
│   ├── analyse/            # POST /analyze
│   ├── users/              # Auth + users
│   ├── health.py
│   ├── stats.py
│   └── websockets_router.py
└── schemas/
    └── schemas.py          # Pydantic API models
```
