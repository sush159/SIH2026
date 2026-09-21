export const OFFICER_LOCATION = {
  pos: [25.5788, 91.8933],
  name: "Patrol Unit #104 (Officer Sushanthi / SDRF)",
  heading: "North-West (310°)",
  elevation: "1,525m MSL",
  accuracy: "±3m (RTK Lock)"
};

export const FIELD_HARDWARE_DEVICES = [
  {
    id: "GW-SH01",
    name: "LoRa Gateway Station #01",
    type: "gateway",
    typeLabel: "Base Station Gateway",
    location: "Shillong Ridge Upper Mast",
    coords: [25.5830, 91.8900],
    coordsText: "25.5830° N, 91.8900° E (1,540m MSL)",
    status: "warning",
    statusText: "Silent Spike Post-Shock",
    battery: "12.1V (Solar Offline)",
    batteryPct: 62,
    signal: "-84 dBm (LoRa Mesh)",
    connectedNodes: 6,
    lastPing: "4 mins ago",
    telemetry: {
      voltage: "12.1V",
      rssi: "-84 dBm",
      packetLoss: "4.2%",
      temperature: "17.8°C",
      solarInput: "0.0 mA (Rain Occlusion)"
    },
    sensorsAttached: ["Inclinometer SH-101", "Piezometer PZ-204", "Rain Gauge RG-301", "Extensometer EX-102"],
    notes: "Main mesh relay gateway covering Shillong North slope sector."
  },
  {
    id: "SH-101",
    name: "Borehole MEMS Inclinometer SH-101",
    type: "inclinometer",
    typeLabel: "Slope Tiltmeter / Inclinometer",
    location: "Shillong Middle Ridge Borehole #2",
    coords: [25.5810, 91.8910],
    coordsText: "25.5810° N, 91.8910° E (1,520m MSL)",
    status: "critical",
    statusText: "Tilt Spike: 4.8°/hr",
    battery: "3.58V (Lithium Cell)",
    batteryPct: 88,
    signal: "-76 dBm",
    connectedNodes: 1,
    lastPing: "Just now",
    telemetry: {
      tiltRate: "4.8°/hr",
      cumulativeTilt: "7.2°",
      depth: "18.0m",
      shearPlane: "Detected at 12.4m depth",
      temperature: "16.2°C"
    },
    sensorsAttached: ["Dual-Axis MEMS Sensor Probe", "Pore Sensor Coupler"],
    notes: "Critical subsurface displacement recorded. Immediate slope shear alert."
  },
  {
    id: "PZ-204",
    name: "Pore Pressure Piezometer PZ-204",
    type: "piezometer",
    typeLabel: "Vibrating Wire Piezometer",
    location: "Shillong Lower Slope Drainage Aquifer",
    coords: [25.5765, 91.8895],
    coordsText: "25.5765° N, 91.8895° E (1,495m MSL)",
    status: "critical",
    statusText: "Pressure: 142 kPa (Critical)",
    battery: "3.62V",
    batteryPct: 92,
    signal: "-79 dBm",
    connectedNodes: 1,
    lastPing: "2 mins ago",
    telemetry: {
      porePressure: "142.4 kPa",
      waterTableRise: "+1.85m in 6h",
      soilSaturation: "89.4%",
      hydrostaticHead: "14.5m"
    },
    sensorsAttached: ["High-Pressure Geotechnical Diaphragm"],
    notes: "Severe ground saturation. Liquefaction threshold approaching."
  },
  {
    id: "RG-301",
    name: "Optical Rain Gauge Station RG-301",
    type: "raingauge",
    typeLabel: "High-Rate Rain Gauge",
    location: "Shillong Peak Radar Weather Station",
    coords: [25.5850, 91.8950],
    coordsText: "25.5850° N, 91.8950° E (1,560m MSL)",
    status: "active",
    statusText: "Precipitation: 52 mm/h",
    battery: "13.4V (Solar Active)",
    batteryPct: 98,
    signal: "-68 dBm",
    connectedNodes: 1,
    lastPing: "1 min ago",
    telemetry: {
      currentRainfall: "52.0 mm/h",
      accumulated24h: "184.2 mm",
      peakIntensity: "68.0 mm/h",
      ambientHumidity: "98%"
    },
    sensorsAttached: ["Optical Drop Sensor", "Tipping Bucket Calibrator"],
    notes: "Torrential monsoon precipitation exceedance active."
  },
  {
    id: "EX-102",
    name: "Surface Extensometer Crackmeter EX-102",
    type: "extensometer",
    typeLabel: "Optical Surface Extensometer",
    location: "GS Road Ridge Embankment Cut",
    coords: [25.5740, 91.8885],
    coordsText: "25.5740° N, 91.8885° E (1,505m MSL)",
    status: "warning",
    statusText: "Crack Opening: 14.2 mm",
    battery: "3.60V",
    batteryPct: 84,
    signal: "-82 dBm",
    connectedNodes: 1,
    lastPing: "3 mins ago",
    telemetry: {
      crackDisplacement: "14.2 mm",
      expansionVelocity: "2.1 mm/h",
      baselineGap: "2.0 mm",
      anchorStability: "Secure"
    },
    sensorsAttached: ["Linear Potentiometric Displacement Probe"],
    notes: "Tension crack width expanding rapidly along outer road shoulder."
  },
  {
    id: "SG-401",
    name: "Subsurface Geophone Sensor SG-401",
    type: "geophone",
    typeLabel: "Acoustic / Micro-Seismic Geophone",
    location: "Shillong East Escarpment Flank",
    coords: [25.5800, 91.8940],
    coordsText: "25.5800° N, 91.8940° E (1,530m MSL)",
    status: "critical",
    statusText: "180 micro-events/min",
    battery: "3.55V",
    batteryPct: 79,
    signal: "-86 dBm",
    connectedNodes: 1,
    lastPing: "1 min ago",
    telemetry: {
      acousticEvents: "180 events/min",
      dominantFreq: "24.5 Hz (Rock Fracture)",
      energyFlux: "High Acceleration",
      backgroundNoise: "Subdued"
    },
    sensorsAttached: ["Tri-axial 4.5Hz Seismic Velocity Sensor"],
    notes: "Acoustic micro-cracking indicates imminent slope mass detachment."
  },
  {
    id: "ARD-NODE-07",
    name: "Arduino LoRa Edge Field Node #07",
    type: "arduino",
    typeLabel: "Edge IoT Node (Arduino)",
    location: "Polo Ground Transit Sector",
    coords: [25.5770, 91.8920],
    coordsText: "25.5770° N, 91.8920° E (1,500m MSL)",
    status: "active",
    statusText: "Mesh Relay Online",
    battery: "5.02V (Regulated)",
    batteryPct: 95,
    signal: "-72 dBm",
    connectedNodes: 4,
    lastPing: "Just now",
    telemetry: {
      mcuVoltage: "5.02V",
      loraFrequency: "868.1 MHz",
      uptime: "148 hrs 22 min",
      packetsForwarded: "14,820",
      firmware: "v2.4.1-STABLE"
    },
    sensorsAttached: ["DHT22 Temp/Humidity", "SW-420 Vibration", "LoRa SX1276 Module"],
    notes: "Edge processing & physical LoRa gateway repeater node."
  }
];

