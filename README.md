# IDS-AI: AI-Powered Intrusion Detection System

A full-stack web application that uses machine learning and AI to detect network intrusions and analyze security threats in real-time. The system combines a FastAPI backend with a React frontend to provide an interactive dashboard for network monitoring and threat analysis.

## 📋 Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Contributing](#contributing)

## ✨ Features

- **Real-time Network Monitoring**: Monitor network traffic and detect anomalies
- **AI-Powered Threat Detection**: Machine learning models for intrusion detection
- **Interactive Dashboard**: React-based UI for visualization and analysis
- **User Management**: User authentication and profile management
- **Threat Analysis**: Detailed analysis of detected security threats
- **API Documentation**: Auto-generated interactive API documentation
- **WebSocket Support**: Real-time updates via WebSocket connections

## 📁 Project Structure

```
IDS-AI/
├── backend/                    # FastAPI backend application
│   ├── main.py                # Application entry point
│   ├── requirements.txt        # Python dependencies
│   ├── config/                # Configuration management
│   ├── database/              # Database models and operations
│   ├── ml/                    # Machine learning models and inference
│   ├── router/                # API route handlers
│   ├── schemas/               # Pydantic schemas for validation
│   ├── users/                 # User management and authentication
│   └── README.md              # Backend documentation
│
├── frontend/                   # React TypeScript Vite application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service clients
│   │   ├── stores/            # State management
│   │   ├── hooks/             # Custom React hooks
│   │   └── types/             # TypeScript type definitions
│   ├── package.json           # Node dependencies
│   ├── vite.config.ts         # Vite configuration
│   └── README.md              # Frontend documentation
│
├── database/                   # Database initialization and migrations
├── load_tests/                # Load testing and attack simulations
└── pyproject.toml             # Project configuration

```

## 📋 Prerequisites

- **Python**: >= 3.11
- **Node.js**: >= 16
- **npm** or **yarn**: For frontend package management
- **Ollama**: For local LLM inference (optional, for AI analysis features)
- **Git**: For version control

## 🚀 Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. (Optional) Setup Ollama for LLM features:
```bash
ollama pull mistral
ollama serve  # Run in a separate terminal
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node dependencies:
```bash
npm install
```

## 🎯 Getting Started

### Start the Backend

1. Ensure your virtual environment is activated (in the `backend` directory):
```bash
source venv/bin/activate   # On Windows: venv\Scripts\activate
```

2. Start the FastAPI server:
```bash
uvicorn main:app --reload
```

The backend will run on `http://localhost:8000`
- Interactive API documentation: `http://localhost:8000/docs`
- Alternative API documentation: `http://localhost:8000/redoc`

### Start the Frontend

1. In another terminal, navigate to the `frontend` directory:
```bash
cd frontend
```

2. Start the development server:
```bash
npm run dev
```

The frontend will typically run on `http://localhost:5173`

### Access the Application

- Open your browser and navigate to the frontend URL (usually `http://localhost:5173`)
- The frontend will communicate with the backend API running on `http://localhost:8000`

## 🏗️ Architecture

### Backend Architecture
- **Framework**: FastAPI (async, high-performance)
- **Database**: SQL-based (configured in database module)
- **ML Models**: Scikit-learn and custom neural networks (in `ml/` module)
- **LLM Integration**: Ollama for local inference
- **Authentication**: OAuth2 with JWT tokens
- **Real-time**: WebSocket support for live updates

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite (fast development and production builds)
- **State Management**: Zustand or Context API (stores module)
- **HTTP Client**: Axios or Fetch (services module)
- **UI Components**: Custom React components with Tailwind CSS styling

## 📚 Additional Resources

- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)
- [ML Module Documentation](./backend/ml/knowledge_base.txt)

## 🤝 Contributing

When contributing to this project, please follow these guidelines:

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes with descriptive commits
3. Push to your branch and submit a pull request
4. Ensure code follows the project's style conventions
5. Add tests for new features

## 📝 Notes

- Keep backend and frontend development servers running in separate terminals
- The `ollama serve` command must run in its own terminal when using LLM features
- Refer to individual README files in `backend/` and `frontend/` for specific setup and configuration details

## 📄 License

Include your license information here.

---

For more information or issues, please check the individual module README files or contact the development team.
