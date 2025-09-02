const AWS = require("aws-sdk");
const Curriculum = require("../model/curriculumModel.js");
const Book = require("../model/bookModel.js");
const { uploadToS3 } = require("../helper/s3.js");
const { extractAndPrepare } = require("../helper/pdfExtract.js");
const { embedAndSaveText } = require("../helper/qdrant.js");

const fs = require("fs");
const axios = require("axios");

module.exports = {
  addCurriculumData: async (req, res) => {
    try {
      const { userId, countryId, stateId, yearId, subjectId } = req.body;

      // Validate file
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "PDF file is required",
        });
      }

      // Validate required fields
      if (!countryId || !stateId || !yearId || !subjectId) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      // Upload file to S3
      const folderName = "curriculums";
      const s3Data = await uploadToS3(req.file, folderName);

      // Fetch PDF from S3
      const response = await axios.get(s3Data, { responseType: "arraybuffer" });
      const pdfBuffer = Buffer.from(response.data, "binary");

      // Extract + clean + tokenize
      const { text: extractedText, tokenCount } = await extractAndPrepare(pdfBuffer);
      console.log("Token count:", tokenCount);
      
      // Decide type
      let bookType = "pdf";
      let textData = "";
      if (tokenCount <= 8000) {
        bookType = "text";
        textData = extractedText;
      }

      // Save in Book collection
      const newBook = new Book({
        url: s3Data,
        type: bookType,
        text: textData,
      });
      await newBook.save();

      // Save in Qdrant (only if tokenCount > 8000)
      if (tokenCount > 1000) {
        console.log("Dededed")
        await embedAndSaveText({
          text: extractedText,
          metadata: {
            bookId: String(newBook._id),
            userId,
            countryId,
            stateId,
            yearId,
            subjectId,
            s3Url: s3Data,
          },
        });
      }

      // Save in Curriculum collection
      let existingCurriculum = await Curriculum.findOne({
        userId,
        countryId,
        stateId,
        yearId,
        subjectId,
      });

      let newCurriculum;
      if (existingCurriculum) {
        existingCurriculum.files.push(newBook._id);
        await existingCurriculum.save();
        newCurriculum = existingCurriculum;
      } else {
        newCurriculum = new Curriculum({
          userId,
          files: [newBook._id],
          countryId,
          stateId,
          yearId,
          subjectId,
        });
        await newCurriculum.save();
      }

      // Delete local temp file
      fs.unlinkSync(req.file.path);

      return res.status(200).json({
        success: true,
        message: "Curriculum uploaded successfully",
        data: {
          curriculum: newCurriculum,
          book: newBook,
          tokenCount,
        },
      });
    } catch (error) {
      console.error("Error in addCurriculumData:", error);

      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(500).json({
        success: false,
        message: "Error uploading curriculum",
        error: error.message,
      });
    }
  },
};
