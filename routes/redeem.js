const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const redeemFile = path.join(__dirname, "../data/redeem.json");

// Helper function to read redeem data safely
function readRedeemData() {
    if (!fs.existsSync(redeemFile)) {
        return [];
    }
    try {
        const data = fs.readFileSync(redeemFile, "utf8");
        return JSON.parse(data || "[]");
    } catch (err) {
        return [];
    }
}

// Helper function to write redeem data
function writeRedeemData(data) {
    fs.writeFileSync(redeemFile, JSON.stringify(data, null, 2));
}

// POST /api/redeem
router.post("/", (req, res) => {
    try {
        const { userId, amount, type } = req.body;
        // Accept either 'wallet' or 'address' key from request
        const wallet = req.body.wallet || req.body.address;

        // 1. Check Missing Fields
        if (!userId || !wallet || !amount) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: userId, wallet UID, or amount"
            });
        }

        const numericAmount = Number(amount);

        // 2. Minimum Limit Validation (Strictly 1,000,000 BABYDOGE)
        if (isNaN(numericAmount) || numericAmount < 1000000) {
            return res.status(400).json({
                success: false,
                message: "Minimum withdrawal is 1,000,000 BABYDOGE"
            });
        }

        // 3. Create New Redeem Request Record
        const newRedeem = {
            id: Date.now().toString(),
            userId: String(userId).trim(),
            wallet: String(wallet).trim(),
            amount: numericAmount,
            type: type || "BINANCE",
            status: "PENDING",
            createdAt: new Date().toISOString()
        };

        // 4. Save to redeem.json
        const redeems = readRedeemData();
        redeems.push(newRedeem);
        writeRedeemData(redeems);

        return res.status(200).json({
            success: true,
            message: "✅ Withdrawal Request Submitted Successfully!",
            redeem: newRedeem
        });

    } catch (error) {
        console.error("Redeem Route Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});

module.exports = router;
