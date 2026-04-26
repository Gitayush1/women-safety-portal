const express = require("express");
const { userAuth } = require("../middlewares/auth");
const { detectEmergencyRisk } = require("../risk-detection/services/riskDetectionService");

const riskDetectionRouter = express.Router();

// Prototype endpoint for SOS text/voice risk analysis.
riskDetectionRouter.post("/analyze", userAuth, async (req, res) => {
  try {
    const { text, voiceTranscript } = req.body;
    const result = await detectEmergencyRisk({ text, voiceTranscript });

    res.status(200).json({
      message: "Risk analysis completed",
      result,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to analyze emergency risk",
      details: error.message,
    });
  }
});

module.exports = riskDetectionRouter;
