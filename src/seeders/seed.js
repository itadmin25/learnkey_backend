const dotenv = require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Models
const Country = require("../model/countryModel");
const Year = require("../model/yearModel");
const Subject = require("../model/subjectModel");
const Class = require("../model/conversationModel");

const MONGO_URI = process.env.MONGODB_URL;

const readJSON = (file) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, file), "utf8"));

const importData = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    const data = readJSON("pairs.au.json");
    // await Country.deleteMany({});
    // await Class.deleteMany({});
    // await Year.deleteMany({});
    // await Subject.deleteMany({});

    for (const countryObj of data.countries) {
      // Insert country
      const country = await Country.findOneAndUpdate(
        { name: countryObj.name },
        { name: countryObj.name, countryCode: "AU" },
        { new: true, upsert: true }
      );

      for (const classObj of countryObj.classes) {
        // Insert class (linked directly to country)
        const classDoc = await Class.findOneAndUpdate(
          { class: classObj.class, country: country._id },
          { class: classObj.class, country: country._id },
          { new: true, upsert: true }
        );

        for (const yearObj of classObj.years) {
          // Insert year (reference class only)
          const year = await Year.findOneAndUpdate(
            { year: yearObj.year, class: classDoc._id },
            { year: yearObj.year, class: classDoc._id },
            { new: true, upsert: true }
          );

          for (const subjectName of yearObj.subjects) {
            // Insert subject
            await Subject.findOneAndUpdate(
              { name: subjectName, year: year._id },
              { name: subjectName, year: year._id },
              { new: true, upsert: true }
            );
          }
        }
      }
    }

    console.log("🎉 seeding done");
    process.exit();
  } catch (err) {
    console.error("❌ seed error:", err);
    process.exit(1);
  }
};

const deleteData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    await Country.deleteMany({});
    await Class.deleteMany({});
    await Year.deleteMany({});
    await Subject.deleteMany({});
    console.log("🗑 all collections cleared");
    process.exit();
  } catch (err) {
    console.error("❌ delete error:", err);
    process.exit(1);
  }
};

if (process.argv[2] === "-i") {
  importData();
} else if (process.argv[2] === "-d") {
  deleteData();
} else {
  process.exit();
}
