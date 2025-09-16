const express = require("express");
const router = express.Router();
const chatController = require("../controller/chatCtrl.js");
const jwtAuth = require('../middileware/jwt.js');
const uploads = require('../middileware/multer.js')

router.post("/chat", uploads.array("files"), chatController.createConversation);
router.post("/chat/message", uploads.array("files"), chatController.addMessage);

module.exports = router;
