/**
 * ResilientGuard — Disaster Management Authority (DDMA) Command Center
 * admin.js — 3-Page Operational Tool: Overview Heatmap, Zone Intelligence & Delivery Audit Log
 */

// =======================================================================// =========================================================================
// STATE & ZONE DATABASE
// =========================================================================
let currentActivePage = "page1";
let selectedZoneKey = "sector-4";
let leafletOverviewMapInstance = null;
let leafletZoneMapInstance = null;
let zoneDetailLayers = {
  perimeter: null,
  sensors: null,
  villages: null,
  roads: null
};
let adminBroadcastChannel = null;

// Comprehensive Multi-Zone Operational Intelligence Database (No population references)
const ZONES_DATABASE = {
  "sector-4": {
    name: "Sector 4 Slopes, Joshimath (Chamoli)",
    coords: "30.5562° N, 79.5641° E (Elevation: 1,890m MSL)",
    center: [30.5575, 79.5650],
    zoom: 15,
    severity: "critical",
    severityText: "RED ALERT — LEVEL 4 EVACUATION",
    finalRisk: "94.6%",
    confidenceScore: "93.2%",
    riskWindow: "~45 Minutes",
    shelter: "Govt College Relief Camp #2",
    polygon: [
      [30.5595, 79.5610],
      [30.5620, 79.5665],
      [30.5580, 79.5690],
      [30.5540, 79.5635]
    ],
    sensors: [
      { name: "Node SN-401 (Borehole Inclinometer)", pos: [30.5582, 79.5630], type: "tilt", val: "4.8°/hr tilt acceleration (Exceeds Threshold)" },
      { name: "Piezometer PZ-04 (Pore Pressure)", pos: [30.5570, 79.5650], type: "soil", val: "88.4% moisture pore saturation" },
      { name: "Gateway GW-04 (LoRa Mesh)", pos: [30.5592, 79.5620], type: "gateway", val: "Silent (12m ago post-tilt spike)" },
      { name: "IMD Doppler AWS Rain Gauge", pos: [30.5605, 79.5600], type: "rain", val: "84.6 mm / 24h continuous downpour" }
    ],
    flags: {
      cascadingFlood: {
        active: true,
        badge: "+2.4m Surge Alert",
        trigger: "Landslide mass blocking Alaknanda gorge",
        arrival: "45 to 75 minutes downstream",
        action: "Evacuate riverside settlements immediately"
      },
      dataSilence: {
        active: true,
        badge: "Node Disrupted (Slide Activity)",
        station: "Gateway GW-04 (Sector 4 Upper Slope)",
        lastTx: "Lost 12m ago after recording 4.8°/hr tilt exceedance",
        action: "Classified as physical slope failure, not network loss"
      }
    },
    factors: [
      { label: "Cumulative Precipitation", source: "IMD Doppler AWS", value: "84.6 mm / 24h (Surge >80mm threshold)" },
      { label: "Volumetric Soil Moisture", source: "In-situ Piezometer Nodes", value: "88.4% (Pore Saturation Liquefaction)" },
      { label: "Slope Gradient & Aspect", source: "CartoDEM / Survey of India", value: "38.4° Convex Slope (Colluvial Mantle)" },
      { label: "Surface Creep & Displacement", source: "Sentinel-1 InSAR", value: "+14.2 mm/wk continuous ground creep" },
      { label: "Field Ground Observation", source: "Citizen Report #904 (Verified)", value: "3.2m structural tension crack along lower road" },
      { label: "Borehole Inclinometer Tilt", source: "Node SN-401", value: "4.8°/hour acceleration prior to silence" }
    ],
    villages: [
      { name: "Sector 4 Basti (Joshimath)", severity: "critical", proximity: "0.4 km", road: "blocked", roadText: "Cut Off (Km 42)", score: "Score: 9.8 / 10", shelter: "Govt College Relief Camp #2", pos: [30.5550, 79.5625] },
      { name: "Helang Lower Valley", severity: "critical", proximity: "1.2 km", road: "restricted", roadText: "Partial Bypass", score: "Score: 8.9 / 10", shelter: "Helang High School Camp", pos: [30.5510, 79.5580] },
      { name: "Sunil Gaon Ridge", severity: "high", proximity: "1.8 km", road: "open", roadText: "Open Access", score: "Score: 7.2 / 10", shelter: "Sports Stadium Safe Zone", pos: [30.5625, 79.5710] },
      { name: "Govindghat Riverside Basti", severity: "high", proximity: "3.4 km", road: "open", roadText: "Open Access", score: "Score: 6.8 / 10", shelter: "Govindghat High Ground Camp", pos: [30.5480, 79.5630] }
    ],
    roads: [
      { name: "NH-7 Transit (Joshimath ⇄ Helang Km 42)", status: "blocked", statusText: "Blocked by Mudslide", bypass: "Upper Helang Bypass", delay: "14.8 km (+12 min delay)" },
      { name: "Joshimath ⇄ Auli Mountain Road", status: "restricted", statusText: "Restricted / Slush", bypass: "Ropeway / 4WD Only", delay: "13.2 km (+25 min delay)" },
      { name: "Sector 4 Access Spur Road", status: "restricted", statusText: "At-Risk (Creep)", bypass: "College Ridge Footpath", delay: "2.1 km (+10 min delay)" },
      { name: "NH-7 North (Joshimath ⇄ Badrinath)", status: "open", statusText: "Open & Monitored", bypass: "Direct Highway", delay: "44.0 km (Nominal)" }
    ],
    feasibility: [
      { village: "Sector 4 Basti", shelter: "Govt College Relief Camp #2", channel: "App Push + SMS + Tower Siren", statusClass: "low", reach: "99% Reachable" },
      { village: "Helang Lower Valley", shelter: "Helang High School Camp", channel: "SMS Fallback + LoRa Node", statusClass: "low", reach: "94% Reachable" },
      { village: "Sunil Gaon Ridge", shelter: "Sports Stadium Safe Zone", channel: "Smartphone App + SMS", statusClass: "low", reach: "96% Reachable" },
      { village: "Govindghat Riverside", shelter: "Govindghat High Ground Camp", channel: "Siren Tower #3 + Satellite", statusClass: "high", reach: "100% Siren Blast" }
    ],
    satellite: {
      orbit: "Descending Pass #012",
      timestamp: "Acquired: 42m ago (00:10 IST)",
      modelTag: "ResNet50-InSAR-v3.4",
      gsd: "10m/px (Sentinel-1 SAR C-Band)",
      insarVelocity: "+14.2 mm/wk",
      insarLevel: "critical",
      insarSub: "Severe line-of-sight slope creep (Threshold: >5.0 mm/wk)",
      insarBarWidth: "88%",
      ndwiVal: "0.84 Index",
      ndwiLevel: "high",
      ndwiSub: "Pore-pressure saturation along colluvial slip plane",
      ndwiBarWidth: "84%",
      scarVal: "3.2m Fissure Detected",
      scarLevel: "critical",
      scarSub: "Mask confidence: 96.8% (Matched with Patrol #104)",
      scarBarWidth: "96%",
      riskScore: "94.6% Susceptibility",
      nextPass: "Sentinel-1B in 5h 22m",
      radarCoherence: "0.89 (High Quality)",
      xaiWeights: [
        { label: "InSAR Radar Creep", weight: 42, color: "#dc2626" },
        { label: "Doppler AWS Rain", weight: 33, color: "#ea580c" },
        { label: "CartoDEM Slope Gradient", weight: 15, color: "#2563eb" },
        { label: "NDWI Soil Saturation", weight: 10, color: "#0891b2" }
      ],
      detections: [
        { id: "CRACK-01", label: "Tension Fissure (3.2m)", conf: "96.8%", type: "crack", x: 26, y: 32, w: 26, h: 18, color: "#ef4444" },
        { id: "SLIP-TOE", label: "Active Colluvial Toe (+14mm/wk)", conf: "94.2%", type: "slip", x: 46, y: 46, w: 32, h: 28, color: "#f97316" },
        { id: "ROAD-VOID", label: "Spur Road Undermining", conf: "91.5%", type: "road", x: 34, y: 72, w: 26, h: 15, color: "#dc2626" }
      ]
    }
  },

  "nh7-corridor": {
    name: "NH-7 Transit Corridor (Km 42 Helang)",
    coords: "30.5518° N, 79.5590° E (Elevation: 1,520m MSL)",
    center: [30.5518, 79.5590],
    zoom: 15,
    severity: "critical",
    severityText: "RED ALERT — HIGHWAY BLOCKADE",
    finalRisk: "98.0%",
    confidenceScore: "96.4%",
    riskWindow: "Active Blockade (0 min)",
    shelter: "Helang High School Camp",
    polygon: [
      [30.5535, 79.5565],
      [30.5540, 79.5615],
      [30.5500, 79.5610],
      [30.5495, 79.5570]
    ],
    sensors: [
      { name: "Highway Cut-Slope Tilt Accel", pos: [30.5522, 79.5595], type: "tilt", val: "42.0° unstable rock-cut excavation" },
      { name: "Helang Rain AWS Station", pos: [30.5508, 79.5575], type: "rain", val: "92.0 mm / 24h continuous downpour" },
      { name: "Gateway GW-02 (Helang Transit)", pos: [30.5512, 79.5585], type: "gateway", val: "Online (13.4V Solar)" }
    ],
    flags: {
      cascadingFlood: {
        active: false,
        title: "",
        text: ""
      },
      dataSilence: {
        active: false,
        title: "",
        text: ""
      }
    },
    factors: [
      { label: "Debris Accumulation", source: "Highway Patrol Sensor", value: "3,800 m³ mud and boulder mass over roadway" },
      { label: "Cut-Slope Instability", source: "In-situ Tilt Accel", value: "42.0° unstable road-cut excavation" },
      { label: "Rainfall Trigger", source: "Helang AWS", value: "92.0 mm / 24h continuous downpour" },
      { label: "Field Verification", source: "Border Roads Patrol #12", value: "Complete vehicular blockade confirmed" }
    ],
    villages: [
      { name: "Helang Lower Transit Hub", severity: "critical", proximity: "0.2 km", road: "blocked", roadText: "Blocked", score: "Score: 9.4 / 10", shelter: "Helang Camp", pos: [30.5510, 79.5580] },
      { name: "Marwari Bridge Depot", severity: "high", proximity: "1.5 km", road: "restricted", roadText: "Restricted", score: "Score: 7.8 / 10", shelter: "Helang Camp", pos: [30.5545, 79.5640] }
    ],
    roads: [
      { name: "NH-7 Transit Km 42", status: "blocked", statusText: "Blocked", bypass: "Upper Helang Bypass", delay: "14.8 km (+12 min delay)" },
      { name: "Helang Link Road", status: "restricted", statusText: "Restricted", bypass: "Local Village Track", delay: "6.4 km (+15 min delay)" }
    ],
    feasibility: [
      { village: "Helang Transit Hub", shelter: "Helang Camp", channel: "SMS Broadcast + VMS Signboards", statusClass: "low", reach: "95% Reachable" },
      { village: "Marwari Bridge Depot", shelter: "Helang Camp", channel: "App Push + VHF Police Relay", statusClass: "low", reach: "92% Reachable" }
    ],
    satellite: {
      orbit: "Ascending Pass #034",
      timestamp: "Acquired: 1h 15m ago (23:15 IST)",
      modelTag: "YOLOv8-Landslide-v2.8",
      gsd: "10m/px (Sentinel-1 SAR / CartoDEM)",
      insarVelocity: "+18.6 mm/wk",
      insarLevel: "critical",
      insarSub: "Catastrophic road-cut shear acceleration",
      insarBarWidth: "94%",
      ndwiVal: "0.78 Index",
      ndwiLevel: "high",
      ndwiSub: "High moisture accumulation in debris runout cone",
      ndwiBarWidth: "78%",
      scarVal: "3,800 m³ Debris Mass",
      scarLevel: "critical",
      scarSub: "Highway blockade confidence: 98.4% (BRO verified)",
      scarBarWidth: "98%",
      riskScore: "98.0% Susceptibility",
      nextPass: "Sentinel-1A in 3h 40m",
      radarCoherence: "0.74 (Debris decorrelation)",
      xaiWeights: [
        { label: "Debris Mass Occlusion", weight: 48, color: "#dc2626" },
        { label: "Cut-Slope Instability", weight: 28, color: "#ea580c" },
        { label: "24h Cumulative Rain", weight: 16, color: "#2563eb" },
        { label: "NDWI Soil Wetness", weight: 8, color: "#0891b2" }
      ],
      detections: [
        { id: "DEBRIS-01", label: "Highway Blockade Km 42 (3,800 m³)", conf: "98.4%", type: "blockade", x: 30, y: 36, w: 40, h: 30, color: "#dc2626" },
        { id: "CUT-SLOPE", label: "Unstable Excavation Face (42°)", conf: "95.1%", type: "slope", x: 20, y: 18, w: 28, h: 22, color: "#ea580c" }
      ]
    }
  },

  "sector-5": {
    name: "Sector 5 Upper Ridge, Joshimath",
    coords: "30.5601° N, 79.5702° E (Elevation: 2,120m MSL)",
    center: [30.5630, 79.5710],
    zoom: 15,
    severity: "high",
    severityText: "ORANGE WARNING — ELEVATED WATCH",
    finalRisk: "68.2%",
    confidenceScore: "86.0%",
    riskWindow: "~4 Hours",
    shelter: "Sports Stadium Safe Zone",
    polygon: [
      [30.5630, 79.5670],
      [30.5680, 79.5740],
      [30.5620, 79.5780],
      [30.5590, 79.5710]
    ],
    sensors: [
      { name: "Ridge Probe SN-502", pos: [30.5640, 79.5720], type: "soil", val: "65.2% volumetric moisture" },
      { name: "Gateway GW-05 (Upper Ridge)", pos: [30.5655, 79.5700], type: "gateway", val: "Online (13.2V Solar)" },
      { name: "Borehole Tiltmeter SN-501", pos: [30.5620, 79.5730], type: "tilt", val: "1.2°/wk creep" }
    ],
    flags: {
      cascadingFlood: {
        active: false,
        title: "",
        text: ""
      },
      dataSilence: {
        active: false,
        title: "",
        text: ""
      }
    },
    factors: [
      { label: "Soil Moisture Rate", source: "Ridge Probe SN-502", value: "65.2% volumetric moisture" },
      { label: "Slope Angle", source: "CartoDEM", value: "29.1° forested slope" },
      { label: "InSAR Creep Velocity", source: "Sentinel-1 InSAR", value: "+4.1 mm/wk surface tension" },
      { label: "Citizen Field Reports", source: "Citizen App #901", value: "1 verified report of surface crack" }
    ],
    villages: [
      { name: "Sunil Gaon Upper", severity: "high", proximity: "0.8 km", road: "open", roadText: "Open", score: "Score: 6.9 / 10", shelter: "Sports Stadium Safe Zone", pos: [30.5625, 79.5710] },
      { name: "Auli Lower Settlement", severity: "moderate", proximity: "1.9 km", road: "open", roadText: "Open", score: "Score: 5.2 / 10", shelter: "Sports Stadium Safe Zone", pos: [30.5670, 79.5760] }
    ],
    roads: [
      { name: "Joshimath ⇄ Auli Road", status: "restricted", statusText: "Restricted Slush", bypass: "Ropeway Line", delay: "13.2 km (+20 min delay)" }
    ],
    feasibility: [
      { village: "Sunil Gaon Upper", shelter: "Sports Stadium Safe Zone", channel: "App Push + SMS", statusClass: "low", reach: "97% Reachable" },
      { village: "Auli Lower Settlement", shelter: "Sports Stadium Safe Zone", channel: "SMS + Local Warning", statusClass: "low", reach: "94% Reachable" }
    ],
    satellite: {
      orbit: "Descending Pass #012",
      timestamp: "Acquired: 42m ago (00:10 IST)",
      modelTag: "ResNet50-InSAR-v3.4",
      gsd: "10m/px (Sentinel-1 SAR & Sentinel-2)",
      insarVelocity: "+4.1 mm/wk",
      insarLevel: "high",
      insarSub: "Elevated slope tension creep (Approaching limit)",
      insarBarWidth: "55%",
      ndwiVal: "0.65 Index",
      ndwiLevel: "moderate",
      ndwiSub: "Subsurface seep channels emerging near water tank",
      ndwiBarWidth: "65%",
      scarVal: "Incipient Ridge Scar",
      scarLevel: "high",
      scarSub: "Detection confidence: 86.0% (Upper Sunil Gaon)",
      scarBarWidth: "86%",
      riskScore: "68.2% Susceptibility",
      nextPass: "Sentinel-1B in 5h 22m",
      radarCoherence: "0.92 (High Quality)",
      xaiWeights: [
        { label: "InSAR Ridge Creep", weight: 36, color: "#ea580c" },
        { label: "Soil Moisture Index", weight: 30, color: "#0891b2" },
        { label: "Slope Gradient (29°)", weight: 20, color: "#2563eb" },
        { label: "Precipitation AWS", weight: 14, color: "#d97706" }
      ],
      detections: [
        { id: "RIDGE-01", label: "Upper Tension Line (1.4m)", conf: "86.0%", type: "crack", x: 38, y: 24, w: 32, h: 22, color: "#ea580c" },
        { id: "SEEPAGE", label: "Muddy Seepage Channel", conf: "82.4%", type: "seep", x: 50, y: 52, w: 26, h: 22, color: "#0284c7" }
      ]
    }
  },

  "alaknanda-basin": {
    name: "Alaknanda Lower Basin",
    coords: "30.5489° N, 79.5612° E (Elevation: 1,380m MSL)",
    center: [30.5489, 79.5612],
    zoom: 15,
    severity: "moderate",
    severityText: "YELLOW WATCH — ADVISORY MONITORING",
    finalRisk: "44.0%",
    confidenceScore: "81.5%",
    riskWindow: ">12 Hours",
    shelter: "Govindghat High Ground Camp",
    polygon: [
      [30.5510, 79.5580],
      [30.5520, 79.5640],
      [30.5460, 79.5650],
      [30.5450, 79.5590]
    ],
    sensors: [
      { name: "CWC Hydro Radar Stage", pos: [30.5485, 79.5615], type: "water", val: "1,378.4m (+1.1m below danger mark)" },
      { name: "Gateway GW-03 (Hydro Basin)", pos: [30.5495, 79.5600], type: "gateway", val: "Online (13.6V Solar)" }
    ],
    flags: {
      cascadingFlood: {
        active: true,
        badge: "River Stage Watch (+1.4m)",
        trigger: "Upstream slope failure into river gorge",
        arrival: "Within 30 to 60 minutes",
        action: "Monitor low-lying ghats and embankments"
      },
      dataSilence: {
        active: false,
        badge: "",
        station: "",
        lastTx: "",
        action: ""
      }
    },
    factors: [
      { label: "River Stage Level", source: "CWC Hydro Radar", value: "1,378.4m (+1.1m below danger mark)" },
      { label: "Upstream Discharge", source: "Tapovan Sensor Node", value: "480 m³/s (Moderate)" },
      { label: "Local Rainfall", source: "Basin AWS", value: "32.0 mm / 24h" }
    ],
    villages: [
      { name: "Govindghat Lower Ghats", severity: "moderate", proximity: "0.3 km", road: "open", roadText: "Open", score: "Score: 4.6 / 10", shelter: "Govindghat High Ground Camp", pos: [30.5480, 79.5620] },
      { name: "Vishnuprayag Confluence", severity: "low", proximity: "2.1 km", road: "open", roadText: "Open", score: "Score: 3.2 / 10", shelter: "Govindghat High Ground Camp", pos: [30.5440, 79.5580] }
    ],
    roads: [
      { name: "Ghat Access Road", status: "open", statusText: "Open", bypass: "Direct Highway", delay: "Nominal" }
    ],
    feasibility: [
      { village: "Govindghat Lower Ghats", shelter: "Govindghat High Ground Camp", channel: "Siren Tower #3 + SMS", statusClass: "low", reach: "98% Reachable" },
      { village: "Vishnuprayag Confluence", shelter: "Govindghat High Ground Camp", channel: "App Push + SMS", statusClass: "low", reach: "95% Reachable" }
    ],
    satellite: {
      orbit: "Descending Pass #012",
      timestamp: "Acquired: 42m ago (00:10 IST)",
      modelTag: "HydroFlood-InSAR-v2.1",
      gsd: "10m/px (Sentinel-1 SAR / Sentinel-2)",
      insarVelocity: "+1.2 mm/wk",
      insarLevel: "low",
      insarSub: "Normal bedrock baseline; gorge constriction watched",
      insarBarWidth: "22%",
      ndwiVal: "0.92 Index",
      ndwiLevel: "high",
      ndwiSub: "High water surface signature in active gorge",
      ndwiBarWidth: "92%",
      scarVal: "Downstream Surge Zone",
      scarLevel: "moderate",
      scarSub: "River stage anomaly confidence: 81.5%",
      scarBarWidth: "82%",
      riskScore: "44.0% Susceptibility",
      nextPass: "Sentinel-1B in 5h 22m",
      radarCoherence: "0.95 (Stable Valley Bedrock)",
      xaiWeights: [
        { label: "River Stage Radar", weight: 45, color: "#0284c7" },
        { label: "Upstream Discharge", weight: 30, color: "#0891b2" },
        { label: "Valley InSAR Motion", weight: 15, color: "#d97706" },
        { label: "Precipitation", weight: 10, color: "#16a34a" }
      ],
      detections: [
        { id: "GORGE-01", label: "Alaknanda Constriction Point", conf: "88.2%", type: "surge", x: 42, y: 38, w: 36, h: 32, color: "#0284c7" },
        { id: "GHAT-ZONE", label: "Low-Lying Embankment (+1.4m Reach)", conf: "81.5%", type: "flood", x: 22, y: 62, w: 30, h: 24, color: "#d97706" }
      ]
    }
  }
};

