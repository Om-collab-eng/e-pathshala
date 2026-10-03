/**
 * services/groqBookAgent.js
 * Dedicated AI Agent for Book Cover Extraction using Groq AI (with OpenRouter/NVIDIA fallback).
 * Accurately analyzes Front and Back cover text to extract complete book metadata into structured JSON.
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const https = require('https');
require('dotenv').config();

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim();
const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY || '').trim();
const NVIDIA_API_KEY = (process.env.NVIDIA_API_KEY || '').trim();

/**
 * Call Groq Cloud AI with ultra-low latency (Llama 3.3 70B Versatile)
 */
async function callGroqAPI(prompt, options = {}) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured in environment.');
  }

  const model = options.model || 'llama-3.3-70b-versatile';

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert AI Librarian and Book Cataloger. Analyze OCR text and images from book covers and return ONLY valid, clean JSON with zero markdown or conversational text.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 1500
    },
    {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      httpsAgent,
      timeout: 8000 // 8s fast timeout
    }
  );

  if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
    return response.data.choices[0].message.content.trim();
  }
  throw new Error('Invalid response from Groq API');
}

/**
 * Call OpenRouter with Llama 3.3 70B (Fallback 1)
 */
async function callOpenRouterFallback(prompt, options = {}) {
  if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY not configured');

  const models = ['meta-llama/llama-3.3-70b-instruct', 'google/gemini-2.0-flash-001', 'openai/gpt-3.5-turbo'];
  
  let lastErr = null;
  for (const model of models) {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert AI Librarian and Cataloger. Output ONLY a valid JSON object matching the requested schema.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 1500
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
          },
          httpsAgent,
          timeout: 10000
        }
      );

      if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
        return response.data.choices[0].message.content.trim();
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('OpenRouter fallback failed');
}

/**
 * Call NVIDIA NIM with Llama 3.1 70B (Fallback 2)
 */
async function callNvidiaFallback(prompt) {
  if (!NVIDIA_API_KEY) throw new Error('NVIDIA_API_KEY not configured');

  const response = await axios.post(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    {
      model: 'meta/llama-3.1-70b-instruct',
      messages: [
        { role: 'system', content: 'You are an expert AI Librarian and Cataloger. Output ONLY valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 1500
    },
    {
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      httpsAgent,
      timeout: 10000
    }
  );

  if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
    return response.data.choices[0].message.content.trim();
  }
  throw new Error('NVIDIA API fallback failed');
}

/**
 * Clean & Parse JSON from AI response safely
 */
function cleanAndParseJSON(text) {
  if (!text) return null;
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').replace(/```/gi, '').trim();
  try {
    return JSON.parse(clean);
  } catch (err) {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e) {}
    }
    return null;
  }
}

/**
 * Google Lens Multimodal Vision AI Model Runner
 * Uses Gemini 2.5 Flash Lite / Gemini 2.5 Flash via OpenRouter for human-level visual understanding of book covers
 */
