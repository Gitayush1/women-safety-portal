const express = require("express");
const reportRouter = express.Router();
const Report = require("../models/Report");
const Police = require("../models/Police");
const { userAuth } = require("../middlewares/auth");
const { detectEmergencyRisk } = require("../risk-detection/services/riskDetectionService");

const buildStationReportFilter = (station) => {
  const stationId = station?._id;
  const stationIdString = stationId ? String(stationId) : "";
  const stationName = station?.policeStationName || "";
  const objectIdRefs = [stationId, stationIdString].filter(Boolean);
  const filters = [];

  if (objectIdRefs.length) {
    filters.push(
      { linkedStationIds: { $in: objectIdRefs } },
      { assignedStationId: { $in: objectIdRefs } }
    );
  }

  if (stationName) {
    filters.push({ assignedStation: stationName });
  }

  return {
    $or: filters,
  };
};

// Get all reports
reportRouter.get("/", userAuth, async (req, res) => {
  try {
    const reports = await Report.find(buildStationReportFilter(req.user))
      .populate("assignedOfficer", "badgeNumber policeStationName")
      .populate("assignedStationId", "policeStationName badgeNumber")
      .populate("linkedStationIds", "policeStationName badgeNumber")
      .sort({ createdAt: -1 });
    
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// Get single report
reportRouter.get("/:id", userAuth, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      ...buildStationReportFilter(req.user),
    })
      .populate("assignedOfficer", "badgeNumber policeStationName")
      .populate("assignedStationId", "policeStationName badgeNumber")
      .populate("linkedStationIds", "policeStationName badgeNumber")
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
      voiceTranscript,
      voiceUrl,
      userId,
      userName,
      reporterName,
      reporterPhone,
      assignedStation,
      assignedStationId,
      linkedStationIds,
      coordinates,
    } = req.body;

    const normalizedDescription = description?.trim() || voiceTranscript?.trim();
    if (!normalizedDescription) {
      return res.status(400).json({
        error: "Provide either description text or voiceTranscript",
      });
    }

    if (!assignedStationId) {
      return res.status(400).json({
        error: "assignedStationId is required",
      });
    }

    const station = await Police.findById(assignedStationId);
    if (!station) {
      return res.status(404).json({ error: "Assigned police station not found" });
    }

    const normalizedLinkedStationIds = Array.isArray(linkedStationIds)
      ? [...new Set(linkedStationIds.map((id) => String(id)))]
      : [String(assignedStationId)];

    if (!normalizedLinkedStationIds.includes(String(assignedStationId))) {
      normalizedLinkedStationIds.push(String(assignedStationId));
    }

    const linkedStations = await Police.find({
      _id: { $in: normalizedLinkedStationIds },
    }).select("_id");

    if (linkedStations.length !== normalizedLinkedStationIds.length) {
      return res.status(404).json({
        error: "One or more linked police station IDs are invalid",
      });
    }

    // Generate unique report ID
    const reportCount = await Report.countDocuments();
    const reportId = `RPT-${String(reportCount + 1).padStart(3, "0")}`;
    const riskAnalysis = await detectEmergencyRisk({
      text: normalizedDescription,
      voiceTranscript,
    });

    const report = new Report({
      reportId,
      type,
      location,
      description: normalizedDescription,
      voiceTranscript,
      voiceUrl,
      // Priority is AI-driven and not accepted from client payload.
      priority: riskAnalysis.riskLevel,
      riskConfidence: riskAnalysis.confidence,
      riskReason: riskAnalysis.reason,
      riskSource: riskAnalysis.debug?.source,
      riskFallbackReason: riskAnalysis.debug?.fallbackReason,
      reporterName: userId?.trim?.() || userName?.trim?.() || reporterName,
      reporterPhone,
      assignedStationId,
      linkedStationIds: normalizedLinkedStationIds,
      assignedStation: assignedStation || station.policeStationName,
      coordinates,
    });

    const savedReport = await report.save();
    res.status(201).json({
      message: "Report created successfully",
      report: savedReport,
      aiRisk: riskAnalysis,
    });
  } catch (err) {
    res.status(400).json({ error: "Failed to create report: " + err.message });
  }
});

// Update report status
reportRouter.patch("/:id/status", userAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const report = await Report.findOneAndUpdate(
      {
        _id: req.params.id,
        ...buildStationReportFilter(req.user),
      },
      { status },
      { new: true }
    ).populate("assignedOfficer", "badgeNumber policeStationName");

    if (!report) {
      return res.status(404).json({ error: "Report not found or access denied" });
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

    const report = await Report.findOneAndUpdate(
      {
        _id: req.params.id,
        ...buildStationReportFilter(req.user),
      },
      { assignedOfficer: officerId },
      { new: true }
    ).populate("assignedOfficer", "badgeNumber policeStationName");

    if (!report) {
      return res.status(404).json({ error: "Report not found or access denied" });
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
    
    const report = await Report.findOneAndUpdate(
      {
        _id: req.params.id,
        ...buildStationReportFilter(req.user),
      },
      { $push: { notes: { note, addedBy: req.user._id } } },
      { new: true }
    ).populate("assignedOfficer", "badgeNumber policeStationName")
     .populate("notes.addedBy", "badgeNumber policeStationName");

    if (!report) {
      return res.status(404).json({ error: "Report not found or access denied" });
    }

    res.json({ message: "Note added to report", report });
  } catch (err) {
    res.status(400).json({ error: "Failed to add note" });
  }
});

module.exports = reportRouter;
