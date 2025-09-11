const mongoose = require("mongoose");
const classSchema = new mongoose.Schema({
    class: { type: String, required: true },
    country: { type: mongoose.Schema.Types.ObjectId, ref: "Country", required: true }
}, { timestamps: true });
module.exports = mongoose.model("Class", classSchema);