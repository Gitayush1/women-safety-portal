function preprocessInput({ text = "", voiceTranscript = "" }) {
  const mergedText = `${text} ${voiceTranscript}`.trim();
  return mergedText.toLowerCase().replace(/\s+/g, " ");
}

module.exports = {
  preprocessInput,
};
