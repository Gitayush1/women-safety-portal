const express = require("express");
const policeRouter = express.Router();
const Police = require("../models/Police");
const {userAuth}  = require("../middlewares/auth");

const COOKIE_OPTIONS = {
  httpOnly: true,                                    // not accessible via JS
  secure: process.env.NODE_ENV === "production",     // HTTPS only in prod
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,                  // 7 days in ms
};

//signup API
policeRouter.post("/signup", async (req, res) => {
  try {
    const { policeStationName, badgeNumber, password, latitude, longitude } = req.body;

    // Basic input validation
    if (!policeStationName || !badgeNumber || !password || latitude == null || longitude == null) {
      return res.status(400).json({ error: "All fields are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const police = new Police({
      policeStationName,
      badgeNumber,
      password, // bcrypt pre-save hook handles hashing
      latitude,
      longitude,
    });

    const savedPolice = await police.save();
    const jwtToken = await savedPolice.getJWT();
    res.cookie("token", jwtToken, COOKIE_OPTIONS);

    // Never return the password field
    const { password: _pw, ...safeData } = savedPolice.toObject();
    res.json({ message: "Police Officer Added successfully!", data: safeData });
  } catch (err){
    res.status(400).json({ error: "Error message: " + err.message });
  }
});

//Login API
policeRouter.post("/login", async(req, res) => {
  try{
    const { badgeNumber, password } = req.body;

    if (!badgeNumber || !password) {
      return res.status(400).json({ error: "Badge number and password are required." });
    }

    const police = await Police.findOne({ badgeNumber });
    if(!police){
      // Use a generic message to avoid user enumeration
      throw new Error("Invalid credentials");
    }
    const isPassword = await police.validatePassword(password);
    if(!isPassword){
      throw new Error("Invalid credentials");
    }

    const jwtToken = await police.getJWT();
    res.cookie("token", jwtToken, COOKIE_OPTIONS);

    // Never return the password field
    const { password: _pw, ...safeData } = police.toObject();
    res.json(safeData);

  }
  catch(err){
    res.status(400).json({ error: "Error message is: " + err.message });
  }
});

// Verify current session — used by AuthGuard on the frontend
policeRouter.get("/me", userAuth, (req, res) => {
  const { password: _pw, ...safeData } = req.user;
  res.json(safeData);
});

//Get all police stations API
policeRouter.get("/stations", async (req, res) => {
  try {
    const policeStations = await Police.find({}, { 
      policeStationName: 1, 
      latitude: 1, 
      longitude: 1, 
      badgeNumber: 1 
    });
    res.json({ policeStations });
  } catch (err) {
    res.status(400).json({ error: "Error fetching police stations: " + err.message });
  }
});

//Logout API
policeRouter.post("/logout", userAuth, async(req, res) => {
    try{
        const police = req.user;
        if(!police){
            throw new Error("Police officer not found");
        }
        res.clearCookie("token", COOKIE_OPTIONS);
        res.json({message: "Logout Successfully by: " + police.badgeNumber});
    }
    catch(err){
        res.status(400).json({error: "Error is: " + err.message});
    }
});

module.exports = policeRouter;
