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

  try {
    const { content, modelUsed } = await callOpenRouter({
      requestedModel,
      messages: [
        { role: "system", content: CODE_SYNTHESIZER_PROMPT },
        { role: "user", content: userContent },
      ],
      temperature: 0.25,
      max_tokens: 4500,
      timeout: 55000,
    });

    const parsed = parseAndHealGeneratedContent(content, prompt);
    const enriched = postProcessAndEnrichFiles(parsed, blueprint);
    enriched.modelUsed = modelUsed;
    return enriched;
  } catch (error) {
    console.warn("[Synthesizer Agent] AI call fallback triggered:", error.message);
    const fallbackSite = createFallbackSynthesizedSite(prompt, blueprint);
    const enriched = postProcessAndEnrichFiles(fallbackSite, blueprint);
    enriched.modelUsed = "codeatik/resilient-synthesizer";
    return enriched;
  }
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
    try {
      const { content, modelUsed } = await callOpenRouter({
        requestedModel,
        messages: [
          { role: "system", content: CODE_SYNTHESIZER_PROMPT },
          { role: "user", content: userContent },
        ],
        temperature: 0.25,
        max_tokens: 4500,
        timeout: 55000,
      });

      const parsed = parseAndHealGeneratedContent(content, prompt);
      const enriched = postProcessAndEnrichFiles(parsed, previousBlueprint);
      return {
        title: enriched.title,
        blueprint: previousBlueprint,
        files: enriched.files,
        modelUsed,
      };
    } catch (refineErr) {
      console.warn("[Refine] AI model failed, keeping previous files with update note:", refineErr.message);
      return {
        title: previousBlueprint?.title || "Refined Website",
        blueprint: previousBlueprint,
        files: previousFiles,
        modelUsed: "codeatik/cached-state",
      };
    }
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

