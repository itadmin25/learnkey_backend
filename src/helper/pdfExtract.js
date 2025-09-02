const pdfParse = require("pdf-parse");
const GPT3Tokenizer = require("gpt3-tokenizer").default;

async function extractAndPrepare(pdfBuffer) {
  // Step 1: Extract
  let { text } = await pdfParse(pdfBuffer);

  // Step 2: Clean text
  text = text
    .replace(/\r/g, "")                       // normalize CRLF
    .replace(/\n{3,}/g, "\n\n")               // collapse too many newlines
    .replace(/[ \t]+/g, " ")                  // collapse multiple spaces
    .replace(/DX @ www\.desibbrg\.com/gi, "") // remove watermark (case insensitive)
    .replace(/Page \d+ of \d+/gi, "")         // remove page numbers if present
    .trim();

  // Step 3: Tokenize
  const tokenizer = new GPT3Tokenizer({ type: "gpt3" });
  const encoded = tokenizer.encode(text);

  return {
    text,
    tokenCount: encoded.bpe.length,
  };
}

module.exports = { extractAndPrepare };
