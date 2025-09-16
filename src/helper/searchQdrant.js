const axios = require("axios");
const { getEmbedding } = require("../helper/qdrant");
const getCollectionName = require("./getCollectionName");

const QDRANT_URL = "http://localhost:6333";
const MAX_CONTEXT_LENGTH = 2000; // max chars for LLM context

async function searchQdrant(question, classId, yearId, subjectId, limit = 5, customCollection = null) {
  try {
    // Determine collection
    const collectionName = customCollection || (await getCollectionName(classId, yearId, subjectId));
    if (!collectionName) {
      console.warn("❌ No collection found, skipping Qdrant search");
      return "";
    }

    // Generate embedding
    const embedding = await getEmbedding(question);
    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      console.warn("❌ Embedding empty or invalid, skipping Qdrant search");
      return "";
    }

    // Ensure limit is a valid number
    const safeLimit = typeof limit === "number" && limit > 0 ? limit : 5;

    // Make Qdrant search request
    const response = await axios.post(`${QDRANT_URL}/collections/${collectionName}/points/search`, {
      vector: embedding,
      limit: safeLimit,
      with_payload: true
    });

    const results = response.data.result || [];

    // Concatenate text chunks
    return results
      .map(item => item.payload?.text || "")
      .filter(Boolean)
      .join("\n")
      .substring(0, MAX_CONTEXT_LENGTH);

  } catch (err) {
    console.error("❌ searchQdrant error:", err.response?.data || err.message);
    return "";
  }
}

module.exports = { searchQdrant };
