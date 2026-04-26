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

async function classifyRisk({ text, similarityScore }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.RISK_LLM_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    return heuristicClassifyRisk({ text, similarityScore });
  }

  try {
    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content:
            "You are an emergency risk classifier for women's safety. Return only compact JSON with keys: level (high|medium|low), confidence (0..1).",
        },
        {
          role: "user",
          content: `Classify this SOS message.\nText: "${text}"\nSimilarity score to historical incidents: ${similarityScore}`,
        },
      ],
      temperature: 0,
      max_output_tokens: 80,
    });

    const rawText = response.output_text || "";
    const parsed = JSON.parse(rawText);
    const normalized = normalizeLlmResponse(parsed);
    if (normalized) return normalized;
  } catch (error) {
    // Graceful fallback keeps risk engine available if model call fails.
  }

  return heuristicClassifyRisk({ text, similarityScore });
}

module.exports = {
  classifyRisk,
};
