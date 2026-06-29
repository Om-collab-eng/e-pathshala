# Deep-Dive Technical Presentation Blueprint: Librika (e-Pathshala)

This comprehensive guide details every user-facing feature, system mechanic, backend database table, routing path, and logic formula in **Librika (e-Pathshala)**. Use this text directly for your presentation slides, scripts, and handouts.

---

## SECTION 1: SYSTEM ARCHITECTURE & INTEGRATED PLATFORM

### 1. Unified Web Platform
*   **Technologies**: Python Flask backend, SQLite databases with Write-Ahead Logging (WAL) mode for concurrency, Jinja2 template rendering, and mobile-responsive Vanilla CSS (Outfit & Plus Jakarta Sans typography).
*   **Role-Based Security Portal**:
    *   *Super Admin*: Global control panel, platform moderation, subscription management, school provisioning.
    *   *Admin / Librarian*: Catalog management, member registration, transactions control, upload review pipelines.
    *   *Student*: Personal library bookshelf, reading dashboards, streaks tracker, AI-quiz portals, community uploads.
*   **Dynamic Database Isolation**:
    *   `demo.db`: Sandboxed database sandbox specifically generated for session visitors checking out features.
    *   `library_v3.db`: Production database containing persistent real-world catalogs, transactions, and school information.
    *   Connection manager dynamically switches connection targets based on `session.get('is_demo')`.

---

## SECTION 2: SMART AI BOOK SCANNER MODULE

