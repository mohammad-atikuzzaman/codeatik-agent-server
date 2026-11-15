import { callOpenRouter } from "./openRouterService.js";
import {
  ARCHITECT_AGENT_PROMPT,
  CODE_SYNTHESIZER_PROMPT,
  buildRefinementPrompt,
} from "./harnessSkills.js";

/**
 * Stage 1: The Chief UX/UI Architect Agent
 * Deconstructs user prompt into a cohesive architectural blueprint.
 */
export const planArchitecture = async (prompt, requestedModel = null) => {
  try {
    const { content } = await callOpenRouter({
      requestedModel,
      messages: [
        { role: "system", content: ARCHITECT_AGENT_PROMPT },
        { role: "user", content: `USER REQUEST: ${prompt}\n\nFormulate the complete UX/UI Architecture Blueprint in JSON.` },
      ],
      temperature: 0.2,
      max_tokens: 1200,
      timeout: 25000,
    });

    return parseBlueprint(content, prompt);
  } catch (error) {
    console.warn("Architect Agent fallback triggered:", error.message);
    return createFallbackBlueprint(prompt);
  }
};

/**
 * Stage 2: Senior Frontend Code Synthesizer
 * Generates code directly adhering to the Architect's Blueprint.
 */
export const synthesizeCode = async (prompt, blueprint, requestedModel = null) => {
  const blueprintSummary = JSON.stringify(blueprint, null, 2);
  const userContent = `
USER ORIGINAL PROMPT:
${prompt}

UX ARCHITECTURE BLUEPRINT:
${blueprintSummary}

Synthesize the complete, production-ready website with index.html, styles.css, and script.js adhering strictly to this blueprint.
`.trim();

  const { content, modelUsed } = await callOpenRouter({
    requestedModel,
    messages: [
      { role: "system", content: CODE_SYNTHESIZER_PROMPT },
      { role: "user", content: userContent },
    ],
    temperature: 0.25,
    max_tokens: 4000,
    timeout: 50000,
  });

  const parsed = parseAndHealGeneratedContent(content, prompt);
  const enriched = postProcessAndEnrichFiles(parsed, blueprint);
  enriched.modelUsed = modelUsed;
  return enriched;
};

/**
 * Master Agentic Entry Point: Runs the multi-agent pipeline
 */
export const generateSite = async (
  prompt,
  previousFiles = null,
  previousBlueprint = null,
  requestedModel = null
) => {
  // If refinement on existing website:
  if (previousFiles && typeof previousFiles === "object") {
    const userContent = buildRefinementPrompt(prompt, previousFiles, previousBlueprint);
    const { content, modelUsed } = await callOpenRouter({
      requestedModel,
      messages: [
        { role: "system", content: CODE_SYNTHESIZER_PROMPT },
        { role: "user", content: userContent },
      ],
      temperature: 0.25,
      max_tokens: 4000,
      timeout: 50000,
    });

    const parsed = parseAndHealGeneratedContent(content, prompt);
    const enriched = postProcessAndEnrichFiles(parsed, previousBlueprint);
    return {
      title: enriched.title,
      blueprint: previousBlueprint,
      files: enriched.files,
      modelUsed,
    };
  }

  // Full Agentic 2-Stage Pipeline:
  // Step 1: Architect Agent plans the blueprint
  console.log(`[Agentic Stage 1] Formulating UX Architecture Blueprint for: "${prompt}"...`);
  const blueprint = await planArchitecture(prompt, requestedModel);

  // Step 2: Code Synthesizer Agent implements the blueprint
  console.log(`[Agentic Stage 2] Synthesizing production code based on blueprint: "${blueprint.title}"...`);
  const synthesized = await synthesizeCode(prompt, blueprint, requestedModel);

  return {
    title: blueprint.title || synthesized.title,
    blueprint,
    files: synthesized.files,
    modelUsed: synthesized.modelUsed,
  };
};

/**
 * Parses raw JSON from Architect Agent
 */
function parseBlueprint(rawContent, fallbackPrompt) {
  let cleaned = rawContent
    .replace(/^[\s]*```(?:json)?/gm, "")
    .replace(/```[\s]*$/gm, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.substring(start, end + 1));
      } catch (inner) {}
    }
    return createFallbackBlueprint(fallbackPrompt);
  }
}

function createFallbackBlueprint(prompt) {
  return {
    title: prompt.slice(0, 35) || "Modern Web Application",
    category: "Modern Web Application",
    targetAudience: "General professional audience",
    brandTone: "Modern, sleek, and intuitive",
    colorPalette: {
      primary: "#6366f1",
      secondary: "#8b5cf6",
      background: "#020617",
      surface: "#0f172a",
      text: "#f8fafc",
      accent: "#10b981",
    },
    typography: {
      fontFamily: "Plus Jakarta Sans",
      headingFont: "Outfit",
    },
    sections: [
      { name: "Navbar", summary: "Responsive glassmorphic navigation" },
      { name: "Hero", summary: "Value proposition with call to action" },
      { name: "Features", summary: "Key capabilities and benefits" },
      { name: "FAQ", summary: "Interactive answers to common questions" },
      { name: "Footer", summary: "Site navigation and copyright" },
    ],
    interactiveWidgets: ["Mobile menu drawer", "FAQ Accordion", "Interactive form submission"],
  };
}

