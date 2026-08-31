const express = require("express");
const router = express.Router();

// GET /api/leaderboard
router.get("/", async (req, res) => {
    try {
        // Agle 7 din baad ka dynamic timestamp
        const cycleEndTime = Date.now() + (7 * 24 * 60 * 60 * 1000);

        // Dummy/Sample Leaderboard Data (Testing ke liye)
        const leaderboardData = [
            { rank: 1, binanceId: "84739201", adsWatched: 45 },
            { rank: 2, binanceId: "19283746", adsWatched: 32 },
            { rank: 3, binanceId: "56473829", adsWatched: 20 }
        ];

        res.status(200).json({
            success: true,
            cycleEndTime: cycleEndTime,
            leaderboard: leaderboardData
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
