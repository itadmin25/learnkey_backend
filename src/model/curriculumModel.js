const mongoose = require("mongoose");

const curriculumSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    yearId: { type: mongoose.Schema.Types.ObjectId, ref: "Year", required: true },
    countryId: { type: mongoose.Schema.Types.ObjectId, ref: "Country", required: true },
    files: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
      },
    ],
    // vectorized: { type: Boolean, default: false },
    // vectorRef: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Curriculum", curriculumSchema);
