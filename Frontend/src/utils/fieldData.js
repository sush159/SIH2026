export const OFFICER_LOCATION = {
  pos: [25.5788, 91.8933],
  name: "Patrol Unit #104 (Officer Sushanthi / SDRF)",
  heading: "North-West (310°)",
  elevation: "1,525m MSL",
  accuracy: "±3m (RTK Lock)"
};

export const INITIAL_FIELD_TASKS = {
  "TASK-101": {
    id: "TASK-101",
    type: "hardware",
    typeLabel: "Hardware Alert",
    title: "Gateway GW-SH01 Offline Inspection",
    location: "Shillong Ridge Upper Slope",
    coords: [25.5830, 91.8900],
    coordsText: "25.5830° N, 91.8900° E (1,540m)",
    distance: "0.4 km NW",
    urgency: "critical",
    urgencyText: "CRITICAL / SILENT SPIKE",
    summary: "Gateway GW-SH01 silent post-tilt spike (4.8°/hr). Inspect antenna mast, solar feed, and slope shear.",
    diagnostics: {
      station: "Gateway GW-SH01 (LoRa Mesh)",
      lastTelemetry: "4.8°/hr tilt exceedance recorded",
      batteryVoltage: "12.1V (Solar Offline)",
      connectedSensors: "4 Inclinometers, 2 Piezometers",
      failureMode: "Physical slope failure / rockfall impact"
    },
    status: "pending"
  },

  "TASK-102": {
    id: "TASK-102",
    type: "citizen",
    typeLabel: "Citizen Report",
    title: "Tension Crack on Road Embankment",
    location: "Laitumkhrah Slope Spur Road",
    coords: [25.5750, 91.8900],
    coordsText: "25.5750° N, 91.8900° E (1,490m)",
    distance: "0.5 km SW",
    urgency: "high",
    urgencyText: "HIGH PRIORITY",
    summary: "Citizen Report #904 flagged 3.2m continuous ground crack forming along asphalt road edge.",
    citizenReport: {
      reportId: "#REP-904",
      reporter: "Bantei Lyngdoh (Laitumkhrah)",
      timestamp: "35m ago (00:05 IST)",
      description: "Asphalt along GS Road outer edge cracked open 8-10cm. Muddy water leaking through crack toward lower homes.",
      photoPreview: "Road asphalt separation with visible soil void",
      tags: ["Tension Crack", "Water Seepage"]
    },
    status: "pending"
  },

  "TASK-103": {
    id: "TASK-103",
    type: "zone",
    typeLabel: "Zone Check",
    title: "GS Road Urban Corridor Debris Clearance",
    location: "GS Road Ridge Pass (Shillong)",
    coords: [25.5750, 91.8900],
    coordsText: "25.5750° N, 91.8900° E (1,510m)",
    distance: "1.2 km S",
    urgency: "critical",
    urgencyText: "CRITICAL BLOCKADE",
    summary: "Verify PWD earthmover progress and ensure Shillong Peak Link Bypass remains clear for light traffic.",
    zoneCheck: {
      sector: "Shillong Urban Ridge Cut",
      blockadeVolume: "3,800 m³ mud and boulder mass",
      bypassRoute: "Shillong Peak Link Bypass (Open, 12.4 km)",
      safetyProtocol: "Commercial transit prohibited until slope stabilized"
    },
    status: "pending"
  },

  "TASK-104": {
    id: "TASK-104",
    type: "hardware",
    typeLabel: "Hardware Alert",
    title: "Inclinometer Node SH-101 Check",
    location: "Shillong Middle Ridge",
    coords: [25.5810, 91.8910],
    coordsText: "25.5810° N, 91.8910° E (1,520m)",
    distance: "0.6 km N",
    urgency: "high",
    urgencyText: "HIGH PRIORITY",
    summary: "Borehole sensor SH-101 recorded extreme tilt acceleration prior to silence. Inspect casing and wiring.",
    diagnostics: {
      station: "Node SH-101 (Inclinometer)",
      lastTelemetry: "4.8°/hr tilt acceleration",
      batteryVoltage: "3.6V Lithium Primary",
      connectedSensors: "Dual-axis MEMS (Depth: 18m)",
      failureMode: "Sub-surface shear displacement check"
    },
    status: "pending"
  },

  "TASK-105": {
    id: "TASK-105",
    type: "citizen",
    typeLabel: "Citizen Report",
    title: "Muddy Spring Seepage at Police Bazar Ridge",
    location: "Police Bazar Ridge Track",
    coords: [25.5780, 91.8860],
    coordsText: "25.5780° N, 91.8860° E (1,500m)",
    distance: "1.8 km NE",
    urgency: "moderate",
    urgencyText: "ELEVATED WATCH",
    summary: "Citizen Report #901 reported sudden muddy spring erupting from hill slope near water reservoir.",
    citizenReport: {
      reportId: "#REP-901",
      reporter: "Wanbiang Marbaniang",
      timestamp: "1h ago (23:40 IST)",
      description: "Hillside discharging brown muddy water. Ground soft and spongy under foot.",
      photoPreview: "Turbid water pooling around terrace stone wall",
      tags: ["Muddy Seepage", "Soft Soil"]
    },
    status: "pending"
  }
};
