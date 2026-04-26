const { RISK_LEVELS } = require("../config/riskConfig");
const { preprocessInput } = require("./preprocessService");
const { findClosestIncidents } = require("./retrievalService");
const { classifyRisk } = require("./classificationService");
const { applyRuleOverrides } = require("./ruleEngineService");

function mapPriority(riskLevel) {
  if (riskLevel === RISK_LEVELS.HIGH) return "P1";
  if (riskLevel === RISK_LEVELS.MEDIUM) return "P2";
  return "P3";
}

async function detectEmergencyRisk(payload = {}) {
  const normalizedText = preprocessInput(payload);

  if (!normalizedText) {
    return {
      riskLevel: RISK_LEVELS.MEDIUM,
      priority: "P2",
      confidence: 0,
      reason: "No clear content detected; defaulted to safe fallback.",
      flaggedForReview: true,
      similarIncidents: [],
      matchedRules: [],
    };
  }

  const similarIncidents = findClosestIncidents(normalizedText);
  const topSimilarity = similarIncidents[0]?.similarity || 0;

  const modelPrediction = await classifyRisk({
    text: normalizedText,
    similarityScore: topSimilarity,
  });

  const ruleOutcome = applyRuleOverrides(normalizedText);
  let finalRisk = modelPrediction.level;
  let confidence = modelPrediction.confidence;
  let reason = "Model prediction with retrieval context.";
  let flaggedForReview = false;

  if (ruleOutcome.hasOverride) {
    finalRisk = ruleOutcome.level;
    confidence = Math.min(1, Number((confidence + ruleOutcome.scoreBoost / 100).toFixed(2)));
    reason = "Rule-based override triggered by critical phrases.";
  } else if (confidence < 0.55) {
    finalRisk = RISK_LEVELS.MEDIUM;
    flaggedForReview = true;
    reason = "Ambiguous confidence; routed to medium priority review.";
  }

  return {
    riskLevel: finalRisk,
    priority: mapPriority(finalRisk),
    confidence,
    reason,
    flaggedForReview,
    matchedRules: ruleOutcome.matchedRules,
    similarIncidents,
    debug: {
      modelPrediction,
      topSimilarity,
    },
  };
}

module.exports = {
  detectEmergencyRisk,
};
