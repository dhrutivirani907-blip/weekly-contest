const express = require("express");

const router = express.Router();

const pool = require("../utils/postgres");

// ===============================
// Dashboard Data
// ===============================

router.get("/dashboard", async (req, res) => {

    try {

        const usersResult = await pool.query(`
            SELECT
                COUNT(*)::int AS total_users,
                COALESCE(SUM(ad_count), 0)::int AS total_ads,
                COALESCE(SUM(balance), 0) AS total_balance
            FROM users
        `);

        const pendingResult = await pool.query(`
            SELECT COUNT(*)::int AS pending_redeem
            FROM withdrawals
            WHERE status = 'Pending'
        `);

        const data = usersResult.rows[0];

        res.json({

            success: true,

            totalUsers: data.total_users,

            totalAds: data.total_ads,

            totalBalance: Number(data.total_balance),

            pendingRedeem: pendingResult.rows[0].pending_redeem

        });

    }

    catch (error) {

        console.error("Dashboard Error:", error);

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

});


// ===============================
// All Users
// ===============================

router.get("/users", async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                user_id AS "userId",
                device_id AS "deviceId",
                ad_count AS "adCount",
                captcha_count AS "captchaCount",
                balance,
                claimed_tasks AS "claimedTasks",
                created_at AS "createdAt"
            FROM users
            ORDER BY created_at DESC
        `);

        res.json({

            success: true,

            users: result.rows

        });

    }

    catch (error) {

        console.error("Users Error:", error);

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

});


// ===============================
// All Withdrawal Requests
// ===============================

router.get("/redeems", async (req, res) => {

    console.log("🔥 REDEEMS API HIT");

    try {

        console.log("🔌 Testing PostgreSQL...");

        const result = await pool.query(`
            SELECT
                id,
                user_id AS "userId",
                type,
                wallet,
                amount,
                fee,
                total_deduct AS "totalDeduct",
                status,
                date
            FROM withdrawals
            ORDER BY date DESC
        `);

        console.log("✅ PostgreSQL query successful");
        console.log("📦 Rows:", result.rows.length);

        res.json({
            success: true,
            redeems: result.rows
        });

    } catch (error) {

        console.error("❌ REDEEMS ERROR:");
        console.error(error);
        console.error("MESSAGE:", error.message);
        console.error("CODE:", error.code);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});
// ===============================
// Update Withdrawal Status
// ===============================

router.post("/redeem/update", async (req, res) => {

    const client = await pool.connect();

    try {

        const { id, status } = req.body;

        if (!id || !["Approved", "Rejected"].includes(status)) {

            return res.status(400).json({

                success: false,

                message: "Invalid request."

            });

        }

        await client.query("BEGIN");


        // Find withdrawal

        const result = await client.query(
            `
            SELECT *
            FROM withdrawals
            WHERE id = $1
            FOR UPDATE
            `,
            [id]
        );


        if (result.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({

                success: false,

                message: "Withdrawal not found."

            });

        }


        const withdrawal = result.rows[0];


        // Prevent changing an already processed request

        if (withdrawal.status !== "Pending") {

            await client.query("ROLLBACK");

            return res.status(400).json({

                success: false,

                message:
                    "This withdrawal is already " +
                    withdrawal.status +
                    "."

            });

        }


        // =====================================
        // If Rejected → Return balance
        // =====================================

        if (status === "Rejected") {

            await client.query(
                `
                UPDATE users
                SET balance = balance + $1
                WHERE user_id = $2
                `,
                [
                    withdrawal.total_deduct,
                    withdrawal.user_id
                ]
            );

        }


        // =====================================
        // Update withdrawal status
        // =====================================

        await client.query(
            `
            UPDATE withdrawals
            SET status = $1
            WHERE id = $2
            `,
            [
                status,
                id
            ]
        );


        await client.query("COMMIT");


        res.json({

            success: true,

            message: "Status Updated",

            status: status

        });

    }

    catch (error) {

        await client.query("ROLLBACK");

        console.error("Update Redeem Error:", error);

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

    finally {

        client.release();

    }

});


module.exports = router;