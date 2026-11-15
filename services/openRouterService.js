import axios from "axios";
import serverConfig from "../config/serverConfig.js";
import { sanitizeModel, DEFAULT_MODEL } from "../config/allowedModels.js";

/**
 * OpenRouter Unified Client with Whitelist Enforcement & Resilient Fallbacks
 */
export const callOpenRouter = async ({
  messages,
  temperature = 0.2,
  max_tokens = 4000,
  requestedModel = null,
  timeout = 50000,
}) => {
  // Strictly enforce the whitelist of permitted models
  const primaryModel = sanitizeModel(requestedModel || process.env.AI_MODEL || DEFAULT_MODEL);
  
  // Fallback to default allowed model if primary isn't default, otherwise another free allowed model
  const fallbackModel = primaryModel === DEFAULT_MODEL ? "inclusionai/ling-3.2-flash:free" : DEFAULT_MODEL;

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

  // Attempt 1: Whitelisted Primary Model
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

    // If already using fallback model, try ultimate safe fallback openrouter/free
    if (primaryModel === fallbackModel) {
      console.log(`[OpenRouter] Attempting emergency free router fallback...`);
      try {
        const emergencyRes = await makeRequest("openrouter/free", Math.min(max_tokens, 4000));
        const content = emergencyRes.data?.choices?.[0]?.message?.content;
        if (content) {
          return { content, modelUsed: "openrouter/free" };
        }
      } catch (err) {
        throw primaryErr;
      }
    }

    // Attempt 2: Whitelisted Fallback Model
    console.log(`[OpenRouter] Falling back to resilient model: "${fallbackModel}"...`);
    try {
      const fallbackRes = await makeRequest(fallbackModel, Math.min(max_tokens, 4000));
      const content = fallbackRes.data?.choices?.[0]?.message?.content;
      if (content) {
        return { content, modelUsed: fallbackModel };
      }
      throw new Error("Empty completion from fallback model");
    } catch (fallbackErr) {
      console.error("[OpenRouter] Fallback model also failed:", fallbackErr.response?.data || fallbackErr.message);
      // Last-ditch emergency attempt with openrouter/free
      try {
        const emergencyRes = await makeRequest("openrouter/free", Math.min(max_tokens, 4000));
        const content = emergencyRes.data?.choices?.[0]?.message?.content;
        if (content) {
          return { content, modelUsed: "openrouter/free" };
        }
      } catch (emErr) {
        // Ignore emergency error, throw the fallback error
      }
      throw fallbackErr;
    }
  }
};
