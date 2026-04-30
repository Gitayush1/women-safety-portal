const express = require("express");
const mongoose = require("mongoose");
const { userAuth } = require("../middlewares/auth");
const {
  detectEmergencyRisk,
} = require("../risk-detection/services/riskDetectionService");
const {
  upsertReportFromEmergencyLocation,
} = require("../services/emergencyReportService");

const trackingRouter = express.Router();
const RISK_CACHE_TTL_MS = 2 * 60 * 1000;
const RISK_CACHE_MAX_ITEMS = 1000;
const riskCache = new Map();

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

const normalizeStatus = (rawStatus) => {
  const value = String(rawStatus || "").trim().toLowerCase();
  if (!value) return "unknown";
  if (value.includes("emergency") || value.includes("sos")) return "emergency";
  if (value.includes("warning") || value.includes("alert")) return "warning";
  if (value.includes("safe") || value.includes("normal")) return "safe";
  return value;
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

const getFallbackBattery = (doc) => {
  const seedSource = String(doc?._id || doc?.userId || doc?.email || "seed");
  let hash = 0;
  for (let i = 0; i < seedSource.length; i += 1) {
    hash = (hash * 31 + seedSource.charCodeAt(i)) >>> 0;
  }
  // Stable "random-like" range from 22 to 96
  return 22 + (hash % 75);
};

const normalizeBattery = (doc) => {
  const candidate =
    typeof doc?.batteryLevel === "number"
      ? doc.batteryLevel
      : typeof doc?.battery === "number"
      ? doc.battery
      : null;

  if (typeof candidate === "number" && candidate > 0 && candidate <= 100) {
    return Math.round(candidate);
  }

  return getFallbackBattery(doc);
};

const normalizeUserDoc = (doc) => {
  const lastLocation = extractLocation(doc);
  const updatedAt = toDate(doc?.updatedAt || doc?.createdAt, doc?._id).toISOString();

  return {
    _id: String(doc?._id),
    userId: doc?.userId ? String(doc.userId) : undefined,
    name:
      doc?.reporterName ||
      doc?.userId ||
      doc?.name ||
      doc?.username ||
      doc?.userName ||
      "Unknown User",
    phone: doc?.reporterPhone || doc?.phone || doc?.phoneNumber || "N/A",
    email: doc?.email || "",
    status: normalizeStatus(doc?.status || "emergency"),
    lastLocation,
    batteryLevel: normalizeBattery(doc),
    updatedAt,
    note: doc?.note || "",
    source: "users",
  };
};

const mapRiskToStatus = (riskLevel) => {
  const level = String(riskLevel || "").toLowerCase();
  if (level === "high") return "emergency";
  if (level === "medium") return "warning";
  if (level === "low") return "safe";
  return "unknown";
};

const buildRiskInputText = (doc) => {
  const parts = [doc?.description, doc?.location].filter(
    (value) => typeof value === "string" && value.trim()
  );
  return parts.join(". ");
};

const buildRiskCacheKey = (doc, text, voiceTranscript) => {
  const id = String(doc?._id || "");
  const updatedAt = String(doc?.updatedAt || doc?.time || doc?.createdAt || "");
  return `${id}|${updatedAt}|${text}|${voiceTranscript}`;
};

const getCachedRisk = (cacheKey) => {
  const cached = riskCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() - cached.cachedAt > RISK_CACHE_TTL_MS) {
    riskCache.delete(cacheKey);
    return null;
  }

  return cached.result;
};

const setCachedRisk = (cacheKey, result) => {
  if (riskCache.size >= RISK_CACHE_MAX_ITEMS) {
    const oldestKey = riskCache.keys().next().value;
    if (oldestKey) {
      riskCache.delete(oldestKey);
    }
  }

  riskCache.set(cacheKey, {
    cachedAt: Date.now(),
    result,
  });
};

const buildTrackedUser = async (doc, station, options = {}) => {
  const { persistReport = true } = options;
  const normalizedUser = {
    ...normalizeUserDoc(doc),
    source: "emergency_locations",
  };

  const text = buildRiskInputText(doc);
  const voiceTranscript =
    typeof doc?.voiceTranscript === "string" ? doc.voiceTranscript : "";

  if (!text && !voiceTranscript) {
    return normalizedUser;
  }

  try {
    const cacheKey = buildRiskCacheKey(doc, text, voiceTranscript);
    const cachedRisk = getCachedRisk(cacheKey);
    const riskResult =
      cachedRisk || (await detectEmergencyRisk({ text, voiceTranscript }));

    if (!cachedRisk) {
      setCachedRisk(cacheKey, riskResult);
    }

    const savedReport = persistReport
      ? await upsertReportFromEmergencyLocation({
          doc,
          station,
          riskAnalysis: riskResult,
        })
      : null;

    return {
      ...normalizedUser,
      status: mapRiskToStatus(riskResult?.riskLevel),
      aiRisk: {
        level: riskResult?.riskLevel,
        priority: riskResult?.priority,
        confidence: riskResult?.confidence,
        reason: riskResult?.reason,
        flaggedForReview: Boolean(riskResult?.flaggedForReview),
      },
      reportId: savedReport?.reportId,
      reportObjectId: savedReport?._id,
    };
  } catch (error) {
    return normalizedUser;
  }
};

