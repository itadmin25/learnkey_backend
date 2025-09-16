const Conversation = require("../model/chatModel");
const { searchQdrant } = require("../helper/searchQdrant");
const { handleFileUpload } = require("../helper/handleFileUpload");
const callLLM = require("../helper/llm");

async function buildContext(question, userId, conversationId, classId, yearId, subjectId, uploadedFiles) {
   // 1️⃣ Get curriculum context
   const subjectContext = await searchQdrant(question, classId, yearId, subjectId);

   // 2️⃣ Get file context
   let fileContext = "";
   if (uploadedFiles.length > 0) {
      const collectionName = `${userId}_${conversationId}`;
      fileContext = await searchQdrant(question, null, null, null, 5, collectionName);
   }

   // 3️⃣ Build final context
   let contextPart = "";
   if (subjectContext && subjectContext.trim()) {
      contextPart += `--- Subject / Curriculum Context ---\n${subjectContext}\n\n`;
   }
   if (fileContext && fileContext.trim()) {
      contextPart += `--- User Uploaded Files Context ---\n${fileContext}\n\n`;
   }

   return contextPart;
}



exports.createConversation = async (req, res) => {
   try {
      const { userId, classId, yearId, subjectId, question } = req.body;
      const files = req.files || [];

      if (!userId || !classId || !yearId || !subjectId || !question) {
         return res.status(400).json({ success: false, message: "All fields required" });
      }

      const title = question.length > 50 ? question.substring(0, 47) + "..." : question;
      const newConversation = new Conversation({ userId, classId, subjectId, title, messages: [] });
      const savedConversation = await newConversation.save();
      const conversationId = savedConversation._id;

      // ✅ Upload files + embed into Qdrant
      const uploadedFiles = await handleFileUpload(files, userId, conversationId);

      const userMessage = {
         role: "user",
         content: question,
         files: uploadedFiles.map(f => ({ fileName: f.fileName, url: f.url })),
      };
      savedConversation.messages.push(userMessage);
      await savedConversation.save();

      // Build context (after embedding files)
      const contextPart = await buildContext(question, userId, conversationId, classId, yearId, subjectId, uploadedFiles);

      const historyMessages = savedConversation.messages.slice(-5).map(m => `${m.role}: ${m.content}`).join("\n");

      const llmPrompt = `
You are an AI tutor. Use the following context and history to answer concisely.

${contextPart}

History:
${historyMessages}

Question:
${question}
`;

      const aiResponseText = await callLLM(llmPrompt);
      const aiMessage = { role: "ai", content: aiResponseText, files: [], replyTo: userMessage._id };
      savedConversation.messages.push(aiMessage);
      savedConversation.updatedAt = new Date();
      await savedConversation.save();

      res.status(201).json({ success: true, conversationId, userMessage, aiMessage });

   } catch (err) {
      console.error("❌ createConversation error:", err);
      res.status(500).json({ message: "Internal server error", error: err.message });
   }
};

exports.addMessage = async (req, res) => {
   try {
      const { chatId } = req.query;
      const { userId, classId, yearId, subjectId, question } = req.body;
      const files = req.files || [];

      if (!chatId || !userId || !classId || !yearId || !subjectId || !question) {
         return res.status(400).json({ success: false, message: "All fields required" });
      }

      const conversation = await Conversation.findById(chatId);
      if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });

      // ✅ Upload files + embed into Qdrant
      const uploadedFiles = await handleFileUpload(files, userId, conversation._id);

      const userMessage = {
         role: "user",
         content: question,
         files: uploadedFiles.map(f => ({ fileName: f.fileName, url: f.url })),
      };
      conversation.messages.push(userMessage);
      await conversation.save();

      // Build context (after embedding files)
      const contextPart = await buildContext(question, userId, conversation._id, classId, yearId, subjectId, uploadedFiles);
      const historyMessages = conversation.messages.slice(-5).map(m => `${m.role}: ${m.content}`).join("\n");

      const llmPrompt = `
You are an AI tutor. Use the following context and history to answer concisely.

${contextPart}

History:
${historyMessages}

Question:
${question}
`;

      const aiResponseText = await callLLM(llmPrompt);
      const aiMessage = { role: "ai", content: aiResponseText, files: [], replyTo: userMessage._id };
      conversation.messages.push(aiMessage);
      conversation.updatedAt = new Date();
      await conversation.save();

      res.status(201).json({ success: true, conversationId: conversation._id, userMessage, aiMessage });

   } catch (err) {
      console.error("❌ addMessage error:", err);
      res.status(500).json({ message: "Internal server error", error: err.message });
   }
};
