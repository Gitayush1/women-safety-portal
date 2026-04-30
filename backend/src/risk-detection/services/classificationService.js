const OpenAI = require("openai");
const { CONFIDENCE_THRESHOLDS, RISK_LEVELS } = require("../config/riskConfig");

function heuristicClassifyRisk({ text, similarityScore }) {
  const severityHints = ["danger", "followed", "chasing", "attack", "threat", "help"];
  const hintMatches = severityHints.filter((hint) => text.includes(hint)).length;
  const baseScore = Math.min(1, 0.25 + hintMatches * 0.12 + similarityScore * 0.45);

  if (baseScore >= CONFIDENCE_THRESHOLDS.high) {
    return { level: RISK_LEVELS.HIGH, confidence: Number(baseScore.toFixed(2)), source: "heuristic" };
  }
  if (baseScore >= CONFIDENCE_THRESHOLDS.medium) {
    return { level: RISK_LEVELS.MEDIUM, confidence: Number(baseScore.toFixed(2)), source: "heuristic" };
  }
  return { level: RISK_LEVELS.LOW, confidence: Number(baseScore.toFixed(2)), source: "heuristic" };
}

function normalizeLlmResponse(parsed) {
  const allowedLevels = new Set(Object.values(RISK_LEVELS));
  const rawLevel = parsed?.level || parsed?.riskLevel || parsed?.risk_level;
  const rawConfidence = parsed?.confidence || parsed?.score || parsed?.probability;
  const level = typeof rawLevel === "string" ? rawLevel.toLowerCase() : "";
  const confidence = Number(rawConfidence);

  if (!allowedLevels.has(level)) return null;
  if (!Number.isFinite(confidence)) return null;

  return {
    level,
    confidence: Math.max(0, Math.min(1, Number(confidence.toFixed(2)))),
    source: "llm",
  };
}

function parseJsonObject(rawText) {
  if (!rawText || typeof rawText !== "string") return null;

  try {
    return JSON.parse(rawText);
  } catch (error) {
    const start = rawText.indexOf("{");
    const end = rawText.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    return JSON.parse(rawText.slice(start, end + 1));
  }
}

function summarizeOpenAiError(error) {
  const parts = [
    error?.status && `status ${error.status}`,
    error?.code,
    error?.type,
    error?.message,
  ].filter(Boolean);

  return parts.join(" - ") || "OpenAI request failed";
}

function summarizeGeminiError(status, body) {
  const message = body?.error?.message || body?.message;
  const code = body?.error?.code || status;
  const statusText = body?.error?.status;
  return [code && `status ${code}`, statusText, message]
    .filter(Boolean)
    .join(" - ") || "Gemini request failed";
}

function buildRiskMessages({ text, similarityScore }) {
  return [
    {
      role: "system",
      content:
        "You are an emergency risk classifier for women's safety. Return only JSON with keys: level (high|medium|low), confidence (0..1).",
    },
    {
      role: "user",
      content: `Classify this SOS message.\nText: "${text}"\nSimilarity score to historical incidents: ${similarityScore}`,
    },
  ];
}

function buildRiskPrompt({ text, similarityScore }) {
  return [
    "You are an emergency risk classifier for women's safety.",
    "Return only a raw JSON object. Do not include markdown, explanation, labels, or text before/after the JSON.",
    'Schema: {"level":"high|medium|low","confidence":0.0}',
    "",
    "Classify this SOS message.",
    `Text: "${text}"`,
    `Similarity score to historical incidents: ${similarityScore}`,
  ].join("\n");
}

async function classifyWithOllama({ text, similarityScore, model }) {
  const client = new OpenAI({
    apiKey: process.env.OLLAMA_API_KEY || "ollama",
    baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
  });

  const response = await client.chat.completions.create({
    model,
    messages: buildRiskMessages({ text, similarityScore }),
    temperature: 0,
    max_tokens: 80,
    response_format: { type: "json_object" },
  });

  const rawText = response.choices?.[0]?.message?.content || "";
  const parsed = parseJsonObject(rawText);
  return normalizeLlmResponse(parsed);
}

