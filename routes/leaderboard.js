const express = require("express");
const router = express.Router();
const generateUserId = require("./userId"); // Ya correct path select karein

// Fake/In-memory Leaderboard Data (Agar DB connect nahi hai)
let leaderboardData = [
    { userId: "CRA-A1B2C3D4E5", username: "Player1", score: 1500, completionTime: 120 },
    { userId: "CRA-F6G7H8I9J0", username: "Player2", score: 1200, completionTime: 140 }
];

// Leaderboard Get API
router.get("/", (req, res) => {
    try {
        // High score pehle, tie-breaker ke liye kam time pehle
        const sortedData = leaderboardData.sort((a, b) => b.score - a.score || a.completionTime - b.completionTime);
        res.status(200).json({ success: true, leaderboard: sortedData });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Score Update API
router.post("/update-score", (req, res) => {
    const { userId, username, score, completionTime } = req.body;

    const existingUser = leaderboardData.find(user => user.userId === userId);
    if (existingUser) {
        existingUser.score += score;
        existingUser.completionTime += completionTime;
    } else {
        leaderboardData.push({
            userId: userId || generateUserId(),
            username: username || "Anonymous",
            score: score || 0,
            completionTime: completionTime || 0
        });
    }

    res.status(200).json({ success: true, message: "Score updated successfully" });
});

module.exports = router;
