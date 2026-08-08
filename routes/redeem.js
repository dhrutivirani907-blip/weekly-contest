const express = require("express");
const path = require("path");

const router = express.Router();

const { readJSON, writeJSON } = require("../utils/database");

const usersFile = path.join(__dirname, "../data/users.json");
const redeemFile = path.join(__dirname, "../data/redeem.json");

// =====================================
// Settings
// =====================================

// Binance
const BINANCE_MIN_WITHDRAW = 1000000;
const BINANCE_FEE = 0;

// BEP20
const BEP20_MIN_WITHDRAW = 70000000;
const BEP20_FEE = 10000000;


// =====================================
// Create Redeem Request
// =====================================

router.post("/", (req, res) => {

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
        // Detect Redeem Type
        // =====================================

        const isBinance = wallet.startsWith("BINANCE UID :");


        let minWithdraw;
        let withdrawFee;
        let redeemType;


        if (isBinance) {

            // Binance
            minWithdraw = BINANCE_MIN_WITHDRAW;
            withdrawFee = BINANCE_FEE;
            redeemType = "Binance";

        } else {

            // BEP20
            minWithdraw = BEP20_MIN_WITHDRAW;
            withdrawFee = BEP20_FEE;
            redeemType = "BEP20";

        }


        // =====================================
        // Minimum Withdrawal Check
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


        // =====================================
        // Total Deduction
        // =====================================

        const totalDeduct = withdrawAmount + withdrawFee;


        // =====================================
        // Read Users
        // =====================================

        const users = readJSON(usersFile);

        const user = users.find(
            u => u.userId === userId
        );


        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found."

            });

        }


        // =====================================
        // Balance Check
        // =====================================

        if ((user.balance || 0) < totalDeduct) {

            return res.status(400).json({

                success: false,

                message: "Insufficient balance."

            });

        }


        // =====================================
        // Balance Cut
        // =====================================

        user.balance -= totalDeduct;

        writeJSON(usersFile, users);


        // =====================================
        // Save Redeem Request
        // =====================================

        const redeem = readJSON(redeemFile);


        redeem.push({

            id: Date.now(),

            userId: userId,

            type: redeemType,

            wallet: wallet,

            amount: withdrawAmount,

            fee: withdrawFee,

            totalDeduct: totalDeduct,

            status: "Pending",

            date: new Date().toISOString()

        });


        writeJSON(redeemFile, redeem);


        // =====================================
        // Success Response
        // =====================================

        return res.json({

            success: true,

            message:
                redeemType +
                " redeem request submitted.",

            type: redeemType,

            amount: withdrawAmount,

            fee: withdrawFee,

            totalDeduct: totalDeduct,

            balance: user.balance

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


// =====================================
// Redeem History
// =====================================

router.get("/:userId", (req, res) => {

    try {

        const { userId } = req.params;

        const redeem = readJSON(redeemFile);

        const history = redeem.filter(
            item => item.userId === userId
        );


        return res.json({

            success: true,

            history: history

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