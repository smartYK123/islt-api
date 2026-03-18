require("express-async-errors");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
process.env.TZ = 'Africa/Lagos';
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { Expo } = require('expo-server-sdk');
const crypto = require("crypto");

const app = express();
const secret = crypto.randomBytes(32).toString("hex");
//routers/sliderRoutes
app.use(cors());
app.use(morgan("dev"));
app.use("/videos", express.static(path.join(__dirname, "videos")));
const participationRoutes = require("./routers/participationRoutes");
// const router = require('./routers/route');
const expo = new Expo();
const session = require("express-session");
const departmentRoutes = require('./routers/departmentRoutes');

app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));
app.use(express.json());

app.use("/participation", participationRoutes);
app.use('/api', departmentRoutes);

//socket.io
app.use(
  session({
    secret: secret,
    resave: false,
    saveUninitialized: true,
  })
);
const jwt = require("jsonwebtoken");
mongoose.set("strictQuery", false);
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
app.use((error, req, res, next) => {
  res.status(500).json({ error: error.message });
});

const multer = require('multer');
app.get('/api', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API is running',
    time: new Date().toISOString()
  });
});
//secret


const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('Passenger started app on port', PORT);
  connectDB();
});


//app.use('/api/sliders', sliderRoutes);