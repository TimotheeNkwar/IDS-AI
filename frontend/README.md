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

```text

frontend/
├── public/
│   └── index.html       # HTML entry point
├── src/
│   ├── App.css          # Dashboard styles
│   ├── App.jsx          # Main application component
│   └── index.jsx        # React DOM entry point
└── package.json         # Node dependencies and scripts
```

## Git Workflow: Frontend Branch

### Create and Switch to Frontend Branch

```bash
# Create a new branch for frontend changes
git checkout -b frontend-branch

# Or create and switch in one command
git checkout -b frontend-branch main
```

### Work on the Frontend Branch

Make your changes to components, styles, or dependencies:

```bash
# Stage changes
git add frontend/

# Commit changes
git commit -m "feat: add new dashboard component"

# Push branch to remote
git push origin frontend-branch
```

### Merge Frontend Branch into Main

#### Option 1: Via Git Command (Local)

```bash
# Switch to main branch
git checkout main

# Pull latest changes from remote
git pull origin main

# Merge frontend-branch into main
git merge frontend-branch

# Push merged changes
git push origin main
```

#### Option 2: Via Pull Request (Recommended)

```bash
# Push your branch to remote (if not already pushed)
git push origin frontend-branch

# Create a pull request on GitHub/GitLab
# - Go to your repository
# - Click "New Pull Request" or "Create PR"
# - Base: main
# - Compare: frontend-branch
# - Add title and description
# - Request review and merge
```

#### Clean Up After Merge

```bash
# Delete local branch
git branch -d frontend-branch

# Delete remote branch
git push origin --delete frontend-branch
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

## Features

- Auto-refreshing SOC-style dashboard
- ML, LLM, alert storage, and traffic storage health indicators
- Alert severity and workflow counters
- Alert filtering by search, severity, and status
- Inline alert status updates via `PATCH /api/alerts/{id}/status`
- Recent analyzed traffic view from `/api/traffic`