function createFallbackSynthesizedSite(prompt, blueprint) {
  const bp = blueprint || createFallbackBlueprint(prompt);
  const title = bp.title || prompt.slice(0, 40) || "Modern Web Application";
  const primary = bp.colorPalette?.primary || "#6366f1";
  const background = bp.colorPalette?.background || "#090d16";
  const surface = bp.colorPalette?.surface || "#111827";
  const text = bp.colorPalette?.text || "#f8fafc";
  const accent = bp.colorPalette?.accent || "#10b981";
  const headingFont = bp.typography?.headingFont || "Outfit";
  const bodyFont = bp.typography?.fontFamily || "Plus Jakarta Sans";

  const sectionsHtml = (bp.sections || [])
    .filter((s) => !["Navbar", "Footer"].includes(s.name))
    .map(
      (s) => `
    <section class="py-20 px-6 max-w-6xl mx-auto border-b border-slate-800/80">
      <div class="flex items-center gap-3 mb-4">
        <span class="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-950/80 text-indigo-400 border border-indigo-800/50">
          \${s.name}
        </span>
      </div>
      <h2 class="text-3xl font-bold tracking-tight text-slate-100 mb-4" style="font-family: '\${headingFont}', sans-serif;">
        \${s.name}
      </h2>
      <p class="text-slate-400 text-lg leading-relaxed max-w-3xl mb-8">
        \${s.summary}
      </p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm hover:border-slate-700 transition">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-white" style="background-color: \${primary};">
            <i data-lucide="sparkles" class="w-5 h-5"></i>
          </div>
          <h3 class="text-lg font-semibold text-slate-200 mb-2">Artisan Craft</h3>
          <p class="text-sm text-slate-400">Tailored with utmost precision and dedication to modern design principles.</p>
        </div>
        <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm hover:border-slate-700 transition">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-white" style="background-color: \${accent};">
            <i data-lucide="zap" class="w-5 h-5"></i>
          </div>
          <h3 class="text-lg font-semibold text-slate-200 mb-2">High Performance</h3>
          <p class="text-sm text-slate-400">Engineered for lightning-fast responsiveness and seamless fluidity across all viewports.</p>
        </div>
        <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm hover:border-slate-700 transition">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-white" style="background-color: \${primary};">
            <i data-lucide="shield-check" class="w-5 h-5"></i>
          </div>
          <h3 class="text-lg font-semibold text-slate-200 mb-2">Proven Reliability</h3>
          <p class="text-sm text-slate-400">Battle-tested architecture designed to deliver an unforgettable user experience.</p>
        </div>
      </div>
    </section>
    `
    )
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en" class="scroll-smooth dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\${title}</title>
  <meta name="description" content="\${bp.description || title}">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link rel="stylesheet" href="styles.css">
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans" style="font-family: '\${bodyFont}', sans-serif; background-color: \${background}; color: \${text};">

  <!-- Navbar -->
  <header class="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <a href="#" class="flex items-center gap-2.5 font-bold text-xl tracking-tight text-white" style="font-family: '\${headingFont}', sans-serif;">
        <span class="w-8 h-8 rounded-lg flex items-center justify-center text-white" style="background-color: \${primary};">
          <i data-lucide="layers" class="w-5 h-5"></i>
        </span>
        \${title}
      </a>
      <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <a href="#features" class="hover:text-white transition">Features</a>
        <a href="#about" class="hover:text-white transition">About</a>
        <a href="#faq" class="hover:text-white transition">FAQ</a>
        <a href="#contact" class="px-4 py-2 rounded-lg text-white font-semibold transition shadow-md" style="background-color: \${primary};">
          Get Started
        </a>
      </nav>
      <button id="mobile-toggle" class="md:hidden p-2 text-slate-400 hover:text-white">
        <i data-lucide="menu" class="w-6 h-6"></i>
      </button>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="py-24 px-6 max-w-6xl mx-auto text-center relative overflow-hidden">
    <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-indigo-950/70 text-indigo-300 border border-indigo-800/60 mb-6">
      <i data-lucide="sparkles" class="w-3.5 h-3.5 text-indigo-400"></i>
      <span>\${bp.category || "Next-Gen Experience"}</span>
    </div>
    <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight" style="font-family: '\${headingFont}', sans-serif;">
      \${title}
    </h1>
    <p class="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
      \${bp.description || "Crafted to perfection with intelligent design systems, seamless interactivity, and modern aesthetics."}
    </p>
    <div class="flex items-center justify-center gap-4 flex-wrap">
      <a href="#features" class="px-6 py-3.5 rounded-xl font-semibold text-white shadow-lg transition transform hover:-translate-y-0.5" style="background-color: \${primary};">
        Explore Showcase
      </a>
      <a href="#contact" class="px-6 py-3.5 rounded-xl font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition">
        Learn More
      </a>
    </div>
  </section>

  <!-- Architectural Blueprint Sections -->
  <main class="flex-1">
    \${sectionsHtml}
  </main>

  <!-- Interactive Contact / Lead Form -->
  <section id="contact" class="py-20 px-6 max-w-4xl mx-auto">
    <div class="p-8 md:p-12 rounded-3xl bg-slate-900/50 border border-slate-800 text-center">
      <h2 class="text-3xl font-bold mb-3" style="font-family: '\${headingFont}', sans-serif;">Connect With Us</h2>
      <p class="text-slate-400 mb-8 max-w-lg mx-auto">Have inquiries or want to experience our offerings firsthand? Leave your message below.</p>
      <form id="contact-form" class="max-w-md mx-auto space-y-4">
        <input type="email" required placeholder="Enter your email" class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500">
        <button type="submit" class="w-full py-3.5 rounded-xl text-white font-semibold shadow-lg transition" style="background-color: \${primary};">
          Send Inquiry
        </button>
      </form>
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t border-slate-800/80 py-10 px-6 text-center text-sm text-slate-500">
    <p>&copy; \${new Date().getFullYear()} \${title}. All rights reserved.</p>
  </footer>

  <script src="script.js"></script>
</body>
</html>`;

  const css = `/* Custom Styles & CSS Variables */
:root {
  --primary: \${primary};
  --background: \${background};
  --surface: \${surface};
  --text: \${text};
  --accent: \${accent};
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
`;

  const js = `// Interactive Logic & Widget Enhancements
document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Mobile menu toggle
  const mobileToggle = document.getElementById("mobile-toggle");
  if (mobileToggle) {
    mobileToggle.addEventListener("click", () => {
      alert("Mobile navigation toggle triggered");
    });
  }

  // Interactive Form Submission
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("Thank you! Your submission was recorded successfully.");
      contactForm.reset();
    });
  }
});
`;

  return {
    title,
    files: {
      "index.html": html,
      "styles.css": css,
      "script.js": js,
    },
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

  // 1. Check if content contains markdown code blocks or raw HTML
  const htmlDocMatch =
    content.match(/<!DOCTYPE\s+html[\s\S]*?<\/html>/i) ||
    content.match(/<html[\s\S]*?<\/html>/i) ||
    content.match(/```(?:html|xml)?\s*\n([\s\S]*?)```/i);

  if (htmlDocMatch) {
    const rawHtml = htmlDocMatch[1] || htmlDocMatch[0];
    if (rawHtml.includes("<body") || rawHtml.includes("<div") || rawHtml.includes("<h1")) {
      files["index.html"] = rawHtml.trim();

      const cssBlockMatch = content.match(/```css\s*\n([\s\S]*?)```/i);
      files["styles.css"] = cssBlockMatch ? cssBlockMatch[1].trim() : "/* Custom Styles */";

      const jsBlockMatch = content.match(/```(?:js|javascript)\s*\n([\s\S]*?)```/i);
      files["script.js"] = jsBlockMatch ? jsBlockMatch[1].trim() : "// Custom Scripts\n";

      return { title: prompt.slice(0, 35) || "Generated Website", files };
    }
  }

  // 2. Try JSON key extraction
  const htmlMatch = content.match(
    /"index\.html"\s*:\s*"([\s\S]*?)(?="\s*,\s*"styles\.css"|"\s*,\s*"script\.js"|"\s*})/
  );
  const cssMatch = content.match(
    /"styles\.css"\s*:\s*"([\s\S]*?)(?="\s*,\s*"script\.js"|"\s*})/
  );
  const jsMatch = content.match(/"script\.js"\s*:\s*"([\s\S]*?)(?="\s*})/);

  if (htmlMatch && htmlMatch[1]) {
    files["index.html"] = unescapeJson(htmlMatch[1]);
    files["styles.css"] = cssMatch && cssMatch[1] ? unescapeJson(cssMatch[1]) : "/* Custom Styles */";
    files["script.js"] = jsMatch && jsMatch[1] ? unescapeJson(jsMatch[1]) : "// Custom Scripts\n";
    return { title: "Generated Website", files };
  }

  // 3. Fallback to resilient synthesized site
  return createFallbackSynthesizedSite(prompt);
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