### 1. High-Speed Bulk Cataloguing
*   **Routing Path**: `/admin/scanner` (renders [scanner_v2.html](file:///Users/omgupta/Desktop/librARY/templates/scanner_v2.html)).
*   **Parallel Execution**: Client-side camera captures are processed concurrently in asynchronous background threads. Reduces execution time to **10 books in 5 seconds**.
*   **SQLite WAL Concurrency**: Backend uses `journal_mode=WAL` and `busy_timeout=10000ms` to prevent database locks during concurrent catalog writes.

### 3. Multi-Tier AI Cover Recognition & Metadata Extraction
*   **NVIDIA VLM Completion**: The scanner passes the base64 cover image directly to the NVIDIA Nemotron Vision API (`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`) to parse:
    *   Title, Subtitle, Author(s), Publisher, Publication Year, ISBN-10/13, Language, Category/Genre, Subject, Target Audience, and a 20-word description.
*   **Automatic VLM Cleaning**: The parser automatically strips `<thought>` blocks out of LLM completions before executing JSON parsing.
*   **Double Fallback Accuracy Engine**:
    *   *Fallback 1 (Google Books API)*: If critical metadata fields (Author, ISBN, Publisher) are missing, the system uses the Google Books API query tool (`q=intitle:[Title]`).
    *   *Fallback 2 (DuckDuckGo Web Search + LLM Refinement)*: If a book is regional (e.g. Indian NCERT textbook, state syllabus, local publisher), standard API queries return empty. The server automatically crawls DuckDuckGo for the title, feeds page snippet context to the Nemotron LLM, and refines the details dynamically.

### 4. Automated Duplicate Stock Handling
*   If a book is scanned that already exists in the school catalog (matched by normalized ISBN or title), the system automatically increments the stock variables (`total_copies += 1` and `available_copies += 1`) in the database.
*   Shows a non-blocking toast alert: `"Existing Book: Added copy of [Title] to stock"` without interrupting the bulk scanner flow.

---

## SECTION 3: SUBSCRIPTIONS & INTERACTIVE 3D CHECKOUT

### 1. Subscriptions & Limit Control
*   **Plans Matrix** (`permissions.py`):
    *   *FREE*: 50 students, 1 librarian, 1 admin, 500 catalog books. AI Chat & scanner disabled.
    *   *BASIC*: 500 students, 2 librarians, 1 admin, 5,000 catalog books. AI features enabled.
    *   *PROFESSIONAL*: Unlimited students, unlimited librarians, unlimited admins, unlimited books. AI features enabled.
*   **Limit Checks**: Every add-user, add-admin, or add-copy action dynamically queries the active subscription limits of the school code from the database.

### 2. Premium 3D Checkout Simulator
*   **Routing Path**: `/billing` (renders [billing_dashboard.html](file:///Users/omgupta/Desktop/librARY/templates/billing_dashboard.html)).
*   **Card Validation**: Front-end detects credit card type (Visa, Mastercard, etc.) live based on prefix digits and renders card logos on the fly.
*   **3D Perspective Flip**: Custom CSS 3D perspectives rotate the card 180 degrees horizontally when focusing the CVV input field to show the card backing.
*   **Authorization Loader**: Displays step-by-step transaction simulations ("Connecting...", "Authorizing...", "Finalizing...") before committing updates and writing invoice logs to database tables.
*   **Instant Downgrades**: Clicking cancel immediately resets plan codes to `FREE` and adjusts database limits back to 50 students.

---

## SECTION 4: GAMIFIED READING SCORE & LEADERBOARDS

### 1. Reader Score Formula
Scores are calculated dynamically to reward actual comprehension, responsibility, and engagement rather than raw volume:
*   **Issue Book**: `+5 points` (acknowledges starting a book)
*   **Return On Time**: `+15 points` (rewards returning assets on time)
*   **Approved Review**: `+20 points` (rewards writing reflective book feedback)
*   **Comprehension Quiz Passed**: `+50 points` (rewards reading completion and memory retention)
*   **Late Return**: `-20 points` (penalizes tardiness)
*   **Lost/Damaged Book**: `-50 points` (penalizes lack of asset care)

$$\text{Physical Reader Score} = (\text{issues} \times 5) + (\text{onTimeReturns} \times 15) + (\text{approvedReviews} \times 20) + (\text{quizzesPassed} \times 50) - (\text{lateReturns} \times 20) - (\text{lostBooks} \times 50)$$

### 2. Three Standalone Leaderboard Portals
*   **Routing Path**: `/leaderboard` (renders [leaderboard.html](file:///Users/omgupta/Desktop/librARY/templates/leaderboard.html)).
    1.  *Physical Library Leaderboard*: Scores compiled from physical catalog checkouts.
    2.  *Digital Library Leaderboard*: Scores compiled from e-Library uploads, bookmarks, and digital progress logs.
    3.  *Overall Leaderboard*: Aggregated total of physical and digital scores.
*   **Filters**: Score lists can be grouped and filtered by:
    *   *Timeframe*: Weekly, Monthly, Yearly, and All-Time.
    *   *Scope*: Class and Section (supports comparing classrooms).

### 3. Student Profile Hub
*   **Routing Path**: `/student/profile` (renders [student_profile.html](file:///Users/omgupta/Desktop/librARY/templates/student_profile.html)).
*   **Streaks Tracker**: Computes consecutive daily reading activity.
*   **Badges Engine**: Dynamically awards achievement badges (e.g. *Comprehension Champion*, *Reading Streak Master*, *Digital Contributor*) as progress goals are met.

---

## SECTION 5: AI COMPREHENSION QUIZ SYSTEM

### 1. On-Demand Assessment Generator
*   **Comprehension Quizzes**: When a student finishes reading a book, the system leverages NVIDIA Nemotron completions to review catalog metadata and generate a 5-question multiple-choice quiz testing actual comprehension.
*   **Attempt Logging**: Evaluates quiz results on submission and logs pass/fail statuses, correct counts, and timestamp records.

### 2. Strict Anti-Exploit Locks
*   **Minimum Reading Period Lock**: To prevent students from issuing and immediately returning books to farm points, the quiz remains locked based on page counts:
    *   *Short books* (<100 pages): Must be held for at least `2 days`.
    *   *Medium books* (100–300 pages): Must be held for at least `5 days`.
    *   *Long books* (>300 pages): Must be held for at least `7 days`.
*   **90-Day Cooldown**: Prevents farming points on duplicate read events. A student cannot earn points for re-reading/re-quizzing the same book title within `90 days` of their last pass.

---

## SECTION 6: COMMUNITY E-LIBRARY & REPOSITORY

### 1. Digital Content Center
*   **Routing Path**: `/digital-library` (renders [digital_library.html](file:///Users/omgupta/Desktop/librARY/templates/digital_library.html)).
*   **Built-in E-Reader**: Integrated HTML5 PDF/EPUB parser allowing students to read documents cleanly within mobile and web browser windows.
*   **Peer-to-Peer Uploads**: Enables students to publish academic artifacts:
    *   *Class Notes*: Revision summaries and study templates.
    *   *Project & Research Reports*: Academic projects and lab reports.
    *   *Articles & Summary Materials*: Independent studies, essays.
*   **Progress Tracking**: Automatically logs reading statistics, streaks, and exact page read progress percentage to the database.

---

## SECTION 7: AI SEMANTIC SEARCH ENGINE

### 1. Intent-Based Retrieval
*   **Semantic Matching**: Runs a completions intent parser using the NVIDIA completions model to read user search strings and match them semantically against book attributes.
*   **Examples**:
    *   Querying *"courage in space"* ranks astronomy research, astronaut biographies, and sci-fi books highly, even if the keyword "courage" or "space" is not in their titles.
*   **Relevance Indicator Badges**: Displays a gradient `🤖 XX% Match` badge directly on matching book cards.
*   **Hybrid search fallback**: Local JavaScript filter queries process search keywords instantly on keypress. Toggling **🤖 AI Search** submits the form to rank items semantically on the server.
