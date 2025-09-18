const axios = require("axios");

const OLLAMA_URL = "http://3.24.151.87:11434/api/embeddings";
const QDRANT_URL = process.env.QDRANT_URL
const MODEL = "nomic-embed-text";
const MAX_CHARS = 2000;
const BATCH_SIZE = 10;

// Split into chunks
function chunkText(text) {
  let chunks = [];
  for (let i = 0; i < text.length; i += MAX_CHARS) {
    chunks.push(text.slice(i, i + MAX_CHARS));
  }
  return chunks;
}

// Get embedding
async function getEmbedding(text) {
  try {
    const response = await axios.post(OLLAMA_URL, {
      model: MODEL,
      prompt: text,
    });
    return response.data.embedding;
  } catch (err) {
    console.error("Embedding error:", err.response?.data || err.message);
    return null;
  }
}

// Create collection
async function createCollection(collectionName, vectorSize) {
  try {
    await axios.put(`${QDRANT_URL}/collections/${collectionName}`, {
      vectors: { size: vectorSize, distance: "Cosine" },
    });
    console.log(`✅ Collection "${collectionName}" created/exists`);
  } catch (err) {
    console.error("Error creating collection:", err.response?.data || err.message);
  }
}

// Insert into Qdrant
async function insertToQdrant(collectionName, chunks, embeddings, metadata) {
  const points = embeddings.map((embedding, idx) => ({
    id: Date.now() + idx,
    vector: embedding,
    payload: { text: chunks[idx], ...metadata },
  }));

  try {
    await axios.put(`${QDRANT_URL}/collections/${collectionName}/points?wait=true`, {
      points,
    });
    console.log(`✅ Inserted ${points.length} points into Qdrant`);
  } catch (err) {
    console.error("Error inserting points:", err.response?.data || err.message);
  }
}

// Process in batches
async function processInBatches(chunks) {
  let embeddings = [];
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    console.log(`🚀 Processing batch ${i / BATCH_SIZE + 1}`);
    const results = await Promise.all(batch.map(chunk => getEmbedding(chunk)));
    embeddings.push(...results.filter(Boolean));
  }
  return embeddings;
}

async function embedAndSaveText({ text, collectionName, metadata }) {
  const chunks = chunkText(text);
  console.log(`📄 Text split into ${chunks.length} chunks`);

  const embeddings = await processInBatches(chunks);
  if (embeddings.length > 0) {
    await createCollection(collectionName, embeddings[0].length);
    await insertToQdrant(collectionName, chunks, embeddings, metadata);
  }
}

module.exports = { embedAndSaveText, getEmbedding };
