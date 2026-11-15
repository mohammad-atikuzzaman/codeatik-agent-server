import axios from "axios";
import serverConfig from "../config/serverConfig.js";
import { sanitizeModel, DEFAULT_MODEL } from "../config/allowedModels.js";

/**
 * Resilient free fallback order
 */
const FALLBACK_CANDIDATES = [
  "particle-ai/particle-1:free",
  "nvidia/nemotron-3.5-super-vl:free",
  "baidu/ernie-5.5-flash-preview:free",
  "openrouter/free",
];

/**
 * OpenRouter Unified Client with Whitelist Enforcement & Resilient Reasoning Extraction
 */
export const callOpenRouter = async ({
  messages,
  temperature = 0.2,
  max_tokens = 4000,
  requestedModel = null,
  timeout = 50000,
}) => {
  const primaryModel = sanitizeModel(requestedModel || process.env.AI_MODEL || DEFAULT_MODEL);

  // Build trial queue without duplicate entries
  const trialQueue = [
    primaryModel,
    ...FALLBACK_CANDIDATES.filter((m) => m !== primaryModel),
  ];

  const headers = {
    Authorization: `Bearer ${serverConfig.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.CLIENT_URL || "https://codeatikagent.netlify.app",
    "X-Title": "CodeAtik Agent",
  };

  let lastError = null;

  for (let i = 0; i < trialQueue.length; i++) {
    const currentModel = trialQueue[i];
    const isPrimary = i === 0;

    try {
      if (!isPrimary) {
        console.log(`[OpenRouter Cascade] Trying fallback model: "${currentModel}"...`);
      }

      const res = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: currentModel,
          messages,
          temperature,
          max_tokens,
        },
        {
          headers,
          timeout,
        }
      );

      const message = res.data?.choices?.[0]?.message;
      let content = message?.content;

      // Extract from reasoning if content was omitted or placed in reasoning
      if ((!content || typeof content !== "string" || !content.trim()) && message?.reasoning) {
        if (
          message.reasoning.includes("<!DOCTYPE") ||
          message.reasoning.includes("```") ||
          message.reasoning.includes("<html") ||
          message.reasoning.includes("{")
        ) {
          content = message.reasoning;
        }
      }

      if (content && typeof content === "string" && content.trim().length > 0) {
        if (!isPrimary) {
          console.log(`[OpenRouter Cascade] Recovered successfully with model "${currentModel}"`);
        }
        return { content, modelUsed: currentModel };
      }

      console.warn(`[OpenRouter] Empty content from model "${currentModel}"`);
      lastError = new Error(`Empty content returned by model "${currentModel}"`);
    } catch (err) {
      const status = err.response?.status;
      const errorMsg = err.response?.data?.error?.message || err.message;
      console.warn(`[OpenRouter] Model "${currentModel}" failed (${status || "ERR"}): ${errorMsg}`);
      lastError = err;

      // If user hit 401 unauthorized (invalid key), stop cascade immediately
      if (status === 401) {
        throw new Error("Invalid OpenRouter API Key in configuration.");
      }
    }
  }

  throw lastError || new Error("Failed to generate content with available OpenRouter models");
};
