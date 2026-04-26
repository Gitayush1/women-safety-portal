# AI Emergency Risk Detection Prototype

This prototype implements a hybrid risk engine for SOS inputs:

1. Preprocess text and voice transcript.
2. Generate deterministic prototype embeddings.
3. Retrieve similar historical incidents with vector similarity.
4. Classify base risk level with a model-like scoring function.
5. Apply rule-based keyword overrides for critical situations.
6. Use confidence fallback to medium + review when uncertain.

## API

- Endpoint: `POST /api/risk-detection/analyze`
- Auth: uses existing `userAuth` middleware
- Input body:

```json
{
  "text": "I think someone is following me",
  "voiceTranscript": "please help me"
}
```

## Response highlights

- `riskLevel`: `high` | `medium` | `low`
- `priority`: `P1` | `P2` | `P3`
- `confidence`: numeric score
- `matchedRules`: high-risk phrases that triggered override
- `similarIncidents`: retrieval matches from historical dataset
- `flaggedForReview`: true when ambiguous/low confidence

## Next integration steps

- Replace `vectorizeText` with a real embedding provider.
- Move historical incidents into MongoDB with vector index support.
- Push `priority` into officer assignment / dashboard queues.

## LLM setup (enabled with fallback)

- `classifyRisk` now attempts an OpenAI model call when `OPENAI_API_KEY` is set.
- Optional: set `RISK_LLM_MODEL` (default: `gpt-4o-mini`).
- If key is missing or API call fails, service falls back to existing heuristic classifier.
