const mongoose = require("mongoose");
const classSchema = new mongoose.Schema({
    class: { type: String, required: true },
    state: { type: mongoose.Schema.Types.ObjectId, ref: "State", required: true }
}, { timestamps: true });
module.exports = mongoose.model("Class", classSchema);