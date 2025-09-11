const mongoose = require("mongoose");
const Country = require("../model/countryModel");
const Class = require("../model/chatModel");
const Year = require("../model/yearModel");
const Subject = require("../model/subjectModel");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

module.exports = {
  getMasterDataForAdmin: async (req, res) => {
  try {
    const { countryId, classId, yearId } = req.query;

    // Deepest level wins if multiple are sent
    if (yearId) {
      if (!isValidId(yearId)) {
        return res.status(400).json({ success: false, message: "Invalid yearId" });
      }
      const year = await Year.findById(yearId).select("_id");
      if (!year) return res.status(404).json({ success: false, message: "Year not found" });

      const subjects = await Subject.find({ yearId })
        .select("_id name")
        .sort({ name: 1 })
        .lean();

      return res.status(200).json({
        success: true,
        level: "subjects",
        parent: { yearId },
        data: subjects,
      });
    }

    if (classId) {
      if (!isValidId(classId)) {
        return res.status(400).json({ success: false, message: "Invalid classId" });
      }
      const classDoc = await Class.findById(classId).select("_id");
      if (!classDoc) return res.status(404).json({ success: false, message: "Class not found" });

      const years = await Year.find({ classId })
        .select("_id year")
        .sort({ year: 1 })
        .lean();

      return res.status(200).json({
        success: true,
        level: "years",
        parent: { classId },
        data: years.map((y) => ({ _id: y._id, name: y.year })),
      });
    }

    if (countryId) {
      if (!isValidId(countryId)) {
        return res.status(400).json({ success: false, message: "Invalid countryId" });
      }
      const country = await Country.findById(countryId).select("_id");
      if (!country) return res.status(404).json({ success: false, message: "Country not found" });

      const classes = await Class.find({ countryId })
        .select("_id class")
        .sort({ class: 1 })
        .lean();

      return res.status(200).json({
        success: true,
        level: "classes",
        parent: { countryId },
        data: classes.map((c) => ({ _id: c._id, name: c.class })),
      });
    }

    // Default: return all countries
    const countries = await Country.find()
      .select("_id name")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      level: "countries",
      data: countries,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

};