export const FIELD_CITIZEN_REPORTS = [
  {
    id: "REP-904",
    reporter: "Bantei Lyngdoh",
    contact: "+91-98621-44102",
    location: "Laitumkhrah Slope Spur Road (GS Road Outer Cut)",
    coords: [25.5750, 91.8900],
    coordsText: "25.5750° N, 91.8900° E (1,490m)",
    timestamp: "35m ago (00:05 IST)",
    urgency: "critical",
    category: "Tension Crack & Water Seepage",
    description: "Asphalt along GS Road outer edge cracked open 8-10cm. Brown muddy water leaking through crack toward lower hillside residential buildings.",
    evidencePhoto: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80",
    tags: ["Tension Crack", "Water Seepage", "Road Edge Failure"],
    status: "investigating", // 'investigating', 'verified', 'resolved', 'escalated'
    fieldVerification: {
      measuredCrackWidth: "9.2 cm",
      displacementRate: "1.4 cm/hr",
      soilSaturation: "Critical (88%)",
      officerNotes: "Inspection verified active asphalt tension fault. Cones placed. PWD barrier requested."
    }
  },
  {
    id: "REP-901",
    reporter: "Wanbiang Marbaniang",
    contact: "+91-94361-09221",
    location: "Police Bazar Ridge Track",
    coords: [25.5780, 91.8860],
    coordsText: "25.5780° N, 91.8860° E (1,500m)",
    timestamp: "1h ago (23:40 IST)",
    urgency: "high",
    category: "Muddy Spring & Soil Liquefaction",
    description: "Hillside discharging sudden brown muddy water. Ground feels spongy and vibrating under foot near municipal water tank.",
    evidencePhoto: "https://images.unsplash.com/photo-1615840287214-7ff58936c4cf?w=600&auto=format&fit=crop&q=80",
    tags: ["Muddy Seepage", "Soft Soil", "Water Surcharge"],
    status: "pending",
    fieldVerification: null
  },
  {
    id: "REP-908",
    reporter: "Daphisha Nongrum",
    contact: "+91-97740-88123",
    location: "Upper Helang Cut (NH-7 Bypass Sector)",
    coords: [25.5720, 91.8870],
    coordsText: "25.5720° N, 91.8870° E (1,485m)",
    timestamp: "2h ago (22:45 IST)",
    urgency: "critical",
    category: "Retaining Wall Bulge & Rockfall",
    description: "Stone masonry retaining wall bulged outwards 15cm. Loose gravel and rocks falling onto transit lane.",
    evidencePhoto: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
    tags: ["Retaining Wall Bulge", "Rockfall Debris", "Lane Threat"],
    status: "verified",
    fieldVerification: {
      measuredCrackWidth: "14.5 cm",
      displacementRate: "2.0 cm/hr",
      soilSaturation: "High (82%)",
      officerNotes: "Retaining wall integrity compromised. Heavy traffic diverted to Upper Helang Bypass."
    }
  },
  {
    id: "REP-912",
    reporter: "Pynskhem Kharbangar",
    contact: "+91-98560-33214",
    location: "Mawlai Ridge Drainage Gully",
    coords: [25.5820, 91.8840],
    coordsText: "25.5820° N, 91.8840° E (1,515m)",
    timestamp: "3h ago (21:50 IST)",
    urgency: "moderate",
    category: "Culvert Blockade & Silt Overflow",
    description: "Culvert beneath slope road choked with tree limbs and mud slurry. Runoff overflowing directly across road.",
    evidencePhoto: "https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=600&auto=format&fit=crop&q=80",
    tags: ["Culvert Blocked", "Runoff Slurry", "Drainage Choke"],
    status: "pending",
    fieldVerification: null
  }
];

