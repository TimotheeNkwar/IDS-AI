# IDS-AI

This project implements an Artificial Intelligence-based Intrusion Detection System (IDS) designed to detect malicious network activities using Machine Learning and Deep Learning techniques.

## Project Structure

```text
IDS-AI/
├── frontend/        # React user interface
├── backend/         # Python / FastAPI REST API & ML logic
└── database/        # MySQL configuration and data models
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

Start a local MySQL instance (or configure a connection in `backend/.env`):

```sql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
DATABASE_NAME=ids_ai
```

See each sub-folder's own `README.md` for detailed instructions.

## Git Workflow

This project uses feature branches for organizing work across frontend, backend, and database components.

### Available Branches

- **`main`** - Production-ready code
- **`database-branch`** - Database configuration and schema changes
- **`backend-branch`** - API endpoints and backend logic
- **`frontend-branch`** - UI components and frontend features

### Complete Workflow Example

#### 1. Create and Work on a Feature Branch

```bash
# Create backend branch
git checkout -b backend-branch main

# Make changes
cd backend
# ... edit files ...

# Stage and commit
git add backend/
git commit -m "feat: add user authentication endpoint"
git push origin backend-branch
```

#### 2. Create Pull Request and Review

```bash
# On GitHub/GitLab:
# 1. Click "New Pull Request"
# 2. Set Base: main, Compare: backend-branch
# 3. Add description and request reviews
# 4. Address feedback and push updates
```

#### 3. Merge into Main

```bash
# Option A: Merge locally
git checkout main
git pull origin main
git merge backend-branch
git push origin main

# Option B: Merge via GitHub/GitLab UI
# Click "Merge Pull Request" button
```

#### 4. Clean Up

```bash
# Delete local branch
git branch -d backend-branch

# Delete remote branch
git push origin --delete backend-branch
```

### Useful Commands

```bash
# List all branches
git branch -a

# Switch between branches
git checkout database-branch

# View commit history
git log --oneline

# See which branches are merged
git branch --merged main

# Sync with latest main
git fetch origin
git rebase origin/main
```

### Best Practices

- Create a new branch for each feature or fix
- Use descriptive commit messages
- Keep branches focused on a single concern
- Test locally before pushing
- Create Pull Requests for code review
- Delete branches after merging to keep repository clean

## Avoiding and Resolving Conflicts

### Before Starting Work: Always Sync with Main

```bash
# Fetch latest changes from remote
git fetch origin

# Pull latest changes into your current branch
git pull origin main

# Or sync your feature branch with latest main
git checkout your-branch
git rebase origin/main
```

### Before Pushing: Update Your Branch

```bash
# Make sure your branch is up-to-date
git fetch origin

# Pull latest main into your branch to catch any new changes
git checkout your-branch
git merge origin/main

# Or use rebase for a cleaner history (only if branch is not shared)
git rebase origin/main
```

### Step-by-Step: Avoid Conflicts While Working

#### 1. Start Fresh

```bash
# Ensure main is up-to-date
git checkout main
git pull origin main

# Create your feature branch from latest main
git checkout -b backend-branch
```

#### 2. Work on Your Changes

```bash
# Make edits to files
cd backend
# ... edit files ...

# Commit regularly with clear messages
git add backend/
git commit -m "feat: add validation logic"
```

#### 3. Before Pushing: Check for Updates

```bash
# Fetch latest changes from remote (doesn't modify local files)
git fetch origin

# Check if main has been updated
git log origin/main..main  # Shows commits in main not in origin/main

# If main was updated, sync your branch
git pull origin main
```

#### 4. Push Your Changes

```bash
# Push to remote
git push origin backend-branch
```

### If You Already Have a Conflict

#### Resolving Merge Conflicts

```bash
# If you get a conflict message during git pull or merge
git status  # Shows files with conflicts

# Edit the conflicted files
# Look for markers like:
# <<<<<<< HEAD
# your changes
# =======
# their changes
# >>>>>>> branch-name

# After resolving, mark as resolved
git add conflicted-file.py

# Complete the merge
git commit -m "fix: resolve merge conflicts"
```

#### Aborting a Problematic Merge

```bash
# If merge goes wrong, abort it
git merge --abort

# Or abort a rebase
git rebase --abort
```

### Recommended Workflow to Minimize Conflicts

```bash
# 1. Start of day: sync with latest main
git checkout main
git pull origin main

# 2. Create or switch to your feature branch
git checkout -b backend-branch
git pull origin main

# 3. Work in small chunks and commit often
git add backend/feature.py
git commit -m "feat: implement feature part 1"

# 4. Before end of shift: check for updates
git fetch origin
git pull origin main  # Merge latest changes into your branch

# 5. Before pushing: final sync
git fetch origin
git pull origin main

# 6. Push your work
git push origin backend-branch
```

### Communication Tips

- **Notify team** when working on shared files
- **Check with others** before modifying core files (models.py, config.py)
- **Keep commits small** for easier merging
- **Pull frequently** to stay in sync
- **Test locally** before pushing after major merges
