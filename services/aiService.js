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
 * 1. Call NVIDIA NIM API (Fastest Vision & OCR)
 * Models:
 * - Vision / OCR: meta/llama-3.2-11b-vision-instruct, minimaxai/minimax-m3
 * - Fast Text: meta/llama-3.1-8b-instruct, nvidia/llama-3.1-nemotron-70b-instruct
 */
async function callNvidiaAI(prompt, options = {}) {
  if (!nvidiaKey) throw new Error("NVIDIA API key not configured");

  const isVision = !!options.imageBase64;
  const model = options.model || (isVision ? "meta/llama-3.2-11b-vision-instruct" : "mistralai/mistral-nemo-12b-instruct");

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
    temperature: options.temperature !== undefined ? options.temperature : 0.2,
    top_p: options.top_p !== undefined ? options.top_p : 0.7,
    max_tokens: options.max_tokens || 1024
  }, {
    headers: {
      "Authorization": `Bearer ${nvidiaKey}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    timeout: 20000
  });

  if (response.data && response.data.choices && response.data.choices[0]) {
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
  const model = options.model || (isVision ? "meta-llama/llama-3.2-11b-vision-instruct:free" : "meta-llama/llama-3.3-70b-instruct");

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
    temperature: options.temperature !== undefined ? options.temperature : 0.2,
    max_tokens: options.max_tokens || 2048
  }, {
    headers: {
      "Authorization": `Bearer ${openrouterKey}`,
      "Content-Type": "application/json"
    },
    timeout: 20000
  });

  if (response.data && response.data.choices && response.data.choices[0]) {
    return response.data.choices[0].message.content.trim();
  }
  throw new Error("Invalid response format from OpenRouter API");
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
      responseMimeType: options.jsonMode ? "application/json" : "text/plain",
      temperature: options.temperature !== undefined ? options.temperature : 0.7,
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
 * Unified AI Router — prioritizes NVIDIA API (fastest), then OpenRouter, then Gemini
 */
async function callAI(prompt, options = {}) {
  // 1. Try NVIDIA API
  if (nvidiaKey) {
    try {
      return await callNvidiaAI(prompt, options);
    } catch (err) {
      console.warn("NVIDIA API attempt failed, trying fallback:", err.message);
    }
  }

  // 2. Try OpenRouter API
  if (openrouterKey) {
    try {
      return await callOpenRouter(prompt, options);
    } catch (err) {
      console.warn("OpenRouter API attempt failed, trying fallback:", err.message);
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
      console.warn("Gemini API attempt failed:", err.message);
    }
  }

  throw new Error("All AI providers (NVIDIA, OpenRouter, Gemini) failed or are missing API keys.");
}

/**
 * Safely parse JSON from LLM output markdown
 */
function parseJSONFromResponse(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
    return JSON.parse(cleaned);
  }
}

/**
 * AI Domain Capabilities
 */

async function generateBookDescription(title, author, isbn) {
  try {
    const prompt = `Write a 3-sentence description for the book "${title}" by ${author || 'an unknown author'}${isbn ? ' (ISBN: ' + isbn + ')' : ''}. Make it engaging and suitable for a library catalog.`;
    const result = await callAI(prompt, { temperature: 0.7 });
    return result.trim();
  } catch (error) {
    console.error("Book description AI error:", error.message);
    return `Description for ${title} is currently unavailable.`;
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

Example:
{"score": 80, "feedback": "Good job, but you missed a key detail."}
`;
    const result = await callAI(prompt, { jsonMode: true, temperature: 0.2 });
    return parseJSONFromResponse(result);
  } catch (error) {
    console.error("Grade short answer error:", error.message);
    return { score: 0, feedback: "Error grading answer." };
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
    },
    {
      "type": "tf",
      "question": "...",
      "options": ["True", "False"],
      "correct_index": 0
    },
    {
      "type": "fib",
      "question": "...",
      "correct_answer": "..."
    },
    {
      "type": "sa",
      "question": "...",
      "suggested_answer": "..."
    }
  ]
}

Make sure there are at least 3 vocabulary items, 3 Q&As, and 4 quiz questions (one of each type).
Chapter Text:
${chapterText.slice(0, 12000)}
`;
    const result = await callAI(prompt, { jsonMode: true, temperature: 0.3 });
    return parseJSONFromResponse(result);
  } catch (error) {
    console.error("Process chapter error:", error.message);
    return { summary: "Error processing chapter.", vocabulary: [], qna: [], quiz: [] };
  }
}

async function chatWithAssistant(messages, context) {
  try {
    let script = `Context: ${context}\n\n`;
    messages.forEach(msg => {
      script += `${msg.role.toUpperCase()}: ${msg.content}\n`;
    });
    script += `\nASSISTANT:`;
    
    const result = await callAI(script, { temperature: 0.7 });
    return result.trim();
  } catch (error) {
    console.error("Chat error:", error.message);
    return "I'm having trouble thinking right now. Please try again later.";
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

module.exports = {
  generateBookDescription,
  generateQuizFromText,
  gradeShortAnswer,
  processChapter,
  chatWithAssistant,
  analyzeBookCover,
  extractTextOCR,
  callAI,
  callNvidiaAI,
  callOpenRouter,
  callGemini
};
