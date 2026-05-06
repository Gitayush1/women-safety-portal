const Report = require("../models/Report");
const Police = require("../models/Police");

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

const collectStationRefs = (doc, station) => {
  const refs = [
    doc?.assignedStationId,
    doc?.stationId,
    doc?.dedicatedStationId,
    doc?.assignedStation,
    doc?.stationName,
    doc?.policeStationName,
    station?._id,
    station?.badgeNumber,
    station?.policeStationName,
  ];

  if (Array.isArray(doc?.linkedStationIds)) refs.push(...doc.linkedStationIds);
  if (Array.isArray(doc?.linkedStations)) refs.push(...doc.linkedStations);

  return [...new Set(refs.map(stringifyId).filter(Boolean))];
};

async function resolveLinkedStations(doc, station) {
  const refs = collectStationRefs(doc, station);
  const objectIds = refs
    .filter((ref) => /^[a-fA-F0-9]{24}$/.test(ref))
    .map((ref) => ref);
  const textRefs = refs.filter((ref) => !/^[a-fA-F0-9]{24}$/.test(ref));

  const queryParts = [];
  if (objectIds.length) {
    queryParts.push({ _id: { $in: objectIds } });
  }
  if (textRefs.length) {
    queryParts.push(
      { badgeNumber: { $in: textRefs } },
      { policeStationName: { $in: textRefs } }
    );
  }

  const stations = queryParts.length
    ? await Police.find({ $or: queryParts }).select("_id policeStationName badgeNumber")
    : [];

  const currentStationIncluded = stations.some(
    (entry) => stringifyId(entry._id) === stringifyId(station?._id)
  );
  if (station?._id && !currentStationIncluded) {
    stations.push(station);
  }

  return stations;
}

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
  const linkedStations = await resolveLinkedStations(doc, station);
  const assignedStation =
    linkedStations.find((entry) => {
      const assignedRef = stringifyId(doc?.assignedStationId);
      return (
        stringifyId(entry._id) === assignedRef ||
        stringifyId(entry.badgeNumber) === assignedRef ||
        stringifyId(entry.policeStationName) === assignedRef
      );
    }) || station;
  const linkedStationIds = [
    ...new Set(linkedStations.map((entry) => stringifyId(entry._id))),
  ];

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
    reporterName: pickString(doc?.userId, doc?.name, doc?.username, doc?.userName, "Unknown User"),
    reporterPhone: pickString(doc?.phone, doc?.phoneNumber, "N/A"),
    assignedStationId: assignedStation._id,
    linkedStationIds,
    assignedStation: assignedStation.policeStationName,
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
