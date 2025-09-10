const express = require("express");
const router = express.Router();
const chatController = require("../controller/chatCtrl.js");
const jwtAuth = require('../middileware/jwt.js');

router.post("/chat", chatController.createConversation);
router.post("/chat/message", chatController.addMessage);

module.exports = router;
