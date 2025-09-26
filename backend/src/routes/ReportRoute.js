const express = require("express");
const reportRouter = express.Router();
const Report = require("../models/Report");
const Police = require("../models/Police");
const { userAuth } = require("../middlewares/auth");

// Get all reports
reportRouter.get("/", userAuth, async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("assignedOfficer", "badgeNumber policeStationName")
      .sort({ createdAt: -1 });
    
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// Get single report
reportRouter.get("/:id", userAuth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("assignedOfficer", "badgeNumber policeStationName")
      .populate("notes.addedBy", "badgeNumber policeStationName");
    
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    
    res.json({ report });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

// Create new report
reportRouter.post("/", userAuth, async (req, res) => {
  try {
    const {
      type,
      location,
      description,
      priority,
      reporterName,
      reporterPhone,
      coordinates,
    } = req.body;

    // Generate unique report ID
    const reportCount = await Report.countDocuments();
    const reportId = `RPT-${String(reportCount + 1).padStart(3, "0")}`;

    const report = new Report({
      reportId,
      type,
      location,
      description,
      priority,
      reporterName,
      reporterPhone,
      coordinates,
    });

    const savedReport = await report.save();
    res.status(201).json({ message: "Report created successfully", report: savedReport });
  } catch (err) {
    res.status(400).json({ error: "Failed to create report: " + err.message });
  }
});

// Update report status
reportRouter.patch("/:id/status", userAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("assignedOfficer", "badgeNumber policeStationName");

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({ message: "Report status updated", report });
  } catch (err) {
    res.status(400).json({ error: "Failed to update report status" });
  }
});

// Assign officer to report
reportRouter.patch("/:id/assign", userAuth, async (req, res) => {
  try {
    const { officerId } = req.body;
    
    const officer = await Police.findById(officerId);
    if (!officer) {
      return res.status(404).json({ error: "Officer not found" });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { assignedOfficer: officerId },
      { new: true }
    ).populate("assignedOfficer", "badgeNumber policeStationName");

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({ message: "Officer assigned to report", report });
  } catch (err) {
    res.status(400).json({ error: "Failed to assign officer" });
  }
});

// Add note to report
reportRouter.post("/:id/notes", userAuth, async (req, res) => {
  try {
    const { note } = req.body;
    
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { $push: { notes: { note, addedBy: req.user._id } } },
      { new: true }
    ).populate("assignedOfficer", "badgeNumber policeStationName")
     .populate("notes.addedBy", "badgeNumber policeStationName");

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({ message: "Note added to report", report });
  } catch (err) {
    res.status(400).json({ error: "Failed to add note" });
  }
});

module.exports = reportRouter;
