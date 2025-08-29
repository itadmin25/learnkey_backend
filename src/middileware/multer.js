const multer = require('multer');
const fs = require('fs');
const path = require('path');

const upload = multer({
        storage: multer.diskStorage({
                // Destination to store image
                destination: function (req, file, cb) {
                        cb(null, './uploads')
                },
                filename: function (req, file, cb) {
                  const randomFourDigits = Math.floor(1000 + Math.random() * 9000);
                  cb(null, randomFourDigits + '_' + file.originalname);
                }
        })
})
module.exports = upload;
