/**
 * Whitelist of permitted OpenRouter models.
 * Only these models can be used by clients.
 */
export const ALLOWED_MODELS = [
  {
    id: "baidu/ernie-5.5-flash-preview:free",
    name: "ERNIE 5.5 Flash",
    badge: "Fast & Free",
    provider: "Baidu",
    isDefault: true,
  },
  {
    id: "inclusionai/ling-3.2-flash:free",
    name: "Ling 3.2 Flash",
    badge: "Free",
    provider: "InclusionAI",
  },
  {
    id: "thinkingmachines/inkling-2-small:free",
    name: "Inkling 2 Small",
    badge: "Lightweight",
    provider: "ThinkingMachines",
  },
  {
    id: "particle-ai/particle-1:free",
    name: "Particle 1",
    badge: "Agentic",
    provider: "Particle",
  },
  {
    id: "nvidia/nemotron-3.5-super-vl:free",
    name: "Nemotron 3.5 Super VL",
    badge: "Vision / Logic",
    provider: "NVIDIA",
  },
];

export const DEFAULT_MODEL = "baidu/ernie-5.5-flash-preview:free";

export const isModelAllowed = (modelId) => {
  if (!modelId || typeof modelId !== "string") return false;
  return ALLOWED_MODELS.some((m) => m.id === modelId.trim());
};

export const sanitizeModel = (requestedModel) => {
  if (isModelAllowed(requestedModel)) {
    return requestedModel.trim();
  }
  return DEFAULT_MODEL;
};
