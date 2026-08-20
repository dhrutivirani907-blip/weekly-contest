const express = require("express");

const router = express.Router();

const generateUserId = require("../utils/userId");
const pool = require("../utils/postgres");


// =====================================
// Register User
// =====================================

router.post("/register", async (req, res) => {

    console.log("REGISTER REQUEST RECEIVED:", req.body);

    const { deviceId } = req.body;

    if (!deviceId) {

        return res.status(400).json({

            success: false,
            message: "Device ID missing"

        });

    }

    try {

        // =====================================
        // Check Existing Device
        // =====================================

        const existingUser = await pool.query(
            `
            SELECT
                user_id AS "userId",
                device_id AS "deviceId",
                ad_count AS "adCount",
                captcha_count AS "captchaCount",
                balance,
                claimed_tasks AS "claimedTasks",
                created_at AS "createdAt"
            FROM users
            WHERE device_id = $1
            LIMIT 1
            `,
            [deviceId]
        );


        if (existingUser.rows.length > 0) {

            console.log(
                "EXISTING USER:",
                existingUser.rows[0].userId
            );

            return res.json({

                success: true,

                user: existingUser.rows[0]

            });

        }


        // =====================================
        // Create New User
        // =====================================

        const userId = generateUserId();

        const newUser = {

            userId: userId,

            deviceId: deviceId,

            adCount: 0,

            captchaCount: 0,

            balance: 0,

            claimedTasks: [],

            createdAt: new Date().toISOString()

        };


        // =====================================
        // Save to PostgreSQL
        // =====================================

        await pool.query(
            `
            INSERT INTO users
            (
                user_id,
                device_id,
                ad_count,
                captcha_count,
                balance,
                claimed_tasks,
                created_at
            )
            VALUES
            ($1, $2, $3, $4, $5, $6, $7)
            `,
            [
                newUser.userId,
                newUser.deviceId,
                newUser.adCount,
                newUser.captchaCount,
                newUser.balance,
                JSON.stringify(newUser.claimedTasks),
                newUser.createdAt
            ]
        );


        console.log("USER SAVED:", newUser.userId);


        // =====================================
        // Response
        // =====================================

        return res.json({

            success: true,

            user: newUser

        });

    }

    catch (error) {

        console.error("REGISTER ERROR:", error);

        return res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

});


module.exports = router;