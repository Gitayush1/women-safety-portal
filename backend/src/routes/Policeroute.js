const express = require("express");
const policeRouter = express.Router();
const Police = require("../models/Police");
const bcrypt = require("bcrypt");
const {userAuth}  = require("../middlewares/auth");

//signup API
policeRouter.post("/signup", async (req, res) => {
  try {
    const { policeStationName, badgeNumber, password } = req.body;

    const police = new Police({
      policeStationName,
      badgeNumber,
      password: password, // Let the pre-save middleware handle hashing
    });

    const savedPolice = await police.save();
    const jwtToken = await savedPolice.getJWT();
    res.cookie("token", jwtToken);
    
    res.json({message: "Police Officer Added successfully!", data: savedPolice});
  } catch (err){
    res.status(400).json({error: "Error message: " + err.message});
  }
});

//Login API
policeRouter.post("/login", async(req, res) => {
  try{
    const { badgeNumber, password } = req.body;
    const police = await Police.findOne({ badgeNumber });
    if(!police){
      throw new Error("Invalid credentials");
    }
    const isPassword = await police.validatePassword(password);
    if(!isPassword){
      throw new Error("Password does not match");
    } 
    //Token is generated
    const jwtToken = await police.getJWT();
    res.cookie("token", jwtToken);
    res.json(police);

  }
  catch(err){
    res.status(400).json({error: "Error message is: " + err.message});
  }
});

//Logout API
policeRouter.post("/logout", userAuth, async(req, res) => {
    try{
        const police = req.user;
        if(!police){
            throw new Error("Police officer not found");
        }
        res.clearCookie("token");
        res.json({message: "Logout Successfully by: " + police.badgeNumber});
    }
    catch(err){
        res.status(400).json({error: "Error is: " + err.message});
    }
});

module.exports = policeRouter;
