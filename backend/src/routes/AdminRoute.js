const express = require("express");
const adminRouter = express.Router();
const Police = require("../models/Police");
const Report = require("../models/Report");
const User = require("../models/User");
const { userAuth } = require("../middlewares/auth");

// Get admin dashboard stats
adminRouter.get("/stats", userAuth, async (req, res) => {
  try {
    const [
      totalReports,
      activeReports,
      resolvedToday,
      totalOfficers,
      totalUsers,
      emergencyReports,
    ] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: "active" }),
      Report.countDocuments({ 
        status: "resolved", 
        updatedAt: { $gte: new Date().setHours(0, 0, 0, 0) } 
      }),
      Police.countDocuments(),
      User.countDocuments({ isActive: true }),
      Report.countDocuments({ priority: "high", status: "active" }),
    ]);

    const stats = {
      totalReports,
      activeReports,
      resolvedToday,
      totalOfficers,
      totalUsers,
      emergencyReports,
    };

    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});

// Get all officers
adminRouter.get("/officers", userAuth, async (req, res) => {
  try {
    const officers = await Police.find()
      .select("-password")
      .sort({ createdAt: -1 });
    
    res.json({ officers });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch officers" });
  }
});

// Create new officer
adminRouter.post("/officers", userAuth, async (req, res) => {
  try {
    const { policeStationName, badgeNumber, password } = req.body;

    const officer = new Police({
      policeStationName,
      badgeNumber,
      password,
    });

    const savedOfficer = await officer.save();
    const { password: _, ...officerWithoutPassword } = savedOfficer.toObject();
    
    res.status(201).json({ 
      message: "Officer created successfully", 
      officer: officerWithoutPassword 
    });
  } catch (err) {
    res.status(400).json({ error: "Failed to create officer: " + err.message });
  }
});

// Update officer
adminRouter.patch("/officers/:id", userAuth, async (req, res) => {
  try {
    const { policeStationName, badgeNumber } = req.body;
    
    const officer = await Police.findByIdAndUpdate(
      req.params.id,
      { policeStationName, badgeNumber },
      { new: true }
    ).select("-password");

    if (!officer) {
      return res.status(404).json({ error: "Officer not found" });
    }

    res.json({ message: "Officer updated successfully", officer });
  } catch (err) {
    res.status(400).json({ error: "Failed to update officer" });
  }
});

// Delete officer
adminRouter.delete("/officers/:id", userAuth, async (req, res) => {
  try {
    const officer = await Police.findByIdAndDelete(req.params.id);

    if (!officer) {
      return res.status(404).json({ error: "Officer not found" });
    }

    res.json({ message: "Officer deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete officer" });
  }
});

// Get recent activity
adminRouter.get("/activity", userAuth, async (req, res) => {
  try {
    const [recentReports, recentOfficers] = await Promise.all([
      Report.find()
        .populate("assignedOfficer", "badgeNumber policeStationName")
        .sort({ updatedAt: -1 })
        .limit(10),
      Police.find()
        .select("-password")
        .sort({ updatedAt: -1 })
        .limit(5),
    ]);

    const activity = [
      ...recentReports.map(report => ({
        type: "report",
        action: `Report ${report.reportId} ${report.status}`,
        timestamp: report.updatedAt,
        details: report,
      })),
      ...recentOfficers.map(officer => ({
        type: "officer",
        action: `Officer ${officer.badgeNumber} updated`,
        timestamp: officer.updatedAt,
        details: officer,
      })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 15);

    res.json({ activity });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recent activity" });
  }
});

module.exports = adminRouter;
