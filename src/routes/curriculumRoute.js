const express = require('express')
const router = express.Router()
const jwtAuth = require('../middileware/jwt.js');
const curriculumCtrl = require('../controller/curriculumCtrl.js')
const uploads = require('../middileware/multer.js')

router.post('/addCurriculumData', uploads.single("file"), curriculumCtrl.addCurriculumData)
router.get('/getQdrantCollections', curriculumCtrl.getQudrantCollections)
router.get('/getQdrantCollectionByName', curriculumCtrl.getCollectionByName)

router.get('/availableClasses', curriculumCtrl.availableClasses)
router.get('/availableStates', curriculumCtrl.availableStates)
router.get('/availableSubjects', curriculumCtrl.availableSubjects)





module.exports = router;