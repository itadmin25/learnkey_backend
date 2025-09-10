const mongoose = require("mongoose");

const yearSchema = new mongoose.Schema(
  {
    year: { type: String, required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Year", yearSchema);
