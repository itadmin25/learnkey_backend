const express = require('express')
const router = express.Router()
const jwtAuth = require('../middileware/jwt.js');
const masterDataCtrl = require('../controller/masterDataCtrl.js')

router.get('/admin/data', masterDataCtrl.getMasterDataForAdmin)

module.exports = router;