const express = require("express");
const path = require("path");

const router = express.Router();

const { readJSON } = require("../utils/database");

const usersFile = path.join(__dirname, "../data/users.json");
const redeemFile = path.join(__dirname, "../data/redeem.json");

// ===============================
// Dashboard Data
// ===============================

router.get("/dashboard", (req, res) => {

    const users = readJSON(usersFile);

    const redeems = readJSON(redeemFile);

    const totalUsers = users.length;

    const totalAds = users.reduce((sum, u) => sum + (u.adCount || 0), 0);

    const totalBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);

    const pendingRedeem = redeems.filter(r => r.status === "Pending").length;

    res.json({

        success: true,

        totalUsers,

        totalAds,

        totalBalance,

        pendingRedeem

    });

});

// ===============================
// All Users
// ===============================

router.get("/users", (req, res) => {

    const users = readJSON(usersFile);

    res.json({

        success: true,

        users

    });

});

// ===============================
// All Redeem Requests
// ===============================

router.get("/redeems", (req, res) => {

    const redeems = readJSON(redeemFile);

    res.json({

        success: true,

        redeems

    });

});

// ===============================
// Update Redeem Status
// ===============================

router.post("/redeem/update", (req,res)=>{

    const { id, status } = req.body;


    const redeems = readJSON(redeemFile);


    const redeem = redeems.find(r => r.id == id);


    if(!redeem){

        return res.json({

            success:false,

            message:"Redeem not found"

        });

    }


    redeem.status = status;


    const fs = require("fs");

    fs.writeFileSync(

        redeemFile,

        JSON.stringify(redeems,null,2)

    );


    res.json({

        success:true,

        message:"Status Updated"

    });


});

module.exports = router;