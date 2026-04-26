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
  const level = typeof parsed?.level === "string" ? parsed.level.toLowerCase() : "";
  const confidence = Number(parsed?.confidence);

  if (!allowedLevels.has(level)) return null;
  if (!Number.isFinite(confidence)) return null;

  return {
    level,
    confidence: Math.max(0, Math.min(1, Number(confidence.toFixed(2)))),
    source: "llm",
  };
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
  const parsed = JSON.parse(rawText);
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
  const parsed = JSON.parse(rawText);
  return normalizeLlmResponse(parsed);
}

async function classifyRisk({ text, similarityScore }) {
  const provider = String(process.env.RISK_LLM_PROVIDER || "openai")
    .trim()
    .toLowerCase();
  const apiKey = process.env.OPENAI_API_KEY;
  const defaultModel = provider === "ollama" ? "llama3.2" : "gpt-4o-mini";
  const model = process.env.RISK_LLM_MODEL || defaultModel;
  const requireLlm = String(process.env.RISK_LLM_REQUIRED || "")
    .trim()
    .toLowerCase() === "true";

  if (provider === "openai" && !apiKey) {
    if (requireLlm) {
      throw new Error("OPENAI_API_KEY is required for AI risk classification");
    }

    return heuristicClassifyRisk({ text, similarityScore });
  }

  try {
    const normalized =
      provider === "ollama"
        ? await classifyWithOllama({ text, similarityScore, model })
        : await classifyWithOpenAi({ text, similarityScore, model, apiKey });
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
        : summarizeOpenAiError(error);
    if (requireLlm) {
      throw new Error(`${provider} risk classification failed: ${fallbackReason}`);
    }

    return {
      ...heuristicClassifyRisk({ text, similarityScore }),
      fallbackReason,
    };
  }

  const fallbackReason = "OpenAI returned JSON that did not match risk schema";
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
