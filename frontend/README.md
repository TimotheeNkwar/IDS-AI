# Frontend — IDS-AI

React-based user interface for the AI-powered Intrusion Detection System.

## Prerequisites

- Node.js >= 16
- npm >= 8

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm start

# Build for production
npm run build
```

## Project Structure

```
frontend/
├── public/
│   └── index.html       # HTML entry point
├── src/
│   ├── App.jsx          # Main application component
│   └── index.jsx        # React DOM entry point
└── package.json         # Node dependencies and scripts
```

## Features

- Real-time alert dashboard
- System status indicator
- Communicates with the backend API at `/api`
