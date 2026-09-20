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
      { name: "Gateway GW-SH01 (LoRa Mesh)", pos: [25.5830, 91.8900], type: "gateway", val: "Online (13.8V Solar)", color: "#16a34a" },
      { name: "IMD Doppler AWS Rain Gauge (Shillong)", pos: [25.5845, 91.8870], type: "rain", val: "118.0 mm / 24h continuous monsoon downpour", color: "#0284c7" }
    ],
    hardwareNodes: [
      {
        id: "INC-SH-101",
        name: "Borehole Inclinometer (Ridge Scarp)",
        category: "inclinometer",
        typeLabel: "Borehole Inclinometer",
        model: "Encardio-Rite EAN-26M Dual-Axis MEMS",
        status: "critical",
        statusText: "CRITICAL TILT ALERT",
        primaryMetric: "4.8° / hr Tilt Rate",
        rawValues: {
          tiltX: "+3.24° (East Aspect)",
          tiltY: "+1.56° (Downslope Vector)",
          cumulativeDisp: "18.4 mm",
          depth: "18.5m Borehole Depth",
          temp: "16.4°C"
        },
        threshold: "Max Safe: < 1.0°/hr (Breached)",
        battery: "94% (3.8V LiFePO4)",
        signal: "-78 dBm (LoRaWAN Ch 4)",
        packetLoss: "0.2%",
        lastPing: "12s ago",
        online: true
      },
      {
        id: "RAIN-AWS-04",
        name: "Tipping Bucket Rain Gauge (IMD AWS)",
        category: "rain_gauge",
        typeLabel: "Rain Gauge AWS",
        model: "Met One 370 Opto-Mechanical 0.2mm Bucket",
        status: "warning",
        statusText: "HIGH RAINFALL SURGE",
        primaryMetric: "52.4 mm/h (118.0 mm / 24h)",
        rawValues: {
          intensity1h: "52.4 mm/h",
          cumulative24h: "118.0 mm",
          peak15m: "18.2 mm",
          tipCount: "590 tips",
          orificeArea: "200 cm²"
        },
        threshold: "Warning: > 50 mm/24h (Breached)",
        battery: "100% (Solar 13.8V)",
        signal: "-65 dBm (4G LTE / LoRa)",
        packetLoss: "0.0%",
        lastPing: "4s ago",
        online: true
      },
      {
        id: "PZ-SH-02",
        name: "Vibrating Wire Pore Piezometer",
        category: "piezometer",
        typeLabel: "Pore Piezometer",
        model: "Geokon 4500HD High-Pressure Transducer",
        status: "warning",
        statusText: "HIGH PORE SATURATION",
        primaryMetric: "142.5 kPa (89.2% Saturation)",
        rawValues: {
          porePressure: "142.5 kPa",
          saturationLevel: "89.2% Liquefaction Index",
          groundwaterDepth: "-1.24m below surface",
          frequency: "2,418 Hz",
          diaphragmStress: "82.4 bar"
        },
        threshold: "Limit: < 120 kPa (Elevated)",
        battery: "91% (3.6V Lithium Thionyl)",
        signal: "-82 dBm (LoRaWAN Ch 2)",
        packetLoss: "0.4%",
        lastPing: "18s ago",
        online: true
      },
      {
        id: "SAR-REF-09",
        name: "Sentinel-1 Ground InSAR Radar Reflector",
        category: "insar_radar",
        typeLabel: "InSAR Radar Reflector",
        model: "Trihedral Radar Calibrator 1.2m (C-Band)",
        status: "online",
        statusText: "SATELLITE SYNC ACTIVE",
        primaryMetric: "+15.8 mm/wk Surface Creep",
        rawValues: {
          lineOfSightVelocity: "+15.8 mm/wk",
          interferometricCoherence: "0.91 (Excellent Phase)",
          satellitePass: "Sentinel-1 Descending #084",
          radarWavelength: "5.405 GHz (C-Band)",
          azimuthAngle: "172.4°"
        },
        threshold: "Alert: > 5.0 mm/wk",
        battery: "Passive Structural Reflector",
        signal: "Satellite Orbit Downlink",
        packetLoss: "0.0%",
        lastPing: "38m ago (GEE Sync)",
        online: true
      },
      {
        id: "TDR-SM-05",
        name: "Time Domain Reflectometry Soil Probe",
        category: "tdr_soil",
        typeLabel: "Soil TDR Multi-Depth",
        model: "Campbell Scientific CS655 (3-Depth Probe)",
        status: "online",
        statusText: "SOIL SATURATED",
        primaryMetric: "82.4% Volumetric Water Content",
        rawValues: {
          depth0_5m: "82.4% VWC",
          depth1_0m: "89.2% VWC",
          depth2_0m: "94.1% VWC",
          bulkEC: "1.42 dS/m",
          dielectricPermittivity: "38.6"
        },
        threshold: "Field Capacity: > 75%",
        battery: "88% (Solar 12V)",
        signal: "-80 dBm (LoRaWAN Ch 1)",
        packetLoss: "0.1%",
        lastPing: "25s ago",
        online: true
      },
      {
        id: "GW-SH-01",
        name: "Solar LoRaWAN Master Telemetry Gateway",
        category: "gateway",
        typeLabel: "IoT Master Gateway",
        model: "Milesight UG67 IP67 8-Channel Gateway",
        status: "online",
        statusText: "ROUTING 8/8 NODES",
        primaryMetric: "8 Nodes Active (42ms Latency)",
        rawValues: {
          activeNodes: "8 Active In-Situ Nodes",
          packetForwardRate: "99.8%",
          meshFrequency: "868.1 MHz IN865",
          solarVoltage: "13.8V Charge",
          networkUptime: "99.94%"
        },
        threshold: "Nominal Operating Status",
        battery: "100% (Solar + 24Ah LiFePO4)",
        signal: "-58 dBm (Dual-SIM 4G LTE)",
        packetLoss: "0.01%",
        lastPing: "1s ago",
        online: true
      },
      {
        id: "SRN-TWR-01",
        name: "High-Decibel Siren & Strobe Array",
        category: "siren_tower",
        typeLabel: "Physical Alert Siren",
        model: "Dual 130dB Horn + Xenon Array (USB Interface)",
        status: "online",
        statusText: "ARDUINO USB RELAY SYNCED",
        primaryMetric: "130 dB Output (Armed / Standby)",
        rawValues: {
          serialRelay: "USB Serial Relay COM4 (Synced)",
          sirenAudioDriver: "EAS / Continuous / Hi-Lo Ready",
          strobeXenon: "75 Flashes/min High Visibility",
          backupBattery: "24V Lead-Acid (98% Float)",
          acousticRadius: "3.2 km Radius Coverage"
        },
        threshold: "Arduino Serial Interface Active",
        battery: "98% (24V Standby)",
        signal: "USB Hardware Serial / Synced",
        packetLoss: "0.0%",
        lastPing: "Instant Live Loop",
        online: true
      }
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
      { name: "GS Road Corridor (NH-106 / NH-6)", status: "blocked", statusText: "Blocked by Mudflow", bypass: "Upper Shillong Bypass", delay: "12.4 km (+15 min delay)", coords: [[25.5680, 91.8820], [25.5700, 91.8845], [25.5720, 91.8870], [25.5740, 91.8890], [25.5760, 91.8915], [25.5780, 91.8940], [25.5800, 91.8965]], bypassCoords: [[25.5680, 91.8820], [25.5660, 91.8850], [25.5650, 91.8890], [25.5670, 91.8930], [25.5710, 91.8960], [25.5760, 91.8980], [25.5800, 91.8965]] },
      { name: "Shillong ⇄ Jowai Highway", status: "restricted", statusText: "Restricted / Slush", bypass: "Eastern Bypass Route", delay: "16.2 km (+25 min delay)", coords: [[25.5800, 91.8965], [25.5820, 91.9050], [25.5840, 91.9150], [25.5850, 91.9250]], bypassCoords: [[25.5800, 91.8965], [25.5750, 91.9080], [25.5780, 91.9190], [25.5850, 91.9250]] },
      { name: "Mawlai Ridge Link Spur", status: "restricted", statusText: "At-Risk (Creep)", bypass: "Umshing Road Footpath", delay: "3.1 km (+10 min delay)", coords: [[25.5800, 91.8820], [25.5850, 91.8800], [25.5890, 91.8790]], bypassCoords: [[25.5800, 91.8820], [25.5830, 91.8750], [25.5870, 91.8760], [25.5890, 91.8790]] },
      { name: "Shillong ⇄ Guwahati Expressway", status: "open", statusText: "Open & Monitored", bypass: "Direct Highway", delay: "Nominal", coords: [[25.5800, 91.8965], [25.5900, 91.8900], [25.6000, 91.8850]], bypassCoords: [[25.5800, 91.8965], [25.5880, 91.8940], [25.5950, 91.8880], [25.6000, 91.8850]] }
    ],
    feasibility: [
      { village: "Shillong Peak Ridge Sector", shelter: "Shillong Municipal Relief Center #1", channel: "App Push + SMS + City Siren", statusClass: "low", reach: "99% Reachable" },
      { village: "Mawlai Valley Settlement", shelter: "Mawlai Higher Secondary Camp", channel: "SMS Fallback + LoRa Node", statusClass: "low", reach: "95% Reachable" },
      { village: "Laitumkhrah Upper Slope", shelter: "St. Anthony Relief Safe Zone", channel: "Smartphone App + SMS", statusClass: "low", reach: "97% Reachable" },
      { village: "Polo Ground Community Sector", shelter: "Polo Ground High Ground Camp", channel: "Siren Tower #1 + Satellite", statusClass: "high", reach: "100% Siren Blast" }
    ],
    satellite: {
      thumbnailUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80",
      sentinel1Url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80",
      sentinel2Url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      sentinel1Band: "C-Band SAR (5.405 GHz) InSAR VV+VH Interferometry",
      sentinel2Band: "MSI Bands B4 (Red 665nm), B8 (NIR 842nm), B11 (SWIR 1610nm)",
      sarResolution: "10m GSD / 250km Swath (IW Mode)",
      opticalResolution: "10m GSD / 290km Swath (Level-2A BOA Reflectance)",
      orbit: "Descending Pass #084 (GEE Sentinel-1/2 Ingest)",
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
      radarCoherence: "0.91 (High Quality Phase Stability)",
      xaiWeights: [
        { label: "Sentinel-1 InSAR Radar Creep", weight: 44, color: "#dc2626" },
        { label: "Doppler AWS Rain Surge", weight: 32, color: "#ea580c" },
        { label: "CartoDEM Slope Gradient (36°)", weight: 14, color: "#2563eb" },
        { label: "Sentinel-2 NDWI Soil Moisture", weight: 10, color: "#0891b2" }
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
    hardwareNodes: [
      {
        id: "TILT-CH-201",
        name: "Sohra Escarpment Surface Tiltmeter",
        category: "inclinometer",
        typeLabel: "Escarpment Tiltmeter",
        model: "RST Instruments Digital MEMS Tiltmeter",
        status: "critical",
        statusText: "COLLAPSE ROTATION",
        primaryMetric: "44.0° Dip Angle (+6.2°/d)",
        rawValues: {
          dipAngle: "44.0° Critical Rock Cut",
          accelerationRate: "+6.2° / 24h rotation",
          rockfallRisk: "98.4%",
          depth: "Surface Scarp Anchor",
          temp: "14.8°C"
        },
        threshold: "Limit: < 2.0°/d (Extreme Breach)",
        battery: "89% (3.6V Lithium)",
        signal: "-85 dBm (LoRaWAN)",
        packetLoss: "0.1%",
        lastPing: "8s ago",
        online: true
      },
      {
        id: "RAIN-CH-01",
        name: "Cherrapunji Ultra-High Range AWS Rain Station",
        category: "rain_gauge",
        typeLabel: "High-Capacity Rain AWS",
        model: "Campbell Scientific ARG100 Aerodynamic Rain Gauge",
        status: "critical",
        statusText: "EXTREME DOWNPOUR RECORD",
        primaryMetric: "214.0 mm / 24h (Monsoon Surge)",
        rawValues: {
          intensity1h: "78.6 mm/h",
          cumulative24h: "214.0 mm",
          peakRate: "112.4 mm/h",
          catchArea: "500 cm²",
          siphonCycle: "Active 42s"
        },
        threshold: "Red Alert: > 100 mm/24h",
        battery: "100% (Solar 13.6V)",
        signal: "-60 dBm (4G LTE Primary)",
        packetLoss: "0.0%",
        lastPing: "2s ago",
        online: true
      },
      {
        id: "GW-CH-02",
        name: "Sohra Transit Solar Mesh Repeater",
        category: "gateway",
        typeLabel: "Industrial LoRa Gateway",
        model: "Kerlink Wirnet iStation 868MHz",
        status: "online",
        statusText: "ROUTING 6 NODES",
        primaryMetric: "6 Nodes Active (38ms Ping)",
        rawValues: {
          uplinkRatio: "99.9%",
          solarBusVoltage: "13.4V",
          radioChirp: "SF7 BW125kHz",
          ambientTemp: "15.2°C",
          uptimeHours: "1,420h"
        },
        threshold: "Nominal Operating Status",
        battery: "96% (Solar + 18Ah Battery)",
        signal: "-64 dBm (Satellite Uplink)",
        packetLoss: "0.02%",
        lastPing: "1s ago",
        online: true
      },
      {
        id: "SRN-CH-02",
        name: "Sohra Gorge Warning Siren Array",
        category: "siren_tower",
        typeLabel: "Gorge Siren Array",
        model: "Federal Signal E-Class 128dB Dual Acoustic Horn",
        status: "online",
        statusText: "STANDBY READY",
        primaryMetric: "128 dB Acoustic Horn (Active Relay)",
        rawValues: {
          hornImpedance: "8 Ohms",
          soundCoverage: "4.5 km Canyon Sweep",
          amplifierStatus: "Standby 24.2V",
          strobeMode: "High Flux Orange Xenon",
          autoTestResult: "Pass (07-Sep 18:00)"
        },
        threshold: "Standby / Ready for Dissemination",
        battery: "100% (24V Dual Deep Cycle)",
        signal: "RF VHF + Mesh Linked",
        packetLoss: "0.0%",
        lastPing: "5s ago",
        online: true
      }
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
      { name: "SH-5 Sohra-Shella Highway", status: "blocked", statusText: "Blocked by Rockslide", bypass: "Mawkdok Ridge Route", delay: "18.5 km (+20 min delay)", coords: [[25.2600, 91.7200], [25.2640, 91.7240], [25.2680, 91.7280], [25.2720, 91.7320], [25.2760, 91.7360]], bypassCoords: [[25.2600, 91.7200], [25.2620, 91.7250], [25.2660, 91.7290], [25.2700, 91.7340], [25.2760, 91.7360]] },
      { name: "Cherrapunji ⇄ Shillong Main Link", status: "restricted", statusText: "Restricted Slush", bypass: "Tynghon Bypass Track", delay: "8.2 km (+15 min delay)", coords: [[25.2760, 91.7360], [25.2850, 91.7450], [25.2950, 91.7550]], bypassCoords: [[25.2760, 91.7360], [25.2810, 91.7490], [25.2950, 91.7550]] }
    ],
    feasibility: [
      { village: "Sohra Rim Settlement", shelter: "Sohra Civil Camp", channel: "SMS Broadcast + VMS Alert", statusClass: "low", reach: "96% Reachable" },
      { village: "Mawkdok Ridge Sector", shelter: "Mawkdok High Ground Camp", channel: "App Push + VHF SDRF Relay", statusClass: "low", reach: "93% Reachable" }
    ],
    satellite: {
      thumbnailUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80",
      sentinel1Url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=80",
      sentinel2Url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      sentinel1Band: "C-Band SAR (5.405 GHz) InSAR VV+VH Interferometry",
      sentinel2Band: "MSI Bands B4 (Red 665nm), B8 (NIR 842nm), B11 (SWIR 1610nm)",
      sarResolution: "10m GSD / 250km Swath (IW Mode)",
      opticalResolution: "10m GSD / 290km Swath (Level-2A BOA Reflectance)",
      orbit: "Ascending Pass #019 (GEE Sentinel-1/2 Ingest)",
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
        { label: "Extreme AWS Rain Trigger", weight: 46, color: "#dc2626" },
        { label: "Escarpment Gradient (44°)", weight: 28, color: "#ea580c" },
        { label: "Sentinel-1 InSAR Creep Velocity", weight: 16, color: "#2563eb" },
        { label: "Sentinel-2 NDWI Soil Wetness", weight: 10, color: "#0891b2" }
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
    hardwareNodes: [
      {
        id: "TILT-AR-102",
        name: "Trans-Himalayan Glacial Tiltmeter",
        category: "inclinometer",
        typeLabel: "Borehole Tiltmeter",
        model: "Applied Geomechanics Model 755 Submersible",
        status: "warning",
        statusText: "ELEVATED CREEP",
        primaryMetric: "2.4° / wk Slope Deflection",
        rawValues: {
          radialTilt: "2.4° / week",
          slopeAspect: "41.2° Glacial Slope",
          groundTemperature: "8.4°C",
          boreholeDepth: "22.0m",
          shearVector: "South-West Vector"
        },
        threshold: "Warning: > 1.5°/wk",
        battery: "92% (3.6V Primary Lithium)",
        signal: "-88 dBm (LoRaWAN Long Range)",
        packetLoss: "0.2%",
        lastPing: "14s ago",
        online: true
      },
      {
        id: "SOIL-AR-01",
        name: "Trans-Himalayan Multi-Depth Soil Moisture Probe",
        category: "tdr_soil",
        typeLabel: "Soil Hydrology TDR",
        model: "Sentek Drill & Drop Multi-Depth Probe 1.2m",
        status: "online",
        statusText: "MODERATE SATURATION",
        primaryMetric: "68.4% Volumetric Soil Moisture",
        rawValues: {
          surfaceMoisture: "68.4% VWC",
          deepSubsurface: "74.2% VWC",
          salinityEC: "0.84 dS/m",
          permafrostThawIndex: "Nominal",
          permeabilityRate: "12 mm/h"
        },
        threshold: "Field Saturation: > 70%",
        battery: "95% (Solar + Battery)",
        signal: "-82 dBm (LoRaWAN)",
        packetLoss: "0.1%",
        lastPing: "6s ago",
        online: true
      },
      {
        id: "GW-AR-01",
        name: "Remote Satcom LoRaWAN Telemetry Gateway",
        category: "gateway",
        typeLabel: "Satellite Gateway Relay",
        model: "Inmarsat BGAN + Advantech SmartFlex LoRa",
        status: "online",
        statusText: "SATCOM LINK SYNCED",
        primaryMetric: "Satcom Uplink Active (120ms)",
        rawValues: {
          satelliteConstellation: "Inmarsat I-4 F2 BGAN",
          uplinkMargin: "14.2 dB",
          meshNodesBound: "5 Remote Slopes Nodes",
          solarCharge: "13.8V Float",
          dataVolume24h: "4.2 MB"
        },
        threshold: "Nominal Operating Status",
        battery: "100% (Solar 40W + 36Ah)",
        signal: "Satcom Direct Beam (-54 dBm)",
        packetLoss: "0.0%",
        lastPing: "3s ago",
        online: true
      }
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
      { name: "Trans-Arunachal Highway (NH-13)", status: "restricted", statusText: "Restricted / Slush", bypass: "Border Patrol Track", delay: "22.4 km (+30 min delay)", coords: [[28.6400, 96.1400], [28.6440, 96.1440], [28.6480, 96.1480], [28.6520, 96.1520], [28.6560, 96.1560]], bypassCoords: [[28.6400, 96.1400], [28.6420, 96.1460], [28.6490, 96.1540], [28.6560, 96.1560]] }
    ],
    feasibility: [
      { village: "Walong North Sector", shelter: "Anjaw District Station", channel: "Satellite Push + LoRa Relay", statusClass: "low", reach: "94% Reachable" },
      { village: "Hayuliang Valley Settlement", shelter: "Hayuliang Safe Zone", channel: "SMS + VHF Relay", statusClass: "low", reach: "91% Reachable" }
    ],
    satellite: {
      thumbnailUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80",
      sentinel1Url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=80",
      sentinel2Url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
      sentinel1Band: "C-Band SAR (5.405 GHz) InSAR VV+VH Interferometry",
      sentinel2Band: "MSI Bands B4 (Red 665nm), B8 (NIR 842nm), B11 (SWIR 1610nm)",
      sarResolution: "10m GSD / 250km Swath (IW Mode)",
      opticalResolution: "10m GSD / 290km Swath (Level-2A BOA Reflectance)",
      orbit: "Descending Pass #042 (GEE Sentinel-1/2 Ingest)",
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
      radarCoherence: "0.89 (High Quality Phase Stability)",
      xaiWeights: [
        { label: "Sentinel-1 InSAR Ridge Creep", weight: 38, color: "#ea580c" },
        { label: "Slope Gradient (41°)", weight: 30, color: "#2563eb" },
        { label: "Sentinel-2 NDWI Moisture Index", weight: 20, color: "#0891b2" },
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
    hasGeotag: true,
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
    statusText: "Verified by Field Officer #104",
    patrolOfficer: "Officer Sushanthi (Patrol #104)",
    patrolNotes: "3.2m continuous crack confirmed, 8cm void depth. Escalated to NER Command.",
    dispatchedOfficer: "Field Officer Unit 2"
  },
  {
    id: "REP-901",
    reporter: "Wanbiang Marbaniang",
    contact: "+91 94120 11223",
    zoneKey: "shillong-meghalaya",
    zone: "Shillong Urban Ridge",
    location: "Police Bazar Ridge Track",
    hasGeotag: false,
    coords: null,
    coordsText: "Location Name Only (No Geotag)",
    category: "Water Seepage",
    tags: ["Muddy Seepage", "Soft Soil"],
    severity: "high",
    urgencyText: "Elevated Watch",
    description: "Previously dry hillside is discharging brown muddy water. Ground feels spongy near water reservoir.",
    photo: "Turbid water pooling around terrace stone wall",
    timestamp: "1h ago (23:40 IST)",
    status: "pending",
    statusText: "Pending Field Inspection",
    patrolOfficer: "Unassigned",
    patrolNotes: "",
    dispatchedOfficer: null
  },
  {
    id: "REP-895",
    reporter: "Karsing Rapsang (Bus Driver)",
    contact: "+91 97600 55443",
    zoneKey: "cherrapunji-meghalaya",
    zone: "Cherrapunji (Sohra) Escarpment",
    location: "Sohra Escarpment Highway Cut",
    hasGeotag: true,
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
    statusText: "Verified by Field Officer #12 & PWD",
    patrolOfficer: "Field Officer #12 (Meghalaya PWD)",
    patrolNotes: "3,800 m³ debris. Nohkalikai Ridge route activated.",
    dispatchedOfficer: "Field Officer Unit 4"
  },
  {
    id: "REP-882",
    reporter: "Tasso Taku",
    contact: "+91 98370 88991",
    zoneKey: "remote-arunachal",
    zone: "Remote Slopes, Arunachal Pradesh",
    location: "Trans-Arunachal NH-13 Foothills",
    hasGeotag: false,
    coords: null,
    coordsText: "Location Name Only (No Geotag)",
    category: "Rockfall Debris",
    tags: ["Rockfall", "Valley Base"],
    severity: "moderate",
    urgencyText: "Routine Note",
    description: "Small gravel and stones rolling down mountainside slope onto highway shoulder.",
    photo: "Scattered gravel on road shoulder",
    timestamp: "4h ago (20:30 IST)",
    status: "pending",
    statusText: "Pending Field Inspection",
    patrolOfficer: "Unassigned",
    patrolNotes: "",
    dispatchedOfficer: null
  }
];

export const INITIAL_DISPATCHED_ALERTS = [
  {
    refId: "#ALERT-2026-9041",
    zone: "Shillong Urban & Ridge Slopes",
    zoneName: "Shillong Urban & Ridge Slopes",
    severity: "critical",
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
    severity: "high",
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
    officer: "Field Officer (Officer #104)",
    reason: "Visual verification cleared by SDRF field patrol. Slope currently stable.",
    status: "Archived / Rejected"
  }
];

export const INITIAL_CITIZEN_EVACUATION_TRACKING = [
  {
    id: "CIT-SH-01",
    name: "Laitumkhrah Ward 4 Residence",
    phone: "+91 98765-43210",
    zone: "Shillong Urban Ridge",
    location: "Upper Laitumkhrah Slope (25.5690° N, 91.8980° E)",
    alarmStatus: "not_turned_off",
    status: "unresponsive",
    actionText: "Alarm Ringing (6m+ Unresponsive)",
    ringingDuration: "6m 40s",
    lastUpdate: "6m ago",
    shelterTarget: "St. Anthony Relief Safe Zone",
    evacRoute: "Laitumkhrah Link Bypass",
    officerDispatched: false,
    assignedOfficer: null
  },
  {
    id: "CIT-SH-02",
    name: "Polo Ground Community Cluster #2",
    phone: "+91 98765-11223",
    zone: "Shillong Urban Ridge",
    location: "Polo Grounds Camp Link (25.5840° N, 91.8950° E)",
    alarmStatus: "turned_off",
    status: "evacuating",
    actionText: "Alarm Turned Off (Silenced)",
    ringingDuration: "Silenced in 45s",
    lastUpdate: "3m ago",
    shelterTarget: "Shillong Polo Ground Camp #1",
    evacRoute: "North Polo Arterial Route",
    officerDispatched: false,
    assignedOfficer: null
  },
  {
    id: "CIT-SH-03",
    name: "Shillong Peak Ridge Dwelling #12",
    phone: "+91 94361-99882",
    zone: "Shillong Urban Ridge",
    location: "Steep Crest Cutoff (25.5760° N, 91.8910° E)",
    alarmStatus: "not_turned_off",
    status: "unresponsive",
    actionText: "Alarm Ringing (8m+ Unresponsive)",
    ringingDuration: "8m 15s",
    lastUpdate: "8m ago",
    shelterTarget: "Shillong Municipal Relief Center #1",
    evacRoute: "Shillong Peak Link Bypass",
    officerDispatched: false,
    assignedOfficer: null
  },
  {
    id: "CIT-SH-04",
    name: "Mawlai Valley Settlement Unit",
    phone: "+91 94361-77441",
    zone: "Shillong Urban Ridge",
    location: "Mawlai Lower Valley (25.5890° N, 91.8790° E)",
    alarmStatus: "turned_off",
    status: "evacuating",
    actionText: "Alarm Turned Off (Silenced)",
    ringingDuration: "Silenced in 1m 10s",
    lastUpdate: "1m ago",
    shelterTarget: "Mawlai Higher Secondary Camp",
    evacRoute: "Mawlai Highway Link",
    officerDispatched: false,
    assignedOfficer: null
  },
  {
    id: "CIT-CR-05",
    name: "Sohra Rim Lower Valley Household",
    phone: "+91 94361-22334",
    zone: "Cherrapunji Escarpment",
    location: "Sohra Rim Escarpment Foot (25.2680° N, 91.7280° E)",
    alarmStatus: "not_turned_off",
    status: "unresponsive",
    actionText: "Alarm Ringing (11m+ Unresponsive)",
    ringingDuration: "11m 30s",
    lastUpdate: "11m ago",
    shelterTarget: "Cherrapunji Community Safe Camp",
    evacRoute: "Nohkalikai Ridge Link",
    officerDispatched: false,
    assignedOfficer: null
  },
  {
    id: "CIT-SH-06",
    name: "Nongthymmai Ridge Family #8",
    phone: "+91 98560-44551",
    zone: "Shillong Urban Ridge",
    location: "Upper Nongthymmai Sector (25.5620° N, 91.9050° E)",
    alarmStatus: "turned_off",
    status: "sheltered",
    actionText: "Alarm Turned Off (Safe in Shelter)",
    ringingDuration: "Silenced in 30s",
    lastUpdate: "5m ago",
    shelterTarget: "St. Edmund Relief Camp",
    evacRoute: "Nongthymmai East Avenue",
    officerDispatched: false,
    assignedOfficer: null
  },
  {
    id: "CIT-CP-07",
    name: "Champhai Ridge Slopes Dwelling #3",
    phone: "+91 97740-88112",
    zone: "Champhai Sector (Mizoram)",
    location: "Champhai Terraced Ridge (23.4750° N, 93.3280° E)",
    alarmStatus: "dispatched",
    status: "rescuing",
    actionText: "Field Officer Dispatched (Welfare Rescue)",
    ringingDuration: "Was Ringing 14m",
    lastUpdate: "2m ago",
    shelterTarget: "Champhai Higher Secondary Safe Zone",
    evacRoute: "Zokhawthar Link Road",
    officerDispatched: true,
    assignedOfficer: "Field Officer #108"
  },
  {
    id: "CIT-SH-08",
    name: "Wah Umkhrah Riverside Settlement #14",
    phone: "+91 94361-55667",
    zone: "Shillong Urban Ridge",
    location: "Wah Umkhrah Basin (25.5810° N, 91.8840° E)",
    alarmStatus: "not_turned_off",
    status: "unresponsive",
    actionText: "Alarm Ringing (5m+ Unresponsive)",
    ringingDuration: "5m 10s",
    lastUpdate: "5m ago",
    shelterTarget: "Shillong Municipal Relief Center #1",
    evacRoute: "Polo Ground Upper Link",
    officerDispatched: false,
    assignedOfficer: null
  },
  {
    id: "CIT-CR-09",
    name: "Mawkdok Highway Outpost Family",
    phone: "+91 98560-99221",
    zone: "Cherrapunji Escarpment",
    location: "Mawkdok Escarpment Flank (25.3200° N, 91.7500° E)",
    alarmStatus: "turned_off",
    status: "evacuating",
    actionText: "Alarm Turned Off (Silenced)",
    ringingDuration: "Silenced in 1m 40s",
    lastUpdate: "4m ago",
    shelterTarget: "Mawkdok Community Safe Center",
    evacRoute: "NH-106 South Bypass",
    officerDispatched: false,
    assignedOfficer: null
  }
];