export const INITIAL_FIELD_ROADS = [
  {
    id: "shillong-corridor",
    name: "GS Road Urban Corridor (Shillong)",
    nameHi: "जीएस रोड शहरी मार्ग (शिलांग)",
    status: "Blocked",
    badgeClass: "blocked",
    transitStatus: "Closed for Transit",
    advisory: "Use Bypass (+15m)",
    blockageReason: "Slope mudflow and high runoff closed both lanes near ridge.",
    debrisVolume: "3,800 m³ mud & boulder debris",
    clearanceETA: "Clearing in progress (ETA 45 mins)",
    locationMeta: "Shillong • GS Road Ridge",
    center: [25.5750, 91.8900],
    coords: [
      [25.5680, 91.8820],
      [25.5700, 91.8845],
      [25.5720, 91.8870],
      [25.5740, 91.8890],
      [25.5760, 91.8915],
      [25.5780, 91.8940],
      [25.5800, 91.8965]
    ],
    alternateRoute: {
      name: "Shillong Peak Link Bypass",
      nameHi: "शिलांग पीक लिंक बाईपास",
      status: "Open",
      distance: "12.4 km",
      extraTime: "+15 mins",
      notes: "Reinforced ridge bypass away from active slope drainage channels",
      coords: [
        [25.5680, 91.8820],
        [25.5660, 91.8850],
        [25.5650, 91.8890],
        [25.5670, 91.8930],
        [25.5710, 91.8960],
        [25.5760, 91.8980],
        [25.5800, 91.8965]
      ]
    }
  },
  {
    id: "cherrapunji-road",
    name: "Cherrapunji (Sohra) Escarpment Road",
    nameHi: "चेरापूंजी (सोहरा) कगार मार्ग",
    status: "Blocked",
    badgeClass: "blocked",
    transitStatus: "Critical Blockage",
    advisory: "Use Ridge Transit",
    blockageReason: "Escarpment sheetwash and debris fall along Sohra gorge.",
    debrisVolume: "5,200 m³ boulder mass",
    clearanceETA: "Heavy earthmover deployed (ETA 2.5 hrs)",
    locationMeta: "Cherrapunji • Sohra Escarpment",
    center: [25.2680, 91.7280],
    coords: [
      [25.2600, 91.7200],
      [25.2640, 91.7240],
      [25.2680, 91.7280],
      [25.2720, 91.7320],
      [25.2760, 91.7360]
    ],
    alternateRoute: {
      name: "Nohkalikai Ridge Transit Route",
      nameHi: "नोहकलिकाई कटक पारगमन मार्ग",
      status: "Open",
      distance: "9.8 km",
      extraTime: "+20 mins",
      notes: "Elevated bedrock ridge transit clear of drainage gullies",
      coords: [
        [25.2600, 91.7200],
        [25.2620, 91.7250],
        [25.2660, 91.7290],
        [25.2700, 91.7340],
        [25.2760, 91.7360]
      ]
    }
  },
  {
    id: "trans-arunachal",
    name: "Trans-Arunachal Sector (NH-13)",
    nameHi: "ट्रांस-अरुणाचल सेक्टर (NH-13)",
    status: "At-Risk",
    badgeClass: "at-risk",
    transitStatus: "Single-Lane Escort",
    advisory: "Drive with Care",
    blockageReason: "Saturated slope coluvium causing loose boulder fall.",
    debrisVolume: "Minor gravel spall",
    clearanceETA: "Police convoy escort in effect",
    locationMeta: "Arunachal • Remote Valley NH-13",
    center: [28.6480, 96.1480],
    coords: [
      [28.6400, 96.1400],
      [28.6440, 96.1440],
      [28.6480, 96.1480],
      [28.6520, 96.1520],
      [28.6560, 96.1560]
    ],
    alternateRoute: {
      name: "Valley Low Bypass Route",
      nameHi: "घाटी निचला बाईपास मार्ग",
      status: "Open",
      distance: "18.5 km",
      extraTime: "+25 mins",
      notes: "Lower flood plain embankment bypass route",
      coords: [
        [28.6400, 96.1400],
        [28.6430, 96.1450],
        [28.6470, 96.1500],
        [28.6510, 96.1540],
        [28.6560, 96.1560]
      ]
    }
  },
  {
    id: "shillong-bypass",
    name: "Shillong Bypass Highway (NH-6)",
    nameHi: "शिलांग बाईपास हाईवे (NH-6)",
    status: "Open",
    badgeClass: "open",
    transitStatus: "Open & Clear",
    advisory: "Safe for All Traffic",
    blockageReason: "None. All 4 lanes monitored and clear.",
    debrisVolume: "0 m³",
    clearanceETA: "Fully Operational",
    locationMeta: "Shillong • NH-6 Bypass",
    center: [25.5900, 91.9100],
    coords: [
      [25.5800, 91.9000],
      [25.5850, 91.9050],
      [25.5900, 91.9100],
      [25.5950, 91.9150]
    ],
    alternateRoute: null
  }
];

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

