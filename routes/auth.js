const express = require("express");
const path = require("path");

const router = express.Router();

const generateUserId = require("../utils/userId");
const { readJSON, writeJSON } = require("../utils/database");

const usersFile = path.join(__dirname,"../data/users.json");

router.post("/register",(req,res)=>{

    console.log("REGISTER REQUEST RECEIVED:", req.body);

    const { deviceId } = req.body;

    if (!deviceId) {

    return res.status(400).json({

        success: false,

        message: "Device ID missing"

    });

}

    const users = readJSON(usersFile);

    const existingUser = users.find(u => u.deviceId === deviceId);

if (existingUser) {

    return res.json({

        success: true,

        user: existingUser

    });

}

    const userId = generateUserId();

    const newUser={

        userId,

        deviceId,

        adCount: 0,

        captchaCount:0,

        balance:0,

        claimedTasks:[],

        createdAt:new Date().toISOString()

    };

    users.push(newUser);

    writeJSON(usersFile,users);

    res.json({

        success:true,

        user:newUser

    });

});

module.exports=router;