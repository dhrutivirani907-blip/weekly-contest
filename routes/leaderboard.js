const express = require("express");
const router = express.Router();

// GET /api/leaderboard
router.get("/", async (req, res) => {
    try {
        // Tournament End Time (Jaise 7 din baad ka time milliseconds me)
        // Agar aap dynamic timer use kar rahe hain to exact end timestamp calculate karein
        const now = new Date();
        const cycleEndTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).getTime();

        // Sample / Database Leaderboard Data
        const leaderboardData = []; 

        res.status(200).json({
            success: true,
            cycleEndTime: cycleEndTime, // <-- Ye backend se jana zaroori hai
            leaderboard: leaderboardData
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
