const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer = require('./src/middileware/multer.js');
const cors = require('cors');
const path = require('path');
const port = process.env.PORT;
const dbConnection = require('./src/database/db.js');
// const seeder= require('./src/seeders/seed.js')


// Importing routes
const userRoutes = require('./src/routes/userRoute.js');
const masterDataRoutes = require('./src/routes/masterDataRoute.js')
const curriculumRoutes = require('./src/routes/curriculumRoute.js')
const chatRoutes = require("./src/routes/chatRoutes.js");

// ✅ Global Middleware AFTER webhook
app.use(bodyParser.json());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.use(cors({
    origin: '*'
}));

// ✅ Define routes
app.use('/api', userRoutes);
app.use('/api', masterDataRoutes);
app.use('/api', curriculumRoutes);
app.use("/api", chatRoutes);

// Start server
app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
});

