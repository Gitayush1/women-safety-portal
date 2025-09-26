const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    emergencyContacts: [{
      name: String,
      phone: String,
      relationship: String,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLocation: {
      lat: Number,
      lng: Number,
      timestamp: Date,
    },
    batteryLevel: {
      type: Number,
      default: 100,
    },
    status: {
      type: String,
      enum: ["safe", "warning", "emergency"],
      default: "safe",
    },
    trackingHistory: [{
      lat: Number,
      lng: Number,
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

module.exports = mongoose.model("User", userSchema);
