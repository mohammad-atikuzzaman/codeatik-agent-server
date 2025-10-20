import axios from "axios";
import serverConfig from "../config/serverConfig.js";

export const generateSite = async (prompt) => {
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "x-ai/grok-code-fast-1",
      messages: [
        {
          role: "user",
          content: `
You are an expert frontend engineer. Generate a static website using ONLY HTML, CSS, and JavaScript.

SPECIFIC INSTRUCTIONS:
1. Use Tailwind CSS ONLY if explicitly requested in the prompt
2. ABSOLUTELY NO React, Next.js, Angular, Vue, Bootstrap or other frameworks
3. Return PURE VALID JSON - no markdown, no explanations
4. JSON structure: { "filename": "file content" }
5. Escape ALL special characters in strings (quotes, newlines, etc.)
6. Ensure ALL strings are properly quoted and terminated
7. Do NOT include any text outside the JSON object

EXAMPLE FORMAT:
{
  "index.html": "<!DOCTYPE html>\\n<html>...</html>",
  "styles.css": "body { background: #fff; }"
}

USER PROMPT: ${prompt}
          `.trim(),
        },
      ],
      temperature: 0.2,
      max_tokens: 4000,
    },
    {
      headers: {
        Authorization: `Bearer ${serverConfig.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    }
  );

  if (!response.data.choices?.[0]?.message?.content) {
    throw new Error("Empty response from AI model");
  }

  let rawContent = response.data.choices[0].message.content;
  rawContent = cleanRawContent(rawContent);

  return parseGeneratedContent(rawContent);
};

function cleanRawContent(rawContent) {
  return rawContent
    .replace(/^[\s]*```(?:json)?/gm, "")
    .replace(/```[\s]*$/gm, "")
    .trim();
}

function parseGeneratedContent(rawContent) {
  try {
    return JSON.parse(rawContent);
  } catch (parseError) {
    // Enhanced parsing with fixes
    const jsonStart = rawContent.indexOf("{");
    const jsonEnd = rawContent.lastIndexOf("}") + 1;

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("No JSON structure found in response");
    }

    const jsonString = rawContent.substring(jsonStart, jsonEnd);
    const fixedContent = fixJsonContent(jsonString);

    return JSON.parse(fixedContent);
  }
}

function fixJsonContent(jsonString) {
  return jsonString
    .replace(/(['"])?([a-zA-Z0-9_\-]+)(['"])?:/g, '"$2":')
    .replace(/'/g, '"')
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/\\\//g, "/")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "  ")
    .replace(/\\\\/g, "\\");
}
