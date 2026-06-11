/**
 * Safe fetch wrapper for Schooly AI
 * Automatically appends the user-defined Gemini API key header if available in localStorage.
 */
export async function schoolyFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // Deep copy/clone standard config to avoid mutating arguments in unexpected ways
  const customInit: RequestInit = init ? { ...init } : {};
  
  try {
    const key = localStorage.getItem("schooly_gemini_api_key");
    if (key && key.trim()) {
      // Setup headers dictionary
      const headersObj: Record<string, string> = {};
      
      // Copy existing headers
      if (customInit.headers) {
        if (typeof Headers !== "undefined" && customInit.headers instanceof Headers) {
          customInit.headers.forEach((val, key) => {
            headersObj[key] = val;
          });
        } else if (Array.isArray(customInit.headers)) {
          customInit.headers.forEach(([key, val]) => {
            headersObj[key] = val;
          });
        } else {
          Object.assign(headersObj, customInit.headers);
        }
      }
      
      // Inject header
      headersObj["X-Gemini-API-Key"] = key.trim();
      customInit.headers = headersObj;
    }
  } catch (e) {
    console.warn("[SAFE FETCH] localStorage read bypassed or failed in sandboxed mode:", e);
  }

  return fetch(input, customInit);
}