// =========================================================================
// CITIZEN REPORTS DATABASE & INGESTION STATE
// =========================================================================
let activeReportFilter = "all";
const CITIZEN_REPORTS_DATABASE = [
  {
    id: "REP-904",
    reporter: "Ramesh Singh",
    contact: "+91 98765 43210",
    zoneKey: "sector-4",
    zone: "Sector 4 Slopes, Joshimath",
    location: "Sector 4 Access Spur Road",
    coords: [30.5550, 79.5625],
    coordsText: "30.5550° N, 79.5625° E",
    category: "Tension Crack",
    tags: ["Tension Crack", "Water Seepage"],
    severity: "critical",
    urgencyText: "Critical / Immediate",
    description: "Asphalt along outer road edge cracked open 8-10cm. Water leaking through crack toward lower homes.",
    photo: "Road asphalt separation with visible soil void",
    timestamp: "35m ago (00:05 IST)",
    status: "verified",
    statusText: "Verified by Patrol #104",
    patrolOfficer: "Patrol #104 (Officer Sushanthi)",
    patrolNotes: "3.2m continuous crack confirmed, 8cm void depth. Escalated to DDMA.",
    dispatchedQrt: "SDRF QRT Unit 2"
  },
  {
    id: "REP-901",
    reporter: "Kavita Negi",
    contact: "+91 94120 11223",
    zoneKey: "sector-5",
    zone: "Sector 5 Upper Ridge",
    location: "Sunil Gaon Ridge (Upper Track)",
    coords: [30.5625, 79.5710],
    coordsText: "30.5625° N, 79.5710° E",
    category: "Water Seepage",
    tags: ["Muddy Seepage", "Soft Soil"],
    severity: "high",
    urgencyText: "Elevated Watch",
    description: "Previously dry hillside is discharging brown muddy water. Ground feels spongy near water tank.",
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
    reporter: "Deepak Rawat (Bus Driver)",
    contact: "+91 97600 55443",
    zoneKey: "nh7-corridor",
    zone: "NH-7 Transit Corridor (Km 42)",
    location: "NH-7 Km 42 Highway Cut",
    coords: [30.5518, 79.5590],
    coordsText: "30.5518° N, 79.5590° E",
    category: "Road Blocked",
    tags: ["Mudslide", "Boulders", "Blocked Road"],
    severity: "critical",
    urgencyText: "Critical Blockade",
    description: "Sludge and boulders fallen from upper slope, highway completely obstructed. 15 vehicles backed up.",
    photo: "Debris mass covering two-lane highway",
    timestamp: "2h ago (22:15 IST)",
    status: "verified",
    statusText: "Verified by BRO & Patrol #12",
    patrolOfficer: "BRO Officer & SDRF #12",
    patrolNotes: "3,800 m³ debris. Upper Helang Bypass diverted.",
    dispatchedQrt: "BRO Dozer Unit 4"
  },
  {
    id: "REP-882",
    reporter: "Pooja Bhatt",
    contact: "+91 98370 88991",
    zoneKey: "alaknanda-basin",
    zone: "Alaknanda Lower Basin",
    location: "Govindghat Riverside Track",
    coords: [30.5489, 79.5612],
    coordsText: "30.5489° N, 79.5612° E",
    category: "Rockfall Debris",
    tags: ["Rockfall", "River Bank"],
    severity: "moderate",
    urgencyText: "Routine Note",
    description: "Small gravel and stones rolling down riverside slope onto pedestrian footpath.",
    photo: "Scattered gravel on stone walkway",
    timestamp: "4h ago (20:30 IST)",
    status: "pending",
    statusText: "Pending Field Check",
    patrolOfficer: "Unassigned",
    patrolNotes: "",
    dispatchedQrt: null
  }
];

