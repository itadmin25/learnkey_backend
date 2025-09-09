// utils/pdfHelper.js
const pdfParse = require("pdf-parse");

async function extractPdf(buffer) {
  const pdfData = await pdfParse(buffer);
  return pdfData.text;
}

module.exports = { extractPdf };