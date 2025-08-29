const pdfParse = require("pdf-parse");
const GPT3Tokenizer = require("gpt3-tokenizer").default;

/**
 * Extracts text from a PDF buffer, cleans it,
 * and returns { text, tokenCount }.
 */
async function extractAndPrepare(pdfBuffer) {
  // Step 1: Extract
  let pdfData = await pdfParse(pdfBuffer);
  let text = pdfData.text;

  // Step 2: Clean (preserve structure, remove noise)
  text = text
    .replace(/\r/g, "")                       // normalize CRLF
    .replace(/\n{3,}/g, "\n\n")               // collapse too many newlines
    .replace(/[ \t]+/g, " ")                  // collapse multiple spaces
    .replace(/DX @ www\.desibbrg\.com/g, "")  // remove watermark
    .trim();

  // Step 3: Tokenize
  const tokenizer = new GPT3Tokenizer({ type: "gpt3" });
  const encoded = tokenizer.encode(text);
  const tokenCount = encoded.bpe.length;

  return { text, tokenCount };
}

module.exports = { extractAndPrepare };