// =========================================================================
// INITIALIZATION
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initLiveClock();
  initBroadcastChannel();
  initOverviewLeafletMap();
  initZoneDetailLeafletMap();
  initModalBackdropHandlers();
  populateZoneDetails(selectedZoneKey);
  renderCitizenReports();
  updateCitizenReportsStats();
});

// =========================================================================
// MODAL CLOSE & ESCAPE KEY HANDLERS (EASY EXIT OPTIONS)
// =========================================================================
function initModalBackdropHandlers() {
  const statModal = document.getElementById("statDetailModal");
  const sendModal = document.getElementById("sendAlertConfirmModal");
  const citizenModal = document.getElementById("citizenReportModal");
  const satModal = document.getElementById("satelliteInspectorModal");

  // Clicking outside modal box closes modal
  if (statModal) {
    statModal.addEventListener("click", (e) => {
      if (e.target === statModal) closeStatDetailModal();
    });
  }
  if (sendModal) {
    sendModal.addEventListener("click", (e) => {
      if (e.target === sendModal) closeSendAlertConfirmModal();
    });
  }
  if (citizenModal) {
    citizenModal.addEventListener("click", (e) => {
      if (e.target === citizenModal) closeCitizenReportModal();
    });
  }
  if (satModal) {
    satModal.addEventListener("click", (e) => {
      if (e.target === satModal) closeSatelliteModal();
    });
  }

  // Escape key closes any active modal
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeStatDetailModal();
      closeSendAlertConfirmModal();
      closeCitizenReportModal();
      closeSatelliteModal();
    }
  });
}

// =========================================================================
// LIVE CLOCK
// =========================================================================
function initLiveClock() {
  const clockEl = document.getElementById("adminLiveClock");
  if (!clockEl) return;

  function update() {
    const now = new Date();
    const time = now.toLocaleTimeString("en-GB", { hour12: false });
    clockEl.textContent = `${time} IST`;
  }
  update();
  setInterval(update, 1000);
}

// =========================================================================
// BROADCAST CHANNEL & CROSS-TAB SYNC
// =========================================================================
function initBroadcastChannel() {
  try {
    if (typeof BroadcastChannel !== "undefined") {
      adminBroadcastChannel = new BroadcastChannel("resilientguard_admin_alerts");
      adminBroadcastChannel.onmessage = (event) => {
        const data = event.data;
        if (!data) return;

        if (data.type === "FIELD_TASK_RESOLVED") {
          // Update matching citizen report or hardware task
          const rep = CITIZEN_REPORTS_DATABASE.find(r => r.id === data.taskId || data.taskTitle.includes(r.id));
          if (rep) {
            rep.status = data.resolution === "rejected" ? "rejected" : "verified";
            rep.statusText = data.resolution === "rejected" ? "Rejected (False Alarm)" : `Verified by ${data.officer}`;
            rep.patrolNotes = data.notes;
            renderCitizenReports();
            updateCitizenReportsStats();
            showOperationalToast(`Patrol Update: Report ${rep.id} marked as ${rep.status.toUpperCase()}`);
          }
        } else if (data.type === "CITIZEN_REPORT_SUBMITTED") {
          // Dynamic ingest from citizen portal
          CITIZEN_REPORTS_DATABASE.unshift({
            id: `REP-${Math.floor(100 + Math.random() * 900)}`,
            reporter: data.reporter || "Citizen (App)",
            contact: data.contact || "App Verified",
            zoneKey: "sector-4",
            zone: data.zone || "Sector 4 Slopes",
            location: data.location || "Joshimath Central",
            coords: data.coords || [30.5564, 79.5638],
            coordsText: data.coordsText || "30.5564° N, 79.5638° E",
            category: data.category || "Hazard Finding",
            tags: data.tags || ["Field Finding"],
            severity: data.severity || "high",
            urgencyText: data.severity === "critical" ? "Critical" : "Elevated Watch",
            description: data.description || "Ground observation logged via citizen portal.",
            photo: data.photo || "Photo evidence captured",
            timestamp: "Just now",
            status: "pending",
            statusText: "Pending Field Check",
            patrolOfficer: "Unassigned",
            patrolNotes: "",
            dispatchedQrt: null
          });
          renderCitizenReports();
          updateCitizenReportsStats();
          showOperationalToast(`New Citizen Hazard Report Received!`);
        }
      };
    }
  } catch (e) {
    console.warn("BroadcastChannel notice:", e);
  }
}

// =========================================================================
// 4-PAGE SWITCHER NAVIGATION
// =========================================================================
function switchAdminPage(pageKey) {
  currentActivePage = pageKey;

  // Update Page Navigation Buttons
  const navBtn1 = document.getElementById("navBtnPage1");
  const navBtn2 = document.getElementById("navBtnPage2");
  const navBtn3 = document.getElementById("navBtnPage3");
  const navBtn4 = document.getElementById("navBtnPage4");

  if (navBtn1) navBtn1.classList.toggle("active", pageKey === "page1");
  if (navBtn2) navBtn2.classList.toggle("active", pageKey === "page2");
  if (navBtn3) navBtn3.classList.toggle("active", pageKey === "page3");
  if (navBtn4) navBtn4.classList.toggle("active", pageKey === "page4");

  // Update View Containers
  const view1 = document.getElementById("viewPage1Overview");
  const view2 = document.getElementById("viewPage2Details");
  const view3 = document.getElementById("viewPage3History");
  const view4 = document.getElementById("viewPage4Reports");

  if (view1) view1.classList.toggle("active", pageKey === "page1");
  if (view2) view2.classList.toggle("active", pageKey === "page2");
  if (view3) view3.classList.toggle("active", pageKey === "page3");
  if (view4) view4.classList.toggle("active", pageKey === "page4");

  // Invalidate map sizes so tiles always render cleanly
  if (pageKey === "page1" && leafletOverviewMapInstance) {
    setTimeout(() => {
      leafletOverviewMapInstance.invalidateSize();
    }, 120);
  } else if (pageKey === "page2") {
    if (!leafletZoneMapInstance) {
      initZoneDetailLeafletMap();
    }
    setTimeout(() => {
      if (leafletZoneMapInstance) {
        leafletZoneMapInstance.invalidateSize();
        updateZoneDetailMap(selectedZoneKey);
      }
    }, 120);
  } else if (pageKey === "page4") {
    renderCitizenReports();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// =========================================================================
// PAGE 1: OVERVIEW LEAFLET HEATMAP
// =========================================================================
function initOverviewLeafletMap() {
  const mapEl = document.getElementById("leafletOverviewMap");
  if (!mapEl || leafletOverviewMapInstance) return;

  const joshimathCenter = [30.5564, 79.5638];

  leafletOverviewMapInstance = L.map("leafletOverviewMap", {
    center: joshimathCenter,
    zoom: 14,
    zoomControl: true,
    attributionControl: false
  });

  // Esri Satellite & Terrain Basemaps
  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 19
  }).addTo(leafletOverviewMapInstance);

  L.tileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 19
  }).addTo(leafletOverviewMapInstance);

  // Sector 4 Critical Polygon (Red)
  const s4Polygon = L.polygon([
    [30.5595, 79.5610],
    [30.5620, 79.5665],
    [30.5580, 79.5690],
    [30.5540, 79.5635]
  ], {
    color: "#dc2626",
    weight: 3,
    fillColor: "#ef4444",
    fillOpacity: 0.45,
    dashArray: "6, 6"
  }).addTo(leafletOverviewMapInstance);

  s4Polygon.bindPopup(`
    <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.8rem; padding: 4px;">
      <strong style="color: #dc2626;">Sector 4 Slopes (Critical • 94.6%)</strong><br>
      Risk Window: ~45 Mins • 4 Settlements<br>
      <a href="javascript:void(0)" onclick="openZoneDetails('sector-4')" style="color: #1e40af; font-weight: 700; display: inline-block; margin-top: 4px;">Inspect Zone Details (Page 2) →</a>
    </div>
  `);

  // Sector 5 High Polygon (Orange)
  const s5Polygon = L.polygon([
    [30.5630, 79.5670],
    [30.5680, 79.5740],
    [30.5620, 79.5780],
    [30.5590, 79.5710]
  ], {
    color: "#ea580c",
    weight: 2,
    fillColor: "#f97316",
    fillOpacity: 0.35
  }).addTo(leafletOverviewMapInstance);

  s5Polygon.bindPopup(`
    <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.8rem; padding: 4px;">
      <strong style="color: #ea580c;">Sector 5 Upper Ridge (High • 68.2%)</strong><br>
      Risk Window: ~4 Hours<br>
      <a href="javascript:void(0)" onclick="openZoneDetails('sector-5')" style="color: #1e40af; font-weight: 700; display: inline-block; margin-top: 4px;">Inspect Zone Details (Page 2) →</a>
    </div>
  `);

  // Road Blockade Marker (NH-7 Km 42)
  L.circleMarker([30.5518, 79.5590], {
    radius: 9,
    fillColor: "#dc2626",
    color: "#ffffff",
    weight: 2,
    fillOpacity: 1
  }).addTo(leafletOverviewMapInstance)
    .bindPopup(`
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.8rem; padding: 4px;">
        <strong style="color: #dc2626;">NH-7 Km 42 Blocked</strong><br>
        <a href="javascript:void(0)" onclick="openZoneDetails('nh7-corridor')" style="color: #1e40af; font-weight: 700; display: inline-block; margin-top: 4px;">Inspect Zone Details (Page 2) →</a>
      </div>
    `);

  // Hardware Silent Gateway Marker (GW-04)
  L.circleMarker([30.5592, 79.5620], {
    radius: 7,
    fillColor: "#be123c",
    color: "#ffffff",
    weight: 2,
    fillOpacity: 1
  }).addTo(leafletOverviewMapInstance)
    .bindPopup(`<strong>Gateway GW-04 (Silent Anomaly)</strong><br>Sector 4 Upper Slope`);
}

