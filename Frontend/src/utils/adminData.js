export const ZONES_DATABASE = {
  "shillong-meghalaya": {
    name: "Shillong Urban & Ridge Slopes (Meghalaya)",
    coords: "25.5788° N, 91.8933° E (Elevation: 1,525m MSL)",
    center: [25.5788, 91.8933],
    zoom: 15,
    severity: "critical",
    severityText: "RED ALERT — LEVEL 4 EVACUATION",
    finalRisk: "94.6%",
    confidenceScore: "93.8%",
    riskWindow: "~45 Minutes",
    shelter: "Shillong Municipal Relief Center #1 (Polo Ground)",
    polygon: [
      [25.5840, 91.8860],
      [25.5865, 91.8995],
      [25.5735, 91.9020],
      [25.5710, 91.8875]
    ],
    sensors: [
      { name: "Node SH-101 (Borehole Inclinometer)", pos: [25.5810, 91.8910], type: "tilt", val: "4.8°/hr tilt acceleration (Exceeds Threshold)", color: "#dc2626" },
      { name: "Piezometer PZ-SH (Pore Saturation)", pos: [25.5775, 91.8950], type: "soil", val: "89.2% pore pressure moisture saturation", color: "#ea580c" },
      { name: "Gateway GW-SH01 (LoRa Mesh)", pos: [25.5830, 91.8900], type: "gateway", val: "Silent (12m ago post-tilt spike)", color: "#be123c" },
      { name: "IMD Doppler AWS Rain Gauge (Shillong)", pos: [25.5845, 91.8870], type: "rain", val: "118.0 mm / 24h continuous monsoon downpour", color: "#0284c7" }
    ],
    flags: {
      cascadingFlood: {
        active: true,
        badge: "+2.4m Surge Alert",
        trigger: "Slope debris flow encroaching downstream storm drainage",
        arrival: "30 to 60 minutes downstream",
        action: "Evacuate low-lying drainage and stream valleys"
      },
      dataSilence: {
        active: true,
        badge: "Node Disrupted (Slide Activity)",
        station: "Gateway GW-SH01 (Shillong Ridge Upper Slope)",
        lastTx: "Lost 12m ago after recording 4.8°/hr tilt exceedance",
        action: "Classified as physical slope shear, not network loss"
      }
    },
    factors: [
      { label: "Cumulative Precipitation", source: "IMD Doppler AWS (Shillong)", value: "118.0 mm / 24h (Surge >80mm threshold)" },
      { label: "Volumetric Soil Moisture", source: "In-situ Piezometer Nodes", value: "89.2% (Pore Saturation Liquefaction)" },
      { label: "Slope Gradient & Aspect", source: "CartoDEM / Survey of India", value: "36.2° Convex Hill Slope (Colluvial Mantle)" },
      { label: "Surface Creep & Displacement", source: "Sentinel-1 InSAR (GEE)", value: "+15.8 mm/wk continuous ground creep" },
      { label: "Field Ground Observation", source: "Citizen Report #SH-904 (Verified)", value: "3.8m structural tension crack along ridge roadway" },
      { label: "Borehole Inclinometer Tilt", source: "Node SH-101", value: "4.8°/hour acceleration prior to silence" }
    ],
    villages: [
      { name: "Shillong Peak Ridge Sector", severity: "critical", proximity: "0.4 km", road: "blocked", roadText: "Cut Off (GS Road)", score: "Score: 9.8 / 10", shelter: "Shillong Municipal Relief Center #1", pos: [25.5760, 91.8910] },
      { name: "Mawlai Valley Settlement", severity: "critical", proximity: "1.2 km", road: "restricted", roadText: "Partial Bypass", score: "Score: 8.9 / 10", shelter: "Mawlai Higher Secondary Camp", pos: [25.5890, 91.8790] },
      { name: "Laitumkhrah Upper Slope", severity: "high", proximity: "1.8 km", road: "open", roadText: "Open Access", score: "Score: 7.2 / 10", shelter: "St. Anthony Relief Safe Zone", pos: [25.5690, 91.8980] },
      { name: "Polo Ground Community Sector", severity: "high", proximity: "2.1 km", road: "open", roadText: "Open Access", score: "Score: 6.8 / 10", shelter: "Polo Ground High Ground Camp", pos: [25.5840, 91.8950] }
    ],
    roads: [
      { name: "GS Road Corridor (NH-106 / NH-6)", status: "blocked", statusText: "Blocked by Mudflow", bypass: "Upper Shillong Bypass", delay: "12.4 km (+15 min delay)" },
      { name: "Shillong ⇄ Jowai Highway", status: "restricted", statusText: "Restricted / Slush", bypass: "Eastern Bypass Route", delay: "16.2 km (+25 min delay)" },
      { name: "Mawlai Ridge Link Spur", status: "restricted", statusText: "At-Risk (Creep)", bypass: "Umshing Road Footpath", delay: "3.1 km (+10 min delay)" },
      { name: "Shillong ⇄ Guwahati Expressway", status: "open", statusText: "Open & Monitored", bypass: "Direct Highway", delay: "Nominal" }
    ],
    feasibility: [
      { village: "Shillong Peak Ridge Sector", shelter: "Shillong Municipal Relief Center #1", channel: "App Push + SMS + City Siren", statusClass: "low", reach: "99% Reachable" },
      { village: "Mawlai Valley Settlement", shelter: "Mawlai Higher Secondary Camp", channel: "SMS Fallback + LoRa Node", statusClass: "low", reach: "95% Reachable" },
      { village: "Laitumkhrah Upper Slope", shelter: "St. Anthony Relief Safe Zone", channel: "Smartphone App + SMS", statusClass: "low", reach: "97% Reachable" },
      { village: "Polo Ground Community Sector", shelter: "Polo Ground High Ground Camp", channel: "Siren Tower #1 + Satellite", statusClass: "high", reach: "100% Siren Blast" }
    ],
    satellite: {
      thumbnailUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1000&q=80",
      orbit: "Descending Pass #084 (GEE Sentinel-1/2)",
      timestamp: "Acquired: 38m ago (GEE NER Live Telemetry)",
      modelTag: "NER-Landslide-ResNet-v4.2",
      gsd: "10m/px (Google Earth Engine Sentinel-1 SAR & Sentinel-2)",
      insarVelocity: "+15.8 mm/wk",
      insarLevel: "critical",
      insarSub: "Severe line-of-sight slope creep (Threshold: >5.0 mm/wk)",
      insarBarWidth: "90%",
      ndwiVal: "0.86 Index",
      ndwiLevel: "high",
      ndwiSub: "Pore-pressure water saturation along colluvial shear plane",
      ndwiBarWidth: "86%",
      scarVal: "3.8m Fissure Detected",
      scarLevel: "critical",
      scarSub: "Mask confidence: 97.4% (Verified with SDRF Patrol)",
      scarBarWidth: "97%",
      riskScore: "94.6% Susceptibility",
      nextPass: "Sentinel-1B in 4h 10m",
      radarCoherence: "0.91 (High Quality)",
      xaiWeights: [
        { label: "GEE InSAR Radar Creep", weight: 44, color: "#dc2626" },
        { label: "Doppler AWS Rain", weight: 32, color: "#ea580c" },
        { label: "CartoDEM Slope Gradient", weight: 14, color: "#2563eb" },
        { label: "GEE NDWI Soil Moisture", weight: 10, color: "#0891b2" }
      ],
      detections: [
        { id: "SH-CRACK-01", label: "Tension Fissure (3.8m)", conf: "97.4%", type: "crack", x: 26, y: 32, w: 28, h: 18, color: "#ef4444" },
        { id: "SH-SLIP-TOE", label: "Active Colluvial Toe (+15.8mm/wk)", conf: "95.1%", type: "slip", x: 48, y: 46, w: 32, h: 28, color: "#f97316" },
        { id: "SH-ROAD-VOID", label: "GS Road Undermining", conf: "92.8%", type: "road", x: 34, y: 72, w: 26, h: 15, color: "#dc2626" }
      ]
    }
  },

  "cherrapunji-meghalaya": {
    name: "Cherrapunji (Sohra) Escarpment (Meghalaya)",
    coords: "25.2700° N, 91.7300° E (Elevation: 1,430m MSL)",
    center: [25.2700, 91.7300],
    zoom: 15,
    severity: "critical",
    severityText: "RED ALERT — ESCARPMENT RUNOFF FAILURE",
    finalRisk: "98.0%",
    confidenceScore: "96.4%",
    riskWindow: "Active Failure (0 min)",
    shelter: "Sohra Civil Sub-Division Relief Camp",
    polygon: [
      [25.2780, 91.7220],
      [25.2810, 91.7380],
      [25.2630, 91.7390],
      [25.2610, 91.7210]
    ],
    sensors: [
      { name: "Sohra Escarpment Tiltmeter", pos: [25.2720, 91.7320], type: "tilt", val: "44.0° unstable rock-cut escarpment", color: "#dc2626" },
      { name: "Cherrapunji AWS Rain Station", pos: [25.2680, 91.7280], type: "rain", val: "214.0 mm / 24h extreme rainfall", color: "#0284c7" },
      { name: "Gateway GW-CH02 (Sohra Transit)", pos: [25.2710, 91.7295], type: "gateway", val: "Online (13.4V Solar)", color: "#16a34a" }
    ],
    flags: {
      cascadingFlood: {
        active: true,
        badge: "+3.2m Gorge Surge",
        trigger: "Escarpment debris mass obstructing drainage canyon",
        arrival: "20 to 45 minutes downstream",
        action: "Evacuate canyon floor and waterfall tourists"
      },
      dataSilence: { active: false, title: "", text: "" }
    },
    factors: [
      { label: "Extreme Precipitation", source: "Cherrapunji AWS Radar", value: "214.0 mm / 24h (World's Wettest Belt)" },
      { label: "Escarpment Instability", source: "In-situ Tiltmeter", value: "44.0° vertical sandstone-shale scarp" },
      { label: "Debris Accumulation", source: "Highway Patrol Sensor", value: "4,200 m³ rockfall and mud mass" },
      { label: "Field Ground Check", source: "SDRF Patrol Unit #3", value: "SH-5 Highway completely blocked at Km 18" }
    ],
    villages: [
      { name: "Sohra Rim Settlement", severity: "critical", proximity: "0.3 km", road: "blocked", roadText: "Blocked (SH-5)", score: "Score: 9.6 / 10", shelter: "Sohra Civil Camp", pos: [25.2710, 91.7290] },
      { name: "Mawkdok Ridge Sector", severity: "high", proximity: "2.4 km", road: "restricted", roadText: "Restricted", score: "Score: 7.9 / 10", shelter: "Mawkdok High Ground Camp", pos: [25.2850, 91.7450] }
    ],
    roads: [
      { name: "SH-5 Sohra-Shella Highway", status: "blocked", statusText: "Blocked by Rockslide", bypass: "Mawkdok Ridge Route", delay: "18.5 km (+20 min delay)" },
      { name: "Cherrapunji ⇄ Shillong Main Link", status: "restricted", statusText: "Restricted Slush", bypass: "Tynghon Bypass Track", delay: "8.2 km (+15 min delay)" }
    ],
    feasibility: [
      { village: "Sohra Rim Settlement", shelter: "Sohra Civil Camp", channel: "SMS Broadcast + VMS Alert", statusClass: "low", reach: "96% Reachable" },
      { village: "Mawkdok Ridge Sector", shelter: "Mawkdok High Ground Camp", channel: "App Push + VHF SDRF Relay", statusClass: "low", reach: "93% Reachable" }
    ],
    satellite: {
      thumbnailUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80",
      orbit: "Ascending Pass #019 (GEE Sentinel-1/2)",
      timestamp: "Acquired: 1h 05m ago (GEE NER Live Telemetry)",
      modelTag: "NER-Landslide-YOLOv8-v3.1",
      gsd: "10m/px (Google Earth Engine Sentinel-1 SAR / CartoDEM)",
      insarVelocity: "+19.2 mm/wk",
      insarLevel: "critical",
      insarSub: "Catastrophic escarpment shear acceleration",
      insarBarWidth: "96%",
      ndwiVal: "0.94 Index",
      ndwiLevel: "high",
      ndwiSub: "Total moisture saturation in canyon drainage head",
      ndwiBarWidth: "94%",
      scarVal: "4,200 m³ Debris Mass",
      scarLevel: "critical",
      scarSub: "Highway blockade confidence: 98.6% (SDRF verified)",
      scarBarWidth: "98%",
      riskScore: "98.0% Susceptibility",
      nextPass: "Sentinel-1A in 3h 15m",
      radarCoherence: "0.78 (Runoff decorrelation)",
      xaiWeights: [
        { label: "Extreme Rain Trigger", weight: 46, color: "#dc2626" },
        { label: "Escarpment Gradient (44°)", weight: 28, color: "#ea580c" },
        { label: "GEE InSAR Velocity", weight: 16, color: "#2563eb" },
        { label: "NDWI Soil Wetness", weight: 10, color: "#0891b2" }
      ],
      detections: [
        { id: "CH-DEBRIS-01", label: "SH-5 Highway Blockade (4,200 m³)", conf: "98.6%", type: "blockade", x: 30, y: 36, w: 42, h: 32, color: "#dc2626" },
        { id: "CH-SCARP-FACE", label: "Vertical Scarp Failure (44°)", conf: "96.2%", type: "slope", x: 22, y: 16, w: 30, h: 24, color: "#ea580c" }
      ]
    }
  },

  "remote-arunachal": {
    name: "Remote Slopes, Arunachal Pradesh",
    coords: "28.6500° N, 96.1500° E (Elevation: 2,140m MSL)",
    center: [28.6500, 96.1500],
    zoom: 14,
    severity: "high",
    severityText: "ORANGE WARNING — REMOTE SLOPE WATCH",
    finalRisk: "72.4%",
    confidenceScore: "88.0%",
    riskWindow: "~3 Hours",
    shelter: "Anjaw District High Ground Station",
    polygon: [
      [28.6650, 96.1320],
      [28.6720, 96.1680],
      [28.6380, 96.1720],
      [28.6320, 96.1350]
    ],
    sensors: [
      { name: "Trans-Himalayan Probe AR-01", pos: [28.6540, 96.1480], type: "soil", val: "68.4% volumetric soil moisture", color: "#ea580c" },
      { name: "Gateway GW-AR01 (Remote Satellite Relay)", pos: [28.6580, 96.1520], type: "gateway", val: "Online (13.8V Satcom)", color: "#16a34a" },
      { name: "Borehole Tiltmeter AR-T02", pos: [28.6480, 96.1460], type: "tilt", val: "2.4°/wk creep", color: "#d97706" }
    ],
    flags: {
      cascadingFlood: { active: false, title: "", text: "" },
      dataSilence: { active: false, title: "", text: "" }
    },
    factors: [
      { label: "Soil Moisture Rate", source: "Probe AR-01", value: "68.4% volumetric moisture" },
      { label: "High Slope Angle", source: "CartoDEM", value: "41.2° steep glacial-fluvial slope" },
      { label: "GEE InSAR Creep", source: "Sentinel-1 InSAR (GEE)", value: "+6.8 mm/wk surface tension" },
      { label: "Satellite Observation", source: "Earth Engine Live Feed", value: "Tension cracks forming on upper terrace" }
    ],
    villages: [
      { name: "Walong North Sector", severity: "high", proximity: "1.4 km", road: "open", roadText: "Open", score: "Score: 7.1 / 10", shelter: "Anjaw District Station", pos: [28.6520, 96.1420] },
      { name: "Hayuliang Valley Settlement", severity: "moderate", proximity: "3.2 km", road: "open", roadText: "Open", score: "Score: 5.6 / 10", shelter: "Hayuliang Community Safe Zone", pos: [28.6610, 96.1620] }
    ],
    roads: [
      { name: "Trans-Arunachal Highway (NH-13)", status: "restricted", statusText: "Restricted / Slush", bypass: "Border Patrol Track", delay: "22.4 km (+30 min delay)" }
    ],
    feasibility: [
      { village: "Walong North Sector", shelter: "Anjaw District Station", channel: "Satellite Push + LoRa Relay", statusClass: "low", reach: "94% Reachable" },
      { village: "Hayuliang Valley Settlement", shelter: "Hayuliang Safe Zone", channel: "SMS + VHF Relay", statusClass: "low", reach: "91% Reachable" }
    ],
    satellite: {
      thumbnailUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80",
      orbit: "Descending Pass #042 (GEE Sentinel-1/2)",
      timestamp: "Acquired: 54m ago (GEE NER Live Telemetry)",
      modelTag: "NER-Landslide-ResNet-v4.2",
      gsd: "10m/px (Google Earth Engine Sentinel-1 & Sentinel-2)",
      insarVelocity: "+6.8 mm/wk",
      insarLevel: "high",
      insarSub: "Elevated slope tension creep on upper mountain ridge",
      insarBarWidth: "68%",
      ndwiVal: "0.72 Index",
      ndwiLevel: "moderate",
      ndwiSub: "Glacial melt and rainwater seepage channels emerging",
      ndwiBarWidth: "72%",
      scarVal: "Incipient Ridge Scar",
      scarLevel: "high",
      scarSub: "Detection confidence: 88.0% (Upper Terrace)",
      scarBarWidth: "88%",
      riskScore: "72.4% Susceptibility",
      nextPass: "Sentinel-1B in 6h 30m",
      radarCoherence: "0.89 (High Quality)",
      xaiWeights: [
        { label: "GEE InSAR Ridge Creep", weight: 38, color: "#ea580c" },
        { label: "Slope Gradient (41°)", weight: 30, color: "#2563eb" },
        { label: "Soil Moisture Index", weight: 20, color: "#0891b2" },
        { label: "Precipitation AWS", weight: 12, color: "#d97706" }
      ],
      detections: [
        { id: "AR-RIDGE-01", label: "Upper Tension Line (2.1m)", conf: "88.0%", type: "crack", x: 38, y: 24, w: 32, h: 22, color: "#ea580c" },
        { id: "AR-MUD-SEEP", label: "High-Altitude Seepage Channel", conf: "84.2%", type: "seep", x: 50, y: 52, w: 26, h: 22, color: "#0284c7" }
      ]
    }
  }
};

