require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// Routes Import
const authRoute = require("./routes/auth");
const adRoute = require("./routes/ad");
const rewardRoute = require("./routes/reward");
const redeemRoute = require("./routes/redeem");
const adminRoute = require("./routes/admin");
const leaderboardRoute = require("./routes/leaderboard");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes Register
app.use("/api/auth", authRoute);
app.use("/api/ad", adRoute);
app.use("/api/reward", rewardRoute);
app.use("/api/redeem", redeemRoute);
app.use("/api/admin", adminRoute);
app.use("/api/leaderboard", leaderboardRoute);

// Serve Frontend Files
app.use(express.static(path.join(__dirname, "../www")));

// Database Folder & Paths
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const usersFile = path.join(dataDir, "users.json");
const timerFile = path.join(dataDir, "timer.json");

// JSON Read/Write Helpers
const readData = (filePath) => {
    if (!fs.existsSync(filePath)) return [];
    try {
        const content = fs.readFileSync(filePath, "utf8");
        return content ? JSON.parse(content) : [];
    } catch (e) {
        return [];
    }
};

const writeData = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
};

// 7-Day Leaderboard Timer Engine
const getTimerData = () => {
    if (!fs.existsSync(timerFile)) {
        const cycleEndTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
        const initialTimer = { cycleEndTime };
        writeData(timerFile, initialTimer);
        return initialTimer;
    }
    try {
        const content = fs.readFileSync(timerFile, "utf8");
        const parsed = JSON.parse(content);
        if (!parsed || !parsed.cycleEndTime) throw new Error("Invalid timer");
        return parsed;
    } catch (e) {
        const cycleEndTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
        const fallbackTimer = { cycleEndTime };
        writeData(timerFile, fallbackTimer);
        return fallbackTimer;
    }
};

// Auto Leaderboard Reset Check (Every 1 Minute)
setInterval(() => {
    let timer = getTimerData();
    if (Date.now() >= Number(timer.cycleEndTime)) {
        let users = readData(usersFile);

        if (users.length > 0) {
            users.sort((a, b) => (b.adsWatched || 0) - (a.adsWatched || 0));
            if (users[0] && (users[0].adsWatched || 0) > 0) {
                users[0].totalBalance = (users[0].totalBalance || 0) + 1000000000;
            }
        }

        users = users.map(u => ({ ...u, adsWatched: 0 }));
        writeData(usersFile, users);

        const newTimer = { cycleEndTime: Date.now() + 7 * 24 * 60 * 60 * 1000 };
        writeData(timerFile, newTimer);
        console.log("🏆 Leaderboard Cycle Reset & Winner Rewarded!");
    }
}, 60000);

// Home Route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../www/index.html"));
});

// Start Server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server Running on port ${PORT}`);
});
