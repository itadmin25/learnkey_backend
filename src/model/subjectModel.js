const mongoose = require("mongoose");
const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    year: { type: mongoose.Schema.Types.ObjectId, ref: "Year", required: true }
}, { timestamps: true });
module.exports = mongoose.model("Subject", subjectSchema);