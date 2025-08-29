const Country = require("../model/countryModel");
const State = require("../model/stateModel");
const Class = require("../model/classModel");
const Year = require("../model/yearModel");
const Subject = require("../model/subjectModel");

module.exports = {
    getMasterDataForAdmin: async (req, res) => {
        try {
            const { countryId } = req.query;

            // If no countryId, return all countries
            if (!countryId) {
                const countries = await Country.find();
                return res.status(200).json({ success: true, data: countries });
            }

            // If countryId is provided, return full mapping for that country
            const country = await Country.findById(countryId);
            if (!country) {
                return res.status(404).json({ success: false, message: "Country not found" });
            }

            const states = await State.find({ country: countryId });
            const stateArr = [];
            for (const state of states) {
                const classes = await Class.find({ state: state._id });
                const classArr = [];
                for (const classDoc of classes) {
                    const years = await Year.find({ state: state._id, class: classDoc._id });
                    const yearArr = [];
                    for (const year of years) {
                        const subjects = await Subject.find({ year: year._id });
                        yearArr.push({
                            year: year.year,
                            subjects: subjects.map(sub => sub.name)
                        });
                    }
                    classArr.push({
                        class: classDoc.class,
                        years: yearArr
                    });
                }
                stateArr.push({
                    name: state.name,
                    classes: classArr
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    country: country.name,
                    states: stateArr
                }
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
}