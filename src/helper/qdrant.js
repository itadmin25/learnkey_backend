// helper/embedAndQdrant.js
const { QdrantClient } = require("@qdrant/js-client-rest");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
});

const COLLECTION = "class:year:subject";
const VECTOR_DIM = 768; // Nomic embedding dimension

/**
 * Ensure collection exists in Qdrant
 */
async function ensureCollection() {
  const { collections } = await qdrant.getCollections();
  const exists = collections.some((c) => c.name === COLLECTION);

  if (!exists) {
    await qdrant.createCollection(COLLECTION, {
      vectors: {
        size: VECTOR_DIM,
        distance: "Cosine",
      },
    });
  }
}

/**
 * Split text into chunks (non-empty)
 */
function chunkText(text, chunkSize = 1000, overlap = 100) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    const chunk = text.slice(i, i + chunkSize).trim();
    if (chunk) chunks.push(chunk);
  }
  return chunks;
}

/**
 * Get embedding from local Ollama (nomic-embed-text)
 */
async function getNomicEmbedding(text) {
  try {
    const response = await axios.post("http://localhost:11434/api/embeddings", {
      model: "nomic-embed-text",
      input: text,
    });

    console.log("Ollama response:", response.data); // log to check structure

    // Adjust depending on actual response from Ollama
    const embedding =
      response.data?.embedding || response.data?.embeddings?.[0]?.embedding;

    if (!embedding || embedding.length !== VECTOR_DIM) {
      throw new Error(
        `Invalid embedding received. Expected dimension ${VECTOR_DIM}, got ${
          embedding?.length || 0
        }`
      );
    }

    return embedding;
  } catch (err) {
    console.error("Error getting embedding from Ollama:", err.message);
    throw err;
  }
}

/**
 * Embed text chunks and save to Qdrant
 * metadata can include userId, subject, etc.
 */
async function embedAndSaveText({ text, metadata }) {
  try {
    await ensureCollection();

    const chunks = chunkText(text, 1000);
    if (chunks.length === 0) {
      console.warn("No valid text chunks to embed.");
      return;
    }

    const embeddings = await Promise.all(
      chunks.map(async (chunk) => {
        const vector = await getNomicEmbedding(chunk);
        return { text: chunk, vector };
      })
    );

    const points = embeddings.map((item) => ({
      id: uuidv4(),
      vector: item.vector,
      payload: {
        text: item.text,
        ...metadata, // e.g., userId
      },
    }));

    const res = await qdrant.upsert(COLLECTION, { points });
    console.log(
      `✅ Saved ${points.length} chunks into Qdrant (Nomic embeddings)`,
      res
    );
  } catch (err) {
    console.error("Error in embedAndSaveText:", err.message);
    throw err;
  }
}

module.exports = { embedAndSaveText };
