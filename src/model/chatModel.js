const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
    url: { type: String, required: true },  
    fileName: { type: String, required: true },
    fileType: { type: String },
    uploadedAt: { type: Date, default: Date.now },
});

const messageSchema = new mongoose.Schema({
    role: { type: String, enum: ["user", "ai"], required: true },
    content: { type: String },
    files: [fileSchema],
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation.messages" }, 
    editedAt: { type: Date },
});

const conversationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    title: { type: String, required: true },
    messages: [messageSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Conversation", conversationSchema);