const extractComparableIds = (value) => {
  if (value === null || value === undefined) return [];

  if (Array.isArray(value)) {
    return value.flatMap((entry) => extractComparableIds(entry));
  }

  if (typeof value === "string" || typeof value === "number") {
    return [String(value)];
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return [String(value)];
  }

  if (typeof value === "object") {
    const ids = [];
    if (typeof value.toHexString === "function") {
      ids.push(String(value.toHexString()));
    }
    if (value.$oid) ids.push(String(value.$oid));
    if (value._id) ids.push(...extractComparableIds(value._id));
    if (value.id) ids.push(...extractComparableIds(value.id));
    if (typeof value.toString === "function") {
      const asString = String(value.toString());
      if (/^[a-fA-F0-9]{24}$/.test(asString)) {
        ids.push(asString);
      }
    }
    return ids;
  }

  return [];
};

const extractComparableNames = (value) => {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) {
    return value.flatMap((entry) => extractComparableNames(entry));
  }
  if (typeof value === "string" || typeof value === "number") {
    return [String(value).trim().toLowerCase()];
  }
  if (typeof value === "object") {
    const names = [];
    if (value.name) names.push(...extractComparableNames(value.name));
    if (value.stationName) names.push(...extractComparableNames(value.stationName));
    if (value.policeStationName) {
      names.push(...extractComparableNames(value.policeStationName));
    }
    if (value.assignedStation) {
      names.push(...extractComparableNames(value.assignedStation));
    }
    return names;
  }
  return [];
};

const isAssignedToStation = (doc, station) => {
  const stationIdString = String(station?._id || "");
  const stationBadge = String(station?.badgeNumber || "").trim();
  const stationName = String(station?.policeStationName || "")
    .trim()
    .toLowerCase();
  const hasStationId = Boolean(stationIdString);
  const hasStationBadge = Boolean(stationBadge);
  const hasStationName = Boolean(stationName);
  if (!hasStationId && !hasStationBadge && !hasStationName) return false;

  const stationFields = [
    doc?.stationId,
    doc?.assignedStationId,
    doc?.dedicatedStationId,
    doc?.linkedStationIds,
  ];
  const stationNameFields = [
    doc?.assignedStation,
    doc?.stationName,
    doc?.policeStationName,
    doc?.linkedStations,
  ];

  const allIds = stationFields.flatMap((entry) => extractComparableIds(entry));
  const allNames = stationNameFields.flatMap((entry) =>
    extractComparableNames(entry)
  );

  const idMatch = hasStationId && allIds.includes(stationIdString);
  const badgeMatch = hasStationBadge && allIds.includes(stationBadge);
  const nameMatch = hasStationName && allNames.includes(stationName);
  return idMatch || badgeMatch || nameMatch;
};

trackingRouter.get("/users", userAuth, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ error: "Database not ready" });
    }

    const station = req.user;
    const emergencyRows = await db
      .collection("emergency_locations")
      .find({})
      .limit(500)
      .toArray();
    const assignedStationDocs = emergencyRows.filter((doc) =>
      isAssignedToStation(doc, station)
    );
    const isFallbackScope = assignedStationDocs.length === 0;
    const stationDocs = isFallbackScope ? emergencyRows : assignedStationDocs;
    const stationUsers = await Promise.all(
      stationDocs.map((doc) =>
        buildTrackedUser(doc, station, { persistReport: !isFallbackScope })
      )
    );

    return res.json({
      users: stationUsers,
      scope: isFallbackScope ? "all" : "assigned",
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch tracking data" });
  }
});

trackingRouter.get("/emergency", userAuth, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ error: "Database not ready" });
    }

    const station = req.user;
    const emergencyRows = await db
      .collection("emergency_locations")
      .find({})
      .limit(500)
      .toArray();

    const assignedStationDocs = emergencyRows.filter((doc) =>
      isAssignedToStation(doc, station)
    );
    const isFallbackScope = assignedStationDocs.length === 0;
    const stationDocs = isFallbackScope ? emergencyRows : assignedStationDocs;
    const normalized = (await Promise.all(
      stationDocs.map((doc) =>
        buildTrackedUser(doc, station, { persistReport: !isFallbackScope })
      )
    ))
      .filter((doc) => doc.status === "emergency");
    return res.json({
      users: normalized,
      scope: isFallbackScope ? "all" : "assigned",
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch emergency data" });
  }
});

module.exports = trackingRouter;
