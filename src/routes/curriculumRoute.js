const express = require('express')
const router = express.Router()
const jwtAuth = require('../middileware/jwt.js');
const curriculumCtrl = require('../controller/curriculumCtrl.js')
const uploads = require('../middileware/multer.js')

router.post('/addCurriculumData', uploads.single("file"), curriculumCtrl.addCurriculumData)

module.exports = router;