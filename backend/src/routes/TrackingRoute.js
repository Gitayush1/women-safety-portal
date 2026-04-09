const express = require("express");
const mongoose = require("mongoose");
const { userAuth } = require("../middlewares/auth");

const trackingRouter = express.Router();

const toDate = (value, fallbackId) => {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (fallbackId && typeof fallbackId.getTimestamp === "function") {
    return fallbackId.getTimestamp();
  }
  return new Date();
};

const normalizeStatus = (rawStatus, forceEmergency = false) => {
  if (forceEmergency) return "emergency";
  const value = String(rawStatus || "").toLowerCase();
  if (value.includes("emergency") || value.includes("sos")) return "emergency";
  if (value.includes("warning") || value.includes("alert")) return "warning";
  if (value.includes("safe") || value.includes("normal")) return "safe";
  return "safe";
};

const extractLocation = (doc) => {
  if (
    doc?.lastLocation &&
    typeof doc.lastLocation.lat === "number" &&
    typeof doc.lastLocation.lng === "number"
  ) {
    return {
      lat: doc.lastLocation.lat,
      lng: doc.lastLocation.lng,
      timestamp: toDate(doc.lastLocation.timestamp, doc._id).toISOString(),
    };
  }

  const latCandidates = [doc?.latitude, doc?.lat, doc?.location?.lat];
  const lngCandidates = [doc?.longitude, doc?.lng, doc?.location?.lng];

  const lat = latCandidates.find((v) => typeof v === "number");
  const lng = lngCandidates.find((v) => typeof v === "number");

  if (typeof lat === "number" && typeof lng === "number") {
    return {
      lat,
      lng,
      timestamp: toDate(doc?.updatedAt || doc?.createdAt, doc?._id).toISOString(),
    };
  }

  return null;
};

const normalizeUserDoc = (doc, forceEmergency = false) => {
  const lastLocation = extractLocation(doc);
  const updatedAt = toDate(doc?.updatedAt || doc?.createdAt, doc?._id).toISOString();

  return {
    _id: String(doc?._id),
    userId: doc?.userId ? String(doc.userId) : undefined,
    name:
      doc?.userId ||
      doc?.name ||
      doc?.username ||
      doc?.userName ||
      "Unknown User",
    phone: doc?.phone || doc?.phoneNumber || "N/A",
    email: doc?.email || "",
    status: normalizeStatus(doc?.status, forceEmergency),
    lastLocation,
    batteryLevel:
      typeof doc?.batteryLevel === "number"
        ? doc.batteryLevel
        : typeof doc?.battery === "number"
        ? doc.battery
        : 0,
    updatedAt,
    note: doc?.note || "",
    source: forceEmergency ? "emergency_locations" : "users",
  };
};

trackingRouter.get("/users", userAuth, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ error: "Database not ready" });
    }

    const users = await db.collection("users").find({}).limit(500).toArray();
    const normalized = users.map((doc) => normalizeUserDoc(doc, false));

    return res.json({ users: normalized });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch users data" });
  }
});

trackingRouter.get("/emergency", userAuth, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ error: "Database not ready" });
    }

    const emergencyRows = await db
      .collection("emergency_locations")
      .find({})
      .limit(500)
      .toArray();

    const normalized = emergencyRows.map((doc) => normalizeUserDoc(doc, true));
    return res.json({ users: normalized });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch emergency data" });
  }
});

module.exports = trackingRouter;
