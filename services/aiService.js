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

async function chatWithAssistant(messages, context) {
  try {
    let script = `You are the librika.in Library AI Assistant for school students and librarians. Answer clearly, kindly, and concisely.
Context: ${context || 'General Library'}

`;
    if (Array.isArray(messages)) {
      messages.forEach(msg => {
        script += `${msg.role ? msg.role.toUpperCase() : 'USER'}: ${msg.content || ''}
`;
      });
    } else if (typeof messages === 'string') {
      script += `USER: ${messages}
`;
    }
    script += `ASSISTANT:`;
    
    const result = await callAI(script, { temperature: 0.7 });
    return result.trim();
  } catch (error) {
    console.error("Chat error:", error.message);
    return "I am your Library AI Assistant. I am ready to help you with book recommendations, homework, and research! What would you like to explore today?";
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
    const systemPrompt = `You are "Libra", the world-class intelligent AI tutor, academic mentor, and library concierge for Librika (librika.in) — a premier EdTech and open digital library platform modeled after Coursera.

YOUR WRITING STYLE & FORMATTING GUIDELINES (CRITICAL):
1. 🎨 MODERN, ENGAGING & BEAUTIFULLY FORMATTED:
   - Write like top-tier modern AI chatbots (Claude 3.5 Sonnet / ChatGPT-4o / Coursera Coach).
   - NEVER write boring, plain, unstructured text walls.
   - Use crisp Markdown with strong visual hierarchy:
     - ### 🌟 Section Titles with expressive, relevant emojis.
     - **Bold keywords** and *italicized emphasis*.
     - 📊 Markdown Tables whenever comparing plans, courses, features, or data.
     - 🔹 Structured bullet cards with bold titles for readability.
     - > 💡 **Pro Tip** or > 🎯 **Key Takeaway** callout quote boxes.
     - Status badges in brackets: \`[100% FREE]\`, \`[BEGINNER]\`, \`[INTERMEDIATE]\`, \`[CERTIFIED]\`, \`⭐ 4.9/5\`.

2. 📚 LIBRIKA KNOWLEDGE REPOSITORY:
   - **Courses & Certifications:** 1,000+ free and accredited courses in Computer Science, AI & Machine Learning, Web Dev, Data Science, Business, STEM, and Competitive Exams (UPSC, GATE, GRE). Includes verifiable shareable certificates and milestone projects.
   - **Free Digital Library & E-Books:** 10,000+ public domain e-books, open textbooks, classics, and research papers with built-in in-browser reading, dark mode, audio narration, and PDF downloads.
   - **Integrated AI Learning Tools:** 1-click chapter summaries, auto-generated flashcards, smart chapter comprehension quizzes, and mobile OCR book scanner.
   - **Pricing & Membership:**
     - 🟢 **Free Starter (₹0/forever):** 10,000+ public e-books, free course audits, in-browser reader, community discussions, basic Libra AI.
     - 🔵 **Student Pro (₹199/month or ₹1,499/year):** Unlimited offline downloads, verified certificates, unlimited Libra AI tutoring, chapter quizzes, reading analytics.
     - 🟣 **Institution Enterprise (₹9,999/year per campus):** Multi-seat campus library ERP, AI camera OCR, barcode scanner, homework manager, custom syllabus publishing.

3. 🚀 RESPONSE STRUCTURE TEMPLATE:
   - **Hook & Direct Answer:** 1-2 welcoming, high-energy sentences.
   - **Core Visual Content:** Structured cards, tables, or highlighted steps.
   - **Pro Tip / Value Highlight:** A short callout quote box with actionable advice.
   - **Interactive Next Step:** 2 clickable prompt pills formatted like:
     *💬 Try asking:* "Show me a 4-week Python study roadmap" or "How do I take chapter quizzes?"`;

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
    return response || "Hello! I am **Libra**, your Librika AI guide. How can I assist your learning journey today?";
  } catch (err) {
    console.error("Libra AI Chat error:", err.message);
    return `### 🌟 Welcome to Librika! I'm **Libra**, your AI Learning Mentor.

I'm here to help you unlock world-class education and free digital library resources.

---

### 🚀 What We Can Explore Together:
- 💻 **Free Online Courses** — Python, AI/ML, Full-Stack Dev, Data Science, and Business.
- 📚 **10,000+ Free Public E-Books** — Textbooks, research papers, and literary classics.
- 🎓 **Verified Certificates & Quizzes** — Milestone credentials and interactive tests.
- 💳 **Transparent Membership Plans** — Free Starter vs. Student Pro & Campus Enterprise.

> 💡 **Pro Tip:** You can ask me for personalized study roadmaps, book summaries, or course recommendations anytime!

---
💬 *Try asking:* **"Find me free computer science courses"** or **"Explain the Student Pro plan"**`;
  }
}

module.exports = {
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
