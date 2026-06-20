# School Library OCR Scanner System

A production-ready School Library Book Cataloging and OCR Scanning system. The application allows librarians to scan book covers using a camera or file upload, run Tesseract OCR on the cover image, refine book details (title, author, publisher, ISBN, subject, category) using the OpenRouter AI model, and save them in an SQLite database with auto-incremented library IDs matching the format `LIBdd/mm/yy/count` (e.g. `LIB20/06/26/1`).

---

## 📁 Folder Structure

```text
ocr-scanner-system/
├── package.json         # Node.js project configuration and dependencies
├── .env                 # Environment variables (OpenRouter key, Port)
├── database.js          # SQLite connection, tables schema, and db helper operations
├── server.js            # Express.js server, multer configuration, and Tesseract/AI routes
└── public/              # Frontend client assets
    ├── index.html       # Responsive Single-Page admin dashboard and scanner layout
    ├── style.css        # Premium dark mode theme styles
    └── app.js           # Client-side camera and upload controller logic
```

---

## 🛠️ Technology Stack

1. **Backend Core**: Node.js & Express.js
2. **Database Layer**: SQLite3
3. **OCR Engine**: Tesseract.js (Pure JS WASM port of Tesseract OCR for maximum portability, running on node)
4. **AI Processor**: OpenRouter API (`cohere/north-mini-code:free` model)
5. **Frontend Interface**: Semantic HTML5, CSS3 Custom Properties (Vanilla), and Vanilla JS

---

## 🚀 Installation & Setup Guide

### 1. Install Node.js
If you don't have Node.js installed:
- **Windows / macOS**: Download and run the installer from the official website: [https://nodejs.org/](https://nodejs.org/) (Select the LTS version).
- **Linux (Ubuntu/Debian)**: Run the following commands:
  ```bash
  sudo apt update
  sudo apt install nodejs npm
  ```
- **Verify installation**:
  ```bash
  node -v
  npm -v
  ```

### 2. Tesseract OCR Installation & Verification
For local processing, Tesseract is run natively via Javascript WebAssembly (`tesseract.js` npm package) on the server, which runs out-of-the-box on all OS platforms.
If you also need to use the native binary or verify it on a local machine:

#### Windows
1. Download the Tesseract installer from the UB Mannheim repository: [https://github.com/UB-Mannheim/tesseract/wiki](https://github.com/UB-Mannheim/tesseract/wiki).
2. Run the installer. The default path is: `C:\Program Files\Tesseract-OCR\tesseract.exe`.
3. Add `C:\Program Files\Tesseract-OCR` to your System Environment variables (PATH).
4. Verify the CLI installation:
   ```cmd
   tesseract --version
   ```

#### macOS (via Homebrew)
1. Run:
   ```bash
   brew install tesseract
   ```
2. Verify:
   ```bash
   tesseract --version
   ```

---

## 📦 Project Setup

1. Open your terminal and change directory to the `ocr-scanner-system` folder:
   ```bash
   cd ocr-scanner-system
   ```

2. Install all required Node.js package dependencies:
   ```bash
   npm install
   ```
   *This command installs: `express`, `multer`, `cors`, `dotenv`, `sqlite3`, `tesseract.js`, and `axios`.*

3. Configure Environment Variables:
   Open the `.env` file in the root folder and configure the variables:
   ```env
   PORT=5000
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

4. Run the Application:
   Start the development server using:
   ```bash
   npm start
   ```
   *The server starts listening on: **`http://localhost:5000`***

---

## 💡 Key Features walkthrough

1. **Statistics & Stats Cards**:
   - Displays real-time calculations of **Total Books**, **Successful Scans**, **Failed Scans**, and **Success Rate** percentages in the Admin Dashboard.
2. **Dynamic File Upload & Camera Integration**:
   - Drag & drop cover images into the scanner zone or select them manually.
   - Use the Web Camera option to stream video and capture snapshots directly from a laptop or mobile web browser.
3. **Advanced AI Structuring**:
   - Extracted OCR text is refined via the `cohere/north-mini-code:free` LLM to structure title, author, publisher, ISBN, subject, and category properties.
4. **Low Confidence Warning Flags**:
   - If the OCR confidence score falls below 70%, the interface displays an alert banner warning you to double-check or retake the image.
5. **Inventory Search & Filter**:
   - The Inventory tab includes category filters and text search matching Title, Author, or ISBN.