async function classifyWithOpenAi({ text, similarityScore, model, apiKey }) {
  const client = new OpenAI({ apiKey });
  const response = await client.responses.create({
    model,
    input: buildRiskMessages({ text, similarityScore }),
    temperature: 0,
    max_output_tokens: 80,
    text: {
      format: {
        type: "json_schema",
        name: "risk_classification",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            level: {
              type: "string",
              enum: [RISK_LEVELS.HIGH, RISK_LEVELS.MEDIUM, RISK_LEVELS.LOW],
            },
            confidence: {
              type: "number",
            },
          },
          required: ["level", "confidence"],
        },
      },
    },
  });

  const rawText = response.output_text || "";
  const parsed = parseJsonObject(rawText);
  return normalizeLlmResponse(parsed);
}

async function classifyWithGemini({ text, similarityScore, model, apiKey }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: buildRiskPrompt({ text, similarityScore }) }],
        },
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 200,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            level: {
              type: "STRING",
              enum: [RISK_LEVELS.HIGH, RISK_LEVELS.MEDIUM, RISK_LEVELS.LOW],
            },
            confidence: {
              type: "NUMBER",
            },
          },
          required: ["level", "confidence"],
        },
      },
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(summarizeGeminiError(response.status, body));
  }

  const rawText = body?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const parsed = parseJsonObject(rawText);
  const normalized = normalizeLlmResponse(parsed);
  if (!normalized) {
    const detail = JSON.stringify(parsed || rawText).slice(0, 300);
    throw new Error(`Gemini returned invalid risk JSON: ${detail}`);
  }

  return normalized;
}

async function classifyRisk({ text, similarityScore }) {
  const provider = String(process.env.RISK_LLM_PROVIDER || "openai")
    .trim()
    .toLowerCase();
  const openAiApiKey = process.env.OPENAI_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const defaultModel =
    provider === "ollama"
      ? "llama3.2"
      : provider === "gemini"
      ? "gemini-2.5-flash"
      : "gpt-4o-mini";
  const model = process.env.RISK_LLM_MODEL || defaultModel;
  const requireLlm = String(process.env.RISK_LLM_REQUIRED || "")
    .trim()
    .toLowerCase() === "true";

  if (provider === "openai" && !openAiApiKey) {
    if (requireLlm) {
      throw new Error("OPENAI_API_KEY is required for AI risk classification");
    }

    return heuristicClassifyRisk({ text, similarityScore });
  }

  if (provider === "gemini" && !geminiApiKey) {
    if (requireLlm) {
      throw new Error("GEMINI_API_KEY is required for AI risk classification");
    }

    return heuristicClassifyRisk({ text, similarityScore });
  }

  try {
    let normalized;
    if (provider === "ollama") {
      normalized = await classifyWithOllama({ text, similarityScore, model });
    } else if (provider === "gemini") {
      normalized = await classifyWithGemini({
        text,
        similarityScore,
        model,
        apiKey: geminiApiKey,
      });
    } else {
      normalized = await classifyWithOpenAi({
        text,
        similarityScore,
        model,
        apiKey: openAiApiKey,
      });
    }

    if (normalized) {
      return {
        ...normalized,
        provider,
      };
    }
  } catch (error) {
    const fallbackReason =
      provider === "ollama"
        ? error?.message || "Ollama request failed"
        : provider === "gemini"
        ? error?.message || "Gemini request failed"
        : summarizeOpenAiError(error);
    if (requireLlm) {
      throw new Error(`${provider} risk classification failed: ${fallbackReason}`);
    }

    return {
      ...heuristicClassifyRisk({ text, similarityScore }),
      fallbackReason,
    };
  }

  const fallbackReason = `${provider} returned JSON that did not match risk schema`;
  if (requireLlm) {
    throw new Error(`${provider} risk classification failed: ${fallbackReason}`);
  }

  return {
    ...heuristicClassifyRisk({ text, similarityScore }),
    fallbackReason,
  };
}

module.exports = {
  classifyRisk,
};
