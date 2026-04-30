require("dotenv").config();

const { classifyRisk } = require("../src/risk-detection/services/classificationService");

async function main() {
  const result = await classifyRisk({
    text: "please help me someone is chasing me near the bus stop",
    similarityScore: 0.92,
  });

  console.log(
    JSON.stringify(
      {
        ok: result.source === "llm",
        provider: process.env.RISK_LLM_PROVIDER || "openai",
        model:
          process.env.RISK_LLM_MODEL ||
          (process.env.RISK_LLM_PROVIDER === "ollama"
            ? "llama3.2"
            : process.env.RISK_LLM_PROVIDER === "gemini"
            ? "gemini-2.5-flash"
            : "gpt-4o-mini"),
        result,
      },
      null,
      2
    )
  );

  if (result.source !== "llm") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error.message,
      },
      null,
      2
    )
  );
  process.exitCode = 1;
});
