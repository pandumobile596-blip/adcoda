import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

const ANALYSIS_PROMPT = `You are an elite advertising analyst trained on high-performing global ads.

Analyze this marketing/advertising image and return a complete expert breakdown.

Return ONLY a valid JSON object with exactly these fields. No markdown. No code blocks. No extra text. Just raw JSON:
{
  "hook": "What visually or emotionally grabs attention in the first 3 seconds — be specific",
  "primary_emotion": "The dominant emotion triggered (e.g. nostalgia, desire, fear of missing out, status, joy, urgency)",
  "target_audience": "Specific audience — include age range, lifestyle, interests, pain points",
  "industry": "Specific industry (e.g. Food & Beverage, SaaS, E-commerce, Health & Wellness, Finance, Fashion, Travel, Education)",
  "marketing_objective": "Primary goal — Brand Awareness, Direct Conversion, Retention, Lead Generation, or Engagement",
  "formula_name": "One of: AIDA, PAS, BAB, FAB, Emotional Branding, Storytelling, Social Proof, Fear Appeal, or Aspirational",
  "formula_explanation": "2-3 sentences explaining WHY this formula fits and exactly how it is applied in this ad",
  "why_it_works": "Cover: (1) psychological triggers used, (2) visual strategy and composition, (3) timing or seasonality if relevant",
  "weakness": "Honest critique — what is missing, unclear, or could be stronger. Never say 'none'",
  "how_to_adapt": "Give 3 specific new hook variations + 2-3 product categories or niches that can copy this concept for dropshipping or DTC brands",
  "final_summary": "One powerful insight a marketer can apply immediately to their next campaign",
  "extracted_text": "All visible text in the image copied verbatim, or 'No visible text' if none",
  "category": "One of: Social Ad, Email Newsletter, Landing Page, Banner Ad, Print Ad, Video Script, Sales Page, or Other"
}`;

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function fetchImageAsBase64(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
  const blob = await response.blob();
  const base64DataUrl = await blobToBase64(blob);
  const mimeType = blob.type || "image/jpeg";
  const base64 = base64DataUrl.split(",")[1];
  return { base64, mimeType };
}

function parseGeminiJson(text) {
  let cleaned = text.trim();
  // Strip markdown code fences
  if (cleaned.includes("```")) {
    const parts = cleaned.split("```");
    for (const part of parts) {
      const p = part.startsWith("json") ? part.slice(4).trim() : part.trim();
      if (p.startsWith("{")) { cleaned = p; break; }
    }
  }
  // Find first { to last }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1);
  return JSON.parse(cleaned);
}

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
    throw new Error("REACT_APP_GEMINI_API_KEY is not set in Vercel environment variables.");
  }

  // #region agent log
  _dbg('Fetching image', { imageUrl });
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
        ANALYSIS_PROMPT,
      ]);
      const text = result.response.text();
      // #region agent log
      _dbg('Gemini responded', { modelName, snippet: text.slice(0, 150) });
      // #endregion
      const parsed = parseGeminiJson(text);
      // #region agent log
      _dbg('Parse OK', { formula: parsed.formula_name, industry: parsed.industry });
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
