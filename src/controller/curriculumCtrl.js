const AWS = require("aws-sdk");
const fs = require("fs");
const axios = require("axios");

const Curriculum = require("../model/curriculumModel.js");
const Book = require("../model/bookModel.js");
const Country = require("../model/countryModel");
const Class = require("../model/classModel.js");
const Year = require("../model/yearModel");
const Subject = require("../model/subjectModel");

const { uploadToS3 } = require("../helper/s3.js");
const pdfParse = require("pdf-parse");
const GPT3Tokenizer = require("gpt3-tokenizer").default;
const { embedAndSaveText } = require("../helper/qdrant.js");

const { QdrantClient } = require("@qdrant/js-client-rest");
const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
});

// Token count helper
function countTokens(text) {
  const tokenizer = new GPT3Tokenizer({ type: "gpt3" });
  return tokenizer.encode(text).bpe.length;
}

module.exports = {
  addCurriculumData: async (req, res) => {
    try {
      const { userId, countryId, yearId, classId, subjectId } = req.body;

      // ✅ Validate file
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "PDF file is required",
        });
      }

      // ✅ Validate required fields
      if (!countryId || !yearId || !classId || !subjectId) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      // ✅ Step 1: Extract text locally (before upload)
      const pdfBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(pdfBuffer);
      const extractedText = pdfData.text;

      // ✅ Step 2: Count tokens
      const tokenCount = 100000;
      console.log("📊 Token count:", tokenCount);

      // ✅ Step 3: Upload to S3
      const folderName = "curriculums";
      const s3Url = await uploadToS3(req.file, folderName);

      // ✅ Step 4: Decide book type
      let bookType = "pdf";
      let textData = "";

      // If ≤ 8k tokens → save text only (skip Qdrant)
      if (tokenCount <= 8000) {
        bookType = "text";
        textData = extractedText;
      }

      // ✅ Step 5: Save in Book collection
      const newBook = new Book({
        url: s3Url,
        type: bookType,
        text: textData,
      });
      await newBook.save();

      // ✅ Step 6: Fetch Class, Year, Subject names
      const classDoc = await Class.findById(classId).select("class");
      const yearDoc = await Year.findById(yearId).select("year");
      const subjectDoc = await Subject.findById(subjectId).select("name");
      console.log(classDoc, yearDoc, subjectDoc)
      if (!classDoc || !yearDoc || !subjectDoc) {
        return res.status(404).json({
          success: false,
          message: "Class, Year, or Subject not found",
        });
      }

      // ✅ Step 7: Build collection name
      const collectionName = `${classDoc.class}_${yearDoc.year}_${subjectDoc.name}`;
      console.log(collectionName)
      // ✅ Step 8: If > 8k tokens → embed + push into Qdrant
      if (tokenCount > 8000) {
        await embedAndSaveText({
          text: extractedText,
          metadata: {
            bookId: String(newBook._id),
            userId,
            countryId,
            yearId,
            classId,
            subjectId,
            s3Url,
          },
          collectionName,
        });
      }

      // ✅ Step 9: Save in Curriculum collection
      let existingCurriculum = await Curriculum.findOne({
        userId,
        countryId,
        yearId,
        classId,
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
          yearId,
          classId,
          subjectId,
        });
        await newCurriculum.save();
      }

      // ✅ Step 10: Delete local temp file
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

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
      console.error("❌ Error in addCurriculumData:", error);

      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(500).json({
        success: false,
        message: "Error uploading curriculum",
        error: error.message,
      });
    }
  },

  getQudrantCollections: async (req, res) => {
    try {
      const collections = await qdrantClient.getCollections();
      res.status(200).json({
        success: true,
        collections: collections.collections.map(c => c.name),
      });
    } catch (error) {
      console.error("Error fetching collections:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getCollectionByName: async (req, res) => {
    try {
      const { name } = req.query;
      const points = await qdrantClient.scroll(name, { limit: 50 });
      res.status(200).json({
        success: true,
        collection: name,
        points: points.points,
      });
    } catch (error) {
      console.error("Error fetching points:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
 availableClasses: async (req, res) => {
  try {
    const curriculums = await Curriculum.find().populate("classId", "class");

    const uniqueClasses = {};
    curriculums.forEach(c => {
      if (c.classId) {
        uniqueClasses[c.classId._id] = c.classId.class;
      }
    });

    const classes = Object.keys(uniqueClasses).map(id => ({
      _id: id,
      name: uniqueClasses[id],
    }));

    res.status(200).json({
      success: true,
      message: "Successfully fetched all classes",
      data: classes,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
},

availableSubjects: async (req, res) => {
    try {
      let { classId, 'classId[]': classIdArray } = req.query;
      classId = classId || classIdArray;


      if (!classId) {
        return res.status(400).json({ message: "classId is required" });
      }

      // If only one classId is sent, wrap it in array
      if (!Array.isArray(classId)) {
        classId = [classId];
      }

      const curriculums = await Curriculum.find({ classId: { $in: classId } })
        .populate("subjectId", "name");

      const uniqueSubjects = {};
      curriculums.forEach(c => {
        if (c.subjectId) {
          uniqueSubjects[c.subjectId._id] = c.subjectId.name;
        }
      });

      const subjects = Object.keys(uniqueSubjects).map(id => ({
        _id: id,
        name: uniqueSubjects[id],
      }));

      res.status(200).json({
        success: true,
        message: "Successfully fetched all subjects",
        data: subjects,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

};