export const INITIAL_CITIZEN_REPORTS = [
  {
    id: "REP-904",
    reporter: "Bantei Lyngdoh",
    contact: "+91 98765 43210",
    zoneKey: "shillong-meghalaya",
    zone: "Shillong Urban & Ridge Slopes",
    location: "Laitumkhrah Slope Spur Road",
    coords: [25.5750, 91.8900],
    coordsText: "25.5750° N, 91.8900° E",
    category: "Tension Crack",
    tags: ["Tension Crack", "Water Seepage"],
    severity: "critical",
    urgencyText: "Critical / Immediate",
    description: "Asphalt along GS Road outer edge cracked open 8-10cm. Muddy water leaking through crack toward lower homes.",
    photo: "Road asphalt separation with visible soil void",
    timestamp: "35m ago (00:05 IST)",
    status: "verified",
    statusText: "Verified by Patrol #104",
    patrolOfficer: "Patrol #104 (Officer Sushanthi)",
    patrolNotes: "3.2m continuous crack confirmed, 8cm void depth. Escalated to NER Command.",
    dispatchedQrt: "SDRF QRT Unit 2"
  },
  {
    id: "REP-901",
    reporter: "Wanbiang Marbaniang",
    contact: "+91 94120 11223",
    zoneKey: "shillong-meghalaya",
    zone: "Shillong Urban Ridge",
    location: "Police Bazar Ridge Track",
    coords: [25.5780, 91.8860],
    coordsText: "25.5780° N, 91.8860° E",
    category: "Water Seepage",
    tags: ["Muddy Seepage", "Soft Soil"],
    severity: "high",
    urgencyText: "Elevated Watch",
    description: "Previously dry hillside is discharging brown muddy water. Ground feels spongy near water reservoir.",
    photo: "Turbid water pooling around terrace stone wall",
    timestamp: "1h ago (23:40 IST)",
    status: "pending",
    statusText: "Pending Field Check",
    patrolOfficer: "Unassigned",
    patrolNotes: "",
    dispatchedQrt: null
  },
  {
    id: "REP-895",
    reporter: "Karsing Rapsang (Bus Driver)",
    contact: "+91 97600 55443",
    zoneKey: "cherrapunji-meghalaya",
    zone: "Cherrapunji (Sohra) Escarpment",
    location: "Sohra Escarpment Highway Cut",
    coords: [25.2680, 91.7280],
    coordsText: "25.2680° N, 91.7280° E",
    category: "Road Blocked",
    tags: ["Mudslide", "Boulders", "Blocked Road"],
    severity: "critical",
    urgencyText: "Critical Blockade",
    description: "Sludge and boulders fallen from escarpment slope, highway completely obstructed. 15 vehicles backed up.",
    photo: "Debris mass covering two-lane highway",
    timestamp: "2h ago (22:15 IST)",
    status: "verified",
    statusText: "Verified by PWD & Patrol #12",
    patrolOfficer: "Meghalaya PWD & SDRF #12",
    patrolNotes: "3,800 m³ debris. Nohkalikai Ridge route activated.",
    dispatchedQrt: "PWD Dozer Unit 4"
  },
  {
    id: "REP-882",
    reporter: "Tasso Taku",
    contact: "+91 98370 88991",
    zoneKey: "remote-arunachal",
    zone: "Remote Slopes, Arunachal Pradesh",
    location: "Trans-Arunachal NH-13 Foothills",
    coords: [28.6480, 96.1480],
    coordsText: "28.6480° N, 96.1480° E",
    category: "Rockfall Debris",
    tags: ["Rockfall", "Valley Base"],
    severity: "moderate",
    urgencyText: "Routine Note",
    description: "Small gravel and stones rolling down mountainside slope onto highway shoulder.",
    photo: "Scattered gravel on road shoulder",
    timestamp: "4h ago (20:30 IST)",
    status: "pending",
    statusText: "Pending Field Check",
    patrolOfficer: "Unassigned",
    patrolNotes: "",
    dispatchedQrt: null
  }
];

