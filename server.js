require("dotenv").config();

const express = require("express");
const cors = require("cors");

const fs = require("fs");
const path = require("path");

const authRoute = require("./routes/auth");
const adRoute = require("./routes/ad");
const rewardRoute = require("./routes/reward");
const redeemRoute = require("./routes/redeem");
const adminRoute = require("./routes/admin");
// 1. Leaderboard Route Import Kiya
const leaderboardRoute = require("./routes/leaderboard");

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================
// Middleware
// ==========================

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoute);
app.use("/api/ad", adRoute);
app.use("/api/reward", rewardRoute);
app.use("/api/redeem", redeemRoute);
app.use("/api/admin", adminRoute);
// 2. Leaderboard API Register Ki
app.use("/api/leaderboard", leaderboardRoute);

// Frontend Folder
app.use(express.static(path.join(__dirname, "../www")));

// ==========================
// Database Files
// ==========================

const usersFile = path.join(__dirname, "data", "users.json");
const rewardsFile = path.join(__dirname, "data", "rewards.json");
const redeemFile = path.join(__dirname, "data", "redeem.json");
const adLogsFile = path.join(__dirname, "data", "ad_logs.json");

// ==========================
// Home Route
// ==========================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../www/index.html"));
});

// ==========================
// Start Server
// ==========================

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server Running on port ${PORT}`);
});
