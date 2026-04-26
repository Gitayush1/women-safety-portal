const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Emergency", "Harassment", "Domestic Violence", "Suspicious Activity", "Other"],
    },
    location: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    voiceTranscript: {
      type: String,
      trim: true,
    },
    voiceUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "investigating", "resolved"],
      default: "active",
    },
    priority: {
      type: String,
      required: true,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    riskConfidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    riskReason: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: ["manual", "emergency_locations"],
      default: "manual",
    },
    sourceEmergencyLocationId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    reporterName: {
      type: String,
      required: true,
    },
    reporterPhone: {
      type: String,
      required: true,
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Police",
    },
    assignedStation: {
      type: String,
      required: true,
    },
    assignedStationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Police",
      required: true,
    },
    linkedStationIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Police",
      },
    ],
    coordinates: {
      lat: Number,
      lng: Number,
    },
    evidence: [{
      type: String, // URLs to evidence files
    }],
    notes: [{
      note: String,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Police",
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Report", reportSchema);