export const INITIAL_DISPATCHED_ALERTS = [
  {
    refId: "#ALERT-2026-9041",
    zone: "Shillong Urban & Ridge Slopes",
    zoneName: "Shillong Urban & Ridge Slopes",
    time: "07-Sep 19:45 IST",
    timestamp: "07-Sep 19:45 IST",
    reach: "Shillong Peak (96%), Mawlai (95%), Laitumkhrah (97%)",
    villages: "Shillong Peak (96%), Mawlai (95%), Laitumkhrah (97%)",
    channel: "SMS + Siren + Voice (Bilingual)",
    channels: "SMS + Siren + Voice (Bilingual)",
    delivery: "98.4% Delivered",
    deliveryRate: "98.4% Delivered",
    status: "Active Warning"
  },
  {
    refId: "#ALERT-2026-8820",
    zone: "Cherrapunji (Sohra) Escarpment",
    zoneName: "Cherrapunji (Sohra) Escarpment",
    time: "07-Sep 18:20 IST",
    timestamp: "07-Sep 18:20 IST",
    reach: "Sohra Rim (96%), Mawkdok (93%)",
    villages: "Sohra Rim (96%), Mawkdok (93%)",
    channel: "App Push + SMS + CAP Feed",
    channels: "App Push + SMS + CAP Feed",
    delivery: "97.1% Delivered",
    deliveryRate: "97.1% Delivered",
    status: "Active Warning"
  }
];

