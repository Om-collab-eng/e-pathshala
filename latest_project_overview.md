# 📚 Librika (e-pathshala) — Latest Project Overview & Handoff

> **Synchronized Workflow Document**: This document is updated whenever work completes on either laptop. Before starting any work on any machine, always pull latest changes first.

---

## 🔄 Cross-Laptop Development Workflow

To seamlessly work on this project across multiple laptops via GitHub, follow this strict protocol:

```mermaid
flowchart LR
    A[Start Session] --> B[git pull origin main]
    B --> C[Review latest_project_overview.md]
    C --> D[Develop & Test Changes]
    D --> E[Update latest_project_overview.md]
    E --> F[git add . & git commit]
    F --> G[git push origin main]
    G --> H[Handoff Complete to other laptop]
```

### 1. Step-by-Step BEFORE Every Change (The Pull Ritual)
Run these commands in order before touching any file:
```bash
# Step 1: Ensure your local working tree is clean
git status

# Step 2: (Optional) If you have uncommitted quick edits you want to keep:
git stash

# Step 3: Fetch and merge latest code pushed from the other laptop
git pull origin main

# Step 4: (Optional) If you stashed edits in Step 2:
git stash pop

# Step 5: Verify the latest commit message and author
git log -1 --stat

# Step 6: Read latest_project_overview.md to know the exact state and next goals!
cat latest_project_overview.md
```

### 2. Step-by-Step AFTER Every Change (The Push Ritual)
Run these commands in order once changes are tested and ready to hand off:
```bash
# Step 1: Update 'latest_project_overview.md' with:
#   - What was added, fixed, or modified in the Changelog section
#   - Updated list of Next Steps / Active Tasks

# Step 2: Check modified and untracked files
git status

# Step 3: Review your exact code diff to catch unintended changes
git diff

# Step 4: Stage all modified and new files (secrets are protected by .gitignore)
git add .

# Step 5: Commit with a meaningful conventional commit message
git commit -m "feat/fix(module-name): descriptive summary of changes"

# Step 6: Safety check - rebase with remote in case other laptop pushed meanwhile
git pull origin main --rebase

# Step 7: Push to GitHub so the other laptop can pull it immediately
git push origin main

# Step 8: Verify that working tree is clean and up to date
git status
```


---

## 🔐 Credentials & Sensitive Files (DO NOT COMMIT)

The following files are excluded in `.gitignore` to prevent credential exposure:
1. **`.env`**: Contains production MySQL, NVIDIA API, Supabase, Brevo, Gmail SMTP, and JaaS keys.
2. **`jaas_private_key.pk`**: RSA private key required to generate JaaS (8x8.vc) meeting tokens.
3. **`PROJECT_CREDENTIALS_AND_CONFIG.md`**: Master credentials sheet with MilesWeb SSH, database passwords, and AI keys.
4. **`cookies.txt`** / session tokens.
5. **`*.db`**: Local SQLite database files (`library_v3.db`).

### ⚠️ Transfer Checklist for Laptop B:
When setting up Laptop B for the first time:
1. Clone repo: `git clone git@github.com:Om-collab-eng/e-pathshala.git`
2. **Fetch all secrets directly from the MilesWeb production server via SCP**:
   ```bash
   scp librika_1@45.199.139.18:public_html/.env ./
   scp librika_1@45.199.139.18:public_html/jaas_private_key.pk ./
   scp librika_1@45.199.139.18:public_html/PROJECT_CREDENTIALS_AND_CONFIG.md ./
   # (Password: Kalatota@123)
   ```
   *Alternatively, copy `.env` and `jaas_private_key.pk` via AirDrop or USB.*
3. Run `npm install`.


---

## 🏗️ Architecture & Tech Stack

| Component | Technology | Details |
| :--- | :--- | :--- |
| **Runtime & Framework** | Node.js (>=20.0), Express 5 | `app.js` -> `server_new.js` |
| **Templating Engine** | EJS, `ejs-mate`, `express-ejs-layouts` | Views in `/views` and `/templates` |
| **Database Architecture** | Dual Engine (MySQL & SQLite) | `db.js`: Production uses MilesWeb MySQL (`librika_1_librika`); Local dev falls back to SQLite (`library_v3.db`) |
| **Real-time & Meetings** | Socket.IO + 8x8 JaaS WebRTC | `services/liveSocket.js`, `services/jaasService.js` |
| **AI Assistants & OCR** | NVIDIA NIM, OpenRouter, Tesseract.js | Llama 3.1 70B & Llama 3.2 11B Vision for OCR and study assistant |
| **Email Service** | Nodemailer (Gmail SMTP & Brevo) | `librika.in@gmail.com` |
| **Sessions** | `express-session`, `express-mysql-session` | 30-day persistent sessions |

---

## 📦 Key Portals & System Modules

1. **Modern Student Portal (`/student`, `student_routes.js`)**:
   - 10 unified modules:
     1. Dashboard & Progress
     2. Catalog & Discovery
     3. Reading Room & PDF Viewer
     4. AI Study Assistant & Doubt Solver
     5. Digital Content & Student Publications
     6. Collaborative Study Rooms
     7. Quizzes, Mock Tests & Flashcards
     8. Live Video Meetings & Virtual Classrooms (`/meetings`)
     9. Reading Activity, History & Bookmarks
     10. Profile & Account Settings
2. **Librarian Management System (`/librarian`)**:
   - Physical book cataloging, circulation (issue/return), barcode scanning, student membership, fine management, and inventory auditing.
3. **Super Admin CMS (`/super-admin`)**:
   - Multi-tenant institution management, platform analytics, subscription & billing management, and dynamic announcement/ads ticker engine.
4. **Live Virtual Meeting & Classroom Engine (`/meetings`)**:
   - Powered by 8x8 JaaS (Jitsi as a Service).
   - Generates RS256 JWT tokens via `services/jaasService.js`.
   - Host/moderator and student role-based access.

---

## ⚡ Running the Project Locally

```bash
# 1. Install dependencies
npm install

# 2. Check environment variables
# Ensure .env is present with either MySQL config or default local SQLite fallback

# 3. Start server
npm start
# or for hot reloading:
npm run dev

# Server runs on: http://localhost:3000 (or PORT in .env)
```

---

## 📋 Recent Changelog & Completed Work

- **`8dcef26`**: Fixed dynamic ticker ad click tracking with valid JSON payload and headers.
- **`5bc13fa`**: Implemented dynamic e-library announcements, banner slider, and educational facts ticker with Super Admin CMS management.
- **`499d528`**: Integrated "Publish Content" and "My Publications" directly into the unified modern Student Portal.
- **`e4f7b9f`**: Unified all student navigation into the modern 10-module portal.
- **`4f90c62`**: Fixed static middleware index intercept and updated OCR branding.
- **JaaS Video Conferencing**: Added `services/jaasService.js` and migration `db/initMeetingTables.js`.
- **Security**: Updated `.gitignore` to strictly exclude `cookies.txt`, `*cookies*.txt`, `.stfolder/`, and private keys.

---

## 🎯 Next Steps / Active Tasks

- [ ] Push local commits (`git push origin main`) to update remote repository.
- [ ] On Laptop B: clone repository and copy over `.env` and `jaas_private_key.pk`.
- [ ] Run `npm install` on Laptop B and verify server boots on `http://localhost:3000`.
- [ ] Run meeting table migration on local/production database if not yet applied (`node db/initMeetingTables.js`).
