const axios = require("axios");
const { getEmbedding } = require("../helper/qdrant");
const getCollectionName = require("./getCollectionName");

const QDRANT_URL = "http://localhost:6333";
const MAX_CONTEXT_LENGTH = 2000; // max chars for LLM context

/**
 * Search Qdrant for similar chunks based on a question.
 * @param {String} question - The user question
 * @param {String} classId
 * @param {String} yearId
 * @param {String} subjectId
 * @param {Number} limit - max results to return
 * @returns {String} concatenated text chunks
 */
async function searchQdrant(question, classId, yearId, subjectId, limit = 5) {
  try {
    const collectionName = await getCollectionName(classId, yearId, subjectId);
    console.log("Collection Name:", collectionName);
    if (!collectionName) return "";

    // Generate embedding
    const embedding = await getEmbedding(question);
    if (!embedding) return "";

    // Search Qdrant
    const response = await axios.post(`${QDRANT_URL}/collections/${collectionName}/points/search`, {
      vector: embedding,
      limit,
      with_payload: true,
    });

 const searchResult = response.data.result || [];
// console.log(`Qdrant search found ${searchResult.length} results`);
// console.log("Results detail:", JSON.stringify(searchResult, null, 2));
    // Concatenate text chunks and limit total length
    const contextChunks = searchResult
      .map(item => item.payload?.text || "")
      .join("\n")
      .substring(0, MAX_CONTEXT_LENGTH);
    return contextChunks;

  } catch (err) {
    console.error("❌ searchQdrant error:", err.response?.data || err.message);
    return "";
  }
}

module.exports = { searchQdrant };
