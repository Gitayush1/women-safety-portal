const RISK_LEVELS = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

const KEYWORD_RULES = [
  { phrase: "being followed", level: RISK_LEVELS.HIGH, score: 40 },
  { phrase: "in danger", level: RISK_LEVELS.HIGH, score: 45 },
  { phrase: "help me", level: RISK_LEVELS.HIGH, score: 35 },
  { phrase: "someone is chasing me", level: RISK_LEVELS.HIGH, score: 50 },
  { phrase: "harassment", level: RISK_LEVELS.MEDIUM, score: 20 },
  { phrase: "unsafe", level: RISK_LEVELS.MEDIUM, score: 15 },
];

const CONFIDENCE_THRESHOLDS = {
  high: 0.8,
  medium: 0.55,
};

module.exports = {
  RISK_LEVELS,
  KEYWORD_RULES,
  CONFIDENCE_THRESHOLDS,
};
