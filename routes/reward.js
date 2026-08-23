const express = require("express");

const router = express.Router();

const pool = require("../utils/postgres");
const getRewardData = require("../utils/reward");

console.log("Reward Route Loaded");


// =========================================
// Claim Reward
// =========================================

router.post("/claim", async (req, res) => {

    const client = await pool.connect();

    try {

        const { userId } = req.body;

        if (!userId) {

            return res.status(400).json({
                success: false,
                message: "User ID required."
            });

        }

        await client.query("BEGIN");


        const userResult = await client.query(
            `
            SELECT
                user_id,
                ad_count,
                balance,
                claimed_tasks
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

        const adCount = Number(user.ad_count || 0);
        const balance = Number(user.balance || 0);

        const claimedTasks = Array.isArray(user.claimed_tasks)
            ? user.claimed_tasks
            : [];


        const rewardData = getRewardData(adCount);

        const tier = rewardData.tier;
        const task = rewardData.currentTask;

        const currentTask = rewardData.tasks.find(
            t => t.task === task
        );


        if (!currentTask) {

            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Task not found."
            });

        }


        const target = currentTask.target;


        if (adCount < target) {

            await client.query("ROLLBACK");

            return res.json({
                success: false,
                message: "Task not completed."
            });

        }


        const claimKey = `${tier}-${task}`;

        const reward = task * 5;


        if (claimedTasks.includes(claimKey)) {

            await client.query("ROLLBACK");

            return res.json({
                success: false,
                message: "Already Claimed."
            });

        }


        claimedTasks.push(claimKey);

        const newBalance = balance + reward;


        await client.query(
            `
            UPDATE users
            SET
                balance = $1,
                claimed_tasks = $2
            WHERE user_id = $3
            `,
            [
                newBalance,
                JSON.stringify(claimedTasks),
                String(userId).trim()
            ]
        );


        await client.query("COMMIT");


        return res.json({

            success: true,

            reward: reward,

            balance: newBalance

        });

    }

    catch (err) {

        await client.query("ROLLBACK");

        console.error("Claim Reward Error:", err);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

    finally {

        client.release();

    }

});


// =========================================
// Update Ad Reward
// =========================================

router.post("/update", async (req, res) => {

    const client = await pool.connect();

    try {

        console.log("UPDATE API HIT");
        console.log(req.body);

        const { userId, adCount } = req.body;

        if (!userId || adCount === undefined) {

            return res.status(400).json({
                success: false,
                message: "User ID and adCount required."
            });

        }


        const newAdCount = Number(adCount);

        if (!Number.isFinite(newAdCount) || newAdCount < 0) {

            return res.status(400).json({
                success: false,
                message: "Invalid adCount."
            });

        }


        await client.query("BEGIN");


        const result = await client.query(
            `
            UPDATE users
            SET
                ad_count = $1,
                balance = balance + 20000
            WHERE user_id = $2
            RETURNING
                balance,
                ad_count
            `,
            [
                newAdCount,
                String(userId).trim()
            ]
        );


        if (result.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "User not found."
            });

        }


        await client.query("COMMIT");


        const user = result.rows[0];


        return res.json({

            success: true,

            balance: Number(user.balance),

            adCount: user.ad_count

        });

    }

    catch (err) {

        await client.query("ROLLBACK");

        console.error("Update Reward Error:", err);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

    finally {

        client.release();

    }

});


// =========================================
// Complete Task Reward
// =========================================

router.post("/task-claim", async (req, res) => {

    const client = await pool.connect();

    try {

        const { userId, taskId } = req.body;

        if (!userId || taskId === undefined) {

            return res.status(400).json({
                success: false,
                message: "User ID and taskId required."
            });

        }


        await client.query("BEGIN");


        const result = await client.query(
            `
            SELECT
                balance,
                claimed_tasks
            FROM users
            WHERE user_id = $1
            FOR UPDATE
            `,
            [String(userId).trim()]
        );


        if (result.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "User not found."
            });

        }


        const user = result.rows[0];

        const balance = Number(user.balance || 0);

        const claimedTasks = Array.isArray(user.claimed_tasks)
            ? user.claimed_tasks
            : [];


        const claimKey = `telegram-task-${taskId}`;


        if (claimedTasks.includes(claimKey)) {

            await client.query("ROLLBACK");

            return res.json({
                success: false,
                message: "Task reward already claimed."
            });

        }


        const reward = 5000000;

        const newBalance = balance + reward;

        claimedTasks.push(claimKey);


        await client.query(
            `
            UPDATE users
            SET
                balance = $1,
                claimed_tasks = $2
            WHERE user_id = $3
            `,
            [
                newBalance,
                JSON.stringify(claimedTasks),
                String(userId).trim()
            ]
        );


        await client.query("COMMIT");


        return res.json({

            success: true,

            reward: reward,

            balance: newBalance

        });

    }

    catch (err) {

        await client.query("ROLLBACK");

        console.error("Task Claim Error:", err);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

    finally {

        client.release();

    }

});


module.exports = router;