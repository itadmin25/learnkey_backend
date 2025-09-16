const express = require("express");
const router = express.Router();
const chatController = require("../controller/chatCtrl.js");
const jwtAuth = require('../middileware/jwt.js');
const uploads = require('../middileware/multer.js')

router.post("/chat", jwtAuth, uploads.array("files"), chatController.createConversation);
router.post("/chat/message", jwtAuth, uploads.array("files"), chatController.addMessage);
router.get("/getConversationTitlesByUserId", jwtAuth, chatController.getConversationTitles);
router.get("/getConversationDetails", chatController.getConversationDetails);



module.exports = router;
