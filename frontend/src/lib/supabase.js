import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[AdCoda] Supabase credentials missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env"
  );
}

/**
 * safeFetch — wraps the global fetch and pre-reads every response body into
 * a plain string.  It then returns a plain object that mimics the Fetch
 * Response interface but whose .json() / .text() / .arrayBuffer() methods
 * always serve the cached string, so they can be called any number of times
 * without hitting "body stream already read".
 *
 * This fixes a Supabase JS v2 SDK bug where the SDK internally reads the
 * error-response body more than once when using the newer sb_publishable_*
 * key format.
 */
const safeFetch = async (input, init) => {
  const response = await fetch(input, init);

  // Pre-read the entire body once into a string buffer.
  let cachedText = "";
  try {
    cachedText = await response.text();
  } catch {
    // If the body read fails (e.g. empty body), keep cachedText as "".
  }

  // Return a Response-alike plain object backed by the cached string.
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    redirected: response.redirected,
    type: response.type,
    url: response.url,
    bodyUsed: false,

    clone() {
      // Return a fresh copy so the Supabase SDK's own clone() calls also work.
      return {
        ...this,
        bodyUsed: false,
        clone() {
          return { ...this };
        },
      };
    },

    async text() {
      return cachedText;
    },

    async json() {
      if (!cachedText || !cachedText.trim()) return {};
      try {
        return JSON.parse(cachedText);
      } catch {
        // Supabase occasionally returns non-JSON on auth errors (HTML error pages, etc.)
        // Return empty object — the SDK falls back to the HTTP status for error info.
        return {};
      }
    },

    async arrayBuffer() {
      return new TextEncoder().encode(cachedText).buffer;
    },

    async blob() {
      return new Blob([cachedText], { type: "application/json" });
    },
  };
};

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      fetch: safeFetch,
    },
  }
);
