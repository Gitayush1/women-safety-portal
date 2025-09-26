const express = require("express");
const userRouter = express.Router();
const User = require("../models/User");
const { userAuth } = require("../middlewares/auth");

// Get all users (for tracking)
userRouter.get("/", userAuth, async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select("-trackingHistory")
      .sort({ updatedAt: -1 });
    
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get single user
userRouter.get("/:id", userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Create new user
userRouter.post("/", userAuth, async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      emergencyContacts,
    } = req.body;

    const user = new User({
      name,
      phone,
      email,
      emergencyContacts,
    });

    const savedUser = await user.save();
    res.status(201).json({ message: "User created successfully", user: savedUser });
  } catch (err) {
    res.status(400).json({ error: "Failed to create user: " + err.message });
  }
});

// Update user location
userRouter.patch("/:id/location", userAuth, async (req, res) => {
  try {
    const { lat, lng, batteryLevel, status } = req.body;
    
    const updateData = {
      lastLocation: { lat, lng, timestamp: new Date() },
      batteryLevel,
      status,
    };

    // Add to tracking history (keep last 100 entries)
    const user = await User.findById(req.params.id);
    if (user) {
      user.trackingHistory.push({ lat, lng, timestamp: new Date() });
      if (user.trackingHistory.length > 100) {
        user.trackingHistory = user.trackingHistory.slice(-100);
      }
      await user.save();
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User location updated", user: updatedUser });
  } catch (err) {
    res.status(400).json({ error: "Failed to update user location" });
  }
});

// Get user tracking history
userRouter.get("/:id/tracking", userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("trackingHistory");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ trackingHistory: user.trackingHistory });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tracking history" });
  }
});

// Update user status
userRouter.patch("/:id/status", userAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User status updated", user });
  } catch (err) {
    res.status(400).json({ error: "Failed to update user status" });
  }
});

module.exports = userRouter;
