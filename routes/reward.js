const express = require("express");
const path = require("path");

const router = express.Router();

const { readJSON, writeJSON } = require("../utils/database");
const getRewardData = require("../utils/reward");

const usersFile = path.join(__dirname, "../data/users.json");
const rewardsFile = path.join(__dirname, "../data/rewards.json");

console.log("Reward Route Loaded");



// =========================================
// Claim Reward
// =========================================

router.post("/claim",(req,res)=>{

    const { userId } = req.body;

    const users = readJSON(usersFile);

    

    const user = users.find(u=>u.userId===userId);

    if(!user){

        return res.status(404).json({

            success:false,
            message:"User not found."

        });

    }

    const rewardData = getRewardData(user.adCount || 0);

const tier = rewardData.tier;

const task = rewardData.currentTask;

const currentTask = rewardData.tasks.find(t => t.task === task);

const target = currentTask.target;

    if ((user.adCount || 0) < target) {

        return res.json({

            success:false,
            message:"Task not completed."

        });

    }

    

    const claimKey=`${tier}-${task}`;
    const reward = task * 5;

    if(user.claimedTasks.includes(claimKey)){

        return res.json({

            success:false,
            message:"Already Claimed."

        });

    }

    user.balance += reward;

    user.claimedTasks.push(claimKey);

    writeJSON(usersFile,users);

    res.json({

        success:true,

        reward: reward,

        balance:user.balance

    });

});

// =========================================
// Update Ad Reward
// =========================================

router.post("/update", (req, res) => {

    console.log("UPDATE API HIT");
console.log(req.body);

    try {

        const { userId, adCount } = req.body;

        const users = readJSON(usersFile);

        const user = users.find(u => u.userId === userId);

        if (!user) {

            return res.status(404).json({

                success: false,
                message: "User not found."

            });

        }

        user.adCount = adCount;

        user.balance = (user.balance || 0) + 20000;

        writeJSON(usersFile, users);

        return res.json({

            success: true,

            balance: user.balance,

            adCount: user.adCount

        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({

            success: false,
            message: "Server Error"

        });

    }

});

module.exports = router;