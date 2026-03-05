# Database — IDS-AI

MySQL database configuration and data models for the AI-powered Intrusion Detection System.

## Technology

- **Database:** MySQL >= 8.0
- **Python ORM:** SQLAlchemy 2.0 (async)
- **MySQL driver:** aiomysql (async)
- **Schema validation:** Pydantic v2

## Prerequisites

- MySQL >= 8.0 running locally or on a remote server
- Python >= 3.10 (dependencies installed from `backend/requirements.txt`)

## Configuration

Set the following environment variables (or add them to `backend/.env`):

| Variable         | Default         | Description         |
|------------------|-----------------|---------------------|
| `MYSQL_HOST`     | `localhost`     | MySQL server host   |
| `MYSQL_PORT`     | `3306`          | MySQL server port   |
| `MYSQL_USER`     | `root`          | MySQL username      |
| `MYSQL_PASSWORD` | `` (empty)      | MySQL password      |
| `DATABASE_NAME`  | `ids_ai`        | Database name       |

## Tables

| Table              | Model              | Description                              |
|--------------------|--------------------|------------------------------------------|
| `alerts`           | `Alert`            | Detected intrusion alerts                |
| `network_traffic`  | `NetworkTraffic`   | Raw network traffic records for ML       |

## Files

```
database/
├── config.py    # Database connection helpers (SQLAlchemy async client)
├── models.py    # SQLAlchemy ORM models and Pydantic schemas
└── README.md
```

## Git Workflow: Database Branch

### Create and Switch to Database Branch

```bash
# Create a new branch for database changes
git checkout -b database-branch

# Or create and switch in one command
git checkout -b database-branch main
```

### Work on the Database Branch

Make your changes to database configuration, models, or migrations:

```bash
# Stage changes
git add database/
git add backend/requirements.txt

# Commit changes
git commit -m "chore: update database configuration"

# Push branch to remote
git push origin database-branch
```

### Merge Database Branch into Main

#### Option 1: Via Git Command (Local)

```bash
# Switch to main branch
git checkout main

# Pull latest changes from remote
git pull origin main

# Merge database-branch into main
git merge database-branch

# Push merged changes
git push origin main
```

#### Option 2: Via Pull Request (Recommended)

```bash
# Push your branch to remote (if not already pushed)
git push origin database-branch

# Create a pull request on GitHub/GitLab
# - Go to your repository
# - Click "New Pull Request" or "Create PR"
# - Base: main
# - Compare: database-branch
# - Add title and description
# - Request review and merge
```

#### Clean Up After Merge

```bash
# Delete local branch
git branch -d database-branch

# Delete remote branch
git push origin --delete database-branch
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
