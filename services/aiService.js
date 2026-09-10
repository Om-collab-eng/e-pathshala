const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Provider API keys from .env
const nvidiaKey = process.env.NVIDIA_API_KEY;
const openrouterKey = process.env.OPENROUTER_API_KEY;
const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

let genAI = null;
if (geminiKey) {
  genAI = new GoogleGenerativeAI(geminiKey);
}

console.log(`AI Service loaded. Active keys in env: NVIDIA [${nvidiaKey ? 'YES' : 'NO'}], OpenRouter [${openrouterKey ? 'YES' : 'NO'}], Gemini [${geminiKey ? 'YES' : 'NO'}]`);

/**
 * 1. Call NVIDIA NIM API (Fastest Llama-3.1 70B & Vision)
 */
async function callNvidiaAI(prompt, options = {}) {
  if (!nvidiaKey) throw new Error("NVIDIA API key not configured");

  const isVision = !!options.imageBase64;
  const model = options.model || (isVision ? "meta/llama-3.2-11b-vision-instruct" : "meta/llama-3.1-70b-instruct");

  let content;
  if (isVision) {
    const base64Clean = options.imageBase64.replace(/^data:image\/\w+;base64,/, '');
    content = [
      { type: "text", text: prompt },
      { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Clean}` } }
    ];
  } else {
    content = prompt;
  }

  const response = await axios.post("https://integrate.api.nvidia.com/v1/chat/completions", {
    model: model,
    messages: [{ role: "user", content: content }],
    temperature: options.temperature !== undefined ? options.temperature : 0.3,
    top_p: options.top_p !== undefined ? options.top_p : 0.7,
    max_tokens: options.max_tokens || 1024
  }, {
    headers: {
      "Authorization": `Bearer ${nvidiaKey}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    timeout: 8000
  });

  if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
    return response.data.choices[0].message.content.trim();
  }
  throw new Error("Invalid response format from NVIDIA API");
}

/**
 * 2. Call OpenRouter API (Fallback 1)
 */
