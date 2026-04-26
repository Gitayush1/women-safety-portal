const historicalIncidents = require("../data/historicalIncidents");
const { vectorizeText } = require("./embeddingService");

function cosineSimilarity(vectorA, vectorB) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i += 1) {
    dot += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function findClosestIncidents(inputText, topK = 2) {
  const inputEmbedding = vectorizeText(inputText);
  const scored = historicalIncidents.map((incident) => {
    const incidentEmbedding = vectorizeText(incident.text.toLowerCase());
    return {
      ...incident,
      similarity: Number(cosineSimilarity(inputEmbedding, incidentEmbedding).toFixed(3)),
    };
  });

  return scored.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
}

module.exports = {
  findClosestIncidents,
};
