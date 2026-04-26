const { KEYWORD_RULES, RISK_LEVELS } = require("../config/riskConfig");

function applyRuleOverrides(text) {
  const triggered = KEYWORD_RULES.filter((rule) => text.includes(rule.phrase));
  if (triggered.length === 0) {
    return { hasOverride: false, level: null, scoreBoost: 0, matchedRules: [] };
  }

  const hasHigh = triggered.some((rule) => rule.level === RISK_LEVELS.HIGH);
  const level = hasHigh ? RISK_LEVELS.HIGH : RISK_LEVELS.MEDIUM;
  const scoreBoost = triggered.reduce((sum, rule) => sum + rule.score, 0);

  return {
    hasOverride: true,
    level,
    scoreBoost,
    matchedRules: triggered.map((rule) => rule.phrase),
  };
}

module.exports = {
  applyRuleOverrides,
};