async function callGoogleLensVisionAPI(params = {}) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured for Google Lens Vision AI.');
  }

  const {
    frontImageBase64 = null,
    backImageBase64 = null,
    frontDiskPath = null,
    backDiskPath = null,
    candidates = {}
  } = params;

  let fUrl = null;
  if (frontImageBase64 && frontImageBase64.includes('base64,')) {
    fUrl = frontImageBase64;
  } else if (frontDiskPath && fs.existsSync(frontDiskPath)) {
    const fBuf = fs.readFileSync(frontDiskPath);
    fUrl = `data:image/jpeg;base64,${fBuf.toString('base64')}`;
  }

  if (!fUrl) {
    throw new Error('No valid front cover image found for Google Lens Vision analysis.');
  }

  let bUrl = null;
  if (backImageBase64 && backImageBase64.includes('base64,')) {
    bUrl = backImageBase64;
  } else if (backDiskPath && fs.existsSync(backDiskPath)) {
    const bBuf = fs.readFileSync(backDiskPath);
    bUrl = `data:image/jpeg;base64,${bBuf.toString('base64')}`;
  }

  const prompt = `You are Google Lens AI for Book Recognition and Library Cataloging.
Analyze the attached book cover image(s) with human-level visual understanding.

INSTRUCTIONS:
1. Identify the Title (exact book title, properly formatted, omit author name and publisher logos from title).
2. Identify Subtitle if present.
3. Identify Author(s) or Editor(s).
4. Identify Publisher or Publishing House (e.g. Penguin, Pearson, O'Reilly, Oxford, NCERT, Vyay, etc.).
5. Extract ISBN (10-digit or 13-digit) from the barcode, back cover numbers, or copyright area.
6. Extract MRP / Printed Price (e.g. ₹299, $19.99).
7. Extract Synopsis / blurb summary from the back cover text.
8. Identify Category / Subject (e.g. Self-help, Fiction, Science, Computer Science, Literature, etc.).
9. MIRROR / ORIENTATION CHECK: If the text in the image is horizontally mirrored or reversed (common with webcam reflections), automatically un-reverse and read the correct words!

Return ONLY a clean JSON object in this exact schema (no markdown formatting, no backticks):
{
  "title": "Exact Book Title",
  "subtitle": "",
  "author": "Author Name(s)",
  "publisher": "Publisher Name",
  "isbn": "978...",
  "price": "299",
  "publication_year": "",
  "edition": "",
  "language": "English",
  "category": "Self-help",
  "synopsis": "Concise summary...",
  "confidence_score": 98
}`;

  const userContents = [
    { type: 'text', text: prompt },
    { type: 'image_url', image_url: { url: fUrl } }
  ];

  if (bUrl) {
    userContents.push({
      type: 'image_url',
      image_url: { url: bUrl }
    });
  }

  const visionModels = [
    'google/gemini-2.5-flash-lite',
    'google/gemini-2.5-flash',
    'google/gemini-3.5-flash-lite',
    'qwen/qwen3.8-27b:free'
  ];

  let lastErr = null;
  for (const model of visionModels) {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are Google Lens AI Book Cataloger. Output ONLY valid JSON matching the requested schema.'
            },
            { role: 'user', content: userContents }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 1500
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
          },
          httpsAgent,
          timeout: 12000
        }
      );

      if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
        const text = response.data.choices[0].message.content.trim();
        const parsed = cleanAndParseJSON(text);
        if (parsed && (parsed.title || parsed.author || parsed.isbn)) {
          return {
            parsed,
            modelUsed: `Google Lens (${model.split('/')[1] || model})`,
            rawText: text
          };
        }
      }
    } catch (err) {
      console.warn(`[Google Lens Vision] Model ${model} failed:`, err.response ? err.response.status + ' ' + JSON.stringify(err.response.data) : err.message);
      lastErr = err;
    }
  }

  throw lastErr || new Error('All Google Lens vision models failed.');
}

/**
 * Core Agent Function: Analyze Front & Back Cover Text + Regex Candidates
 * @param {Object} params - { frontText, backText, candidates, frontImageBase64, backImageBase64, frontDiskPath, backDiskPath }
 * @returns {Promise<Object>} Structured Book Catalog Metadata
 */
