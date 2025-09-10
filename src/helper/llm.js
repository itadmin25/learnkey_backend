const axios = require("axios");
async function callLLM(prompt) {
  try {
    const response = await axios.post(
      "https://api.together.xyz/v1/chat/completions",
      {
        model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
        messages: [
          { role: "system", content: "You are an AI tutor that answers concisely and clearly." },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
   return response.data.choices[0].message.content;
  } catch (err) {
    console.error("❌ LLM API error:", err.response?.data || err.message);
    throw new Error("LLM request failed");
  }
}

module.exports = callLLM;
