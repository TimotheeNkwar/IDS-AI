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

## Git Workflow: Backend Branch

### Create and Switch to Backend Branch

```bash
# Create a new branch for backend changes
git checkout -b backend-branch

# Or create and switch in one command
git checkout -b backend-branch main
```

### Work on the Backend Branch

Make your changes to API endpoints, business logic, or dependencies:

```bash
# Stage changes
git add backend/

# Commit changes
git commit -m "feat: add new API endpoint"

# Push branch to remote
git push origin backend-branch
```

### Merge Backend Branch into Main

#### Option 1: Via Git Command (Local)

```bash
# Switch to main branch
git checkout main

# Pull latest changes from remote
git pull origin main

# Merge backend-branch into main
git merge backend-branch

# Push merged changes
git push origin main
```

#### Option 2: Via Pull Request (Recommended)

```bash
# Push your branch to remote (if not already pushed)
git push origin backend-branch

# Create a pull request on GitHub/GitLab
# - Go to your repository
# - Click "New Pull Request" or "Create PR"
# - Base: main
# - Compare: backend-branch
# - Add title and description
# - Request review and merge
```

#### Clean Up After Merge

```bash
# Delete local branch
git branch -d backend-branch

# Delete remote branch
git push origin --delete backend-branch
```

### View Branch History

```bash
# List all branches
git branch -a

# View commit history on current branch
git log --oneline

# View branches merged into main
git branch --merged main
```

## API Endpoints

| Method | Path          | Description                  |
|--------|---------------|------------------------------|
| GET    | /api/status   | System health check          |
| GET    | /api/alerts   | Retrieve recent IDS alerts   |

## Environment Variables

Create a `.env` file in this directory:

```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
DATABASE_NAME=ids_ai
```