export const INITIAL_REJECTED_ALERTS = [
  {
    refId: "#REJ-2026-1049",
    zoneName: "Walong North Sector (Arunachal)",
    timestamp: "07-Sep 14:10 IST",
    officer: "Incident Commander (Officer #104)",
    reason: "Visual verification cleared by SDRF field patrol. Slope currently stable.",
    status: "Archived / Rejected"
  }
];

export const INITIAL_CITIZEN_EVACUATION_TRACKING = [
  {
    id: "CIT-SH-01",
    name: "Laitumkhrah Ward 4 Residence (Khasi Hills)",
    phone: "+91 98765-43210",
    zone: "Shillong Urban & Ridge Slopes (Meghalaya)",
    location: "Upper Laitumkhrah Slope (25.5690° N, 91.8980° E)",
    status: "unresponsive",
    actionText: "Unresponsive (Alarm Active 6m+)",
    lastUpdate: "6m ago",
    shelterTarget: "St. Anthony Relief Safe Zone",
    qrtDispatched: false,
    qrtTeam: null
  },
  {
    id: "CIT-SH-02",
    name: "Polo Ground Community Sector 2",
    phone: "+91 98765-11223",
    zone: "Shillong Urban & Ridge Slopes (Meghalaya)",
    location: "Polo Grounds Camp Link (25.5840° N, 91.8950° E)",
    status: "evacuating",
    actionText: "Alarm Silenced - Evacuating",
    lastUpdate: "3m ago",
    shelterTarget: "Shillong Polo Ground Camp #1",
    qrtDispatched: false,
    qrtTeam: null
  },
  {
    id: "CIT-SH-03",
    name: "Shillong Peak Ridge Dwelling #12",
    phone: "+91 94361-99882",
    zone: "Shillong Urban & Ridge Slopes (Meghalaya)",
    location: "Steep Crest Cutoff (25.5760° N, 91.8910° E)",
    status: "unresponsive",
    actionText: "Unresponsive - Field Check Needed",
    lastUpdate: "8m ago",
    shelterTarget: "Shillong Municipal Relief Center #1",
    qrtDispatched: false,
    qrtTeam: null
  },
  {
    id: "CIT-SH-04",
    name: "Mawlai Valley Settlement Cluster",
    phone: "+91 94361-77441",
    zone: "Shillong Urban & Ridge Slopes (Meghalaya)",
    location: "Mawlai Lower Valley (25.5890° N, 91.8790° E)",
    status: "acknowledged",
    actionText: "Alarm Silenced - En Route to Camp",
    lastUpdate: "1m ago",
    shelterTarget: "Mawlai Higher Secondary Camp",
    qrtDispatched: false,
    qrtTeam: null
  }
];
