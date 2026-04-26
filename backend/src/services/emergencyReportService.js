const Report = require("../models/Report");

const REPORT_SEQUENCE_PREFIX = "RPT";
const REPORT_TYPES = new Set([
  "Emergency",
  "Harassment",
  "Domestic Violence",
  "Suspicious Activity",
  "Other",
]);

const stringifyId = (value) => (value ? String(value) : "");

const pickString = (...values) => {
  const value = values.find(
    (entry) => typeof entry === "string" && entry.trim()
  );
  return value ? value.trim() : "";
};

const buildLocationText = (doc) => {
  const explicitLocation = pickString(doc?.location, doc?.address);
  if (explicitLocation) return explicitLocation;

  const lat =
    typeof doc?.lastLocation?.lat === "number"
      ? doc.lastLocation.lat
      : typeof doc?.latitude === "number"
      ? doc.latitude
      : typeof doc?.lat === "number"
      ? doc.lat
      : null;
  const lng =
    typeof doc?.lastLocation?.lng === "number"
      ? doc.lastLocation.lng
      : typeof doc?.longitude === "number"
      ? doc.longitude
      : typeof doc?.lng === "number"
      ? doc.lng
      : null;

  if (typeof lat === "number" && typeof lng === "number") {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  return "Unknown location";
};

const buildCoordinates = (doc) => {
  if (
    doc?.lastLocation &&
    typeof doc.lastLocation.lat === "number" &&
    typeof doc.lastLocation.lng === "number"
  ) {
    return { lat: doc.lastLocation.lat, lng: doc.lastLocation.lng };
  }

  const lat =
    typeof doc?.latitude === "number"
      ? doc.latitude
      : typeof doc?.lat === "number"
      ? doc.lat
      : null;
  const lng =
    typeof doc?.longitude === "number"
      ? doc.longitude
      : typeof doc?.lng === "number"
      ? doc.lng
      : null;

  if (typeof lat === "number" && typeof lng === "number") {
    return { lat, lng };
  }

  return undefined;
};

const buildReportId = async () => {
  const reportCount = await Report.countDocuments();
  return `${REPORT_SEQUENCE_PREFIX}-${String(reportCount + 1).padStart(3, "0")}`;
};

const normalizeReportType = (value) => {
  const candidate = pickString(value);
  return REPORT_TYPES.has(candidate) ? candidate : "Emergency";
};

async function upsertReportFromEmergencyLocation({ doc, station, riskAnalysis }) {
  const sourceEmergencyLocationId = stringifyId(doc?._id);
  if (!sourceEmergencyLocationId || !station?._id) return null;

  const description = pickString(
    doc?.description,
    doc?.note,
    doc?.message,
    doc?.voiceTranscript,
    "Emergency alert from live tracking"
  );
  const voiceTranscript = pickString(doc?.voiceTranscript);
  const existingReport = await Report.findOne({ sourceEmergencyLocationId });
  const reportId = existingReport?.reportId || (await buildReportId());
  const linkedStationIds = [station._id];

  const update = {
    reportId,
    type: normalizeReportType(doc?.type),
    location: buildLocationText(doc),
    description,
    voiceTranscript,
    voiceUrl: pickString(doc?.voiceUrl, doc?.audioUrl),
    priority: riskAnalysis?.riskLevel || "medium",
    riskConfidence: riskAnalysis?.confidence,
    riskReason: riskAnalysis?.reason,
    riskSource: riskAnalysis?.debug?.source,
    riskFallbackReason: riskAnalysis?.debug?.fallbackReason,
    reporterName: pickString(doc?.name, doc?.username, doc?.userName, doc?.userId, "Unknown User"),
    reporterPhone: pickString(doc?.phone, doc?.phoneNumber, "N/A"),
    assignedStationId: station._id,
    linkedStationIds,
    assignedStation: station.policeStationName,
    coordinates: buildCoordinates(doc),
    source: "emergency_locations",
    sourceEmergencyLocationId,
  };

  return Report.findOneAndUpdate(
    { sourceEmergencyLocationId },
    { $set: update, $setOnInsert: { status: "active" } },
    { new: true, upsert: true, runValidators: true }
  );
}

module.exports = {
  upsertReportFromEmergencyLocation,
};
