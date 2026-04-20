import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

const MARKETING_PROMPT = `You are a marketing analyst. Analyze this marketing/advertising image and extract the following information.
Return ONLY a valid JSON object with exactly these fields (no markdown, no extra text):
{
  "extracted_text": "All visible text in the image verbatim",
  "marketing_formula": "Primary formula used - one of: AIDA, PAS, BAB, FAB, PPPP, 4Ps, or a brief description if none apply",
  "industry": "Specific industry (e.g., SaaS, E-commerce, Health & Wellness, Finance, Real Estate, Fashion, Food & Beverage, Education, Travel)",
  "emotional_hook": "Primary emotional trigger (e.g., Fear of Missing Out, Social Proof, Aspirational Identity, Urgency, Trust & Authority, Curiosity, Pain Point)",
  "category": "Content type (e.g., Social Ad, Email Newsletter, Landing Page, Banner Ad, Print Ad, Video Script, Sales Page)"
}`;

/**
 * Convert a Blob/File to a base64 data string.
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Fetch an image from a public URL and return it as base64 + mimeType.
 * Falls back gracefully if the fetch fails.
 */
async function fetchImageAsBase64(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const blob = await response.blob();
  const base64DataUrl = await blobToBase64(blob);
  const mimeType = blob.type || "image/jpeg";
  // base64DataUrl is like "data:image/jpeg;base64,/9j/4AAQ..."
  const base64 = base64DataUrl.split(",")[1];
  return { base64, mimeType };
}

/**
 * Analyze a marketing image using Google Gemini AI.
 * Tries gemini-1.5-flash first, falls back to gemini-1.0-pro-vision.
 *
 * @param {string} imageUrl - Public URL of the image to analyze
 * @returns {Promise<Object>} - { extracted_text, marketing_formula, industry, emotional_hook, category }
 */
export async function analyzeMarketingImage(imageUrl) {
  // #region agent log
  const _dbg = (msg, data) => {
    console.log(`[Gemini] ${msg}`, data ?? "");
    fetch('http://127.0.0.1:7311/ingest/f5827246-f5c5-4bb6-9521-5c6a1f81f80c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c4c027'},body:JSON.stringify({sessionId:'c4c027',location:'gemini.js',message:msg,data:data??null,timestamp:Date.now()})}).catch(()=>{});
  };
  // #endregion

  // #region agent log
  _dbg('analyzeMarketingImage called', { imageUrl, hasApiKey: !!GEMINI_API_KEY, keyPrefix: GEMINI_API_KEY ? GEMINI_API_KEY.slice(0,8)+'...' : 'MISSING' });
  // #endregion

  if (!GEMINI_API_KEY) {
    // #region agent log
    _dbg('ERROR: API key missing');
    // #endregion
    throw new Error(
      "Gemini API key not configured. Add REACT_APP_GEMINI_API_KEY to your Vercel environment variables."
    );
  }

  // #region agent log
  _dbg('Fetching image as base64', { imageUrl });
  // #endregion
  let base64, mimeType;
  try {
    ({ base64, mimeType } = await fetchImageAsBase64(imageUrl));
    // #region agent log
    _dbg('Image fetched OK', { mimeType, base64Length: base64?.length });
    // #endregion
  } catch (fetchErr) {
    // #region agent log
    _dbg('ERROR fetching image', { error: fetchErr.message });
    // #endregion
    throw fetchErr;
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-8b"];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      // #region agent log
      _dbg('Trying model', { modelName });
      // #endregion
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([
        { inlineData: { data: base64, mimeType } },
        MARKETING_PROMPT,
      ]);

      let text = result.response.text().trim();
      // #region agent log
      _dbg('Gemini responded', { modelName, textSnippet: text.slice(0, 120) });
      // #endregion

      // Strip markdown code fences if present
      if (text.includes("```")) {
        const parts = text.split("```");
        for (const part of parts) {
          const cleaned = part.startsWith("json") ? part.slice(4).trim() : part.trim();
          if (cleaned.startsWith("{")) {
            text = cleaned;
            break;
          }
        }
      }

      const parsed = JSON.parse(text);
      // #region agent log
      _dbg('Parse OK', parsed);
      // #endregion
      return parsed;
    } catch (err) {
      // #region agent log
      _dbg('Model failed', { modelName, error: err.message });
      // #endregion
      lastError = err;
    }
  }

  throw lastError;
}
