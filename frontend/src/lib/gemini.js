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
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Gemini API key not configured. Add REACT_APP_GEMINI_API_KEY to your Vercel environment variables."
    );
  }

  const { base64, mimeType } = await fetchImageAsBase64(imageUrl);

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-8b"];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([
        { inlineData: { data: base64, mimeType } },
        MARKETING_PROMPT,
      ]);

      let text = result.response.text().trim();

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

      return JSON.parse(text);
    } catch (err) {
      lastError = err;
      // Try next model
    }
  }

  throw lastError;
}
