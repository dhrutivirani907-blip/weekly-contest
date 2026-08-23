const express = require("express");
const path = require("path");

const router = express.Router();

const { readJSON, writeJSON } = require("../utils/database");

const usersFile = path.join(__dirname, "../data/users.json");
const adLogsFile = path.join(__dirname, "../data/ad_logs.json");

// ===================================
// Ad Complete
// ===================================

router.post("/complete", (req, res) => {

    try {

        const { userId } = req.body;

        if (!userId) {

            return res.status(400).json({

                success: false,
                message: "User ID is required."

            });

        }

        const users = readJSON(usersFile);

        const user = users.find(u => u.userId === userId);

        if (!user) {

            return res.status(404).json({

                success: false,
                message: "User not found."

            });

        }

        // Increase Ad Count

        if (!user.adCount) {

            user.adCount = 0;

        }

        user.adCount++;

        // Save Ad Log

        const logs = readJSON(adLogsFile);

        logs.push({

            userId: user.userId,
            count: user.adCount,
            time: new Date().toISOString()

        });

        writeJSON(adLogsFile, logs);

        // Save User

        writeJSON(usersFile, users);

        return res.json({

            success: true,
            message: "Ad counted successfully.",

            data: {

                adCount: user.adCount

            }

        });

    }

    catch (err) {

        console.log(err);

        return res.status(500).json({

            success: false,
            message: "Server Error"

        });

    }

});

module.exports = router;