/**
 * Auto-healing parser for generated code files
 */
function parseAndHealGeneratedContent(rawContent, prompt) {
  let cleaned = rawContent
    .replace(/^[\s]*```(?:json)?/gm, "")
    .replace(/```[\s]*$/gm, "")
    .trim();

  try {
    const data = JSON.parse(cleaned);
    return normalizeResultStructure(data, prompt);
  } catch (initialErr) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = cleaned.substring(firstBrace, lastBrace + 1);
      try {
        const data = JSON.parse(candidate);
        return normalizeResultStructure(data, prompt);
      } catch (innerErr) {
        const healed = candidate
          .replace(/,\s*([}\]])/g, "$1")
          .replace(/\\'/g, "'")
          .replace(/\r\n/g, "\\n")
          .replace(/\t/g, "  ");
        try {
          const data = JSON.parse(healed);
          return normalizeResultStructure(data, prompt);
        } catch (healErr) {}
      }
    }

    return regexFallbackExtraction(cleaned, prompt);
  }
}

function normalizeResultStructure(data, fallbackPrompt) {
  let title = data.title || "Generated Website";
  let files = {};

  if (data.files && typeof data.files === "object") {
    files = data.files;
  } else if (data["index.html"]) {
    files = { ...data };
    delete files.title;
  } else {
    files = { "index.html": "<!DOCTYPE html><html><body>Error loading files</body></html>" };
  }

  return { title, files };
}

function regexFallbackExtraction(content, prompt) {
  const files = {};
  const htmlMatch = content.match(/"index\.html"\s*:\s*"([\s\S]*?)(?="\s*,\s*"styles\.css"|"\s*,\s*"script\.js"|"\s*})/);
  const cssMatch = content.match(/"styles\.css"\s*:\s*"([\s\S]*?)(?="\s*,\s*"script\.js"|"\s*})/);
  const jsMatch = content.match(/"script\.js"\s*:\s*"([\s\S]*?)(?="\s*})/);

  files["index.html"] = htmlMatch && htmlMatch[1]
    ? unescapeJson(htmlMatch[1])
    : `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Generated Site</title></head><body><h1>${prompt}</h1></body></html>`;
  files["styles.css"] = cssMatch && cssMatch[1] ? unescapeJson(cssMatch[1]) : "/* Custom Styles */";
  files["script.js"] = jsMatch && jsMatch[1] ? unescapeJson(jsMatch[1]) : "// Custom Scripts\n";

  return { title: "Generated Website", files };
}

function unescapeJson(str) {
  return str.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
}

/**
 * Enriches code with CDNs, custom CSS palette variables, and Google Fonts
 */
function postProcessAndEnrichFiles(result, blueprint = null) {
  let html = result.files["index.html"] || "";
  let css = result.files["styles.css"] || "";

  // Inject Google Fonts based on Blueprint
  const fontName = blueprint?.typography?.fontFamily || "Plus Jakarta Sans";
  const formattedFont = encodeURIComponent(fontName);
  if (!html.includes("fonts.googleapis.com")) {
    html = html.replace(
      "</head>",
      `  <link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  <link href="https://fonts.googleapis.com/css2?family=${formattedFont}:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">\n</head>`
    );
  }

  // Inject Tailwind CDN
  if (!html.includes("cdn.tailwindcss.com")) {
    html = html.replace("</head>", '  <script src="https://cdn.tailwindcss.com"></script>\n</head>');
  }

  // Inject Lucide Icons CDN
  if (!html.includes("unpkg.com/lucide")) {
    html = html.replace("</head>", '  <script src="https://unpkg.com/lucide@latest"></script>\n</head>');
  }

  // Link styles and scripts
  if (!html.includes("styles.css")) {
    html = html.replace("</head>", '  <link rel="stylesheet" href="styles.css">\n</head>');
  }
  if (!html.includes("script.js")) {
    html = html.replace("</body>", '  <script src="script.js" defer></script>\n</body>');
  }

  // Inject CSS Variables from Blueprint Color Palette into styles.css
  if (blueprint?.colorPalette) {
    const { primary, secondary, background, surface, text, accent } = blueprint.colorPalette;
    const cssVars = `
:root {
  --color-primary: ${primary || "#6366f1"};
  --color-secondary: ${secondary || "#8b5cf6"};
  --color-bg: ${background || "#020617"};
  --color-surface: ${surface || "#0f172a"};
  --color-text: ${text || "#f8fafc"};
  --color-accent: ${accent || "#10b981"};
  font-family: '${fontName}', sans-serif;
}
`;
    if (!css.includes(":root")) {
      css = cssVars + "\n" + css;
    }
  }

  result.files["index.html"] = html;
  result.files["styles.css"] = css;
  return result;
}
