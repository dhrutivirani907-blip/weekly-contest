const express = require("express");
const router = express.Router();
const pool = require("../utils/postgres");

// 1. Submit Redeem Request (POST)
router.post("/", async (req, res) => {
    try {
        const { userId, amount, type } = req.body;
        const wallet = req.body.wallet || req.body.address;

        if (!userId || !wallet || !amount) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount < 1000000) {
            return res.status(400).json({
                success: false,
                message: "Minimum withdrawal is 1,000,000 BABYDOGE"
            });
        }

        const fee = 0;
        const totalDeduct = numericAmount + fee;
        const redeemType = type || "BINANCE";
        const status = "Pending";

        // Auto-ensure table exists with correct schema
        await pool.query(`
            CREATE TABLE IF NOT EXISTS withdrawals (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                wallet VARCHAR(255) NOT NULL,
                amount NUMERIC NOT NULL,
                fee NUMERIC DEFAULT 0,
                total_deduct NUMERIC NOT NULL,
                type VARCHAR(50) DEFAULT 'BINANCE',
                status VARCHAR(50) DEFAULT 'Pending',
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Insert into withdrawals table
        const insertQuery = `
            INSERT INTO withdrawals (user_id, wallet, amount, fee, total_deduct, type, status, date)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING id, user_id AS "userId", wallet, amount, fee, total_deduct AS "totalDeduct", type, status, date;
        `;

        const result = await pool.query(insertQuery, [
            String(userId).trim(),
            String(wallet).trim(),
            numericAmount,
            fee,
            totalDeduct,
            redeemType,
            status
        ]);

        return res.status(200).json({
            success: true,
            message: "✅ Withdrawal Request Submitted Successfully!",
            redeem: result.rows[0]
        });

    } catch (error) {
        console.error("❌ Redeem Route DB Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Database Error: " + error.message
        });
    }
});

// 2. Fetch User History (GET)
router.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(`
            SELECT id, user_id AS "userId", wallet, amount, fee, total_deduct AS "totalDeduct", type, status, date
            FROM withdrawals
            WHERE user_id = $1
            ORDER BY date DESC
        `, [userId]);

        return res.status(200).json({
            success: true,
            history: result.rows
        });
    } catch (error) {
        console.error("❌ History DB Error:", error.message);
        return res.status(200).json({
            success: true,
            history: []
        });
    }
});

module.exports = router;
