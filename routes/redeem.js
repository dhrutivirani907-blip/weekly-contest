const express = require("express");
const router = express.Router();

const pool = require("../../../backend/utils/postgres");

// =====================================
// Settings
// =====================================

const BINANCE_MIN_WITHDRAW = 1000000;
const BINANCE_FEE = 0;

const BEP20_MIN_WITHDRAW = 70000000;
const BEP20_FEE = 10000000;


// =====================================
// Create Withdrawal Request
// =====================================

router.post("/", async (req, res) => {

    const client = await pool.connect();

    try {

        const { userId, wallet, amount } = req.body;

        if (!userId || !wallet || !amount) {

            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });

        }

        const withdrawAmount = Number(amount);

        if (!Number.isFinite(withdrawAmount) || withdrawAmount <= 0) {

            return res.status(400).json({
                success: false,
                message: "Invalid withdrawal amount."
            });

        }


        // =====================================
        // Detect Withdrawal Type
        // =====================================

        const isBinance = wallet.startsWith("BINANCE UID :");

        let minWithdraw;
        let withdrawFee;
        let redeemType;

        if (isBinance) {

            minWithdraw = BINANCE_MIN_WITHDRAW;
            withdrawFee = BINANCE_FEE;
            redeemType = "Binance";

        } else {

            minWithdraw = BEP20_MIN_WITHDRAW;
            withdrawFee = BEP20_FEE;
            redeemType = "BEP20";

        }


        // =====================================
        // Minimum Withdrawal
        // =====================================

        if (withdrawAmount < minWithdraw) {

            return res.status(400).json({

                success: false,

                message:
                    "Minimum " +
                    redeemType +
                    " withdrawal is " +
                    minWithdraw.toLocaleString() +
                    " BabyDoge."

            });

        }


        const totalDeduct = withdrawAmount + withdrawFee;


        // =====================================
        // Transaction Start
        // =====================================

        await client.query("BEGIN");


        // =====================================
        // Get User
        // =====================================

        const userResult = await client.query(
            `
            SELECT *
            FROM users
            WHERE user_id = $1
            FOR UPDATE
            `,
            [String(userId).trim()]
        );


        if (userResult.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({

                success: false,
                message: "User not found."

            });

        }


        const user = userResult.rows[0];

        const currentBalance = Number(user.balance || 0);


        // =====================================
        // Balance Check
        // =====================================

        if (currentBalance < totalDeduct) {

            await client.query("ROLLBACK");

            return res.status(400).json({

                success: false,
                message: "Insufficient balance."

            });

        }


        // =====================================
        // Deduct Balance
        // =====================================

        const newBalance = currentBalance - totalDeduct;

        await client.query(
            `
            UPDATE users
            SET balance = $1
            WHERE user_id = $2
            `,
            [
                newBalance,
                String(userId).trim()
            ]
        );


        // =====================================
        // Generate Withdrawal ID
        // =====================================

        const withdrawalId =
            Date.now() * 1000 +
            Math.floor(Math.random() * 1000);


        // =====================================
        // Save Withdrawal
        // =====================================

        await client.query(
            `
            INSERT INTO withdrawals
            (
                id,
                user_id,
                type,
                wallet,
                amount,
                fee,
                total_deduct,
                status,
                date
            )
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
            `,
            [
                withdrawalId,
                String(userId).trim(),
                redeemType,
                wallet,
                withdrawAmount,
                withdrawFee,
                totalDeduct,
                "Pending"
            ]
        );


        // =====================================
        // Commit
        // =====================================

        await client.query("COMMIT");


        return res.json({

            success: true,

            message:
                redeemType +
                " redeem request submitted.",

            id: withdrawalId,

            type: redeemType,

            amount: withdrawAmount,

            fee: withdrawFee,

            totalDeduct: totalDeduct,

            balance: newBalance

        });

    }

    catch (err) {

        await client.query("ROLLBACK");

        console.error("Withdrawal Error:", err);

        return res.status(500).json({

            success: false,
            message: "Server Error"

        });

    }

    finally {

        client.release();

    }

});


// =====================================
// Withdrawal History
// =====================================

router.get("/:userId", async (req, res) => {

    try {

        const { userId } = req.params;

        const result = await pool.query(
            `
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
            WHERE user_id = $1
            ORDER BY date DESC
            `,
            [String(userId).trim()]
        );


        return res.json({

            success: true,

            history: result.rows

        });

    }

    catch (err) {

        console.error("Withdrawal History Error:", err);

        return res.status(500).json({

            success: false,
            message: "Server Error"

        });

    }

});


module.exports = router;