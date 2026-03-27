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
const trainingVideo = require ("./models/trainingVideo1")
const homeLikeRoutes = require("./routers/homeLikeRouter");
const homeCommentRoutes = require("./routers/homeCommentRouter");
const commentRoutes = require("./routers/commentRoute");
const quizDurationRoutes = require('./routers/quizDurationRouter');
const Notify = require("./models/notify")

const likeRoutes = require("./routers/likeRouter");
const app = express();
const secret = crypto.randomBytes(32).toString("hex");
app.use(cors());
app.use(morgan("dev"));
app.use("/videos", express.static(path.join(__dirname, "videos")));
const participationRoutes = require("./routers/participationRoutes");
const expo = new Expo();
const session = require("express-session");
const departmentRoutes = require('./routers/departmentRoutes');
const dailyQuoteRoutes = require('./routers/dailyQuoteRoutes');
const meetingRoutes = require('./routers/myMeetingRouter');
const warRoomRoutes = require("./routers/warRoomRouter");
const pinnedNoticesRoutes = require('./routers/pinNoticesRoute');

const sliderIsltRoutes = require('./routers/sliderIsltRouter');
const traingISLTRoutes = require("./routers/trainingISLTrouter");
const verifyMentee = require("./routers/verifymenteeRouter");
const eventRoutes = require("./routers/eventsRouter");
const router = require('./routers/route');
const MenteeCode = require("./models/menteeCode");
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));
app.use(express.json());
const WarRoom = require("./models/warRoom");

const kcCallback = require("./routers/kc_callbackRoute");
const validateToken = require("./routers/validate-token");
app.use("/api/events", eventRoutes);
app.use('/api', router)
app.use('/api', pinnedNoticesRoutes);
app.use("/comments", commentRoutes);
app.use('/api', quizDurationRoutes);
app.use("/likes", likeRoutes);
app.use("/homeLikes", homeLikeRoutes);
app.use("/homeComments", homeCommentRoutes);
app.use("/trainingVideo", traingISLTRoutes);
app.use('/api/quotes', dailyQuoteRoutes);
app.use('/sliderislt', sliderIsltRoutes);
app.use("/participation", participationRoutes);
app.use("/kc_callback", kcCallback);
app.use("/validate-token", validateToken);
app.use("/", verifyMentee);
app.use('/api', departmentRoutes);
app.use('/api', meetingRoutes);
app.use("/api", warRoomRoutes);
app.use(
  session({
    secret: secret,
    resave: false,
    saveUninitialized: true,
  })
);

