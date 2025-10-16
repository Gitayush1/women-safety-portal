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