async function analyzeBookWithGroqAgent(params = {}) {
  const {
    frontText = '',
    backText = '',
    candidates = {}
  } = params;

  // 1. PRIMARY: Try Google Lens Multimodal Vision AI if images are provided
  if (OPENROUTER_API_KEY && (
    (params.frontImageBase64 && params.frontImageBase64.includes('base64,')) ||
    (params.frontDiskPath && fs.existsSync(params.frontDiskPath))
  )) {
    try {
      const visionResult = await callGoogleLensVisionAPI(params);
      if (visionResult && visionResult.parsed) {
        const p = visionResult.parsed;
        const normalizedIsbn = p.isbn ? String(p.isbn).replace(/[^0-9X]/gi, '') : ((candidates.isbns && candidates.isbns[0]) || '');
        const normalizedPrice = p.price ? String(p.price).replace(/[^0-9.]/g, '') : ((candidates.prices && candidates.prices[0]) || '');

        const entity = {
          title: p.title || '',
          subtitle: p.subtitle || '',
          author: p.author || '',
          publisher: p.publisher || '',
          edition: p.edition || (candidates.editions && candidates.editions[0]) || '',
          publication_year: p.publication_year || (candidates.years && candidates.years[0]) || '',
          language: p.language || 'English',
          isbn: normalizedIsbn,
          price: normalizedPrice,
          class: p.class || '',
          subject: p.category || p.subject || 'General',
          synopsis: p.synopsis || '',
          confidence_score: p.confidence_score || 95,
          provider_used: visionResult.modelUsed || 'Google Lens AI (Gemini 2.5 Vision)',
          missing_fields: []
        };

        const critical = ['title', 'author', 'isbn', 'publisher', 'price', 'synopsis'];
        entity.missing_fields = critical.filter(f => !entity[f] || String(entity[f]).trim() === '');
        return entity;
      }
    } catch (vErr) {
      console.warn('[AI Agent] Google Lens Vision failed, falling back to text AI:', vErr.message);
    }
  }

  // 2. FALLBACK: Text-Based AI Analysis using OCR output
  const candidateSummary = [
    candidates.isbns && candidates.isbns.length ? `Detected ISBN candidates: ${candidates.isbns.join(', ')}` : '',
    candidates.prices && candidates.prices.length ? `Detected Price/MRP candidates: ₹${candidates.prices.join(', ₹')}` : '',
    candidates.years && candidates.years.length ? `Detected Year candidates: ${candidates.years.join(', ')}` : '',
    candidates.editions && candidates.editions.length ? `Detected Edition candidates: ${candidates.editions.join(', ')}` : ''
  ].filter(Boolean).join('\n');

  const prompt = `Analyze the following extracted book cover text and candidates.
Map all detected information into this exact JSON structure:
{
  "title": "Exact Title of the book (clear, capitalized)",
  "subtitle": "Subtitle if present or empty string",
  "author": "Author name(s) or Editor(s)",
  "publisher": "Publishing House (e.g. Oxford, NCERT, Pearson, S. Chand, Penguin)",
  "edition": "Edition (e.g. 1st Edition, 2nd Edition, Revised)",
  "publication_year": "4-digit year (e.g. 2024)",
  "language": "Language of the book (e.g. English, Hindi, Sanskrit, Regional)",
  "isbn": "10 or 13 digit numeric ISBN without hyphens",
  "price": "Printed MRP or price number (e.g. 450)",
  "class": "School class/grade if applicable (e.g. Class 10, Grade 9, College, General)",
  "subject": "Academic subject or category (e.g. Mathematics, Science, Literature, History, Computer Science)",
  "synopsis": "A concise 2 to 4 sentence summary of the book content extracted from the back cover blurb or front teaser",
  "confidence_score": 90,
  "missing_fields": []
}

Rules:
1. If a field is not detected from the text or candidates, leave it as an empty string "".
2. In "missing_fields", list any critical fields that are currently empty (e.g. ["isbn", "price", "publisher", "synopsis"]).
3. Ensure the title does not include promotional slogans or author names.

FRONT COVER TEXT:
"""
${frontText.slice(0, 3000)}
"""

BACK COVER TEXT:
"""
${backText.slice(0, 3000)}
"""

REGEX CANDIDATES:
${candidateSummary || 'None'}
`;

  let responseText = null;
  let providerUsed = 'None';

  // 1. Try Groq AI
  if (GROQ_API_KEY) {
    try {
      responseText = await callGroqAPI(prompt);
      providerUsed = 'Groq (Llama 3.3 70B)';
    } catch (groqErr) {
      console.warn('[AI Agent] Groq attempt failed:', groqErr.message);
    }
  }

  // 2. Try OpenRouter Fallback
  if (!responseText && OPENROUTER_API_KEY) {
    try {
      responseText = await callOpenRouterFallback(prompt);
      providerUsed = 'OpenRouter (Llama 3.3)';
    } catch (orErr) {
      console.warn('[AI Agent] OpenRouter fallback failed:', orErr.message);
    }
  }

  // 3. Try NVIDIA Fallback
  if (!responseText && NVIDIA_API_KEY) {
    try {
      responseText = await callNvidiaFallback(prompt);
      providerUsed = 'NVIDIA NIM (Llama 3.1 70B)';
    } catch (nvErr) {
      console.warn('[AI Agent] NVIDIA fallback failed:', nvErr.message);
    }
  }

  const parsed = cleanAndParseJSON(responseText) || {};

  // Build clean normalized entity
  const result = {
    title: parsed.title || '',
    subtitle: parsed.subtitle || '',
    author: parsed.author || '',
    publisher: parsed.publisher || '',
    edition: parsed.edition || (candidates.editions && candidates.editions[0]) || '',
    publication_year: parsed.publication_year || (candidates.years && candidates.years[0]) || '',
    language: parsed.language || 'English',
    isbn: parsed.isbn ? String(parsed.isbn).replace(/[^0-9X]/gi, '') : ((candidates.isbns && candidates.isbns[0]) || ''),
    price: parsed.price ? String(parsed.price).replace(/[^0-9.]/g, '') : ((candidates.prices && candidates.prices[0]) || ''),
    class: parsed.class || '',
    subject: parsed.subject || 'General',
    synopsis: parsed.synopsis || '',
    confidence_score: parsed.confidence_score || 85,
    provider_used: providerUsed,
    missing_fields: []
  };

  // Compute missing fields dynamically
  const critical = ['title', 'author', 'isbn', 'publisher', 'price', 'synopsis'];
  result.missing_fields = critical.filter(f => !result[f] || String(result[f]).trim() === '');

  return result;
}

module.exports = {
  analyzeBookWithGroqAgent,
  callGoogleLensVisionAPI,
  callGroqAPI
};
