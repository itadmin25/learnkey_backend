const Class = require("../model/classModel");
const Year = require("../model/yearModel");
const Subject = require("../model/subjectModel");

async function getCollectionName(classId, yearId, subjectId) {
  const classDoc = await Class.findById(classId).select("class");
  const yearDoc = await Year.findById(yearId).select("year");
  const subjectDoc = await Subject.findById(subjectId).select("name");
  if (!classDoc || !yearDoc || !subjectDoc) {
    throw new Error("Class, Year, or Subject not found");
  }

  return `${classDoc.class}_${yearDoc.year}_${subjectDoc.name}`;
}

module.exports = getCollectionName;