// =========================================================================
// PAGE 2: TACTICAL ZONE GIS & SENSOR MAP
// =========================================================================
function initZoneDetailLeafletMap() {
  const mapEl = document.getElementById("leafletZoneDetailMap");
  if (!mapEl || leafletZoneMapInstance) return;

  leafletZoneMapInstance = L.map("leafletZoneDetailMap", {
    center: [30.5562, 79.5641],
    zoom: 15,
    zoomControl: true,
    attributionControl: false
  });

  // Esri Satellite & Terrain Basemaps
  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 19
  }).addTo(leafletZoneMapInstance);

  L.tileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 19
  }).addTo(leafletZoneMapInstance);

  zoneDetailLayers.perimeter = L.layerGroup().addTo(leafletZoneMapInstance);
  zoneDetailLayers.sensors = L.layerGroup().addTo(leafletZoneMapInstance);
  zoneDetailLayers.villages = L.layerGroup().addTo(leafletZoneMapInstance);
  zoneDetailLayers.roads = L.layerGroup().addTo(leafletZoneMapInstance);

  updateZoneDetailMap(selectedZoneKey);
}

function updateZoneDetailMap(zoneKey) {
  if (!leafletZoneMapInstance) return;
  const data = ZONES_DATABASE[zoneKey];
  if (!data) return;

  // Clear existing layers
  if (zoneDetailLayers.perimeter) zoneDetailLayers.perimeter.clearLayers();
  if (zoneDetailLayers.sensors) zoneDetailLayers.sensors.clearLayers();
  if (zoneDetailLayers.villages) zoneDetailLayers.villages.clearLayers();
  if (zoneDetailLayers.roads) zoneDetailLayers.roads.clearLayers();

  // 1. Center & Zoom to Zone
  if (data.center) {
    leafletZoneMapInstance.setView(data.center, data.zoom || 15);
  }

  // 2. Add Zone Perimeter Polygon
  if (data.polygon) {
    const sevColor = data.severity === "critical" ? "#dc2626" : (data.severity === "high" ? "#ea580c" : "#d97706");
    const poly = L.polygon(data.polygon, {
      color: sevColor,
      weight: 3,
      fillColor: sevColor,
      fillOpacity: 0.4,
      dashArray: "6, 6"
    }).addTo(zoneDetailLayers.perimeter);

    poly.bindPopup(`
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.8rem; padding: 4px;">
        <strong style="color: ${sevColor};">${data.name}</strong><br>
        Risk Score: <strong>${data.finalRisk}</strong> (Confidence: ${data.confidenceScore})<br>
        Risk Window: <strong>${data.riskWindow}</strong><br>
        Assigned Shelter: <strong>${data.shelter}</strong>
      </div>
    `);
  }

  // 3. Add Sensor Markers
  if (data.sensors) {
    data.sensors.forEach(s => {
      const isGateway = s.type === "gateway";
      const isSilent = s.val.includes("Silent");
      const markerColor = isSilent ? "#be123c" : (isGateway ? "#16a34a" : "#2563eb");

      L.circleMarker(s.pos, {
        radius: isGateway ? 8 : 6,
        fillColor: markerColor,
        color: "#ffffff",
        weight: 2,
        fillOpacity: 1
      }).addTo(zoneDetailLayers.sensors)
        .bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.78rem; padding: 3px;">
            <strong>${s.name}</strong><br>
            Status / Value: <span style="color: ${markerColor}; font-weight: 700;">${s.val}</span>
          </div>
        `);
    });
  }

  // 4. Add Village / Settlement Markers
  if (data.villages) {
    data.villages.forEach(v => {
      if (v.pos) {
        L.circleMarker(v.pos, {
          radius: 7,
          fillColor: "#9333ea",
          color: "#ffffff",
          weight: 2,
          fillOpacity: 0.95
        }).addTo(zoneDetailLayers.villages)
          .bindPopup(`
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.78rem; padding: 3px;">
              <strong>${v.name}</strong><br>
              Proximity: ${v.proximity} • Road: ${v.roadText}<br>
              Assigned Shelter: <strong>${v.shelter || data.shelter}</strong>
            </div>
          `);
      }
    });
  }

  // 5. Add Road Blockade / Corridor Markers
  if (zoneKey === "sector-4" || zoneKey === "nh7-corridor") {
    L.circleMarker([30.5518, 79.5590], {
      radius: 9,
      fillColor: "#dc2626",
      color: "#ffffff",
      weight: 2,
      fillOpacity: 1
    }).addTo(zoneDetailLayers.roads)
      .bindPopup(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.78rem; padding: 3px;">
          <strong style="color: #dc2626;">NH-7 Km 42 Blocked</strong><br>
          Authorized Bypass: <strong>Upper Helang Bypass (14.8 km)</strong>
        </div>
      `);

    // Bypass Route Line (Green dashed line)
    L.polyline([
      [30.5500, 79.5550],
      [30.5535, 79.5575],
      [30.5560, 79.5600]
    ], {
      color: "#16a34a",
      weight: 3,
      dashArray: "4, 6"
    }).addTo(zoneDetailLayers.roads)
      .bindPopup("<strong>Upper Helang Bypass Route (Open)</strong>");
  }

  // Update Meta tag on Page 2
  const metaTag = document.getElementById("zoneGisMetaTag");
  if (metaTag) {
    metaTag.textContent = `${data.coords.split("(")[0].trim()} • GIS Active`;
  }
}

// =========================================================================
// PAGE 2: POPULATE DANGER ZONE DETAILS
// =========================================================================
function openZoneDetails(zoneKey) {
  selectedZoneKey = zoneKey;
  populateZoneDetails(zoneKey);
  switchAdminPage("page2");

  // Sync dropdown
  const dropdown = document.getElementById("zoneDetailSelect");
  if (dropdown) dropdown.value = zoneKey;
}

function onZoneDropdownChange(zoneKey) {
  selectedZoneKey = zoneKey;
  populateZoneDetails(zoneKey);
  updateZoneDetailMap(zoneKey);
}

function populateZoneDetails(zoneKey) {
  const data = ZONES_DATABASE[zoneKey];
  if (!data) return;

  // Header Elements
  const titleEl = document.getElementById("detailZoneName");
  const coordsEl = document.getElementById("detailZoneCoords");
  const riskConfEl = document.getElementById("detailRiskAndConfidence");
  const windowEl = document.getElementById("detailRiskWindow");
  const shelterEl = document.getElementById("detailReliefShelter");
  const badgeContainer = document.getElementById("detailSeverityBadgeContainer");

  if (titleEl) titleEl.textContent = data.name;
  if (coordsEl) coordsEl.textContent = data.coords;
  if (riskConfEl) {
    const sevColor = data.severity === "critical" ? "var(--color-critical)" : (data.severity === "high" ? "var(--color-high)" : "var(--color-moderate)");
    riskConfEl.innerHTML = `<span style="color: ${sevColor};">${data.finalRisk}</span> <span style="font-size: 0.88rem; font-weight: 600; color: var(--text-muted);">(Confidence: ${data.confidenceScore})</span>`;
  }
  if (windowEl) windowEl.textContent = data.riskWindow;
  if (shelterEl) shelterEl.textContent = data.shelter;
  if (badgeContainer) {
    const pillClass = data.severity === "critical" ? "critical" : (data.severity === "high" ? "high" : "moderate");
    badgeContainer.innerHTML = `<span class="status-pill ${pillClass}" style="font-size: 0.82rem; padding: 4px 10px;">${data.severityText}</span>`;
  }

  // Update Page 2 Map
  updateZoneDetailMap(zoneKey);

  // Status Flags Section (Conditional Threat Indicator Cards)
  const flagFlood = document.getElementById("flagCascadingFlood");
  const flagSilence = document.getElementById("flagDataSilence");
  const containerFlags = document.getElementById("detailFlagsContainer");

  let hasAnyFlag = false;

  if (flagFlood) {
    if (data.flags && data.flags.cascadingFlood && data.flags.cascadingFlood.active) {
      flagFlood.style.display = "flex";
      hasAnyFlag = true;
      const badgeEl = document.getElementById("surgeStatusBadge");
      const triggerEl = document.getElementById("surgeTriggerVal");
      const arrivalEl = document.getElementById("surgeArrivalVal");
      const actionEl = document.getElementById("surgeActionVal");
      if (badgeEl) badgeEl.textContent = data.flags.cascadingFlood.badge || "Surge Alert";
      if (triggerEl) triggerEl.textContent = data.flags.cascadingFlood.trigger || "Debris damming gorge";
      if (arrivalEl) arrivalEl.textContent = data.flags.cascadingFlood.arrival || "45–75 mins";
      if (actionEl) actionEl.textContent = data.flags.cascadingFlood.action || "Evacuate riverside settlements";
    } else {
      flagFlood.style.display = "none";
    }
  }

  if (flagSilence) {
    if (data.flags && data.flags.dataSilence && data.flags.dataSilence.active) {
      flagSilence.style.display = "flex";
      hasAnyFlag = true;
      const badgeEl = document.getElementById("hardwareStatusBadge");
      const stationEl = document.getElementById("hardwareStationVal");
      const lastTxEl = document.getElementById("hardwareLastTxVal");
      const actionEl = document.getElementById("hardwareActionVal");
      if (badgeEl) badgeEl.textContent = data.flags.dataSilence.badge || "Node Disrupted";
      if (stationEl) stationEl.textContent = data.flags.dataSilence.station || "Gateway GW-04";
      if (lastTxEl) lastTxEl.textContent = data.flags.dataSilence.lastTx || "Signal lost post-tilt spike";
      if (actionEl) actionEl.textContent = data.flags.dataSilence.action || "Treat as physical slide confirmation";
    } else {
      flagSilence.style.display = "none";
    }
  }

  if (containerFlags) {
    containerFlags.style.display = hasAnyFlag ? "grid" : "none";
  }

  // Contributing Factors List
  const factorsContainer = document.getElementById("detailFactorsList");
  if (factorsContainer) {
    factorsContainer.innerHTML = "";
    data.factors.forEach(f => {
      const box = document.createElement("div");
      box.className = "factor-item-box";
      box.innerHTML = `
        <div class="factor-label-row">
          <span>${f.label}</span>
          <span class="factor-source-tag">Source: ${f.source}</span>
        </div>
        <div class="factor-value-text">${f.value}</div>
      `;
      factorsContainer.appendChild(box);
    });
  }

  // Affected Villages Table (No population)
  const villagesTbody = document.getElementById("detailVillagesTableBody");
  if (villagesTbody) {
    villagesTbody.innerHTML = "";
    data.villages.forEach(v => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${v.name}</strong></td>
        <td><span class="status-pill ${v.severity}">${v.severity.toUpperCase()}</span></td>
        <td>${v.proximity}</td>
        <td><span class="status-pill ${v.road}">${v.roadText}</span></td>
        <td><strong style="color: ${v.severity === 'critical' ? 'var(--color-critical)' : 'var(--color-high)'};">${v.score}</strong></td>
      `;
      villagesTbody.appendChild(tr);
    });
  }

  // Affected Roads Table
  const roadsTbody = document.getElementById("detailRoadsTableBody");
  if (roadsTbody) {
    roadsTbody.innerHTML = "";
    data.roads.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${r.name}</strong></td>
        <td><span class="status-pill ${r.status}">${r.statusText}</span></td>
        <td><strong>${r.bypass}</strong></td>
        <td>${r.delay}</td>
      `;
      roadsTbody.appendChild(tr);
    });
  }

  // Pre-dispatch Feasibility Modal Table
  const modalTbody = document.getElementById("modalFeasibilityTableBody");
  if (modalTbody) {
    modalTbody.innerHTML = "";
    data.feasibility.forEach(f => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${f.village}</strong></td>
        <td>${f.shelter}</td>
        <td><span class="status-pill ${f.statusClass}">${f.channel}</span></td>
        <td><strong>${f.reach}</strong></td>
      `;
      modalTbody.appendChild(tr);
    });
  }

  // Update Satellite Earth Observation & ML Vision Module
  updateSatelliteModule(zoneKey);
}

// =========================================================================
// SATELLITE EARTH OBSERVATION & ML VISION SUBSYSTEM (3 CORE MODES)
// =========================================================================
let currentSatViewMode = "sentinel-1";

function switchSatelliteModalMode(mode) {
  currentSatViewMode = mode;

  // Update modal tab buttons
  const tabs = document.querySelectorAll(".sat-modal-tab-btn");
  tabs.forEach(tab => {
    if (tab.dataset.mode === mode) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  // Re-render modal viewport
  const viewportEl = document.getElementById("satModalViewportWrapper");
  if (viewportEl) {
    viewportEl.innerHTML = renderSatelliteViewportHtml(selectedZoneKey, mode);
  }
}

function openSatelliteModal() {
  const modal = document.getElementById("satelliteInspectorModal");
  const modalBody = document.getElementById("satModalBody");
  const data = ZONES_DATABASE[selectedZoneKey];
  if (!modal || !data || !data.satellite) return;
  const sat = data.satellite;

  if (modalBody) {
    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        
        <!-- Top Status & Target Strip -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: #0f172a; padding: 10px 14px; border-radius: var(--radius-xs); border: 1px solid #1e293b; color: #ffffff; font-family: var(--font-main); font-size: 0.76rem; flex-wrap: wrap; gap: 10px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <strong style="color: #38bdf8;">Zone Target:</strong> <span>${data.name} (${data.coords.split("(")[0].trim()})</span>
            <span class="status-pill ${data.severity === 'critical' ? 'critical' : (data.severity === 'high' ? 'high' : 'moderate')}" style="font-size:0.68rem; padding:2px 8px;">${sat.riskScore}</span>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <span><span class="pulse-dot-green"></span> <strong>Live Feed:</strong> ${sat.timestamp}</span>
            <span style="color: #94a3b8;">${sat.orbit}</span>
          </div>
        </div>

        <!-- 3-Option Mode Switcher Bar -->
        <div class="sat-modal-tabs-bar">
          <div class="sat-modal-tabs-group">
            <button type="button" class="sat-modal-tab-btn ${currentSatViewMode === 'sentinel-1' ? 'active' : ''}" data-mode="sentinel-1" onclick="switchSatelliteModalMode('sentinel-1')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20M12 2v20M5 5l14 14M5 19L19 5"/></svg>
              <span>Sentinel-1 (InSAR Displacement Radar)</span>
            </button>
            <button type="button" class="sat-modal-tab-btn ${currentSatViewMode === 'sentinel-2' ? 'active' : ''}" data-mode="sentinel-2" onclick="switchSatelliteModalMode('sentinel-2')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span>Sentinel-2 (Optical Multi-Spectral &amp; Moisture)</span>
            </button>
            <button type="button" class="sat-modal-tab-btn ${currentSatViewMode === 'compare' ? 'active' : ''}" data-mode="compare" onclick="switchSatelliteModalMode('compare')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              <span>Before &amp; After (Comparison Slider)</span>
            </button>
          </div>
          <div style="font-size:0.72rem; color:#94a3b8; font-family:var(--font-main);">
            Model: <strong style="color:#60a5fa;">${sat.modelTag}</strong>
          </div>
        </div>

        <!-- High-Res Interactive Viewport Container -->
        <div id="satModalViewportWrapper" style="background: #020617; border: 1px solid #1e293b; border-radius: var(--radius-xs); overflow: hidden; min-height: 420px; position: relative;">
          ${renderSatelliteViewportHtml(selectedZoneKey, currentSatViewMode)}
        </div>

        <!-- ML Insights & Feature Weight Attribution Breakdown -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px;">
          
          <div style="background: #f8fafc; border: 1px solid var(--border-light); border-radius: var(--radius-xs); padding: 12px; display:flex; flex-direction:column; gap:4px;">
            <div style="font-size: 0.72rem; color: var(--text-muted); font-weight:700; text-transform:uppercase;">Sentinel-1 InSAR Velocity</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: ${sat.insarLevel === 'critical' ? 'var(--color-critical)' : 'var(--color-high)'};">${sat.insarVelocity}</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">${sat.insarSub}</div>
          </div>

          <div style="background: #f8fafc; border: 1px solid var(--border-light); border-radius: var(--radius-xs); padding: 12px; display:flex; flex-direction:column; gap:4px;">
            <div style="font-size: 0.72rem; color: var(--text-muted); font-weight:700; text-transform:uppercase;">Sentinel-2 Soil Saturation</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: #0284c7;">${sat.ndwiVal}</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">${sat.ndwiSub}</div>
          </div>

          <div style="background: #f8fafc; border: 1px solid var(--border-light); border-radius: var(--radius-xs); padding: 12px; display:flex; flex-direction:column; gap:4px;">
            <div style="font-size: 0.72rem; color: var(--text-muted); font-weight:700; text-transform:uppercase;">AI Detection Mask</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: var(--color-primary);">${sat.scarVal}</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">${sat.scarSub}</div>
          </div>

          <div style="background: #f8fafc; border: 1px solid var(--border-light); border-radius: var(--radius-xs); padding: 12px; display:flex; flex-direction:column; gap:4px;">
            <div style="font-size: 0.72rem; color: var(--text-muted); font-weight:700; text-transform:uppercase;">Orbital Overpass &amp; Coherence</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: #059669;">${sat.nextPass}</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">Radar Coherence: <strong>${sat.radarCoherence}</strong></div>
          </div>

        </div>

        <!-- Feature Contribution Weights (XAI) -->
        <div style="background: #f1f5f9; border: 1px solid var(--border-light); border-radius: var(--radius-xs); padding: 10px 14px;">
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px;">Deep Learning Feature Weights in Landslide Prediction:</div>
          <div style="display: flex; gap: 14px; flex-wrap: wrap;">
            ${(sat.xaiWeights || []).map(w => `
              <div style="display:flex; align-items:center; gap:6px; font-size:0.74rem;">
                <span style="width:10px; height:10px; border-radius:2px; background:${w.color}; display:inline-block;"></span>
                <span>${w.label}: <strong>${w.weight}%</strong></span>
              </div>
            `).join("")}
          </div>
        </div>

      </div>
    `;
  }

  modal.classList.add("open");
}

function closeSatelliteModal() {
  const modal = document.getElementById("satelliteInspectorModal");
  if (modal) modal.classList.remove("open");
}

function renderSatelliteViewportHtml(zoneKey, mode) {
  const data = ZONES_DATABASE[zoneKey];
  if (!data || !data.satellite) return "";
  const sat = data.satellite;

  if (mode === "compare") {
    return `
      <div class="sat-compare-container" style="min-height: 420px; position:relative;">
        <!-- Before Layer (Baseline Pre-Rain) -->
        <div class="sat-compare-layer before">
          ${generateSatelliteSvg(zoneKey, "optical_pre")}
          <div class="sat-compare-badge before-label">PRE-RAIN BASELINE (DRY)</div>
        </div>

        <!-- After Layer (Current InSAR / Slip) -->
        <div class="sat-compare-layer after" id="satCompareAfterLayer">
          ${generateSatelliteSvg(zoneKey, "ai-mask")}
          <div class="sat-compare-badge after-label">CURRENT ACTIVE DEFORMATION</div>
        </div>

        <!-- Draggable Handle Indicator -->
        <div class="sat-compare-handle" id="satCompareHandle" style="left: 50%;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </div>

        <!-- Invisible Range Slider Controller -->
        <input type="range" min="0" max="100" value="50" class="sat-compare-slider-input" oninput="onSatelliteCompareInput(this.value)">

        <div class="sat-viewport-legend">
          <span style="display:flex; align-items:center; gap:6px;"><strong style="color: #38bdf8;">◀ Drag Handle:</strong> Compare Pre-rain Dry Terrain vs Active Post-rain Ground Failure</span>
          <span style="font-size: 0.7rem; color: #4ade80;">Temporal Pair: Δt = 6 Days</span>
        </div>
      </div>
    `;
  }

  // Sentinel-1 or Sentinel-2 Mode
  const svgMode = mode === "sentinel-1" ? "insar" : "ndwi";
  const legendHtml = mode === "sentinel-1" ? `
    <span style="font-weight:700; color:#ffffff;">Sentinel-1 InSAR LOS Velocity:</span>
    <span><strong style="color: #dc2626;">■</strong> &gt;+10 mm/wk (Critical)</span>
    <span><strong style="color: #ea580c;">■</strong> +5 to +10 mm/wk (High)</span>
    <span><strong style="color: #eab308;">■</strong> +2 to +5 mm/wk (Creep)</span>
    <span><strong style="color: #06b6d4;">■</strong> &lt;2 mm/wk (Stable)</span>
  ` : `
    <span style="font-weight:700; color:#ffffff;">Sentinel-2 Multi-Spectral Moisture (NDWI):</span>
    <span><strong style="color: #0284c7;">■</strong> &gt;0.80 (Saturated Slip Toe)</span>
    <span><strong style="color: #06b6d4;">■</strong> 0.60–0.80 (Elevated Seepage)</span>
    <span><strong style="color: #10b981;">■</strong> &lt;0.60 (Normal Moisture)</span>
  `;

  return `
    <div class="sat-image-canvas-wrap" style="min-height: 420px; position:relative;">
      ${generateSatelliteSvg(zoneKey, svgMode)}
      
      <!-- HUD Top Left -->
      <div class="sat-hud-overlay top-left">
        <span class="hud-item">${data.name.toUpperCase()}</span>
        <span class="hud-item">${data.coords.split("(")[0].trim()}</span>
        <span class="hud-item">GSD: ${sat.gsd}</span>
      </div>

      <!-- HUD Top Right -->
      <div class="sat-hud-overlay top-right">
        <span class="hud-badge active-mode">${mode === 'sentinel-1' ? 'SENTINEL-1 SAR InSAR (RADAR)' : 'SENTINEL-2 MSI (OPTICAL & NDWI)'}</span>
        <span class="hud-badge orbit-info">${sat.orbit.toUpperCase()}</span>
      </div>

      <!-- Legend -->
      <div class="sat-viewport-legend">
        ${legendHtml}
      </div>
    </div>
  `;
}

function onSatelliteCompareInput(val) {
  const afterLayer = document.getElementById("satCompareAfterLayer");
  const handle = document.getElementById("satCompareHandle");
  if (afterLayer) afterLayer.style.width = `${val}%`;
  if (handle) handle.style.left = `${val}%`;
}

function generateSatelliteSvg(zoneKey, mode) {
  const data = ZONES_DATABASE[zoneKey] || ZONES_DATABASE["sector-4"];
  const sat = data.satellite || {};
  const isCritical = data.severity === "critical";

  let modeSpecificSvg = "";

  if (mode === "optical" || mode === "optical_pre") {
    const isPre = mode === "optical_pre";
    modeSpecificSvg = `
      <!-- Mountain Ridge Topography Shading -->
      <path d="M 0 320 Q 120 260 260 290 T 520 240 T 800 280 L 800 500 L 0 500 Z" fill="#1b281f" opacity="0.85"/>
      <path d="M 0 240 Q 180 160 380 200 T 700 150 T 800 180 L 800 500 L 0 500 Z" fill="#243329" opacity="0.65"/>
      <path d="M 150 120 Q 300 60 500 100 T 800 80 L 800 500 L 150 500 Z" fill="#2d3f33" opacity="0.45"/>

      <!-- Alaknanda River Gorge -->
      <path d="M -20 480 Q 200 450 380 430 T 650 390 T 820 370" fill="none" stroke="#0e3a47" stroke-width="26" stroke-linecap="round"/>
      <path d="M -20 480 Q 200 450 380 430 T 650 390 T 820 370" fill="none" stroke="#165166" stroke-width="12" stroke-linecap="round"/>

      <!-- NH-7 Mountain Corridor Highway -->
      <path d="M 0 420 Q 160 390 320 370 T 580 330 T 800 310" fill="none" stroke="#d97706" stroke-width="5" stroke-dasharray="8 4"/>
      <path d="M 320 370 Q 360 310 400 240 T 450 160" fill="none" stroke="#ca8a04" stroke-width="3" stroke-dasharray="4 3"/>

      <!-- Settlement Canopy Clusters -->
      <rect x="220" y="290" width="34" height="24" rx="4" fill="#64748b" opacity="0.85"/>
      <text x="222" y="326" fill="#e2e8f0" font-size="10" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700">Sector 4 Basti</text>

      <rect x="420" y="210" width="32" height="22" rx="4" fill="#64748b" opacity="0.85"/>
      <text x="422" y="244" fill="#e2e8f0" font-size="10" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700">Sunil Gaon</text>

      <rect x="620" y="340" width="30" height="20" rx="4" fill="#64748b" opacity="0.85"/>
      <text x="622" y="372" fill="#e2e8f0" font-size="10" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700">Helang</text>
      
      <!-- Pre-rain vs Post-rain differences in compare mode -->
      ${!isPre && isCritical ? `
        <path d="M 280 260 Q 310 280 340 310 Q 320 340 290 330 Z" fill="#451a03" opacity="0.9"/>
        <path d="M 270 250 L 350 295" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
      ` : ''}
    `;
  } else if (mode === "insar") {
    // Sentinel-1 InSAR Deformation Interferogram with Rainbow Fringe Contours
    modeSpecificSvg = `
      <defs>
        <radialGradient id="insarHeatmap" cx="45%" cy="55%" r="48%">
          <stop offset="0%" stop-color="#dc2626" stop-opacity="0.95"/>
          <stop offset="25%" stop-color="#ea580c" stop-opacity="0.85"/>
          <stop offset="50%" stop-color="#eab308" stop-opacity="0.75"/>
          <stop offset="75%" stop-color="#06b6d4" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.15"/>
        </radialGradient>
      </defs>

      <!-- Terrain contours backdrop -->
      <path d="M 0 320 Q 120 260 260 290 T 520 240 T 800 280 L 800 500 L 0 500 Z" fill="#1b281f" opacity="0.6"/>
      <path d="M -20 480 Q 200 450 380 430 T 650 390 T 820 370" fill="none" stroke="#0e3a47" stroke-width="22" opacity="0.7"/>

      <!-- InSAR Fringe Contours -->
      <ellipse cx="360" cy="280" rx="260" ry="170" fill="url(#insarHeatmap)" class="sat-radar-fringe"/>
      
      <!-- Concentric Radar Interferometry Phase Lines -->
      <path d="M 180 290 Q 360 210 540 280 Q 360 360 180 290" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-dasharray="6 3" opacity="0.75"/>
      <path d="M 240 285 Q 360 230 480 280 Q 360 335 240 285" fill="none" stroke="#ffffff" stroke-width="2.2" opacity="0.85"/>
      <path d="M 300 280 Q 360 250 420 280 Q 360 310 300 280" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.95"/>

      <!-- Velocity Vectors -->
      <g stroke="#ffffff" stroke-width="2" fill="#ffffff">
        <line x1="330" y1="260" x2="310" y2="300"/>
        <line x1="370" y1="265" x2="355" y2="310"/>
        <line x1="410" y1="270" x2="395" y2="315"/>
      </g>

      <!-- Center LOS Velocity Peak Tag -->
      <g transform="translate(310, 260)">
        <rect x="0" y="0" width="125" height="26" rx="4" fill="rgba(15,23,42,0.92)" stroke="#ef4444" stroke-width="1.5"/>
        <text x="10" y="18" fill="#f87171" font-size="11" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800">${sat.insarVelocity || '+14.2 mm/wk'}</text>
      </g>
    `;
  } else if (mode === "ndwi") {
    // Sentinel-2 Multi-Spectral & NDWI Soil Moisture
    modeSpecificSvg = `
      <defs>
        <radialGradient id="ndwiGradient" cx="42%" cy="60%" r="50%">
          <stop offset="0%" stop-color="#0284c7" stop-opacity="0.9"/>
          <stop offset="30%" stop-color="#06b6d4" stop-opacity="0.75"/>
          <stop offset="60%" stop-color="#14b8a6" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#10b981" stop-opacity="0.1"/>
        </radialGradient>
      </defs>

      <!-- Terrain contours backdrop -->
      <path d="M 0 320 Q 120 260 260 290 T 520 240 T 800 280 L 800 500 L 0 500 Z" fill="#1b281f" opacity="0.6"/>

      <!-- Moisture Saturation Plume along Toe Slope -->
      <ellipse cx="340" cy="310" rx="240" ry="140" fill="url(#ndwiGradient)"/>
      <path d="M 220 340 Q 320 370 460 330 Q 380 400 220 340" fill="#0369a1" opacity="0.8"/>

      <!-- Seepage Flow Paths -->
      <path d="M 330 200 Q 340 260 335 320" fill="none" stroke="#38bdf8" stroke-width="3" stroke-dasharray="6 4"/>
      <path d="M 390 220 Q 385 280 370 330" fill="none" stroke="#38bdf8" stroke-width="3" stroke-dasharray="6 4"/>

      <!-- NDWI Index Tag -->
      <g transform="translate(290, 320)">
        <rect x="0" y="0" width="145" height="26" rx="4" fill="rgba(15,23,42,0.92)" stroke="#38bdf8" stroke-width="1.5"/>
        <text x="10" y="18" fill="#38bdf8" font-size="11" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800">NDWI: ${sat.ndwiVal || '0.84'}</text>
      </g>
    `;
  } else if (mode === "ai-mask") {
    // AI Landslide Segmentation & Deep Learning Detection Bounding Boxes
    const detections = sat.detections || [
      { id: "CRACK-01", label: "Tension Fissure (3.2m)", conf: "96.8%", type: "crack", x: 26, y: 32, w: 26, h: 18, color: "#ef4444" },
      { id: "SLIP-TOE", label: "Active Colluvial Toe", conf: "94.2%", type: "slip", x: 46, y: 46, w: 32, h: 28, color: "#f97316" }
    ];

    let boxesSvg = "";
    detections.forEach(d => {
      const px = d.x * 8;
      const py = d.y * 5;
      const pw = d.w * 8;
      const ph = d.h * 5;

      boxesSvg += `
        <g class="sat-vector-box" onclick="showOperationalToast('Target: [${d.id}] ${d.label} • Conf: ${d.conf}')">
          <rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="3" fill="${d.color}" fill-opacity="0.18" stroke="${d.color}" stroke-width="2" stroke-dasharray="4 2"/>
          <path d="M ${px} ${py + 10} L ${px} ${py} L ${px + 10} ${py}" fill="none" stroke="${d.color}" stroke-width="3"/>
          <path d="M ${px + pw - 10} ${py} L ${px + pw} ${py} L ${px + pw} ${py + 10}" fill="none" stroke="${d.color}" stroke-width="3"/>
          <path d="M ${px} ${py + ph - 10} L ${px} ${py + ph} L ${px + 10} ${py + ph}" fill="none" stroke="${d.color}" stroke-width="3"/>
          <path d="M ${px + pw - 10} ${py + ph} L ${px + pw} ${py + ph} L ${px + pw} ${py + ph - 10}" fill="none" stroke="${d.color}" stroke-width="3"/>
          <rect x="${px}" y="${py - 18}" width="${d.label.length * 7.5 + 46}" height="18" rx="2" fill="${d.color}"/>
          <text x="${px + 5}" y="${py - 5}" fill="#ffffff" font-size="10" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800">[${d.id}] ${d.label} (${d.conf})</text>
        </g>
      `;
    });

    modeSpecificSvg = `
      <path d="M 0 320 Q 120 260 260 290 T 520 240 T 800 280 L 800 500 L 0 500 Z" fill="#1b281f" opacity="0.65"/>
      <path d="M -20 480 Q 200 450 380 430 T 650 390 T 820 370" fill="none" stroke="#0e3a47" stroke-width="22" opacity="0.7"/>
      <polygon points="210,210 460,240 490,390 280,410 190,320" fill="#dc2626" fill-opacity="0.28" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="6 4"/>
      <path d="M 230 230 L 260 245 L 290 240 L 330 265 L 360 270" fill="none" stroke="#ff0000" stroke-width="4" stroke-linecap="round"/>
      ${boxesSvg}
    `;
  }

  return `
    <svg viewBox="0 0 800 500" class="sat-overlay-svg" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="500" fill="#09111e"/>
      <defs>
        <pattern id="satGrid" width="80" height="50" patternUnits="userSpaceOnUse">
          <path d="M 80 0 L 0 0 0 50" fill="none" stroke="rgba(255, 255, 255, 0.06)" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="800" height="500" fill="url(#satGrid)"/>
      <path d="M 0 160 Q 200 110 400 150 T 800 120 L 800 500 L 0 500 Z" fill="#131e16" opacity="0.9"/>
      ${modeSpecificSvg}
      <g transform="translate(745, 430)">
        <circle cx="15" cy="15" r="14" fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
        <line x1="15" y1="23" x2="15" y2="7" stroke="#ffffff" stroke-width="2"/>
        <polygon points="15,4 11,10 19,10" fill="#dc2626"/>
        <text x="12" y="27" fill="#ffffff" font-size="7" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800">N</text>
      </g>
      <g stroke="rgba(255, 255, 255, 0.25)" stroke-width="1">
        <line x1="390" y1="250" x2="410" y2="250"/>
        <line x1="400" y1="240" x2="400" y2="260"/>
      </g>
    </svg>
  `;
}

// =========================================================================
// ACTIONS: SEND ALERT & REJECT WARNING
// =========================================================================
function openSendAlertConfirmModal() {
  const modal = document.getElementById("sendAlertConfirmModal");
  if (modal) modal.classList.add("open");
}

function closeSendAlertConfirmModal() {
  const modal = document.getElementById("sendAlertConfirmModal");
  if (modal) modal.classList.remove("open");
}

function confirmAndDispatchAlert() {
  closeSendAlertConfirmModal();
  const data = ZONES_DATABASE[selectedZoneKey];
  if (!data) return;

  const refId = `#ALT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2, '0')}-Sep ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST`;

  const payload = {
    refId,
    title: `CRITICAL ALERT: ${data.name.toUpperCase()}`,
    desc: `Immediate evacuation advisory issued by District Disaster Control for ${data.name}. Move to designated shelters immediately.`,
    severity: data.severity === "critical" ? "danger" : "warning",
    siren: "eas",
    sector: data.name,
    timestamp: now.toISOString()
  };

  // 1. Post to BroadcastChannel & LocalStorage (syncs with index.html citizen devices)
  try {
    if (!adminBroadcastChannel && typeof BroadcastChannel !== "undefined") {
      adminBroadcastChannel = new BroadcastChannel("resilientguard_admin_alerts");
    }
    if (adminBroadcastChannel) {
      adminBroadcastChannel.postMessage(payload);
    }
    localStorage.setItem("resilientguard_last_admin_alert", JSON.stringify(payload));
  } catch (err) {
    console.warn("Broadcast error:", err);
  }

  // 2. Add entry to Page 3 Dispatched Alerts Table
  const dispatchedTbody = document.getElementById("dispatchedAlertsTableBody");
  if (dispatchedTbody) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><code>${refId}</code></td>
      <td><strong>${data.name}</strong></td>
      <td>${timeStr}</td>
      <td>${data.villages.map(v => `${v.name.split(" ")[0]} (96%)`).join(", ")}</td>
      <td><span class="status-pill low">SMS + Siren Audio</span></td>
      <td><strong>98.0% Delivered</strong></td>
      <td><span class="status-pill critical">Active Warning</span></td>
    `;
    dispatchedTbody.insertBefore(tr, dispatchedTbody.firstChild);
  }

  showOperationalToast("LIVE EMERGENCY ALERT DISPATCHED DISTRICT-WIDE");
}

function promptRejectAlert() {
  const data = ZONES_DATABASE[selectedZoneKey];
  if (!data) return;

  const notes = prompt(`Enter operational justification / reason for rejecting alert for ${data.name}:`, "Visual verification cleared by SDRF field patrol. Slope currently stable.");
  if (notes === null) return; // User cancelled

  const refId = `#REJ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2, '0')}-Sep ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST`;

  // Add entry to Page 3 Rejected / False-Alarm Table
  const rejectedTbody = document.getElementById("rejectedAlertsTableBody");
  if (rejectedTbody) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><code>${refId}</code></td>
      <td><strong>${data.name}</strong></td>
      <td>${timeStr}</td>
      <td>Incident Commander (Officer #104)</td>
      <td>${notes}</td>
      <td><span class="status-pill open">Archived / Rejected</span></td>
    `;
    rejectedTbody.insertBefore(tr, rejectedTbody.firstChild);
  }

  showOperationalToast(`Alert for ${data.name} rejected and logged in Page 3 Audit Archive.`);
  
  // Route to Page 3 so admin sees the archived record
  setTimeout(() => {
    switchAdminPage("page3");
  }, 600);
}

// =========================================================================
// PAGE 3: FILTERING ALERTS & HISTORY
// =========================================================================
function filterHistoryTables() {
  const searchInput = document.getElementById("historySearchInput");
  const zoneSelect = document.getElementById("historyFilterZone");

  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const selectedZone = zoneSelect ? zoneSelect.value.toLowerCase() : "all";

  // Filter Dispatched Table
  const dispatchedRows = document.querySelectorAll("#dispatchedAlertsTableBody tr");
  dispatchedRows.forEach(row => {
    const text = row.textContent.toLowerCase();
    const matchesQuery = !query || text.includes(query);
    const matchesZone = selectedZone === "all" || text.includes(selectedZone);
    row.style.display = matchesQuery && matchesZone ? "" : "none";
  });

  // Filter Rejected Table
  const rejectedRows = document.querySelectorAll("#rejectedAlertsTableBody tr");
  rejectedRows.forEach(row => {
    const text = row.textContent.toLowerCase();
    const matchesQuery = !query || text.includes(query);
    const matchesZone = selectedZone === "all" || text.includes(selectedZone);
    row.style.display = matchesQuery && matchesZone ? "" : "none";
  });
}

// =========================================================================
// STAT DETAIL DRILL-DOWN MODAL (DANGER ZONES / VILLAGES / ROADS / HARDWARE)
// =========================================================================
function openStatDetailModal(statType) {
  const modal = document.getElementById("statDetailModal");
  const titleEl = document.getElementById("statDetailModalTitle");
  const bodyEl = document.getElementById("statDetailModalBody");
  if (!modal || !titleEl || !bodyEl) return;

  if (statType === "danger-zones") {
    titleEl.textContent = "Active Danger Zones & Multi-Model Breakdown";
    bodyEl.innerHTML = `
      <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 10px;">
        All active terrain hazards ranked by Final Fused Risk Score across Chamoli District:
      </div>
      <table class="operational-table">
        <thead>
          <tr>
            <th>Zone Name</th>
            <th>Severity</th>
            <th>Final Risk Score</th>
            <th>Risk Window</th>
            <th>Assigned Shelter</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Sector 4 Slopes, Joshimath</strong></td>
            <td><span class="status-pill critical">CRITICAL</span></td>
            <td><strong style="color: var(--color-critical);">94.6%</strong></td>
            <td>~45 Mins</td>
            <td>Govt College Relief Camp #2</td>
            <td><button type="button" class="btn-portal-link" onclick="closeStatDetailModal(); openZoneDetails('sector-4');">Inspect (Page 2) →</button></td>
          </tr>
          <tr>
            <td><strong>NH-7 Transit (Km 42 Helang)</strong></td>
            <td><span class="status-pill critical">CRITICAL</span></td>
            <td><strong style="color: var(--color-critical);">98.0%</strong></td>
            <td>Active Blockade</td>
            <td>Helang High School Camp</td>
            <td><button type="button" class="btn-portal-link" onclick="closeStatDetailModal(); openZoneDetails('nh7-corridor');">Inspect (Page 2) →</button></td>
          </tr>
          <tr>
            <td><strong>Sector 5 Upper Ridge, Joshimath</strong></td>
            <td><span class="status-pill high">HIGH</span></td>
            <td><strong style="color: var(--color-high);">68.2%</strong></td>
            <td>~4 Hours</td>
            <td>Sports Stadium Safe Zone</td>
            <td><button type="button" class="btn-portal-link" onclick="closeStatDetailModal(); openZoneDetails('sector-5');">Inspect (Page 2) →</button></td>
          </tr>
          <tr>
            <td><strong>Alaknanda Lower Basin</strong></td>
            <td><span class="status-pill moderate">MODERATE</span></td>
            <td><strong style="color: var(--color-moderate);">44.0%</strong></td>
            <td>>12 Hours</td>
            <td>Govindghat High Ground Camp</td>
            <td><button type="button" class="btn-portal-link" onclick="closeStatDetailModal(); openZoneDetails('alaknanda-basin');">Inspect (Page 2) →</button></td>
          </tr>
        </tbody>
      </table>
    `;
  } else if (statType === "villages") {
    titleEl.textContent = "All At-Risk Settlements & Evacuation Status";
    bodyEl.innerHTML = `
      <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 10px;">
        Prioritized list of all 4 settlements in proximity to active landslide and flood hazard corridors:
      </div>
      <table class="operational-table">
        <thead>
          <tr>
            <th>Village Settlement</th>
            <th>Threat Level</th>
            <th>Proximity to Slope</th>
            <th>Road Access Status</th>
            <th>Assigned Relief Shelter</th>
            <th>Composite Priority</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Sector 4 Basti (Joshimath)</strong></td>
            <td><span class="status-pill critical">CRITICAL</span></td>
            <td>0.4 km</td>
            <td><span class="status-pill blocked">Cut Off (Km 42)</span></td>
            <td>Govt College Relief Camp #2</td>
            <td><strong style="color: var(--color-critical);">Score: 9.8 / 10</strong></td>
          </tr>
          <tr>
            <td><strong>Helang Lower Valley</strong></td>
            <td><span class="status-pill critical">CRITICAL</span></td>
            <td>1.2 km</td>
            <td><span class="status-pill restricted">Partial Bypass</span></td>
            <td>Helang High School Camp</td>
            <td><strong style="color: var(--color-critical);">Score: 8.9 / 10</strong></td>
          </tr>
          <tr>
            <td><strong>Sunil Gaon Ridge</strong></td>
            <td><span class="status-pill high">HIGH</span></td>
            <td>1.8 km</td>
            <td><span class="status-pill open">Open Access</span></td>
            <td>Sports Stadium Safe Zone</td>
            <td><strong style="color: var(--color-high);">Score: 7.2 / 10</strong></td>
          </tr>
          <tr>
            <td><strong>Govindghat Riverside Basti</strong></td>
            <td><span class="status-pill high">HIGH (Cascading)</span></td>
            <td>3.4 km</td>
            <td><span class="status-pill open">Open Access</span></td>
            <td>Govindghat High Ground Camp</td>
            <td><strong style="color: var(--color-high);">Score: 6.8 / 10</strong></td>
          </tr>
        </tbody>
      </table>
    `;
  } else if (statType === "roads") {
    titleEl.textContent = "District Arterial Road & Bypass Matrix";
    bodyEl.innerHTML = `
      <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 10px;">
        Live highway clearance, blockade points, and authorized alternate bypass routes:
      </div>
      <table class="operational-table">
        <thead>
          <tr>
            <th>Corridor / Route Name</th>
            <th>Current Status</th>
            <th>Authorized Bypass Route</th>
            <th>Detour Distance &amp; Delay</th>
            <th>Control Directive</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>NH-7 Transit (Joshimath ⇄ Helang Km 42)</strong></td>
            <td><span class="status-pill blocked">Blocked by Mudslide</span></td>
            <td>Upper Helang Bypass Route</td>
            <td>14.8 km (+12 min delay)</td>
            <td><span class="status-pill blocked">Heavy Vehicles Barred</span></td>
          </tr>
          <tr>
            <td><strong>Joshimath ⇄ Auli Mountain Road</strong></td>
            <td><span class="status-pill restricted">Restricted / Slush</span></td>
            <td>Ropeway / 4WD Only</td>
            <td>13.2 km (+25 min delay)</td>
            <td><span class="status-pill restricted">4WD Transmission Only</span></td>
          </tr>
          <tr>
            <td><strong>Sector 4 Access Spur Road</strong></td>
            <td><span class="status-pill restricted">At-Risk (Creep)</span></td>
            <td>College Ridge Footpath</td>
            <td>2.1 km (+10 min delay)</td>
            <td><span class="status-pill restricted">Pedestrian Evac Only</span></td>
          </tr>
          <tr>
            <td><strong>NH-7 North (Joshimath ⇄ Badrinath)</strong></td>
            <td><span class="status-pill open">Open &amp; Monitored</span></td>
            <td>Direct Highway</td>
            <td>44.0 km (Nominal)</td>
            <td><span class="status-pill open">Normal Transit Authorized</span></td>
          </tr>
        </tbody>
      </table>
    `;
  } else if (statType === "hardware") {
    titleEl.textContent = "Field Hardware Infrastructure & Gateway Telemetry Details";
    bodyEl.innerHTML = `
      <!-- Silence is a Signal Escalation Box -->
      <div style="background: #fff1f2; border: 1px solid #fecdd3; border-left: 4px solid #be123c; border-radius: var(--radius-xs); padding: 10px 14px; margin-bottom: 14px; font-size: 0.8rem; color: #881337;">
        <strong>ESCALATION ALERT — SILENCE IS A SIGNAL:</strong> Gateway <strong>GW-04 (Sector 4 Upper Slope)</strong> ceased transmission 12 mins ago immediately after recording an extreme <strong>4.8°/hr</strong> tilt exceedance. Under DDMA protocol, radio silence following critical displacement is escalated as physical node disruption / slide initiation.
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-primary);">LoRa Gateway Mesh Nodes (8 Gateways):</span>
        <button type="button" class="btn-portal-link" onclick="showOperationalToast('Ping signal broadcasted to all 8 gateway transceivers.')">Ping All Gateways</button>
      </div>

      <table class="operational-table">
        <thead>
          <tr>
            <th>Gateway ID</th>
            <th>Deployment Sector</th>
            <th>Status</th>
            <th>Battery / Solar</th>
            <th>Last Seen</th>
            <th>Connected Sensor Nodes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>GW-04</code></td>
            <td>Sector 4 Upper Slope</td>
            <td><span class="status-pill critical">SILENT (ALERT)</span></td>
            <td>12.1V (Solar Offline)</td>
            <td>12 mins ago (00:23 IST)</td>
            <td>4 Inclinometers, 2 Piezometers</td>
          </tr>
          <tr>
            <td><code>GW-01</code></td>
            <td>Joshimath Control Center</td>
            <td><span class="status-pill open">ONLINE</span></td>
            <td>13.8V (100% Solar)</td>
            <td>8 secs ago</td>
            <td>1 AWS Station, 1 Rain Radar</td>
          </tr>
          <tr>
            <td><code>GW-02</code></td>
            <td>Helang Transit Hub</td>
            <td><span class="status-pill open">ONLINE</span></td>
            <td>13.4V (95% Solar)</td>
            <td>14 secs ago</td>
            <td>2 Road Tilt Sensors, 1 Soil Probe</td>
          </tr>
          <tr>
            <td><code>GW-03</code></td>
            <td>Alaknanda Hydro Basin</td>
            <td><span class="status-pill open">ONLINE</span></td>
            <td>13.6V (98% Solar)</td>
            <td>19 secs ago</td>
            <td>2 River Radar Gauges, 1 Accel</td>
          </tr>
          <tr>
            <td><code>GW-05</code></td>
            <td>Sector 5 Upper Ridge</td>
            <td><span class="status-pill open">ONLINE</span></td>
            <td>13.2V (92% Solar)</td>
            <td>25 secs ago</td>
            <td>3 Borehole Tiltmeters</td>
          </tr>
          <tr>
            <td><code>GW-06</code></td>
            <td>Sunil Gaon Ridge</td>
            <td><span class="status-pill open">ONLINE</span></td>
            <td>13.7V (100% Solar)</td>
            <td>11 secs ago</td>
            <td>2 Soil Moisture Probes</td>
          </tr>
          <tr>
            <td><code>GW-07</code></td>
            <td>Govindghat Relay Mast</td>
            <td><span class="status-pill open">ONLINE</span></td>
            <td>13.5V (96% Solar)</td>
            <td>30 secs ago</td>
            <td>1 Siren Relay, 1 River Sensor</td>
          </tr>
          <tr>
            <td><code>GW-08</code></td>
            <td>Auli Mountain Repeater</td>
            <td><span class="status-pill open">ONLINE</span></td>
            <td>13.9V (100% Solar)</td>
            <td>5 secs ago</td>
            <td>1 Weather Station, 2 Tiltmeters</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  modal.classList.add("open");
}

function closeStatDetailModal() {
  const modal = document.getElementById("statDetailModal");
  if (modal) modal.classList.remove("open");
}

// =========================================================================
// PAGE 4: CITIZEN REPORTS FEED & PATROL DISPATCH
// =========================================================================
function updateCitizenReportsStats() {
  const total = CITIZEN_REPORTS_DATABASE.length;
  const pending = CITIZEN_REPORTS_DATABASE.filter(r => r.status === "pending").length;

  const countBadge = document.getElementById("citizenReportsNavBadge");
  if (countBadge) countBadge.textContent = total;

  const statCount = document.getElementById("statCitizenReportsCount");
  if (statCount) statCount.textContent = `${total} Filed`;

  const pendingBadge = document.getElementById("statCitizenPendingBadge");
  if (pendingBadge) {
    pendingBadge.textContent = `${pending} Pending`;
    pendingBadge.className = `status-pill ${pending > 0 ? "high" : "open"}`;
  }
}

function filterReportsByStatus(status, btnEl) {
  activeReportFilter = status;
  const pills = document.querySelectorAll("#viewPage4Reports .filter-pill");
  pills.forEach(p => p.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");
  renderCitizenReports();
}

function filterCitizenReports() {
  renderCitizenReports();
}

function renderCitizenReports() {
  const container = document.getElementById("citizenReportsFeedContainer");
  if (!container) return;

  const searchInput = document.getElementById("reportSearchInput");
  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

  container.innerHTML = "";

  const filtered = CITIZEN_REPORTS_DATABASE.filter(report => {
    if (activeReportFilter === "pending" && report.status !== "pending") return false;
    if (activeReportFilter === "verified" && report.status !== "verified") return false;
    if (activeReportFilter === "critical" && report.severity !== "critical") return false;

    if (query) {
      const matchText = `${report.id} ${report.reporter} ${report.zone} ${report.location} ${report.category} ${report.tags.join(" ")}`.toLowerCase();
      if (!matchText.includes(query)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="background: var(--bg-surface); border: 1px dashed var(--border-light); border-radius: var(--radius-md); padding: 32px; text-align: center; color: var(--text-muted); font-size: 0.88rem;">
        No citizen reports matching current filter criteria.
      </div>
    `;
    return;
  }

  filtered.forEach(report => {
    const card = document.createElement("div");
    card.className = `citizen-report-row-card ${report.severity}`;

    const isPending = report.status === "pending";
    const isVerified = report.status === "verified";

    card.innerHTML = `
      <div class="report-header-flex">
        <div class="report-id-group">
          <span class="report-id-pill">${report.id}</span>
          <span class="status-pill ${report.severity}">${report.urgencyText}</span>
          <span style="font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-main);">${report.timestamp}</span>
        </div>
        <div>
          <span class="status-pill ${isVerified ? 'open' : (isPending ? 'high' : 'low')}">${report.statusText}</span>
        </div>
      </div>

      <div class="report-body-flex">
        <div class="report-photo-thumb" onclick="inspectCitizenReport('${report.id}')" title="Click to view evidence">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 4px;">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>Photo Evidence</span>
        </div>

        <div class="report-main-info">
          <div class="report-reporter-line">
            ${report.reporter} <span style="font-size: 0.76rem; font-weight: normal; color: var(--text-muted);">(${report.contact})</span>
          </div>
          <div style="font-size: 0.78rem; color: var(--text-secondary);">
            <strong>Location:</strong> ${report.location} • <em>${report.zone}</em> <span style="font-family: var(--font-main); color: var(--text-muted);">[${report.coordsText}]</span>
          </div>
          <div class="report-text-quote">
            "${report.description}"
          </div>
          <div class="report-meta-tags">
            ${report.tags.map(t => `<span class="status-pill low" style="font-size: 0.68rem;"># ${t}</span>`).join(" ")}
          </div>
        </div>

        <div class="report-patrol-status-box">
          <div class="patrol-status-label">Ground Patrol Verification</div>
          <div><strong>Officer:</strong> ${report.patrolOfficer}</div>
          ${report.patrolNotes ? `<div><strong>Notes:</strong> ${report.patrolNotes}</div>` : `<div style="color: var(--text-muted); font-style: italic;">Awaiting on-site field check.</div>`}
          ${report.dispatchedQrt ? `<div style="color: #16a34a; font-weight: 700;">Unit: ${report.dispatchedQrt}</div>` : ''}
        </div>
      </div>

      <div class="report-actions-row">
        <button type="button" class="btn-action-secondary" onclick="inspectCitizenReport('${report.id}')">
          Inspect Evidence
        </button>
        ${isPending ? `
          <button type="button" class="btn-action-secondary" style="border-color: #2563eb; color: #2563eb;" onclick="dispatchFieldQrtForReport('${report.id}')">
            Dispatch Field Patrol QRT
          </button>
        ` : ''}
        <button type="button" class="btn-action-primary" onclick="escalateReportToZoneAlert('${report.id}', '${report.zoneKey}')">
          Escalate to Alert Broadcast
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

function inspectCitizenReport(reportId) {
  const report = CITIZEN_REPORTS_DATABASE.find(r => r.id === reportId);
  if (!report) return;

  const modal = document.getElementById("citizenReportModal");
  const title = document.getElementById("citizenModalTitle");
  const body = document.getElementById("citizenModalBody");
  const footer = document.getElementById("citizenModalFooter");

  if (title) title.textContent = `Citizen Report ${report.id} — Ground Evidence & Telemetry`;

  if (body) {
    body.innerHTML = `
      <div style="display: flex; gap: 14px; flex-wrap: wrap; background: #f8fafc; border: 1px solid var(--border-light); padding: 12px; border-radius: var(--radius-xs);">
        <div style="flex: 1; min-width: 240px;">
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Citizen Reporter</div>
          <div style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary);">${report.reporter}</div>
          <div style="font-size: 0.78rem; color: var(--text-secondary);">${report.contact} • Filed ${report.timestamp}</div>
        </div>
        <div style="flex: 1; min-width: 240px;">
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Location &amp; Coordinates</div>
          <div style="font-size: 0.85rem; font-weight: 700;">${report.location}</div>
          <div style="font-size: 0.76rem; font-family: var(--font-main); color: var(--text-muted);">${report.coordsText}</div>
        </div>
      </div>

      <div style="background: #0f172a; border-radius: var(--radius-sm); padding: 24px; text-align: center; color: #ffffff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="1.8">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <div style="font-weight: 700; font-size: 0.92rem; color: #f8fafc;">${report.photo}</div>
        <div style="font-size: 0.74rem; color: #94a3b8; font-family: var(--font-main);">GPS Geotag: ${report.coordsText}</div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 4px;">
        <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary);">Citizen Statement / Description:</span>
        <div style="background: var(--bg-subtle); border-left: 4px solid #2563eb; padding: 10px 14px; border-radius: var(--radius-xs); font-size: 0.86rem; color: var(--text-primary); line-height: 1.5;">
          "${report.description}"
        </div>
      </div>

      <div style="background: var(--bg-subtle); border: 1px solid var(--border-light); border-radius: var(--radius-xs); padding: 12px;">
        <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px;">Patrol Response Status:</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.8rem;">
          <div><strong>Status:</strong> <span class="status-pill ${report.status === 'verified' ? 'open' : 'high'}">${report.statusText}</span></div>
          <div><strong>Officer:</strong> ${report.patrolOfficer}</div>
          <div style="grid-column: span 2;"><strong>Patrol Notes:</strong> ${report.patrolNotes || 'Pending assignment to patrol unit.'}</div>
        </div>
      </div>
    `;
  }

  if (footer) {
    footer.innerHTML = `
      <button type="button" class="btn-action-secondary" onclick="closeCitizenReportModal()">Close</button>
      <button type="button" class="btn-action-primary" onclick="closeCitizenReportModal(); escalateReportToZoneAlert('${report.id}', '${report.zoneKey}')">
        Escalate to Zone Evacuation Alert
      </button>
    `;
  }

  if (modal) modal.classList.add("open");
}

function closeCitizenReportModal() {
  const modal = document.getElementById("citizenReportModal");
  if (modal) modal.classList.remove("open");
}

function dispatchFieldQrtForReport(reportId) {
  const rep = CITIZEN_REPORTS_DATABASE.find(r => r.id === reportId);
  if (!rep) return;

  rep.dispatchedQrt = "Patrol Unit #104 (Officer Sushanthi)";
  rep.statusText = "Patrol Dispatched (QRT Unit #104)";
  rep.patrolOfficer = "Patrol #104 (Officer Sushanthi)";

  try {
    if (adminBroadcastChannel) {
      adminBroadcastChannel.postMessage({
        type: "ADMIN_DISPATCH_PATROL",
        reportId: rep.id,
        location: rep.location,
        coords: rep.coords,
        urgency: rep.severity
      });
    }
  } catch (e) {
    console.warn("Broadcast error:", e);
  }

  renderCitizenReports();
  updateCitizenReportsStats();
  showOperationalToast(`Dispatched Patrol QRT Unit #104 to ${rep.location}!`);
}

function escalateReportToZoneAlert(reportId, zoneKey) {
  if (zoneKey && ZONES_DATABASE[zoneKey]) {
    selectedZoneKey = zoneKey;
    populateZoneDetails(zoneKey);
    switchAdminPage("page2");
    showOperationalToast(`Escalated report ${reportId} to Zone Details for immediate alert broadcast.`);
  } else {
    openSendAlertConfirmModal();
  }
}

// =========================================================================
// OPERATIONAL TOAST UTILITY
// =========================================================================
function showOperationalToast(msg) {
  const toast = document.getElementById("operationalToast");
  if (!toast) return;

  toast.textContent = msg;
  toast.classList.add("show");

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}

// Global exposure for HTML inline event handlers
window.switchAdminPage = switchAdminPage;
window.openZoneDetails = openZoneDetails;
window.onZoneDropdownChange = onZoneDropdownChange;
window.openStatDetailModal = openStatDetailModal;
window.closeStatDetailModal = closeStatDetailModal;
window.openSendAlertConfirmModal = openSendAlertConfirmModal;
window.closeSendAlertConfirmModal = closeSendAlertConfirmModal;
window.confirmAndDispatchAlert = confirmAndDispatchAlert;
window.promptRejectAlert = promptRejectAlert;
window.filterHistoryTables = filterHistoryTables;
window.showOperationalToast = showOperationalToast;
window.filterReportsByStatus = filterReportsByStatus;
window.filterCitizenReports = filterCitizenReports;
window.inspectCitizenReport = inspectCitizenReport;
window.closeCitizenReportModal = closeCitizenReportModal;
window.dispatchFieldQrtForReport = dispatchFieldQrtForReport;
window.escalateReportToZoneAlert = escalateReportToZoneAlert;
