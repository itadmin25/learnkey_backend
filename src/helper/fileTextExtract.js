const { extractPdf } = require("./pdfExtract");
const mammoth = require("mammoth");
const fs = require("fs").promises;

async function extractTextFromFile(file) {
  try {
    if (!file) return "";

    console.log("Extracting file:", file.originalname, "mimetype:", file.mimetype);

    // Get content from buffer or read from disk
    let dataBuffer = file.buffer;
    if (!dataBuffer && file.path) {
      dataBuffer = await fs.readFile(file.path);
    }

    if (!dataBuffer) return "";

    if (file.mimetype === "application/pdf") {
      const text = await extractPdf(dataBuffer);
      console.log("Extracted PDF text length:", text?.length);
      return text || "";
    } 
    else if (file.mimetype.includes("text")) {
      const text = dataBuffer.toString("utf-8");
      console.log("Extracted text file length:", text?.length);
      return text || "";
    } 
    else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      console.log("Extracted DOCX text length:", result?.value?.length);
      return result?.value || "";
    } 
    else {
      console.warn("⚠️ Unsupported file type for embedding:", file.mimetype);
      return "";
    }
  } catch (err) {
    console.error("❌ Error extracting text:", err.message);
    return "";
  }
}

module.exports = { extractTextFromFile };
