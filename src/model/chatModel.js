const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    role: {
        type: String,
        enum: ["student", "teacher"],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
}, { timestamps: true });

const chatSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    title: { type: String },
    messages: [messageSchema],
    totalInputTokens: { type: Number, default: 0 },
    totalOutputTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("chat", chatSchema);
