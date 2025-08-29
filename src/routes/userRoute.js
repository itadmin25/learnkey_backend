const express = require('express')
const router = express.Router()
const jwtAuth = require('../middileware/jwt.js');
const userCtrl = require('../controller/userCtrl.js')


router.post('/registration', userCtrl.register)
router.post('/setupProfile',jwtAuth, userCtrl.setupProfile)
router.post('/login', userCtrl.login)
router.post("/updateUser", jwtAuth, userCtrl.updateUser);
router.get('/getUserById',jwtAuth,userCtrl.getUserById)


module.exports = router;