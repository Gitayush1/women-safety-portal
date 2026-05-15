function preprocessInput({ text = "", voiceTranscript = "" }) {
  const mergedText = `${text} ${voiceTranscript}`.trim();
  return mergedText
    .toLowerCase()
    .replace(/['']/g, " ")        // Replace apostrophes with spaces
    .replace(/\s+/g, " ")         // Collapse multiple spaces
    .trim();
}

module.exports = {
  preprocessInput,
};
