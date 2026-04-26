// Prototype embedding service:
// uses a deterministic hash-like vector until a real embedding model is connected.
function vectorizeText(text, size = 16) {
  const vector = Array(size).fill(0);
  for (let i = 0; i < text.length; i += 1) {
    const charCode = text.charCodeAt(i);
    vector[i % size] += charCode / 255;
  }
  return normalizeVector(vector);
}

function normalizeVector(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) return vector;
  return vector.map((value) => value / magnitude);
}

module.exports = {
  vectorizeText,
};
