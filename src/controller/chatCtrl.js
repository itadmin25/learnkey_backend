const Conversation = require("../model/chatModel");
const { searchQdrant } = require("../helper/searchQdrant");
const callLLM = require("../helper/llm");


exports.createConversation = async (req, res) => {
   try {
      const { userId, classId, yearId, subjectId, question, files } = req.body;

      if (!userId || !classId || !yearId || !subjectId || !question) {
         return res.status(400).json({ success: false, message: "All fields required" });
      }

      const title = question.length > 50 ? question.substring(0, 47) + "..." : question;
      const userMessage = { role: "user", content: question, files: files || [] };

      const newConversation = new Conversation({
         user: userId,
         class: classId,
         subject: subjectId,
         title,
         messages: [userMessage],
      });

      const [contextChunks, savedConversation] = await Promise.all([
         searchQdrant(question, classId, yearId, subjectId),
         newConversation.save(),
      ]);

      const questionId = savedConversation.messages[0]._id;

      const historyMessages = savedConversation.messages.slice(-5).map(msg => `${msg.role}: ${msg.content}`).join("\n");

      const llmPrompt = `
You are an AI tutor. Use the following context and history to answer concisely.

Context:
${contextChunks}

History:
${historyMessages}

Question:
${question}
    `;
      // callLLM(llmPrompt).then(async (aiResponseText) => {
      //    const aiMessage = { role: "ai", content: aiResponseText, files: [], replyTo: questionId };
      //    savedConversation.messages.push(aiMessage);
      //    savedConversation.updatedAt = new Date();
      //    await savedConversation.save();
      // }).catch(err => console.error("❌ LLM call failed:", err));

      // 🔹 Wait for AI response here
      const aiResponseText = await callLLM(llmPrompt);

      // Save AI response
      const aiMessage = { role: "ai", content: aiResponseText, files: [], replyTo: questionId };
      savedConversation.messages.push(aiMessage);
      savedConversation.updatedAt = new Date();
      await savedConversation.save();

      // ✅ Respond with AI answer directly
      res.status(201).json({
         success: true,
         conversationId: savedConversation._id,
         userMessage,
         aiMessage,
      });

      // res.status(201).json({
      //    success: true,
      //    message: "Conversation created. AI response will appear shortly.",
      //    conversationId: savedConversation._id,
      //    userMessage,
      // });

   } catch (err) {
      console.error("❌ createConversation error:", err);
      res.status(500).json({ message: "Internal server error", error: err.message });
   }
};


// Add message to chat
exports.addMessage = async (req, res) => {
  try {
    const { chatId } = req.query;
    const { userId, classId, yearId, subjectId, question, files } = req.body;

    if (!userId || !classId || !yearId || !subjectId || !question) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    // Find conversation
    const conversation = await Conversation.findById(chatId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }
    // User's new message
    const userMessage = { role: "user", content: question, files: files || [] };
    conversation.messages.push(userMessage);
    await conversation.save();

    const questionId = conversation.messages[conversation.messages.length - 1]._id;

    // Prepare context for AI
    const [contextChunks] = await Promise.all([
      searchQdrant(question, classId, yearId, subjectId),
    ]);

    const historyMessages = conversation.messages
      .slice(-5)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join("\n");

    const llmPrompt = `
You are an AI tutor. Use the following context and history to answer concisely.

Context:
${contextChunks}

History:
${historyMessages}

Question:
${question}
    `;

    // Call AI
    const aiResponseText = await callLLM(llmPrompt);

    // Save AI response
    const aiMessage = { role: "ai", content: aiResponseText, files: [], replyTo: questionId };
    conversation.messages.push(aiMessage);
    conversation.updatedAt = new Date();
    await conversation.save();

    // Respond with updated conversation
    res.status(201).json({
      success: true,
      conversationId: conversation._id,
      userMessage,
      aiMessage,
    });

  } catch (err) {
    console.error("❌ addMessage error:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};