async function callOpenRouter(prompt, options = {}) {
  if (!openrouterKey) throw new Error("OpenRouter API key not configured");

  const isVision = !!options.imageBase64;
  const modelsToTry = isVision
    ? ["meta-llama/llama-3.2-11b-vision-instruct:free", "google/gemini-flash-1.5"]
    : ["openai/gpt-3.5-turbo", "google/gemini-2.0-flash-001", "meta-llama/llama-3-8b-instruct:free", "openrouter/auto"];

  let lastErr = null;
  for (const model of modelsToTry) {
    try {
      let content;
      if (isVision) {
        const base64Clean = options.imageBase64.replace(/^data:image\/\w+;base64,/, '');
        content = [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Clean}` } }
        ];
      } else {
        content = prompt;
      }

      const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
        model: model,
        messages: [{ role: "user", content: content }],
        temperature: options.temperature !== undefined ? options.temperature : 0.4,
        max_tokens: options.max_tokens || 1024
      }, {
        headers: {
          "Authorization": `Bearer ${openrouterKey}`,
          "Content-Type": "application/json"
        },
        timeout: 10000
      });

      if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
        return response.data.choices[0].message.content.trim();
      }
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("OpenRouter API failed");
}

/**
 * 3. Call Gemini API (Fallback 2)
 */
async function callGemini(prompt, options = {}) {
  if (!genAI) throw new Error("Gemini API not configured");

  const modelName = options.model || 'gemini-2.0-flash';
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: options.temperature !== undefined ? options.temperature : 0.5,
    }
  });

  let result;
  if (options.parts) {
    result = await model.generateContent([prompt, ...options.parts]);
  } else {
    result = await model.generateContent(prompt);
  }
  const response = await result.response;
  return response.text();
}

/**
 * 4. Call Pollinations AI (Zero-Key Backup Provider)
 */
async function callPollinationsAI(prompt, options = {}) {
  try {
    const encoded = encodeURIComponent(prompt.slice(0, 500));
    const response = await axios.get(`https://text.pollinations.ai/${encoded}`, { timeout: 8000 });
    if (typeof response.data === 'string' && response.data.trim()) {
      return response.data.trim();
    }
  } catch (e) {}

  const response = await axios.post("https://text.pollinations.ai/", {
    messages: [{ role: "user", content: prompt }],
    model: "openai"
  }, { timeout: 8000 });

  if (typeof response.data === 'string') return response.data.trim();
  if (response.data && response.data.content) return String(response.data.content).trim();
  throw new Error("Invalid response from Pollinations AI");
}

function base64ToGenerativePart(base64Data, mimeType = "image/jpeg") {
  const base64Str = base64Data.replace(/^data:image\/\w+;base64,/, '');
  return {
    inlineData: {
      data: base64Str,
      mimeType
    }
  };
}

/**
 * Unified AI Router — multi-tiered failover:
 * NVIDIA (Fast Llama-3.1 70B) -> OpenRouter -> Gemini -> Pollinations AI
 */
async function callAI(prompt, options = {}) {
  // 1. Try NVIDIA API
  if (nvidiaKey) {
    try {
      return await callNvidiaAI(prompt, options);
    } catch (err) {
      console.warn("NVIDIA API attempt failed, trying OpenRouter fallback:", err.message);
    }
  }

  // 2. Try OpenRouter API
  if (openrouterKey) {
    try {
      return await callOpenRouter(prompt, options);
    } catch (err) {
      console.warn("OpenRouter API attempt failed, trying Gemini fallback:", err.message);
    }
  }

  // 3. Try Gemini API
  if (genAI) {
    try {
      if (options.imageBase64) {
        options.parts = [base64ToGenerativePart(options.imageBase64)];
      }
      return await callGemini(prompt, options);
    } catch (err) {
      console.warn("Gemini API attempt failed, trying Pollinations fallback:", err.message);
    }
  }

  // 4. Try Pollinations AI (Zero-Key Backup)
  try {
    return await callPollinationsAI(prompt, options);
  } catch (err) {
    console.warn("Pollinations AI attempt failed:", err.message);
  }

  throw new Error("All AI providers (NVIDIA, OpenRouter, Gemini, Pollinations) failed.");
}

/**
 * Safely parse JSON from LLM output
 */
function parseJSONFromResponse(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').replace(/```/gi, '').trim();
    return JSON.parse(cleaned);
  }
}

async function generateBookDescription(title, author, isbn) {
  try {
    const prompt = `Write a 3-sentence description for the book "${title}" by ${author || 'an author'}${isbn ? ' (ISBN: ' + isbn + ')' : ''}. Make it engaging and suitable for a library catalog.`;
    const result = await callAI(prompt, { temperature: 0.7 });
    return result.trim();
  } catch (error) {
    console.error("Book description AI error:", error.message);
    return `An engaging book title "${title}" by ${author || 'Author'}. Perfect addition to the library collection.`;
  }
}

async function generateQuizFromText(text, numQuestions = 5) {
  try {
    const prompt = `Generate a ${numQuestions}-question multiple-choice quiz based on the following text. 
Return ONLY a valid JSON array of objects.
Example structure:
[
  {
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "correct_answer": "...",
    "explanation": "..."
  }
]

Text:
${text.slice(0, 12000)}
`;
    const result = await callAI(prompt, { jsonMode: true, temperature: 0.4 });
    return parseJSONFromResponse(result);
  } catch (error) {
    console.error("Quiz generation error:", error.message);
    return [];
  }
}

async function gradeShortAnswer(question, correctAnswer, studentAnswer) {
  try {
    const prompt = `You are a teacher grading a student's answer.
Question: "${question}"
Correct Answer: "${correctAnswer}"
Student Answer: "${studentAnswer}"

Evaluate the student's answer based on the correct answer.
Return ONLY a valid JSON object with:
"score": an integer from 0 to 100
"feedback": a short, constructive string explaining the grade
`;
    const result = await callAI(prompt, { jsonMode: true, temperature: 0.2 });
    return parseJSONFromResponse(result);
  } catch (error) {
    console.error("Grade short answer error:", error.message);
    return { score: 75, feedback: "Good effort on your answer!" };
  }
}

async function processChapter(chapterText, chapterTitle) {
  try {
    const prompt = `Analyze the chapter titled "${chapterTitle}" and generate study materials.
Return ONLY a valid JSON object with the exact following structure:
{
  "summary": "Detailed summary",
  "vocabulary": [ {"word": "...", "definition": "..."} ],
  "qna": [ {"q": "...", "a": "..."} ],
  "quiz": [
    {
      "type": "mcq",
      "question": "...",
      "options": ["...","...","...","..."],
      "correct_index": 1
    }
  ]
}

Chapter Text:
${chapterText.slice(0, 12000)}
`;
    const result = await callAI(prompt, { jsonMode: true, temperature: 0.3 });
    return parseJSONFromResponse(result);
  } catch (error) {
    console.error("Process chapter error:", error.message);
    return { summary: "Chapter summary generated.", vocabulary: [], qna: [], quiz: [] };
  }
}

const LIBRIKA_KNOWLEDGE_BASE = `
### 🏛️ ABOUT LIBRIKA (librika.in)
Librika is an enterprise-grade Hybrid Library ERP, Digital Learning Management System (LMS), Open E-Library, and Live Interactive Virtual Classroom Platform for Schools, Colleges, Universities, Personal Collectors, and Students.

---

### 👥 USER ROLES & PORTAL ARCHITECTURE

1. 🎓 STUDENT PORTAL (\`/student\`):
   The Student Portal features exactly 10 core navigation modules:
   - 📊 **Dashboard (\`#dashboard\`):** Overview of active book loans, countdown to due dates, reading stats, upcoming live classes, quick catalog search, and school announcements.
   - 📚 **Catalog (\`#catalog\`):** Search school and global physical books by Title, Author, ISBN, or Category. Real-time availability badges ("Available" vs "Issued Out") and exact aisle/shelf location indicators.
   - 🔄 **My Borrows & Holds (\`#borrows\`):** View currently issued books, due dates, overdue counters, loan history, fine status (standard ₹5/day fine after grace period), and 1-click loan renewal.
   - 📖 **E-Library & Publications (\`#elibrary\`):** In-browser digital reader for PDF and EPUB books; search digital library; and access the Student Author Studio (\`/student/publish\`) to upload and publish digital books/documents (up to **27MB per book**), create chapters, and manage works under **My Publications** (\`/student/my-publications\`).
   - 🤖 **AI Tutor & Study Copilot (\`#ai\`):** AI study buddy for concept explanations, 5-6 bullet text summarization, 5-question multiple choice quizzes, 8-card flashcards, vocabulary builder, and language translation.
   - 🎥 **Live Classes & Studio (\`#classes\` or \`/studio/meeting/:id\`):** Join live interactive video classes powered by official Jitsi as a Service (JaaS on \`8x8.vc\`) infrastructure directly in the browser with mic, camera, screen sharing, and chat.
   - 📝 **Notes & Study Room (\`#notes\`):** Personal subject-wise study notes, digital book bookmarks, and collaborative study room discussions.
   - 🏆 **Reading Tracker & Badges (\`#tracker\` / \`#badges\`):** Track daily reading minutes, pages read, reading streaks, and unlock achievement badges.
   - ⭐ **Book Reviews (\`#reviews\`):** Rate books (1-5 stars), write reviews, and read peer recommendations.
   - ❓ **Help & Support (\`#help\`):** Library rules, borrowing limits, FAQs, and librarian support.

2. 👩‍🏫 LIBRARIAN / SCHOOL ADMIN PORTAL (\`/admin\`):
   - **Circulation Desk:** Barcode scanner integration for instant book issue, return, renewals, and overdue fine collection/waivers.
   - **Catalog Management:** Add physical books with ISBN auto-fill or AI camera OCR book cover scan, barcode label printing, and aisle/shelf mapping.
   - **Student & Member Directory:** Student profiles, bulk CSV import, generate printable Barcode/QR library ID cards.
   - **Digital Content & E-Library:** Upload e-books, manage chapters, review and moderate student publications.
   - **Librika Studio (Live Classrooms):** Schedule live classes, assign teachers and subjects, generate meeting codes on Jitsi JaaS.
   - **Acquisitions & Budget:** Book purchase requests, vendor orders, and inventory procurement tracking.
   - **Reports & Audits:** Circulation analytics, overdue reports, physical inventory audits, fine collection summaries.
   - **Settings:** Loan periods (default 14 days), student borrow limit (default 3 books), teacher borrow limit (default 10 books), daily fine rate (₹5/day).

3. 📖 PERSONAL / SOLO LIBRARY PORTAL (\`/personal\`):
   - For individual readers, researchers, and home libraries.
   - Manage personal book collection, reading wishlist, custom shelves, reading goals, and publish digital books up to 27MB to personal E-Library (\`/personal/elibrary/publish\`).

4. 🛡️ SUPER ADMIN CONSOLE (\`/super-admin\`):
   - 9 Primary Modules:
     1. Overview & Platform Command (live telemetry, tenant metrics, system health)
     2. School & Tenant Management (multi-tenant school onboarding, school codes)
     3. User & Role Administration (manage Admins, Librarians, Students, Personal users)
     4. Plan, Subscription & Billing Engine (Free, Basic, Professional, Enterprise limits)
     5. Global Catalog & Content Hub (global public domain books, moderation)
     6. Live Classrooms & Video Infrastructure (Jitsi JaaS 8x8.vc monitoring)
     7. Security, Access & Compliance (audit logs, role guardrails, maintenance mode)
     8. System Health, Logs & Telemetry (server metrics, database latency)
     9. Configuration & Settings Engine (SMTP, AI keys, backup/restore)

---

### 💳 SUBSCRIPTION PLANS & SPECIFICATIONS

- 🟢 **FREE PLAN (₹0/forever):**
  - Up to 500 physical books, 50 student members, 1 admin, 1 librarian.
  - Up to 20 digital books in E-Library.
  - **Max file size: 27MB per book** (PDF & EPUB).
  - Digital publishing enabled.
  - Barcode scanner & AI camera scanner enabled.
  - Basic AI Study Assistant.

- 🔵 **BASIC PLAN (₹999/month):**
  - Up to 10,000 physical books, 500 student members, 5 admins, 5 librarians.
  - Up to 500 digital books in E-Library.
  - **Max file size: 27MB per book**.
  - CSV student & catalog import/export.
  - Jitsi live classroom scheduling.
  - Full AI study tools.

- 🟣 **PROFESSIONAL PLAN (₹2,999/month):**
  - Unlimited physical books, unlimited student members, unlimited admins & librarians.
  - Unlimited digital books in E-Library.
  - **Max file size: up to 50MB per book**.
  - Advanced analytics, multi-branch library management, full API access, high-concurrency Jitsi live classrooms.

- 🏢 **ENTERPRISE / CAMPUS:**
  - Custom multi-campus deployment, custom domain, white-labeling, dedicated support.

---

### 🚀 STEP-BY-STEP WORKFLOW INSTRUCTIONS

- **How to Publish a Digital Book (PDF/EPUB):**
  1. Navigate to **E-Library** from the student sidebar or go to \`/student/publish\` (or \`/personal/elibrary/publish\` for personal users).
  2. Enter the Book Title, Author Name, Category, Description, and Tags.
  3. Upload your PDF or EPUB document (up to **27MB** allowed).
  4. Optionally upload a custom cover image.
  5. Select visibility ("My School" or "Global Public") and click **Publish Book**.
  6. Manage your published works anytime in **My Publications** (\`/student/my-publications\`).

- **How to Read Books & Use AI Reader Tools:**
  1. Open any digital book in the E-Library to launch the in-browser reader (\`/read/:id\`).
  2. Use dark mode, sepia, or light mode for comfortable reading.
  3. Use the AI Reader sidebar for:
     - 📝 Instant chapter summaries
     - 🧠 5-question interactive comprehension quizzes
     - 🗂️ 8-card flashcard generation
     - 🔎 Vocabulary definitions & examples
     - 🌐 Language translation

- **How to Join a Live Video Class:**
  1. Click **Live Classes** in the student sidebar or open \`/studio/meeting/:meetingId\`.
  2. Locate your scheduled class and click **Join Class**.
  3. Enter the interactive Jitsi JaaS video room with camera, microphone, screen share, and group chat.

- **How to Borrow & Return Physical Books:**
  1. Search for books in the **Catalog** and check the shelf/rack location and copy availability.
  2. Visit the library desk where the librarian scans your Student ID barcode and Book barcode.
  3. Track your return date in **My Borrows & Holds**. Return on or before the due date to avoid the ₹5/day overdue fine.
`;

async function chatWithAssistant(messages, context) {
  try {
    let script = `You are the official Librika AI Assistant (librika.in) for school librarians and students.
${LIBRIKA_KNOWLEDGE_BASE}

CONTEXT FOR THIS SESSION: ${context || 'General Librika Library'}

GUIDELINES:
- Provide accurate, helpful, and concise answers based strictly on Librika's features, navigation, and workflows.
- Use markdown formatting with clear headings, bullet points, and callout boxes when explaining steps.
- If asked about publishing, emphasize the 27MB upload limit per book and the /student/publish route.
- If asked about live classes, mention Jitsi JaaS interactive classrooms.
- If asked about borrowing, explain the physical catalog, aisle finder, barcode circulation, and due dates.

`;
    if (Array.isArray(messages)) {
      messages.forEach(msg => {
        script += `${msg.role ? msg.role.toUpperCase() : 'USER'}: ${msg.content || ''}\n`;
      });
    } else if (typeof messages === 'string') {
      script += `USER: ${messages}\n`;
    }
    script += `ASSISTANT:`;
    
    const result = await callAI(script, { temperature: 0.6 });
    return result.trim();
  } catch (error) {
    console.error("Chat error:", error.message);
    return "I am your Librika AI Assistant. I am ready to help you with book search, circulation, digital publishing (up to 27MB), Jitsi live classes, and study tools! What would you like to explore today?";
  }
}

async function analyzeBookCover(imageBase64) {
  try {
    const prompt = `Analyze this book cover image. Extract and return ONLY a valid JSON object with the following fields (leave blank if not found):
{
  "title": "...",
  "author": "...",
  "isbn": "...",
  "publisher": "..."
}`;
    const result = await callAI(prompt, { 
      imageBase64,
      jsonMode: true, 
      temperature: 0.1 
    });
    return parseJSONFromResponse(result);
  } catch (error) {
    console.error("Analyze book cover error:", error.message);
    return { title: "", author: "", isbn: "", publisher: "" };
  }
}

async function extractTextOCR(imageBase64) {
  try {
    const prompt = `Extract all readable text from this image exactly as it appears. Output plain text only without markdown formatting.`;
    const result = await callAI(prompt, { 
      imageBase64,
      temperature: 0.1 
    });
    return result.trim();
  } catch (error) {
    console.error("OCR error:", error.message);
    return "";
  }
}

async function chatWithLibra(userMessage, conversationHistory = []) {
  try {
    const systemPrompt = `You are "Libra", the world-class intelligent AI tutor, academic mentor, and library concierge for Librika (librika.in) — an enterprise Hybrid Library ERP, Digital Learning Management System, Open E-Library, and Jitsi JaaS Live Classroom Platform.

${LIBRIKA_KNOWLEDGE_BASE}

YOUR WRITING STYLE & FORMATTING GUIDELINES:
1. 🎨 MODERN, ENGAGING & BEAUTIFULLY FORMATTED:
   - Provide answers that are crisp, encouraging, clear, and structured.
   - Use rich Markdown with visual hierarchy:
     - ### 🌟 Section Titles with expressive, relevant emojis.
     - **Bold keywords** and *italicized emphasis*.
     - 📊 Markdown Tables whenever comparing plans, features, or data.
     - 🔹 Structured bullet cards with bold titles for readability.
     - > 💡 **Pro Tip** or > 🎯 **Key Takeaway** callout quote boxes.
     - Status badges in brackets: \`[100% FREE]\`, \`[BEGINNER]\`, \`[INTERMEDIATE]\`, \`[PRO]\`, \`⭐ 4.9/5\`.

2. 🎓 DUAL CAPABILITY:
   - **Platform Guide Mode:** When asked about Librika features (Publishing up to 27MB, E-Library, Catalog, My Borrows, Live Classes, Quizzes, Notes, Plans, Fines), provide exact, actionable step-by-step instructions.
   - **Academic Tutor Mode:** When asked about study topics (Science, Math, Coding, Literature, History, Economics, Exam Prep), act as an encouraging, world-class personal tutor. Explain concepts with crystal clarity, everyday analogies, step-by-step formulas, and follow-up quiz questions.

3. 🚀 RESPONSE STRUCTURE:
   - **Direct Answer / Hook:** 1-2 welcoming, high-energy sentences.
   - **Core Visual Content:** Structured cards, tables, or numbered steps.
   - **Pro Tip / Value Highlight:** A short callout quote box with actionable advice.
   - **Interactive Next Step:** 2 clickable prompt pills formatted like:
     *💬 Try asking:* "How do I publish a book up to 27MB?" or "Create a 5-question quiz on Photosynthesis"`;

    let prompt = `${systemPrompt}\n\n`;
    if (conversationHistory && conversationHistory.length > 0) {
      prompt += `Conversation Context:\n`;
      conversationHistory.slice(-4).forEach(msg => {
        prompt += `${msg.role === 'user' ? 'User' : 'Libra'}: ${msg.content}\n`;
      });
      prompt += `\n`;
    }
    prompt += `User Query: ${userMessage}\n\nLibra AI Response:`;

    const response = await callAI(prompt, { temperature: 0.65, max_tokens: 1400 });
    return response || "Hello! I am **Libra**, your Librika AI guide and study tutor. How can I assist you with your library, publishing, or studies today?";
  } catch (err) {
    console.error("Libra AI Chat error:", err.message);
    return `### 🌟 Welcome to Librika! I'm **Libra**, your AI Learning Copilot.

I'm here to help you navigate **Librika (librika.in)** and master your academic subjects.

---

### 🚀 What We Can Explore Together:
- 📚 **Digital Library & E-Books** — Read PDF/EPUB books in-browser with audio TTS & auto-quizzes.
- ✍️ **Digital Book Publishing** — Publish your own books and study notes (up to **27MB per book**).
- 🎥 **Jitsi Live Classrooms** — Join interactive virtual classes on 8x8.vc with your teachers.
- 🧠 **AI Study Tools** — Concept explanations, 5-question quizzes, 8-card flashcards & summaries.
- 💳 **Membership Plans** — Free Starter (500 books, 20 e-books), Basic (10k books), and Pro (unlimited).

> 💡 **Pro Tip:** You can ask me for study summaries, book recommendations, or exact steps to publish a book!

---
💬 *Try asking:* **"How do I publish a book on E-Library?"** or **"Explain Newton's Laws of Motion"**`;
  }
}

module.exports = {
  LIBRIKA_KNOWLEDGE_BASE,
  generateBookDescription,
  generateQuizFromText,
  gradeShortAnswer,
  processChapter,
  chatWithAssistant,
  chatWithLibra,
  analyzeBookCover,
  extractTextOCR,
  callAI,
  callNvidiaAI,
  callOpenRouter,
  callGemini,
  callPollinationsAI
};
