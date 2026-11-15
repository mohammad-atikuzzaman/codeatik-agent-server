import axios from "axios";
import serverConfig from "../config/serverConfig.js";

/**
 * OpenRouter Unified Client with Smart Fallbacks & Auto-Retry
 */
export const callOpenRouter = async ({
  messages,
  temperature = 0.2,
  max_tokens = 4000,
  requestedModel = null,
  timeout = 50000,
}) => {
  const primaryModel = requestedModel || process.env.AI_MODEL || "openrouter/free";
  const fallbackModel = "openrouter/free";

  const headers = {
    Authorization: `Bearer ${serverConfig.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.CLIENT_URL || "https://codeatikagent.netlify.app",
    "X-Title": "CodeAtik Agent",
  };

  const makeRequest = async (modelToUse, tokens) => {
    return await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: modelToUse,
        messages,
        temperature,
        max_tokens: tokens,
      },
      {
        headers,
        timeout,
      }
    );
  };

  // Attempt 1: Primary Model
  try {
    const res = await makeRequest(primaryModel, max_tokens);
    const content = res.data?.choices?.[0]?.message?.content;
    if (content) {
      return { content, modelUsed: primaryModel };
    }
    throw new Error("Empty completion from primary model");
  } catch (primaryErr) {
    const status = primaryErr.response?.status;
    const errorMsg = primaryErr.response?.data?.error?.message || primaryErr.message;
    console.warn(`[OpenRouter] Primary model "${primaryModel}" failed (${status || "ERR"}): ${errorMsg}`);

    // If already using fallback model, throw error
    if (primaryModel === fallbackModel) {
      throw primaryErr;
    }

    // Attempt 2: Smart Fallback to openrouter/free with safe token limits
    console.log(`[OpenRouter] Automatically falling back to resilient model: "${fallbackModel}"...`);
    try {
      const fallbackRes = await makeRequest(fallbackModel, Math.min(max_tokens, 4000));
      const content = fallbackRes.data?.choices?.[0]?.message?.content;
      if (content) {
        return { content, modelUsed: fallbackModel };
      }
      throw new Error("Empty completion from fallback model");
    } catch (fallbackErr) {
      console.error("[OpenRouter] Fallback model also failed:", fallbackErr.response?.data || fallbackErr.message);
      throw fallbackErr;
    }
  }
};
