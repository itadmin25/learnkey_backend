const { uploadToS3 } = require("./s3");
const { extractTextFromFile } = require("./fileTextExtract");
const { embedAndSaveText } = require("./qdrant");

async function handleFileUpload(files, userId, conversationId) {

  if (!files || files.length === 0) return [];

const uploadedFiles = await Promise.all(
  files.map(async file => {
    try {
      const s3Url = await uploadToS3(file, "user_files");
      const text = await extractTextFromFile(file);

      return { fileName: file.originalname, fileType: file.mimetype, url: s3Url, text: text || "" };
    } catch (err) {
      console.error("❌ File upload/extract failed:", file.originalname, err.message);
      return null;
    }
  })
);


  const validFiles = uploadedFiles.filter(f => f !== null);

  // Embed non-empty text into Qdrant collection (creates the collection)
  if (validFiles.length > 0) {
    const collectionName = `${userId}_${conversationId}`;
    await Promise.all(validFiles.map(async file => {
      if (file.text && file.text.length > 0) {
        try {
          await embedAndSaveText({
            text: file.text,
            collectionName,
            metadata: {
              userId,
              conversationId: String(conversationId),
              fileName: file.fileName,
              fileType: file.fileType,
              url: file.url,
            },
          });
        } catch (err) {
          console.error("❌ Embedding failed:", file.fileName, err.message);
        }
      }
    }));
  }

  return validFiles;
}

module.exports = { handleFileUpload };