// Routes
app.post("/api/warroom", async (req, res) => {
  try {
    const { imageUrls,prayerdate,prayertitle, prayer } = req.body;
    const warRoom = new WarRoom({ imageUrls,prayerdate,prayertitle, prayer });
    await warRoom.save();
    res.status(201).json({ message: "Images posted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes
app.get("/api/warroom", async (req, res) => {
  try {
    const warRooms = await WarRoom.find();
    res.status(200).json(warRooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/notify", async (req, res) => {
  try {
    const { id, user, title, media, description, image, userId,thumbnail,caaoiselimage } = req.body;

    // Normalize the image field to always be an array
    const normalizedImage = Array.isArray(caaoiselimage) ? caaoiselimage : [caaoiselimage];

    const newInformals = new Notify({
      id,
      user,
      title,
      image,
      caaoiselimage: normalizedImage, // Store as an array
      media: {
        type: media.type,
        content: media.content,
        thumbnail: media.thumbnail,
      },
      thumbnail,
      description,
      isNew: true,
      userId,
    });

    const savedInformals = await newInformals.save();

    console.log(savedInformals);
    res.status(201).json(savedInformals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.post("/api/notifications/markAsRead", async (req, res) => {
  try {
    const { userId } = req.body;
    await Notify.updateMany(
      { isNew: true, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );
    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/notifications", async (req, res) => {
  try {
    const { userId, includeUnreadCount } = req.query; // Check if unreadCount is requested
    const informals = await Notify.find().sort({ createdAt: -1 });

    // Filter notifications for the user
    const filteredInformals = informals.map(notification => ({
      ...notification.toObject(),
      isNew: !notification.readBy.includes(userId),
    }));

    if (includeUnreadCount === "true") {
      // Count unread notifications
      const unreadCount = filteredInformals.filter(notification => notification.isNew).length;

      return res.status(200).json({ notifications: filteredInformals, unreadCount });
    }

    // Return just the notifications if unreadCount is not requested
    res.status(200).json(filteredInformals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// 🔥 Paste your codes here
const rawCodes = [
"ISLT202528",
"ISLT202556",
"ISLT202530",
"ISLT202521",
"ISLT202551",
"ISLT202535",
"ISLT202537",
"ISLT202518",
"ISLT202534",
"ISLT2025311",
"ISLT202512",
"ISLT20255",
"ISLT2025251",
"ISLT20256",
"ISLT202538",
"ISLT2025258",
"ISLT202558",
"ISLT202526",
"ISLT202531",
"ISLT202523",
"ISLT2025259",
"ISLT2025253",
"ISLT202514",
"ISLT202554",
"ISLT202529",
"ISLT202517",
"ISLT202524",
"ISLT202548",
"ISLT202525",
"ISLT202532",
"ISLT202527",
"ISLT202552",
"ISLT202531",
"ISLT202546",
"ISLT2025308",
"ISLT202555",
"ISLT202559",
"ISLT202511",
"ISLT202533",
"ISLT202536",
"ISLT202547",
"ISLT202539",
"ISLT202540",
"ISLT202544",
"ISLT202515",
"ISLT202542",
"ISLT202541",
"ISLT202557",
"ISLT202516",
"ISLT202519",
"ISLT2025260",
"ISLT20257",
"ISLT202514",
"ISLT202535",
"ISLT2025308",
"ISLT202530",
"ISLT2025101",
"ISLT2025314",
"ISLT2025111",
"ISLT20250185",
"ISLT2025166",
"ISLT2025051",
"ISLT2025069",
"ISLT2025005",
"ISLT2025081",
"ISLT2025055",
"ISLT2025041",
"ISLT2025095",
"ISLT2025038",
"ISLT2025191",
"ISLT2025231",
"ISLT2025205",
"ISLT2025236",
"ISLT2025186",
"ISLT2025204",
"ISLT2025126",
"ISLT2025008",
"ISLT2025140",
"ISLT2025003",
"ISLT2025230",
"ISLT2025089",
"ISLT2025063",
"ISLT2025017",
"ISLT2025060",
"ISLT2025001",
"ISLT2025038",
"ISLT2025226",
"ISLT2025142",
"ISLT2025218",
"ISLT2025178",
"ISLT2025164",
"ISLT2025083",
"ISLT2025195",
"ISLT2025214",
"ISLT2025193",
"ISLT2025228",
"ISLT2025005",
"ISLT20250152",
"ISLT2025241",
"ISLT2025224",
"ISLT2025136",
"ISLT2025001",
"ISLT2025222",
"ISLT2025145",
"ISLT2025237",
"ISLT20250185",
"ISLT2025149",
"ISLT2025215",
"ISLT2025174",
"ISLT20250182",
"ISLT2025229",
"ISLT2025195",
"ISLT2025195",
"ISLT2025195",
"ISLT2025195",
"ISLT2025195",
"ISLT2025195",
"ISLT2025195",
"ISLT2025195",
"ISLT2025195",
"ISLT2025195",
"ISLT2025195",
"ISLT2025218",
"ISLT2025214",
"ISLT2025034",
"ISLT2025044",
"ISTL2025213",
"ISLT2025228",
"ISLT2025169",
"ISLT2025014",
"ISLT2025172",
"ISLT2025229",
"ISLT2025192",
"ISLT20250153",
"ISLT2025052",
"ISLT2025199",
"ISLT2025162",
"ISLT2025073",
"ISLT20250152",
"ISLT2025206",
"ISLT2025165",
"ISLT2025109",
"ISLT2025210",
"ISLT2025072",
"ISLT2025212",
"ISLT2025052",
"ISLT2025038",
"ISLT2025209",
"ISLT2025198",
"ISLT20250120",
"ISLT2025024",
"ISLT2025142",
"ISLT2025101",
"ISLT2025201",
"ISLT2025191",
"ISLT2025172",
"ISLT2025203",
"ISLT2025143",
"ISLT2025189",
"ISLT2025189",
"ISLT2025016",
"ISLT2025022",
"ISLT2025186",
"ISLT2025076",
"ISLT2025046",
"ISLT20250184",
"ISLT2025028",
"ISLT2025077",
"ISLT2025036",
"ISLT2025002",
"ISLT2025091",
"ISLT2025179",
"ISLT2025095",
"ISLT2025100",
"ISLT20250155",
"ISLT2025023",
"ISLT20250181",
"ISLT2025164",
"ISLT2025163",
"ISLT2025068",
"ISLT2025060",
"ISLT2025010",
"ISLT2025170",
"ISLT2025113",
"ISLT20250123",
"ISLT2025052",
"ISLT2025030",
"ISLT2025071",
"ISLT2025005",
"ISLT2025178",
"ISLT2025062",
"ISLT2025126",
"ISLT2025145",
"ISLT2025104",
"ISLT2025131",
"ISLT2025004",
"ISLT2025140",
"ISLT2025079",
"ISLT2025040",
"ISLT2025125",
"ISLT20250117",
"ISLT20250153",
"ISLT20250118",
"ISLT2025074",
"ISLT2025006",
"ISLT2025072",
"ISLT2025491",
"ISLT2025180",
"ISLT2025056",
"ISLT2025139",
"ISLT2025036",
"ISLT2025111",
"ISLT20250122",
"ISLT2025066",
"ISLT2025098",
"ISLT2025064",
"ISLT2025070",
"ISLT2025015",
"ISLT2025147",
"ISLT2025124",
"ISLT2025011",
"ISLT20250154",
"ISLT2025141",
"ISLT2025045",
"ISLT2025043",
"ISLT2025137",
"ISLT2025024",
"ISLT2025156",
"ISLT2025017",
"ISLT2025097",
"ISLT2025033",
"ISLT2025132",
"ISLT2025168",
"ISLT2025091",
"ISLT2025110",
"ISLT2025057",
"ISLT2025083",
"ISLT2025105",
"ISLT2025115",
"ISLT2025105",
"ISLT2025031",
"ISLT2025014",
"ISLT2025025",
"ISLT20250151",
"ISLT2025069",
"ISLT2025008",
"ISLT2025082",
"ISLT2025138",
"ISLT2025090",
"ISLT2025042",
"ISLT2025127",
"ISLT2025037",
"ISLT2025029",
"ISLT2025055",
"ISLT2025041",
"ISLT2025103",
"ISLT2025050",
"ISLT2025063",
"ISLT2025093",
"ISLT2025035",
"ISLT2025109",
"ISLT2025049",
"ISLT20250129",
"ISLT2025080",
"ISLT2025107",
"ISLT2025134",
"ISLT2025048",
"ISLT2025130",
"ISLT2025142",
"ISLT2025081",
"ISLT2025088",
"ISLT2025150",
"ISLT2025112",
"ISLT2025176",
"ISLT2025146",
"ISLT2025165",
"ISLT2025133",
"ISLT2025019",
"ISLT2025018",
"ISLT2025085",
"ISLT2025038",
"ISLT20250121",
"ISLT20250119",
"ISLT2025108",
"ISLT2025027",
"ISLT20250135",
"ISLT2025067",
"ISLT2025171",
"ISLT2025148",
"ISLT2025136",
"ISLT2025136",
"ISLT2025116",
"ISLT2025003",
"ISLT2025065",
"ISLT2025012",
"ISLT2025054",
"ISLT2025001",
"ISLT2025047",
"ISLT2025078",
"ISLT2025051",
"ISLT2025106",
"ISLT2025038",
];

// ✅ CLEAN + REMOVE DUPLICATES
const cleanedCodes = [...new Set(
  rawCodes.map(code => code.trim().toUpperCase())
)];
//seed
async function seedCodes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const docs = cleanedCodes.map(code => ({
      code,
      used: false,
    }));

    const result = await MenteeCode.insertMany(docs, {
      ordered: false, // skip duplicates
    });

    console.log(`✅ Inserted ${result.length} codes`);
    process.exit();
  } catch (err) {
    console.error("❌ Error inserting codes:", err.message);
    process.exit(1);
  }
}

//  seedCodes();
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

// app.get("/trainingVideo", async (req, res) => {
//   try {
//     const data = await trainingVideo.find({}).sort({ updatedAt: -1 });
//     res.send(data);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });
// app.post("/trainingVideo", async (req, res) => {
//   try {
//     const { id, user, title, media, description, image } = req.body;
//     const newCecbs = new trainingVideo({
//       id,
//       user,
//       title,
//       image,
//       media: {
//         type: media.type,
//         content: media.content,
//         thumbnail: media.thumbnail,
//       },
//       description,
//     });

//     const savedCecbs = await newCecbs.save();

//     console.log(savedCecbs);
//     res.status(201).json(savedCecbs);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

const multer = require('multer');
app.get('/api', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API is running',
    time: new Date().toISOString()
  });
});
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('Passenger started app on port', PORT);
  connectDB();
});
//Inserted 20 codes
//seed