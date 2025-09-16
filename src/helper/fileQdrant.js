const axios = require("axios");
const { getEmbedding } = require("./qdrant"); // your existing embedding function
const QDRANT_URL = "http://localhost:6333";
const MAX_CONTEXT_LENGTH = 2000; // limit for LLM context

/**
 * Utility: Create collection in Qdrant if not exists
 */
async function ensureCollection(collectionName, vectorSize = 1536) {
  try {
    await axios.put(`${QDRANT_URL}/collections/${collectionName}`, {
      vectors: { size: vectorSize, distance: "Cosine" },
    });
    console.log(`✅ Collection ensured: ${collectionName}`);
  } catch (err) {
    console.error("❌ ensureCollection error:", err.response?.data || err.message);
  }
}

/**
 * Store user files in Qdrant (create collection: userId_conversationId)
 * @param {Array} files - Array of file objects [{ name, text }]
 * @param {String} userId
 * @param {String} conversationId
 */
async function storeFileInQdrant(files, userId, conversationId) {
  try {
    const collectionName = `${userId}_${conversationId}`;
    await ensureCollection(collectionName);

    const points = [];

    for (const file of files) {
      if (!file.text) continue; // assume file.text contains extracted text

      // Simple chunking (every 500 chars)
      const chunks = file.text.match(/.{1,500}/g) || [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await getEmbedding(chunk);

        points.push({
          id: `${file.name}_${i}_${Date.now()}`,
          vector: embedding,
          payload: {
            text: chunk,
            fileName: file.name,
            userId,
            conversationId,
          },
        });
      }
    }

    if (points.length > 0) {
      await axios.put(`${QDRANT_URL}/collections/${collectionName}/points?wait=true`, {
        points,
      });
      console.log(`✅ Stored ${points.length} chunks in ${collectionName}`);
    }
  } catch (err) {
    console.error("❌ storeFileInQdrant error:", err.response?.data || err.message);
  }
}

/**
 * Search in user file collection (userId_conversationId)
 * @param {String} question
 * @param {String} userId
 * @param {String} conversationId
 * @param {Number} limit
 * @returns {String} concatenated text chunks
 */
async function searchUserFileQdrant(question, userId, conversationId, limit = 5) {
  try {
    const collectionName = `${userId}_${conversationId}`;

    // Generate embedding for question
    const embedding = await getEmbedding(question);
    if (!embedding) return "";

    // Search in Qdrant
    const response = await axios.post(`${QDRANT_URL}/collections/${collectionName}/points/search`, {
      vector: embedding,
      limit,
      with_payload: true,
    });

    const searchResult = response.data.result || [];
    const contextChunks = searchResult
      .map(item => item.payload?.text || "")
      .join("\n")
      .substring(0, MAX_CONTEXT_LENGTH);

    return contextChunks;
  } catch (err) {
    if (err.response?.status === 404) {
      // Collection not found → no file uploaded
      return "";
    }
    console.error("❌ searchUserFileQdrant error:", err.response?.data || err.message);
    return "";
  }
}

module.exports = {
  storeFileInQdrant,
  searchUserFileQdrant,
};
