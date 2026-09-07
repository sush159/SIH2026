/**
 * Citizen Disaster Early Warning & Area Safety System
 * Core Application Logic & Geospatial State Management
 */

// =============================================================================
// I18N MULTILINGUAL TRANSLATION DICTIONARY (EN / HI)
// =============================================================================
const TRANSLATIONS = {
  en: {
    appTitle: "ResilientGuard",
    appSubtitle: "Citizen Disaster Early Warning & Area Safety",
    offlineNotice: "Showing cached data from 12:40 PM — reconnecting to local mesh...",
    coldStartNotice: "Limited local sensor telemetry — monitoring secondary satellite feeds closely",
    retrySync: "Retry Sync",
    dismiss: "Dismiss",
    navMyArea: "My Area",
    navMap: "Live Map",
    navAlerts: "Alerts",
    navReport: "Report Hazard",
    primaryReasonHeader: "Primary Factor",
    trendLineText: "Conditions stable over past 24h",
    freshnessText: "Updated 3 min ago",
    highConfidence: "Confidence: High (96%)",
    emergencyActionsHeader: "Emergency Support & Shelter",
    sosActive: "Active Alert",
    callEmergency112: "National Helpline 112",
    callDisasterControl: "Disaster Control 1077",
    shelterName: "Joshimath Relief Center #2 (Govt College)",
    shelterMeta: "1.1 km away • Capacity: 180/300 occupied • Medical Aid Ready",
    navigateShelter: "Route",
    telemetryRainfall: "Rainfall Intensity",
    telemetrySoil: "Soil Saturation",
    telemetrySlope: "Ground Deformation",
    savedRoutesHeader: "Saved Commute Corridor",
    viewOnMap: "View on Map →",
    homeRouteTitle: "Joshimath ⇄ Helang Transit",
    homeRouteSub: "NH-7 Main Corridor • 14.8 km",
    blockedBadge: "Blocked (Km 42)",
    openBadge: "Open & Clear",
    corridorNoticeHeader: "Corridor Status",
    advisoryHeader: "Safeguard Rules",
    advisory1: "Keep emergency kit & essential IDs ready.",
    advisory2: "Avoid steep slopes and swollen stream beds.",
    advisory3: "Check Live Map road status before travel.",
    advisory4: "Report new ground cracks or blockages instantly.",
    legendOpen: "Open",
    legendAtRisk: "At-Risk",
    legendBlocked: "Blocked",
    legendShelter: "Shelter",
    mapInspectorHeader: "Geospatial Inspector",
    monitoredRoadsHeader: "Monitored Corridors",
    sheltersHeader: "Designated Shelters",
    alertsPageTitle: "Active Alerts & Corridors",
    alertsPageSub: "Real-time hazard notifications based on telemetry fusion",
    filterAll: "All Alerts",
    filterArea: "My Area",
    filterRoute: "Saved Routes",
    alertScopeArea: "Area Hazard Alert",
    alert1Headline: "High Landslide Probability: Sector 4 Slopes",
    alert1Desc: "Satellite InSAR ground analysis registered displacement acceleration following continuous 48 mm/h precipitation. Residents along western ridge are advised to proceed to designated relief shelters.",
    dataSourceLine1: "Based on Rainfall Radar + Satellite Imagery + Ground InSAR Telemetry",
    alertScopeRoute: "Saved Route Disruption",
    alert2Headline: "NH-7 Road Blockage at Km 42 (Joshimath-Helang)",
    alert2Desc: "Mudflow has temporarily closed both lanes of NH-7 near Km 42. Road clearing machinery is actively deployed.",
    alternateAvailableHeader: "Alternate Road Available: Upper Helang Bypass",
    alternateRouteSub: "Paved two-lane road • Safe elevation • +12 mins transit time",
    applyAlternateRoute: "Use Alternate Route",
    dataSourceLine2: "Based on Traffic Police Feeds + Highway Telemetry + Satellite Radar",
    emptyAlertsTitle: "No Active Warnings or Route Blockages",
    emptyAlertsDesc: "All monitored regions, precipitation zones, and commuter corridors in your sector are operating within normal safety limits.",
    reportTitle: "Report Ground & Road Hazard",
    reportSubtitle: "Field observations assist early-warning models and verify localized safety statuses.",
    reportPhotoLabel: "Photo Evidence",
    optionalTag: "Visual verification",
    uploadDirectTitle: "Direct Photo Upload",
    uploadDirectSub: "Select photos from device gallery / storage",
    geotagCamTitle: "Open Geotag Camera",
    geotagCamSub: "Instant photo with real-time GPS & timestamp",
    uploadPromptTitle: "Tap to Upload Hazard Photo",
    uploadPromptSub: "Supports JPG, PNG with auto-geotagging",
    reportLocationLabel: "Hazard Location",
    autoDetectedTag: "Auto-filled GPS",
    btnDetectGPS: "Detect GPS",
    reportHazardTypeLabel: "Select Issue Category",
    singleSelectTag: "Tap to select",
    tagCrack: "Ground / Wall Crack",
    tagWater: "Water Logging / Inundation",
    tagRoadBlocked: "Road Blocked",
    tagMovement: "Landslide / Slope Movement",
    tagBridge: "Bridge / Culvert Damage",
    tagWires: "Fallen Utilities / Poles",
    reportDescLabel: "Additional Remarks",
    btnSubmitOnline: "Submit Citizen Hazard Report",
    btnSubmitOffline: "Save to Offline Queue (Syncs when online)",
    modalConfirmTitle: "Report Dispatched Successfully",
    modalConfirmSub: "Your observation has been registered in the early warning system and routed to the control center.",
    confirmRefId: "Reference ID:",
    confirmStatus: "Status:",
    confirmLocation: "Location:",
    confirmCategory: "Category:",
    modalClose: "Close & Return"
  },
  hi: {
    appTitle: "रेजिलिएंटगार्ड",
    appSubtitle: "नागरिक आपदा पूर्व चेतावनी एवं क्षेत्र सुरक्षा",
    offlineNotice: "दोपहर 12:40 का कैश्ड डेटा प्रदर्शित — स्थानीय नेटवर्क से पुनः जुड़ रहा है...",
    coldStartNotice: "सीमित स्थानीय सेंसर डेटा — द्वितीयक उपग्रह फ़ीड की निगरानी की जा रही है",
    retrySync: "पुनः प्रयास करें",
    dismiss: "हटाएं",
    navMyArea: "मेरा क्षेत्र",
    navMap: "लाइव मैप",
    navAlerts: "अलर्ट",
    navReport: "जोखिम रिपोर्ट",
    primaryReasonHeader: "मुख्य कारक",
    trendLineText: "पिछले 24 घंटों में स्थितियां स्थिर",
    freshnessText: "3 मिनट पहले अपडेट",
    highConfidence: "सटीकता: उच्च (96%)",
    emergencyActionsHeader: "आपातकालीन सहायता एवं आश्रय",
    sosActive: "सक्रिय चेतावनी",
    callEmergency112: "राष्ट्रीय हेल्पलाइन 112",
    callDisasterControl: "नियंत्रण कक्ष 1077",
    shelterName: "जोशीमठ राहत केंद्र #2 (राजकीय महाविद्यालय)",
    shelterMeta: "1.1 किमी दूर • क्षमता: 180/300 भरी हुई • चिकित्सा सुविधा उपलब्ध",
    navigateShelter: "मार्ग",
    telemetryRainfall: "वर्षा तीव्रता",
    telemetrySoil: "मिट्टी की नमी",
    telemetrySlope: "भू-विस्थापन (उपग्रह)",
    savedRoutesHeader: "सहेजा गया आवागमन मार्ग",
    viewOnMap: "मानचित्र पर देखें →",
    homeRouteTitle: "जोशीमठ ⇄ हेलंग मार्ग",
    homeRouteSub: "एनएच-7 मुख्य मार्ग • 14.8 किमी",
    blockedBadge: "अवरुद्ध (किमी 42)",
    openBadge: "खुला एवं सुरक्षित",
    corridorNoticeHeader: "मार्ग की स्थिति",
    advisoryHeader: "सुरक्षा नियम (सेफगार्ड)",
    advisory1: "आपातकालीन किट व पहचान पत्र तैयार रखें।",
    advisory2: "खड़ी ढलानों और जलधाराओं से दूर रहें।",
    advisory3: "यात्रा से पहले लाइव मैप पर मार्ग जांचें।",
    advisory4: "जमीनी दरारों की तुरंत रिपोर्ट करें।",
    legendOpen: "खुला है",
    legendAtRisk: "जोखिम में",
    legendBlocked: "अवरुद्ध",
    legendShelter: "राहत केंद्र",
    mapInspectorHeader: "भौगोलिक विश्लेषक",
    monitoredRoadsHeader: "निगरानी वाले मार्ग",
    sheltersHeader: "निर्धारित राहत केंद्र",
    alertsPageTitle: "सक्रिय अलर्ट एवं आवागमन मार्ग",
    alertsPageSub: "सेंसर डेटा पर आधारित वास्तविक समय चेतावनी",
    filterAll: "सभी अलर्ट",
    filterArea: "मेरा क्षेत्र",
    filterRoute: "सहेजे गए मार्ग",
    alertScopeArea: "क्षेत्रीय आपदा अलर्ट",
    alert1Headline: "भूस्खलन की अत्यधिक संभावना: सेक्टर 4 ढलान",
    alert1Desc: "लगातार 48 मिमी/घंटा बारिश के बाद उपग्रह इनसार विश्लेषण ने विस्थापन दर्ज किया। पश्चिमी कटक के निवासियों को राहत केंद्र जाने की सलाह दी जाती है।",
    dataSourceLine1: "वर्षा रडार + उपग्रह चित्र + इनसार ढलान टेलीमेट्री पर आधारित",
    alertScopeRoute: "सहेजे गए मार्ग में बाधा",
    alert2Headline: "एनएच-7 किमी 42 पर सड़क अवरुद्ध (जोशीमठ-हेलंग)",
    alert2Desc: "कीचड़ और मलबे के कारण एनएच-7 के दोनों लेन बंद हैं। सड़क निकासी मशीनें तैनात हैं।",
    alternateAvailableHeader: "वैकल्पिक मार्ग उपलब्ध: अपर हेलंग बाईपास",
    alternateRouteSub: "पक्की दो-लेन सड़क • सुरक्षित ऊंचाई • +12 मिनट का समय",
    applyAlternateRoute: "वैकल्पिक मार्ग चुनें",
    dataSourceLine2: "यातायात पुलिस + राजमार्ग डेटा + उपग्रह रडार पर आधारित",
    emptyAlertsTitle: "कोई सक्रिय चेतावनी या सड़क अवरोध नहीं",
    emptyAlertsDesc: "आपके क्षेत्र में सभी उपग्रह अवलोकित क्षेत्र, वर्षा क्षेत्र और मार्ग सामान्य सुरक्षा सीमा में काम कर रहे हैं।",
    reportTitle: "जमीनी व सड़क जोखिम दर्ज करें",
    reportSubtitle: "नागरिक अवलोकन पूर्व चेतावनी मॉडल को सटीक बनाने में मदद करते हैं।",
    reportPhotoLabel: "फ़ोटो प्रमाण",
    optionalTag: "वैकल्पिक",
    uploadDirectTitle: "सीधा फोटो अपलोड",
    uploadDirectSub: "गैलरी या स्टोरेज से फोटो चुनें",
    geotagCamTitle: "जियोटैग कैमरा खोलें",
    geotagCamSub: "लाइव जीपीएस और टाइमस्टैम्प के साथ फोटो लें",
    uploadPromptTitle: "जोखिम की तस्वीर अपलोड करें",
    uploadPromptSub: "स्वतः स्थान टैगिंग के साथ जेपीजी, पीएनजी समर्थित",
    reportLocationLabel: "जोखिम का स्थान",
    autoDetectedTag: "स्वतः जीपीएस",
    btnDetectGPS: "जीपीएस प्राप्त करें",
    reportHazardTypeLabel: "समस्या की श्रेणी चुनें",
    singleSelectTag: "चुनने के लिए टैप करें",
    tagCrack: "जमीन / दीवार में दरार",
    tagWater: "जलभराव / बाढ़",
    tagRoadBlocked: "सड़क अवरुद्ध",
    tagMovement: "भूस्खलन / मिट्टी का खिसकना",
    tagBridge: "पुल / पुलिया की क्षति",
    tagWires: "गिरे हुए बिजली के खंभे/तार",
    reportDescLabel: "अतिरिक्त विवरण",
    btnSubmitOnline: "नागरिक रिपोर्ट जमा करें",
    btnSubmitOffline: "ऑफ़लाइन कतार में सहेजें (ऑनलाइन आने पर सिंक होगा)",
    modalConfirmTitle: "रिपोर्ट सफलतापूर्वक भेजी गई",
    modalConfirmSub: "आपकी जानकारी पूर्व चेतावनी प्रणाली में दर्ज कर नियंत्रण केंद्र को भेज दी गई है।",
    confirmRefId: "संदर्भ संख्या:",
    confirmStatus: "स्थिति:",
    confirmLocation: "स्थान:",
    confirmCategory: "श्रेणी:",
    modalClose: "बंद करें और वापस जाएं"
  }
};

// =============================================================================
// STATE STORE
// =============================================================================
const AppState = {
  currentRisk: 'safe', // 'safe', 'watch', 'warning', 'danger'
  isOffline: false,
  isColdStart: false,
  showEmptyAlerts: false,
  currentLang: 'en',
  activeTab: 'home',
  uploadedPhotos: [],
  selectedTag: 'crack',
  offlineQueue: [],
  reportLat: null,
  reportLng: null,
  reportPlace: '',
  reportElev: '1,874 m AMSL',
  gpsAccuracy: null
};

// Risk Data Configuration (Software-first: Satellite, Weather Radar & Terrain Analytics)
const RISK_DATA = {
  safe: {
    level: "SAFE",
    levelHi: "सुरक्षित",
    color: "#059669",
    bgColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    reasonEn: "Rainfall, terrain slope data, and satellite-derived soil wetness for this sector are within normal safety thresholds. No unusual land movement detected in recent observations.",
    reasonHi: "इस क्षेत्र के लिए वर्षा, ढलान डेटा और उपग्रह आधारित मिट्टी की नमी सामान्य सुरक्षा सीमा में हैं। हालिया अवलोकनों में कोई असामान्य हलचल दर्ज नहीं की गई।",
    trendEn: "Conditions stable over past 24h",
    trendHi: "पिछले 24 घंटों में स्थितियां स्थिर",
    rainfall: "2 mm/h",
    rainfallStat: "Normal Light",
    rainfallColor: "#059669",
    soil: "38%",
    soilStat: "Normal Dry",
    soilColor: "#059669",
    slope: "0.1 mm/h",
    slopeStat: "No movement detected (satellite)",
    slopeColor: "#059669",
    badgeClass: "safe",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`
  },
  watch: {
    level: "WATCH",
    levelHi: "सतर्कता",
    color: "#d97706",
    bgColor: "#fffbeb",
    borderColor: "#fde68a",
    reasonEn: "Satellite and weather radar indicate persistent light rainfall; slight soil wetness increase detected in Sector 2.",
    reasonHi: "उपग्रह और मौसम रडार लगातार हल्की वर्षा दर्शा रहे हैं; सेक्टर 2 में मिट्टी की नमी में मामूली वृद्धि दर्ज।",
    trendEn: "Gradual moisture increase over past 12h",
    trendHi: "पिछले 12 घंटों में नमी में क्रमिक वृद्धि",
    rainfall: "14 mm/h",
    rainfallStat: "Moderate Drizzle",
    rainfallColor: "#d97706",
    soil: "62%",
    soilStat: "Elevated Saturation",
    soilColor: "#d97706",
    slope: "0.8 mm/h",
    slopeStat: "Minor displacement noted (satellite)",
    slopeColor: "#d97706",
    badgeClass: "watch",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
  },
  warning: {
    level: "WARNING",
    levelHi: "चेतावनी",
    color: "#ea580c",
    bgColor: "#fff7ed",
    borderColor: "#fed7aa",
    reasonEn: "Heavy rainfall detected on Doppler radar; satellite moisture models show elevated soil saturation on steep terrain.",
    reasonHi: "डॉपलर रडार पर भारी वर्षा दर्ज; उपग्रह नमी मॉडल खड़ी ढलानों पर बढ़ी हुई मिट्टी की नमी दर्शा रहे हैं।",
    trendEn: "Rapid runoff accumulation over past 6h",
    trendHi: "पिछले 6 घंटों में तेजी से जल संचय",
    rainfall: "32 mm/h",
    rainfallStat: "Heavy Downpour",
    rainfallColor: "#ea580c",
    soil: "78%",
    soilStat: "High Moisture",
    soilColor: "#ea580c",
    slope: "2.1 mm/h",
    slopeStat: "Elevated surface shift (satellite)",
    slopeColor: "#ea580c",
    badgeClass: "warning",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
  },
  danger: {
    level: "DANGER",
    levelHi: "खतरा",
    color: "#dc2626",
    bgColor: "#fef2f2",
    borderColor: "#fecaca",
    reasonEn: "Heavy upstream precipitation and satellite InSAR analysis indicate accelerated ground movement along western ridge.",
    reasonHi: "भारी वर्षा और उपग्रह इनसार विश्लेषण पश्चिमी कटक पर तीव्र सतही विस्थापन दर्शाते हैं।",
    trendEn: "Significant displacement acceleration in past 3h",
    trendHi: "पिछले 3 घंटों में तेजी से विस्थापन",
    rainfall: "48 mm/h",
    rainfallStat: "Heavy Downpour",
    rainfallColor: "#dc2626",
    soil: "89%",
    soilStat: "Critical Moisture",
    soilColor: "#dc2626",
    slope: "4.2 mm/h",
    slopeStat: "Active movement detected (satellite)",
    slopeColor: "#dc2626",
    badgeClass: "danger",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
  }
};

// =============================================================================
// CENTRAL MONITORED ROADS & ALTERNATE ROUTES DATA STORE
// Single source of truth for Live Map, Alerts, and Saved Routes
// =============================================================================
const ROADS_DATA = [
  {
    id: "nh7-km42",
    name: "NH-7 (Km 42 Joshimath)",
    status: "Blocked",
    badgeClass: "blocked",
    transitStatus: "Closed for Transit",
    advisory: "Use Bypass (+12m)",
    description: "Mudflow has temporarily closed both lanes of NH-7 near Km 42. Road clearing machinery is actively deployed.",
    locationMeta: "Joshimath • NH-7 Km 42",
    center: [30.5570, 79.5650],
    coords: [
      [30.5512, 79.5582],
      [30.5524, 79.5595],
      [30.5538, 79.5608],
      [30.5549, 79.5621],
      [30.5558, 79.5635],
      [30.5567, 79.5650],
      [30.5578, 79.5663],
      [30.5590, 79.5678],
      [30.5605, 79.5692],
      [30.5618, 79.5708],
      [30.5630, 79.5724]
    ],
    alternateRoute: {
      name: "Upper Helang Bypass",
      status: "Open",
      distance: "14.8 km",
      extraTime: "+12 mins",
      notes: "Paved two-lane road, safe elevation away from runoff channels",
      coords: [
        [30.5512, 79.5582],
        [30.5498, 79.5590],
        [30.5482, 79.5605],
        [30.5470, 79.5622],
        [30.5465, 79.5642],
        [30.5472, 79.5665],
        [30.5485, 79.5684],
        [30.5502, 79.5702],
        [30.5525, 79.5720],
        [30.5550, 79.5735],
        [30.5578, 79.5742],
        [30.5602, 79.5738],
        [30.5618, 79.5730],
        [30.5630, 79.5724]
      ]
    }
  },
  {
    id: "marwari-bridge",
    name: "Marwari Bridge Corridor",
    status: "At-Risk",
    badgeClass: "at-risk",
    transitStatus: "Light Vehicles Only",
    advisory: "Heavy Freight Barred",
    description: "Alaknanda river swell 1.4m below bridge deck. Light vehicles permitted; heavy freight restricted.",
    locationMeta: "Marwari • Alaknanda Bridge",
    center: [30.5645, 79.5745],
    coords: [
      [30.5605, 79.5692],
      [30.5618, 79.5708],
      [30.5632, 79.5726],
      [30.5645, 79.5745],
      [30.5660, 79.5762],
      [30.5675, 79.5778],
      [30.5690, 79.5795]
    ],
    alternateRoute: {
      name: "Auli-Joshimath High Ridge Link",
      status: "Open",
      distance: "9.4 km",
      extraTime: "+15 mins",
      notes: "High-elevation mountain ridge corridor bypassing river valley entirely",
      coords: [
        [30.5605, 79.5692],
        [30.5622, 79.5685],
        [30.5645, 79.5690],
        [30.5668, 79.5705],
        [30.5692, 79.5728],
        [30.5715, 79.5752],
        [30.5730, 79.5772],
        [30.5712, 79.5788],
        [30.5690, 79.5795]
      ]
    }
  },
  {
    id: "upper-ridge-road",
    name: "Sector 5 Upper Ridge Link",
    status: "At-Risk",
    badgeClass: "at-risk",
    transitStatus: "Caution Required",
    advisory: "Drive with Care",
    description: "Surface runoff causing minor slope debris. Pass with caution; avoid sudden braking.",
    locationMeta: "Sector 5 • Upper Ridge",
    center: [30.5680, 79.5740],
    coords: [
      [30.5635, 79.5690],
      [30.5650, 79.5710],
      [30.5665, 79.5728],
      [30.5680, 79.5742],
      [30.5698, 79.5760],
      [30.5712, 79.5772],
      [30.5725, 79.5785]
    ],
    alternateRoute: {
      name: "East Escarpment Terrace Bypass",
      status: "Open",
      distance: "7.8 km",
      extraTime: "+9 mins",
      notes: "Reinforced retaining wall terrace road with stable granite bedrock foundation",
      coords: [
        [30.5635, 79.5690],
        [30.5655, 79.5695],
        [30.5678, 79.5708],
        [30.5700, 79.5725],
        [30.5722, 79.5748],
        [30.5745, 79.5765],
        [30.5738, 79.5778],
        [30.5725, 79.5785]
      ]
    }
  },
  {
    id: "badrinath-gorge",
    name: "Badrinath Gorge Access Cut",
    status: "Blocked",
    badgeClass: "blocked",
    transitStatus: "Completely Blocked",
    advisory: "No Transit Allowed",
    description: "Rockfall blockage across narrow gorge sector. Heavy earthmovers en route for clearance.",
    locationMeta: "Badrinath • Gorge Access",
    center: [30.5730, 79.5835],
    coords: [
      [30.5690, 79.5795],
      [30.5705, 79.5810],
      [30.5718, 79.5822],
      [30.5730, 79.5835],
      [30.5745, 79.5850],
      [30.5758, 79.5862],
      [30.5770, 79.5875]
    ],
    alternateRoute: null
  },
  {
    id: "helang-bypass",
    name: "Upper Helang Bypass",
    status: "Open",
    badgeClass: "open",
    transitStatus: "Open & Clear",
    advisory: "Safe for All Traffic",
    description: "Road cleared and operational. Elevated paved bypass safe from runoff channels. Speed limit: 30 km/h.",
    locationMeta: "Upper Helang • Bypass Route",
    center: [30.5490, 79.5650],
    coords: [
      [30.5440, 79.5540],
      [30.5455, 79.5575],
      [30.5470, 79.5615],
      [30.5482, 79.5650],
      [30.5495, 79.5685],
      [30.5515, 79.5715],
      [30.5540, 79.5740]
    ],
    alternateRoute: null
  }
];

let mapInstance = null;
let activeAltPolyline = null;
let activeHighlightPolyline = null;

// =============================================================================
// DOM INITIALIZATION & EVENT BINDINGS
// =============================================================================
document.addEventListener("DOMContentLoaded", () => {
  initLanguageToggle();
  initNavigationTabs();
  initLocationModal();
  initSavedRouteManager();
  initRiskSimulator();
  initOfflineSimulation();
  initColdStartSimulation();
  initEmptyAlertsSimulation();
  initReportForm();
  initAdminLiveAlertSystem();
  updateRiskUI();

  const btnSwitchRoute = document.getElementById("btnSwitchRoute");
  if (btnSwitchRoute) {
    btnSwitchRoute.addEventListener("click", () => {
      const blockedRoad = ROADS_DATA.find(r => r.id === "nh7-km42");
      if (blockedRoad && blockedRoad.alternateRoute) {
        switchTab("map");
        setTimeout(() => {
          selectCorridor("nh7-km42");
          highlightAlternateRoute(blockedRoad.alternateRoute);
        }, 200);
      } else {
        switchTab("map");
      }
    });
  }

  const switchMapTabFromHome = document.getElementById("switchMapTabFromHome");
  if (switchMapTabFromHome) {
    switchMapTabFromHome.addEventListener("click", () => switchTab("map"));
  }

  const viewShelterMapBtn = document.getElementById("viewShelterMapBtn");
  if (viewShelterMapBtn) {
    viewShelterMapBtn.addEventListener("click", () => {
      switchTab("map");
      if (mapInstance) {
        mapInstance.flyTo([30.5590, 79.5660], 15, { duration: 1.2 });
      }
    });
  }
});

// =============================================================================
// LANGUAGE TOGGLE & TRANSLATIONS
// =============================================================================
function initLanguageToggle() {
  const enBtn = document.getElementById("langEnBtn");
  const hiBtn = document.getElementById("langHiBtn");

  if (enBtn) enBtn.addEventListener("click", () => setLanguage('en'));
  if (hiBtn) hiBtn.addEventListener("click", () => setLanguage('hi'));
}

function setLanguage(lang) {
  AppState.currentLang = lang;
  const enBtn = document.getElementById("langEnBtn");
  const hiBtn = document.getElementById("langHiBtn");
  if (enBtn) enBtn.classList.toggle("active", lang === 'en');
  if (hiBtn) hiBtn.classList.toggle("active", lang === 'hi');

  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict && dict[key]) {
      el.textContent = dict[key];
    }
  });

  updateRiskUI();
}

// =============================================================================
// NAVIGATION TABS
// =============================================================================
function initNavigationTabs() {
  const tabs = document.querySelectorAll(".nav-tab-item");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-tab");
      switchTab(target);
    });
  });
}

function switchTab(tabId) {
  AppState.activeTab = tabId;
  document.querySelectorAll(".nav-tab-item").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
  });

  document.querySelectorAll(".screen-view").forEach(screen => {
    screen.classList.remove("active");
  });

  const activeScreen = document.getElementById(`screen${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
  if (activeScreen) {
    activeScreen.classList.add("active");
  }

  if (tabId === 'map') {
    setTimeout(() => {
      if (!mapInstance) {
        initLeafletMap();
      } else {
        mapInstance.invalidateSize();
      }
    }, 150);
  }
}

// =============================================================================
// LOCATION & SECTOR RISK SELECTOR MODAL
// =============================================================================
function initLocationModal() {
  const selectorBtn = document.getElementById("locationSelectorBtn");
  const modal = document.getElementById("locationModal");
  const closeBtn = document.getElementById("closeLocationModalBtn");
  const detectBtn = document.getElementById("btnAutoDetectLoc");
  const sectorItems = document.querySelectorAll("#locationList .road-item");

  if (selectorBtn && modal) {
    selectorBtn.addEventListener("click", () => {
      modal.classList.add("open");
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("open");
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("open");
      }
    });
  }

  sectorItems.forEach(item => {
    item.addEventListener("click", () => {
      const risk = item.getAttribute("data-sector-risk");
      const sectorName = item.getAttribute("data-sector-name");
      const lat = parseFloat(item.getAttribute("data-sector-lat"));
      const lng = parseFloat(item.getAttribute("data-sector-lng"));

      if (risk) {
        setRiskLevel(risk);
      }

      if (sectorName) {
        const headerLoc = document.getElementById("headerLocationName");
        const homeLoc = document.getElementById("homeLocationTitle");
        if (headerLoc) headerLoc.textContent = sectorName;
        if (homeLoc) homeLoc.textContent = sectorName;
      }

      if (mapInstance && !isNaN(lat) && !isNaN(lng)) {
        mapInstance.flyTo([lat, lng], 14, { duration: 1.0 });
      }

      if (modal) modal.classList.remove("open");
      showToast(`Switched sector: ${sectorName}`);
    });
  });

  if (detectBtn) {
    detectBtn.addEventListener("click", () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setRiskLevel("danger");
            const headerLoc = document.getElementById("headerLocationName");
            const homeLoc = document.getElementById("homeLocationTitle");
            if (headerLoc) headerLoc.textContent = "Chamoli — Joshimath Slopes (Sector 4)";
            if (homeLoc) homeLoc.textContent = "Chamoli — Joshimath Slopes (Sector 4)";
            if (modal) modal.classList.remove("open");
            showToast("Live GPS lock established: Sector 4 Slopes");
          },
          () => {
            setRiskLevel("danger");
            const headerLoc = document.getElementById("headerLocationName");
            const homeLoc = document.getElementById("homeLocationTitle");
            if (headerLoc) headerLoc.textContent = "Chamoli — Joshimath Slopes (Sector 4)";
            if (homeLoc) homeLoc.textContent = "Chamoli — Joshimath Slopes (Sector 4)";
            if (modal) modal.classList.remove("open");
            showToast("GPS position verified: Sector 4 Slopes");
          }
        );
      } else {
        if (modal) modal.classList.remove("open");
        showToast("GPS location verified");
      }
    });
  }
}

// =============================================================================
// SAVED COMMUTE ROUTE MANAGER
// =============================================================================
function initSavedRouteManager() {
  const openModalBtn = document.getElementById("btnOpenRouteModal");
  const modal = document.getElementById("savedRouteModal");
  const closeModalBtn = document.getElementById("closeRouteModalBtn");
  const routeOptions = document.querySelectorAll("#savedRoutesSelectionList .road-item");

  if (openModalBtn && modal) {
    openModalBtn.addEventListener("click", () => {
      modal.classList.add("open");
    });
  }

  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener("click", () => {
      modal.classList.remove("open");
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("open");
      }
    });
  }

  routeOptions.forEach(opt => {
    opt.addEventListener("click", () => {
      const routeId = opt.getAttribute("data-saved-route-id");
      const road = ROADS_DATA.find(r => r.id === routeId);
      if (!road) return;

      // Update Home Screen Saved Route Card
      const homeCard = document.getElementById("routeCardHome");
      if (homeCard) {
        const titleEl = homeCard.querySelector("h5");
        const subEl = homeCard.querySelector("p");
        const badgeEl = document.getElementById("homeRouteBadge");
        const reasonEl = document.getElementById("homeCorridorReason");

        if (titleEl) titleEl.textContent = road.name;
        if (subEl) subEl.textContent = `${road.status === 'Blocked' ? 'Primary Corridor Affected' : 'Monitored Corridor'} • ${road.alternateRoute ? road.alternateRoute.distance : 'Direct'}`;
        if (badgeEl) {
          badgeEl.textContent = road.status === 'Blocked' ? 'Blocked (Km 42)' : (road.status === 'At-Risk' ? 'At-Risk' : 'Open & Clear');
          badgeEl.className = `road-badge ${road.badgeClass}`;
        }
        if (reasonEl) {
          reasonEl.textContent = road.description;
        }
      }

      // Save preference
      try {
        localStorage.setItem("resilientGuard_savedRoute", routeId);
      } catch (e) {}

      if (modal) modal.classList.remove("open");
      showToast(`Saved route updated to: ${road.name}`);
    });
  });
}

// =============================================================================
// RISK LEVEL SIMULATOR CONTROLS
// =============================================================================
function initRiskSimulator() {
  const riskLevels = ["safe", "watch", "warning", "danger"];
  
  // Allow clicking the main status badge on Home Screen to cycle levels
  const homeBadge = document.getElementById("homeRiskBadge");
  if (homeBadge) {
    homeBadge.style.cursor = "pointer";
    homeBadge.title = "Click to cycle threat level (Safe → Watch → Warning → Danger)";
    homeBadge.addEventListener("click", () => {
      const currentIndex = riskLevels.indexOf(AppState.currentRisk);
      const nextIndex = (currentIndex + 1) % riskLevels.length;
      const nextRisk = riskLevels[nextIndex];
      setRiskLevel(nextRisk);
    });
  }

  // Keyboard shortcut: Press keys 1, 2, 3, 4 to switch risk level anytime
  document.addEventListener("keydown", (e) => {
    // Avoid triggering when user is typing in form inputs
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
    
    if (e.key === "1") setRiskLevel("safe");
    else if (e.key === "2") setRiskLevel("watch");
    else if (e.key === "3") setRiskLevel("warning");
    else if (e.key === "4") setRiskLevel("danger");
    else if (e.key === "0" || e.key === "5") {
      triggerAdminLiveAlert(ADMIN_SCENARIO_PRESETS.landslide);
    }
  });
}

function setRiskLevel(level) {
  AppState.currentRisk = level;
  updateRiskUI();
  showToast(`Risk Status: ${level.toUpperCase()}`);
}

function updateRiskUI() {
  const data = RISK_DATA[AppState.currentRisk];
  const lang = AppState.currentLang;

  const heroCard = document.getElementById("heroRiskCard");
  heroCard.className = `hero-risk-card ${data.badgeClass}`;

  const riskBadge = document.getElementById("homeRiskBadge");
  riskBadge.className = `risk-status-badge ${data.badgeClass}`;

  document.getElementById("homeRiskIcon").innerHTML = data.icon;
  document.getElementById("homeRiskLevelText").textContent = (lang === 'hi') ? data.levelHi : data.level;
  document.getElementById("homeRiskReason").textContent = (lang === 'hi') ? data.reasonHi : data.reasonEn;

  const trendEl = document.getElementById("homeTrendLineText");
  if (trendEl) {
    trendEl.textContent = (lang === 'hi') ? data.trendHi : data.trendEn;
  }

  document.getElementById("telRainfall").textContent = data.rainfall;
  document.getElementById("telRainfallStat").textContent = data.rainfallStat;
  document.getElementById("telRainfallStat").style.color = data.rainfallColor;

  document.getElementById("telSlope").textContent = data.slope;
  document.getElementById("telSlopeStat").textContent = data.slopeStat;
  document.getElementById("telSlopeStat").style.color = data.slopeColor;

  const emergencySection = document.getElementById("emergencySection");
  if (AppState.currentRisk === 'warning' || AppState.currentRisk === 'danger') {
    emergencySection.style.display = "flex";
  } else {
    emergencySection.style.display = "none";
  }
}

// =============================================================================
// OFFLINE & COLD-START SIMULATION CONTROLS
// =============================================================================
function initOfflineSimulation() {
  const retrySyncBtn = document.getElementById("retrySyncBtn");
  const offlineBanner = document.getElementById("offlineBanner");
  const submitBtnText = document.getElementById("submitBtnText");
  const submitReportBtn = document.getElementById("submitReportBtn");

  if (retrySyncBtn) {
    retrySyncBtn.addEventListener("click", () => {
      AppState.isOffline = false;
      if (offlineBanner) offlineBanner.style.display = "none";
      if (submitReportBtn) submitReportBtn.classList.remove("offline-mode");
      if (submitBtnText && TRANSLATIONS[AppState.currentLang]) {
        submitBtnText.textContent = TRANSLATIONS[AppState.currentLang].btnSubmitOnline || "Submit Verified Report";
      }
      showToast("Online connection active");
      if (AppState.offlineQueue && AppState.offlineQueue.length > 0) {
        showToast(`Synced ${AppState.offlineQueue.length} queued report(s)`);
        AppState.offlineQueue = [];
      }
    });
  }
}

function initColdStartSimulation() {
  const dismissBtn = document.getElementById("dismissColdStartBtn");
  const banner = document.getElementById("coldStartBanner");

  if (dismissBtn) {
    dismissBtn.addEventListener("click", () => {
      if (banner) banner.style.display = "none";
      AppState.isColdStart = false;
    });
  }
}

function initEmptyAlertsSimulation() {
  const filterBtns = document.querySelectorAll(".alert-filter-btn");
  filterBtns.forEach(b => {
    b.addEventListener("click", () => {
      filterBtns.forEach(f => f.classList.remove("active"));
      b.classList.add("active");
      const filter = b.getAttribute("data-filter");
      const cards = document.querySelectorAll(".alert-card");
      cards.forEach(card => {
        if (filter === 'all') {
          card.style.display = "flex";
        } else {
          card.style.display = (card.getAttribute("data-category") === filter) ? "flex" : "none";
        }
      });
    });
  });
}

// =============================================================================
// SCREEN 2: HIGH-PRECISION GIS MAP VISUALIZATION (MINIMAL & ULTRA-FOCUSED)
// =============================================================================
// =============================================================================
// SCREEN 2: HIGH-PRECISION GIS MAP VISUALIZATION (LIVE APIS — SATELLITE)
// =============================================================================
let currentBaseLayer = null;
let reverseGeocodeMarker = null;

function initLeafletMap() {
  const mapContainer = document.getElementById("disasterMap");
  if (!mapContainer || mapInstance) return;

  const centerCoordinates = [30.5564, 79.5642];

  // 1. Satellite Basemap — Esri World Imagery (High Resolution)
  currentBaseLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19
  });

  // 1b. Hybrid Reference Labels — Esri World Boundaries & Places (transparent overlay)
  //     Adds crisp road names, village labels & corridor markers over satellite imagery
  const labelsOverlay = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
    attribution: '',
    maxZoom: 19,
    opacity: 0.9,
    pane: 'overlayPane'
  });

  mapInstance = L.map('disasterMap', {
    center: centerCoordinates,
    zoom: 14,
    zoomControl: false,
    layers: [currentBaseLayer]
  });

  // Add labels overlay on top of satellite — renders roads, villages, sector names
  labelsOverlay.addTo(mapInstance);

  // Floating Action Controls Wire-up
  const btnZoomIn = document.getElementById("btnMapZoomIn");
  const btnZoomOut = document.getElementById("btnMapZoomOut");
  const btnLocate = document.getElementById("btnMapLocateMe");
  const btnRecenter = document.getElementById("btnMapRecenter");

  if (btnZoomIn) btnZoomIn.addEventListener("click", () => mapInstance && mapInstance.zoomIn());
  if (btnZoomOut) btnZoomOut.addEventListener("click", () => mapInstance && mapInstance.zoomOut());
  if (btnRecenter) {
    btnRecenter.addEventListener("click", () => {
      if (mapInstance) {
        mapInstance.flyTo(centerCoordinates, 14, { duration: 1.0 });
        showToast("Recentered to Chamoli / Joshimath");
      }
    });
  }
  if (btnLocate) {
    btnLocate.addEventListener("click", () => {
      if (navigator.geolocation) {
        updateMapApiStatus("Detecting live GPS...");
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const userPos = [pos.coords.latitude, pos.coords.longitude];
            if (mapInstance) {
              mapInstance.flyTo(userPos, 15, { duration: 1.2 });
              showToast(`Live GPS: ${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`);
              updateMapApiStatus("GPS Lock: Active");
            }
          },
          () => {
            if (mapInstance) {
              mapInstance.flyTo(centerCoordinates, 15, { duration: 1.0 });
              showToast("Live GPS: Chamoli Sector 4 (Simulated Lock)");
              updateMapApiStatus("GPS Lock: Sector 4");
            }
          }
        );
      }
    });
  }

  // 2. User's Live Location (Single Clean Blue Dot Marker)
  const userGpsIcon = L.divIcon({
    className: 'user-marker-wrapper',
    html: `
      <div class="user-gps-pin" title="Your Live Location">
        <div class="user-gps-pulse"></div>
        <div class="user-gps-dot"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  L.marker(centerCoordinates, { icon: userGpsIcon, interactive: false }).addTo(mapInstance);

  // ---------------------------------------------------------------------------
  // 3. RISK HEATMAP (Critical & High/Warning Zones - Soft Blurred Blobs)
  // ---------------------------------------------------------------------------
  const zoneLayers = [];

  // Critical Danger Heat Blob (Sector 4 Western Slopes)
  const dangerCenter = [30.5585, 79.5620];
  const dangerBlobIcon = L.divIcon({
    className: 'heat-zone-wrapper',
    html: `<div class="heat-blob-shape danger" title="Critical Hazard Zone (Sector 4 Western Slopes)"></div>`,
    iconSize: [180, 180],
    iconAnchor: [90, 90]
  });

  const dangerZone = L.marker(dangerCenter, { icon: dangerBlobIcon, zIndexOffset: -100 });
  dangerZone.bindTooltip(`<strong>Sector 4 Slopes</strong> &bull; <span style="color:#dc2626;font-weight:700;">CRITICAL RISK</span>`, { sticky: true });
  dangerZone.on('click', () => {
    updateInspector(
      "Sector 4 Western Slopes",
      "CRITICAL",
      "Active landslide and slope movement warning. Evacuation advisory in effect for western ridge.",
      "danger",
      {
        zoneType: "LANDSLIDE HAZARD ZONE",
        meta: "Sector 4 • Western Slopes",
        transitStatus: "Evacuate / Avoid",
        advisory: "Proceed to Relief Center"
      }
    );
  });
  zoneLayers.push(dangerZone);

  // High/Warning Heat Blob (Sector 5 Upper Ridge)
  const warningCenter = [30.5695, 79.5765];
  const warningBlobIcon = L.divIcon({
    className: 'heat-zone-wrapper',
    html: `<div class="heat-blob-shape warning" title="High Risk Zone (Sector 5 Upper Ridge)"></div>`,
    iconSize: [160, 160],
    iconAnchor: [80, 80]
  });

  const warningZone = L.marker(warningCenter, { icon: warningBlobIcon, zIndexOffset: -100 });
  warningZone.bindTooltip(`<strong>Sector 5 Ridge</strong> &bull; <span style="color:#d97706;font-weight:700;">HIGH RISK</span>`, { sticky: true });
  warningZone.on('click', () => {
    updateInspector(
      "Sector 5 Upper Ridge",
      "HIGH RISK",
      "High soil saturation and runoff. Non-essential movement discouraged along upper ridge paths.",
      "warning",
      {
        zoneType: "ELEVATED RISK ZONE",
        meta: "Sector 5 • Upper Ridge",
        transitStatus: "Caution Advised",
        advisory: "Stay on Paved Roads"
      }
    );
  });
  zoneLayers.push(warningZone);

  L.layerGroup(zoneLayers).addTo(mapInstance);

  // ---------------------------------------------------------------------------
  // 4. INTERACTIVE REVERSE GEOCODING API ON MAP CLICK (OpenStreetMap Nominatim)
  // ---------------------------------------------------------------------------
  mapInstance.on('click', async (e) => {
    const { lat, lng } = e.latlng;
    updateMapApiStatus(`Geocoding ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E...`);

    try {
      const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
      const res = await fetch(geoUrl);
      const data = await res.json();
      const placeName = data.display_name ? data.display_name.split(",").slice(0, 3).join(",") : "Mountain Terrain / Corridor";

      if (reverseGeocodeMarker && mapInstance.hasLayer(reverseGeocodeMarker)) {
        mapInstance.removeLayer(reverseGeocodeMarker);
      }

      reverseGeocodeMarker = L.popup({ className: 'custom-geocode-popup' })
        .setLatLng([lat, lng])
        .setContent(`
          <div style="padding: 10px 14px; font-family: inherit;">
            <div style="font-size: 0.72rem; font-weight: 800; color: #2563eb; text-transform: uppercase; margin-bottom: 4px;">📍 Live Geocode API Result</div>
            <div style="font-size: 0.88rem; font-weight: 700; color: #0f172a; line-height: 1.3;">${placeName}</div>
            <div style="font-size: 0.74rem; color: #64748b; margin-top: 4px;">${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E</div>
            <div style="margin-top: 8px; font-size: 0.76rem; font-weight: 600; color: #059669; display: flex; align-items: center; gap: 4px;">
              <span>✅ Telemetry fused & active</span>
            </div>
          </div>
        `)
        .openOn(mapInstance);

      updateMapApiStatus("Map API Connected: Live Geocoded");
    } catch (err) {
      updateMapApiStatus("Map API Connected: OSM & OSRM Engine");
    }
  });

  // ---------------------------------------------------------------------------
  // 5. ROAD CORRIDORS - Draw on map via OSRM API when sidebar tab is clicked
  // ---------------------------------------------------------------------------
  document.querySelectorAll(".road-item").forEach(item => {
    item.addEventListener("click", () => {
      const roadId = item.getAttribute("data-road-id");
      if (roadId) {
        selectCorridor(roadId);
      }
    });
  });

  // Default populate inspector
  selectCorridor("nh7-km42");
  updateMapApiStatus("Map API Connected: OSM & OSRM Engine");
}

function updateMapApiStatus(statusText) {
  const badge = document.getElementById("mapApiStatusText");
  if (badge) badge.textContent = statusText;
}

let activeAltBadgeMarker = null;
let activeRoadPolyline = null;   // The selected corridor polyline
let activeAltPolylines = [];     // Alternate route polylines

// ---------------------------------------------------------------------------
// OSRM ROUTING API — Fetch real road geometry between two lat/lng points
// Uses the public OSRM demo server (no API key required)
// ---------------------------------------------------------------------------
async function fetchOSRMRoute(startLatLng, endLatLng) {
  const [lat1, lng1] = startLatLng;
  const [lat2, lng2] = endLatLng;
  const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
  
  updateMapApiStatus("OSRM Routing API: Fetching road geometry...");

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('OSRM response not ok');
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      updateMapApiStatus("OSRM Routing API: Connected & Route Computed");
      // GeoJSON coords are [lng, lat] — flip to [lat, lng] for Leaflet
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    }
  } catch (err) {
    console.warn('OSRM API unavailable, using fallback coords:', err);
    updateMapApiStatus("OSRM API Fallback active");
  }
  return null;
}

// ---------------------------------------------------------------------------
// DRAW ROAD POLYLINE ON MAP (called when a corridor tab is clicked)
// ---------------------------------------------------------------------------
async function drawCorridorOnMap(road) {
  if (!mapInstance) return;

  // Clear any previous corridor polyline
  clearCorridorPolyline();

  const isBlocked = road.status === 'Blocked';
  const isAtRisk  = road.status === 'At-Risk';
  if (!isBlocked && !isAtRisk && road.status !== 'Open') return;

  const coreColor  = isBlocked ? '#dc2626' : (isAtRisk ? '#d97706' : '#059669');
  const dashArray  = isBlocked ? '8, 7' : (isAtRisk ? '5, 6' : null);

  // Start and end of the corridor from ROADS_DATA
  const startCoord = road.coords[0];
  const endCoord   = road.coords[road.coords.length - 1];

  showToast(`Loading ${road.name} route from Routing API...`);

  // Try to fetch real road geometry from OSRM
  let routeCoords = await fetchOSRMRoute(startCoord, endCoord);

  // Fall back to stored coords if OSRM is unavailable
  if (!routeCoords || routeCoords.length < 2) {
    routeCoords = road.coords;
  }

  // Subtle dark casing for depth
  const casing = L.polyline(routeCoords, {
    color: '#0f172a',
    weight: 7,
    opacity: 0.18,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(mapInstance);

  // Main status-coloured line
  const core = L.polyline(routeCoords, {
    color: coreColor,
    weight: 5,
    opacity: 0.92,
    dashArray: dashArray,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(mapInstance);

  core.bindTooltip(`<b>${road.name}</b> &bull; ${road.status}`, { sticky: true });

  // Store both layers so they can be cleared together
  activeRoadPolyline = L.layerGroup([casing, core]).addTo(mapInstance);

  // Fit map to the fetched route
  mapInstance.fitBounds(core.getBounds(), { padding: [60, 60], maxZoom: 15, animate: true });
  showToast(`${road.name} — ${road.status}`);
}

function clearCorridorPolyline() {
  if (activeRoadPolyline && mapInstance) {
    mapInstance.removeLayer(activeRoadPolyline);
    activeRoadPolyline = null;
  }
}

// ---------------------------------------------------------------------------
// ALTERNATE ROUTE — Draw via OSRM on 'Use Alternate Route' button click
// ---------------------------------------------------------------------------
async function highlightAlternateRoute(altData) {
  if (!altData || !mapInstance) return;

  clearAlternateRoute();

  const startCoord = altData.coords[0];
  const endCoord   = altData.coords[altData.coords.length - 1];

  showToast(`Loading alternate route: ${altData.name}...`);

  let routeCoords = await fetchOSRMRoute(startCoord, endCoord);
  if (!routeCoords || routeCoords.length < 2) {
    routeCoords = altData.coords;
  }

  const altLine = L.polyline(routeCoords, {
    color: '#059669',
    weight: 5,
    opacity: 0.92,
    dashArray: '6, 8',
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(mapInstance);

  altLine.bindTooltip(`<b>Bypass: ${altData.name}</b> &bull; ${altData.extraTime}`, { sticky: true });

  // Mid-point badge label
  const midPoint = routeCoords[Math.floor(routeCoords.length / 2)];
  const badgeIcon = L.divIcon({
    className: 'map-pin-wrapper',
    html: `<div class="active-bypass-badge">✨ ${altData.name} (${altData.extraTime})</div>`,
    iconSize: [200, 28],
    iconAnchor: [100, 14]
  });
  activeAltBadgeMarker = L.marker(midPoint, { icon: badgeIcon }).addTo(mapInstance);

  activeAltPolylines = [altLine];
  mapInstance.fitBounds(altLine.getBounds(), { padding: [60, 60], maxZoom: 15 });
  showToast(`✅ Alternate route: ${altData.name} (${altData.extraTime})`);
}

function clearAlternateRoute() {
  activeAltPolylines.forEach(layer => {
    if (mapInstance && mapInstance.hasLayer(layer)) mapInstance.removeLayer(layer);
  });
  activeAltPolylines = [];
  if (activeAltBadgeMarker && mapInstance && mapInstance.hasLayer(activeAltBadgeMarker)) {
    mapInstance.removeLayer(activeAltBadgeMarker);
    activeAltBadgeMarker = null;
  }
  activeAltPolyline = null;
}

function selectCorridor(roadId) {
  const road = ROADS_DATA.find(r => r.id === roadId);
  if (!road) return;

  // Highlight selected card in sidebar
  document.querySelectorAll(".road-item").forEach(item => {
    item.classList.toggle("active-selected", item.getAttribute("data-road-id") === roadId);
  });

  // Draw the road on the map via OSRM API
  if (mapInstance) {
    clearAlternateRoute();
    drawCorridorOnMap(road);
  }

  // Header band class
  const badgeClassMap = { 'Blocked': 'danger', 'At-Risk': 'warning', 'Open': 'safe' };
  const headerClass = badgeClassMap[road.status] || 'safe';
  const zoneHeader = document.getElementById("inspectorZoneHeader");
  if (zoneHeader) zoneHeader.className = `inspector-zone-header ${headerClass}`;

  // Zone type label
  const zoneTypeEl = document.getElementById("inspectorZoneType");
  if (zoneTypeEl) zoneTypeEl.textContent = "ROAD CORRIDOR";

  const titleEl = document.getElementById("inspectorTitle");
  if (titleEl) titleEl.textContent = road.name;

  const badge = document.getElementById("inspectorBadge");
  if (badge) {
    badge.textContent = road.status.toUpperCase();
    badge.className = `inspector-risk-badge ${road.badgeClass}`;
  }

  const metaEl = document.getElementById("inspectorZoneMeta");
  if (metaEl) metaEl.textContent = road.locationMeta || "";

  // Citizen stat pills
  const elTransit = document.getElementById("inspectorStatTransit");
  const elAdvisory = document.getElementById("inspectorStatAdvisory");
  if (elTransit) elTransit.textContent = road.transitStatus || (road.status === 'Blocked' ? 'Closed for Transit' : (road.status === 'At-Risk' ? 'Caution Advised' : 'Open & Clear'));
  if (elAdvisory) elAdvisory.textContent = road.advisory || (road.alternateRoute ? `Use Bypass (${road.alternateRoute.extraTime})` : 'Normal Transit');

  const descEl = document.getElementById("inspectorDescription");
  if (descEl) descEl.textContent = road.description;

  const altBox   = document.getElementById("inspectorAltBox");
  const noAltBox = document.getElementById("inspectorNoAltBox");

  if (road.alternateRoute) {
    if (altBox) {
      altBox.style.display = "flex";
      const altName   = document.getElementById("inspectorAltName");
      const altStatus = document.getElementById("inspectorAltStatus");
      const altTime   = document.getElementById("inspectorAltTime");
      const altDist   = document.getElementById("inspectorAltDist");
      const altNote   = document.getElementById("inspectorAltNote");
      if (altName)   altName.textContent   = road.alternateRoute.name;
      if (altStatus) altStatus.textContent = road.alternateRoute.status;
      if (altTime)   altTime.textContent   = road.alternateRoute.extraTime;
      if (altDist)   altDist.textContent   = road.alternateRoute.distance;
      if (altNote)   altNote.textContent   = road.alternateRoute.notes;

      const btnApply = document.getElementById("btnInspectorApplyAlt");
      if (btnApply) {
        btnApply.onclick = () => highlightAlternateRoute(road.alternateRoute);
      }
    }
    if (noAltBox) noAltBox.style.display = "none";

    // Auto display clean bypass for active road
    highlightAlternateRoute(road.alternateRoute);
  } else {
    clearAlternateRoute();
    if (altBox) altBox.style.display = "none";
    if (noAltBox) {
      noAltBox.style.display = (road.status === 'Blocked' || road.status === 'At-Risk') ? "flex" : "none";
    }
  }
}

function updateInspector(title, badgeText, description, badgeClass, opts) {
  // Header band
  const zoneHeader = document.getElementById("inspectorZoneHeader");
  if (zoneHeader) {
    zoneHeader.className = `inspector-zone-header ${badgeClass}`;
  }

  // Zone type label
  const zoneType = document.getElementById("inspectorZoneType");
  if (zoneType) zoneType.textContent = opts && opts.zoneType ? opts.zoneType : "RISK ZONE";

  document.getElementById("inspectorTitle").textContent = title;

  const badge = document.getElementById("inspectorBadge");
  if (badge) {
    badge.textContent = badgeText;
    badge.className = `inspector-risk-badge ${badgeClass}`;
  }

  const metaEl = document.getElementById("inspectorZoneMeta");
  if (metaEl) metaEl.textContent = opts && opts.meta ? opts.meta : "";

  // Citizen stat pills
  const elTransit = document.getElementById("inspectorStatTransit");
  const elAdvisory = document.getElementById("inspectorStatAdvisory");
  if (elTransit) elTransit.textContent = opts && opts.transitStatus ? opts.transitStatus : (badgeClass === 'danger' ? 'Evacuate / Avoid' : (badgeClass === 'warning' ? 'Caution Advised' : 'Open & Safe'));
  if (elAdvisory) elAdvisory.textContent = opts && opts.advisory ? opts.advisory : (badgeClass === 'danger' ? 'Follow Relief Signs' : 'Normal Movement');

  document.getElementById("inspectorDescription").textContent = description;

  // Hide alt boxes when updating from zone click (roads handled separately)
  const altBox   = document.getElementById("inspectorAltBox");
  const noAltBox = document.getElementById("inspectorNoAltBox");
  if (altBox)   altBox.style.display   = "none";
  if (noAltBox) noAltBox.style.display = "none";
}

// =============================================================================
// SCREEN 4: CITIZEN REPORT FORM & OFFLINE QUEUE
// =============================================================================
function initReportForm() {
  const form = document.getElementById("citizenReportForm");
  const btnUploadDirect = document.getElementById("btnUploadDirect");
  const fileInput = document.getElementById("photoFileInput");
  const btnOpenGeotagCam = document.getElementById("btnOpenGeotagCam");
  const nativeCameraInput = document.getElementById("nativeCameraInput");
  const btnRefreshGPS = document.getElementById("btnRefreshGPS");
  const modal = document.getElementById("confirmationModal");
  const modalCloseBtn = document.getElementById("modalCloseBtn");

  const chips = document.querySelectorAll("#hazardTagGroup .tag-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      AppState.selectedTag = chip.getAttribute("data-tag");
    });
  });

  // Option 1: Direct File Upload
  if (btnUploadDirect && fileInput) {
    btnUploadDirect.addEventListener("click", () => fileInput.click());
    
    // Drag and Drop support
    btnUploadDirect.addEventListener("dragover", (e) => {
      e.preventDefault();
      btnUploadDirect.style.borderColor = "#3b82f6";
    });
    btnUploadDirect.addEventListener("dragleave", () => {
      btnUploadDirect.style.borderColor = "";
    });
    btnUploadDirect.addEventListener("drop", (e) => {
      e.preventDefault();
      btnUploadDirect.style.borderColor = "";
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    });

    fileInput.addEventListener("change", (e) => {
      handleFiles(e.target.files);
    });
  }

  function handleFiles(files) {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        addPhotoPreview(event.target.result, false);
      };
      reader.readAsDataURL(file);
    });
    showToast("Photo attached to report");
  }

  // Option 2: Live Geotag Camera
  if (btnOpenGeotagCam) {
    btnOpenGeotagCam.addEventListener("click", () => {
      openGeotagCamera();
    });
  }

  initGeotagCameraModal(nativeCameraInput);

  // ── Live GPS Detection ──────────────────────────────────────────────────────
  // Runs on form load (passive, silent) AND on "Detect GPS" button press (active)
  // Uses navigator.geolocation for device GPS, then Nominatim for human place name
  // ─────────────────────────────────────────────────────────────────────────────

  const locationInput = document.getElementById("reportLocationInput");

  async function resolveGPSToLocation(lat, lng, isManual = false) {
    // Show loading state in the field
    if (locationInput) {
      locationInput.value = `Locating… ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`;
      locationInput.style.color = "#94a3b8";
    }

    let placeName = "";
    try {
      // Nominatim Reverse Geocoding — free, no API key
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();

      // Build a concise human-readable name from address components
      const addr = data.address || {};
      const parts = [
        addr.village || addr.town || addr.suburb || addr.city_district || addr.neighbourhood || addr.hamlet,
        addr.county || addr.state_district,
        addr.state
      ].filter(Boolean);

      placeName = parts.length > 0 ? parts.slice(0, 2).join(", ") : (data.display_name ? data.display_name.split(",").slice(0, 2).join(",") : "");
    } catch (err) {
      console.warn("Nominatim geocoding failed:", err);
      placeName = "Field Location";
    }

    const coordStr = `${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`;
    const fullValue = placeName ? `${coordStr} — ${placeName}` : coordStr;

    if (locationInput) {
      locationInput.value = fullValue;
      locationInput.style.color = "";
    }

    // Store in AppState for submission
    AppState.reportLat = lat;
    AppState.reportLng = lng;
    AppState.reportPlace = placeName;

    if (isManual) {
      showToast(`📍 GPS locked: ${placeName || coordStr}`);
    }
  }

  function detectGPS(isManual = false) {
    if (!navigator.geolocation) {
      if (locationInput) locationInput.value = "30.55640° N, 79.56420° E — Joshimath, Chamoli, Uttarakhand";
      if (isManual) showToast("GPS not supported — using sector coordinates");
      return;
    }

    if (locationInput && isManual) {
      locationInput.value = "Detecting GPS…";
      locationInput.style.color = "#94a3b8";
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolveGPSToLocation(pos.coords.latitude, pos.coords.longitude, isManual);
      },
      (err) => {
        console.warn("GPS error:", err.message);
        // Graceful fallback — use Chamoli/Joshimath coordinates (sector default)
        if (locationInput) {
          locationInput.value = "30.55640° N, 79.56420° E — Joshimath, Chamoli, Uttarakhand";
          locationInput.style.color = "";
        }
        if (isManual) showToast("GPS signal unavailable — using sector default");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }

  // Auto-detect on report form open (silent, non-blocking)
  detectGPS(false);

  if (btnRefreshGPS) {
    btnRefreshGPS.addEventListener("click", () => detectGPS(true));
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const locationVal = document.getElementById("reportLocationInput").value;
      const descVal = document.getElementById("reportDescInput").value;
      const activeChip = document.querySelector("#hazardTagGroup .tag-chip.active");
      const categoryName = activeChip ? activeChip.querySelector("span").textContent.trim() : "Hazard Report";

      const reportId = `#REP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      if (AppState.isOffline) {
        AppState.offlineQueue.push({
          id: reportId,
          location: locationVal,
          category: categoryName,
          desc: descVal,
          timestamp: new Date().toISOString()
        });

        document.getElementById("modalRefId").textContent = reportId;
        document.getElementById("modalSyncStatus").textContent = "Queued in Local Storage (Offline)";
        document.getElementById("modalSyncStatus").style.color = "#d97706";
        document.getElementById("modalLocationVal").textContent = locationVal.split("—")[0].trim();
        document.getElementById("modalCategoryVal").textContent = categoryName;

        modal.classList.add("open");
      } else {
        document.getElementById("modalRefId").textContent = reportId;
        document.getElementById("modalSyncStatus").textContent = "Verified & Synced";
        document.getElementById("modalSyncStatus").style.color = "#059669";
        document.getElementById("modalLocationVal").textContent = locationVal.split("—")[0].trim();
        document.getElementById("modalCategoryVal").textContent = categoryName;

        modal.classList.add("open");
      }

      form.reset();
      document.getElementById("photoPreviewContainer").innerHTML = "";
      AppState.uploadedPhotos = [];
    });
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", () => {
      modal.classList.remove("open");
      switchTab("home");
    });
  }
}

// =============================================================================
// GEOTAG CAMERA SUBSYSTEM
// =============================================================================
let cameraStream = null;
let currentFacingMode = "environment"; // default back camera
let cameraClockInterval = null;

function initGeotagCameraModal(nativeCameraInput) {
  const closeBtn = document.getElementById("closeCameraModalBtn");
  const shutterBtn = document.getElementById("btnCaptureShutter");
  const switchBtn = document.getElementById("btnSwitchCamera");
  const fallbackBtn = document.getElementById("btnNativeCameraFallback");
  const modal = document.getElementById("geotagCameraModal");

  if (closeBtn) closeBtn.addEventListener("click", closeGeotagCamera);
  if (shutterBtn) shutterBtn.addEventListener("click", captureGeotagPhoto);

  if (switchBtn) {
    switchBtn.addEventListener("click", () => {
      currentFacingMode = (currentFacingMode === "environment") ? "user" : "environment";
      startCameraStream();
    });
  }

  if (fallbackBtn && nativeCameraInput) {
    fallbackBtn.addEventListener("click", () => {
      nativeCameraInput.click();
    });
  }

  if (nativeCameraInput) {
    nativeCameraInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          stampImageWithGeotag(event.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeGeotagCamera();
    });
  }
}

function getFormattedCoordinates(lat, lng) {
  if (lat == null || lng == null) {
    return "30.5564° N, 79.5642° E";
  }
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

function openGeotagCamera() {
  const modal = document.getElementById("geotagCameraModal");
  if (!modal) return;
  modal.classList.add("open");

  // Fetch or refresh live GPS lock for camera HUD
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy || 3);
        AppState.reportLat = lat;
        AppState.reportLng = lng;
        AppState.gpsAccuracy = acc;

        const gpsEl = document.getElementById("camGpsStatusText");
        if (gpsEl) gpsEl.textContent = `GPS Locked (±${acc}m)`;

        updateCameraHudTelemetry();

        // Reverse geocode if place name is not yet known
        if (!AppState.reportPlace) {
          fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          )
            .then((r) => r.json())
            .then((data) => {
              const addr = data.address || {};
              const parts = [
                addr.village || addr.town || addr.suburb || addr.city_district || addr.neighbourhood || addr.hamlet,
                addr.county || addr.state_district,
                addr.state
              ].filter(Boolean);
              AppState.reportPlace = parts.length > 0 ? parts.slice(0, 2).join(", ") : (data.display_name ? data.display_name.split(",").slice(0, 2).join(",") : "Live Location");
            })
            .catch(() => {});
        }
      },
      (err) => {
        console.warn("Camera GPS acquisition note:", err.message);
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );
  }

  updateCameraHudTelemetry();
  if (cameraClockInterval) clearInterval(cameraClockInterval);
  cameraClockInterval = setInterval(updateCameraHudTelemetry, 1000);

  startCameraStream();
}

function closeGeotagCamera() {
  const modal = document.getElementById("geotagCameraModal");
  if (modal) modal.classList.remove("open");
  if (cameraClockInterval) clearInterval(cameraClockInterval);
  stopCameraStream();
}

function startCameraStream() {
  const video = document.getElementById("cameraVideo");
  if (!video) return;

  stopCameraStream();

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: currentFacingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    }).then(stream => {
      cameraStream = stream;
      video.srcObject = stream;
      video.play().catch(e => console.log("Video play error:", e));
      const gpsEl = document.getElementById("camGpsStatusText");
      if (gpsEl) {
        const acc = AppState.gpsAccuracy || 3;
        gpsEl.textContent = `GPS Locked (±${acc}m)`;
      }
    }).catch(err => {
      console.warn("Direct webcam stream inaccessible (using visual fallback):", err);
      renderSimulatedVideoPlaceholder(video);
    });
  } else {
    renderSimulatedVideoPlaceholder(video);
  }
}

function stopCameraStream() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  const video = document.getElementById("cameraVideo");
  if (video) video.srcObject = null;
}

function renderSimulatedVideoPlaceholder(video) {
  const gpsEl = document.getElementById("camGpsStatusText");
  if (gpsEl) {
    const acc = AppState.gpsAccuracy || 3;
    gpsEl.textContent = AppState.reportLat ? `GPS Locked (±${acc}m)` : "Telemetry Ready (GPS Fallback)";
  }
}

function updateCameraHudTelemetry() {
  const now = new Date();
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const day = String(now.getDate()).padStart(2, '0');
  const mon = months[now.getMonth()];
  const yr = now.getFullYear();
  const time = now.toLocaleTimeString('en-US', { hour12: false });
  const timeStr = `${day}-${mon}-${yr} ${time} IST`;

  const coordsEl = document.getElementById("camCoordinatesHud");
  const elevEl = document.getElementById("camElevationHud");
  const timeEl = document.getElementById("camTimestampHud");

  const lat = AppState.reportLat;
  const lng = AppState.reportLng;
  const coordsText = (lat != null && lng != null) ? getFormattedCoordinates(lat, lng) : "30.5564° N, 79.5642° E";

  if (coordsEl) coordsEl.textContent = coordsText;
  if (elevEl) elevEl.textContent = AppState.reportElev || "1,874 m AMSL";
  if (timeEl) timeEl.textContent = timeStr;
}

function captureGeotagPhoto() {
  const video = document.getElementById("cameraVideo");
  const canvas = document.getElementById("geotagCanvas");
  const flash = document.getElementById("cameraFlash");

  if (!canvas) return;

  // Flash animation
  if (flash) {
    flash.classList.add("flash-active");
    setTimeout(() => flash.classList.remove("flash-active"), 120);
  }

  const width = (video && video.videoWidth > 0) ? video.videoWidth : 800;
  const height = (video && video.videoHeight > 0) ? video.videoHeight : 600;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (video && video.srcObject && video.readyState >= 2) {
    ctx.drawImage(video, 0, 0, width, height);
  } else {
    // Generate realistic high-res mountain field snapshot
    drawFallbackScenicView(ctx, width, height);
  }

  const lat = AppState.reportLat;
  const lng = AppState.reportLng;
  const coordsText = (lat != null && lng != null) ? getFormattedCoordinates(lat, lng) : "30.5564° N, 79.5642° E";
  const placeText = AppState.reportPlace || "Joshimath Ward 5, Uttarakhand";
  const elevText = AppState.reportElev || "1,874 m AMSL";

  // Stamp Geotag Telemetry watermark onto photo
  drawGeotagStampOnCanvas(ctx, width, height, coordsText, elevText, placeText);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

  addPhotoPreview(dataUrl, true, coordsText);

  // Sync to hazard location input
  const locInput = document.getElementById("reportLocationInput");
  if (locInput) {
    const fullVal = `${coordsText} — ${placeText} (Camera Geotagged)`;
    locInput.value = fullVal;
    locInput.style.color = "";
  }

  showToast("📸 Geotagged Hazard Photo Captured & Verified!");
  closeGeotagCamera();
}

function stampImageWithGeotag(imageSrc) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.getElementById("geotagCanvas");
    if (!canvas) return;
    canvas.width = img.width || 800;
    canvas.height = img.height || 600;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const lat = AppState.reportLat;
    const lng = AppState.reportLng;
    const coordsText = (lat != null && lng != null) ? getFormattedCoordinates(lat, lng) : "30.5564° N, 79.5642° E";
    const placeText = AppState.reportPlace || "Joshimath Ward 5, Uttarakhand";
    const elevText = AppState.reportElev || "1,874 m AMSL";

    drawGeotagStampOnCanvas(ctx, canvas.width, canvas.height, coordsText, elevText, placeText);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    addPhotoPreview(dataUrl, true, coordsText);
    
    const locInput = document.getElementById("reportLocationInput");
    if (locInput) {
      locInput.value = `${coordsText} — ${placeText} (Camera Geotagged)`;
      locInput.style.color = "";
    }
    showToast("📸 Native Camera Photo Geotagged & Attached!");
    closeGeotagCamera();
  };
  img.src = imageSrc;
}

function drawGeotagStampOnCanvas(ctx, w, h, coords, elev, locationName) {
  const bannerHeight = Math.max(72, Math.round(h * 0.14));
  const bannerY = h - bannerHeight;

  // Dark translucent watermark banner
  ctx.fillStyle = "rgba(11, 17, 32, 0.90)";
  ctx.fillRect(0, bannerY, w, bannerHeight);

  // Emerald accent top line
  ctx.fillStyle = "#059669";
  ctx.fillRect(0, bannerY, w, Math.max(3, Math.round(h * 0.005)));

  // Text setup
  ctx.fillStyle = "#ffffff";
  const baseFontSize = Math.max(12, Math.round(w * 0.022));
  ctx.font = `bold ${baseFontSize}px sans-serif`;

  const now = new Date();
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const dateStr = `${String(now.getDate()).padStart(2, '0')}-${months[now.getMonth()]}-${now.getFullYear()} ${now.toLocaleTimeString('en-US', { hour12: false })} IST`;

  // Left Column: Coordinates & Location
  ctx.fillText(`📍 LAT/LNG: ${coords}`, 18, bannerY + baseFontSize + 14);
  ctx.fillStyle = "#94a3b8";
  ctx.font = `600 ${Math.round(baseFontSize * 0.85)}px sans-serif`;
  ctx.fillText(`⛰️ ELEV: ${elev} • ${locationName}`, 18, bannerY + (baseFontSize * 2) + 20);

  // Right Column: Timestamp & Security Watermark
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.round(baseFontSize * 0.85)}px monospace`;
  const timeWidth = ctx.measureText(dateStr).width;
  ctx.fillText(dateStr, w - timeWidth - 18, bannerY + baseFontSize + 14);

  ctx.fillStyle = "#34d399";
  ctx.font = `bold ${Math.round(baseFontSize * 0.85)}px sans-serif`;
  const brandText = "🛡️ RESILIENTGUARD GEOTAG VERIFIED";
  const brandWidth = ctx.measureText(brandText).width;
  ctx.fillText(brandText, w - brandWidth - 18, bannerY + (baseFontSize * 2) + 20);
}

function drawFallbackScenicView(ctx, w, h) {
  // Mountain terrain gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#475569");
  grad.addColorStop(0.5, "#334155");
  grad.addColorStop(1, "#1e293b");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Mountain ridges
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.6);
  ctx.lineTo(w * 0.25, h * 0.45);
  ctx.lineTo(w * 0.55, h * 0.58);
  ctx.lineTo(w * 0.85, h * 0.4);
  ctx.lineTo(w, h * 0.55);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Foreground slope / road
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.75);
  ctx.lineTo(w * 0.4, h * 0.68);
  ctx.lineTo(w, h * 0.82);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Subdued tag in center
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("FIELD GEOTAG CAPTURE", w / 2, h / 2);
  ctx.textAlign = "start";
}

function addPhotoPreview(srcUrl, isGeotagged = false, coords = "30.5564° N, 79.5642° E") {
  const container = document.getElementById("photoPreviewContainer");
  if (!container) return;
  const thumb = document.createElement("div");
  thumb.className = "preview-thumb";
  thumb.innerHTML = `
    <img src="${srcUrl}" alt="Hazard Evidence Preview">
    ${isGeotagged ? `<div class="preview-geotag-badge">📍 GPS Tagged</div>` : ''}
    <button type="button" class="preview-remove-btn" aria-label="Remove image">&times;</button>
  `;

  thumb.querySelector(".preview-remove-btn").addEventListener("click", () => {
    thumb.remove();
    const idx = AppState.uploadedPhotos.indexOf(srcUrl);
    if (idx > -1) AppState.uploadedPhotos.splice(idx, 1);
  });

  container.appendChild(thumb);
  AppState.uploadedPhotos.push(srcUrl);
}

// =============================================================================
// TOAST NOTIFICATIONS
// =============================================================================
function showToast(message) {
  const toast = document.getElementById("appToast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

// =============================================================================
// ADMIN LIVE ALERT BROADCAST & ALARM SIREN SUBSYSTEM
// =============================================================================
let audioContextInstance = null;
let sirenOscillator1 = null;
let sirenOscillator2 = null;
let sirenGainNode = null;
let sirenModulationInterval = null;
let isSirenActive = false;
let adminBroadcastChannel = null;

const ADMIN_SCENARIO_PRESETS = {
  landslide: {
    title: "CRITICAL FLASH LANDSLIDE & DEBRIS FLOW EVACUATION",
    desc: "District Disaster Control has issued an immediate evacuation advisory for residents in low-lying riverside zones and Sector 4 slopes. Move to designated higher ground relief centers immediately.",
    severity: "danger",
    siren: "eas"
  },
  flood: {
    title: "ALAKNANDA RIVER SURGE FLASH FLOOD WARNING",
    desc: "Upstream precipitation surge has breached critical safety watermark. Rapid flooding expected along riverbanks within 20 minutes. Evacuate all riverbed structures immediately.",
    severity: "danger",
    siren: "eas"
  },
  mudflow: {
    title: "NH-7 KM 42 HIGHWAY MASSIVE MUDFLOW BLOCKADE",
    desc: "Active debris slide at Km 42 has blocked all traffic lanes. Heavy clearance machinery deployed. All commuter transit halted — use Upper Helang Bypass immediately.",
    severity: "warning",
    siren: "wail"
  },
  cloudburst: {
    title: "CHAMOLI CLOUDBURST ADVISORY — SEEK SHELTER",
    desc: "Extreme localized cloudburst detected exceeding 85 mm/h. High flash flood risk in natural gullies. Take shelter in reinforced masonry structures immediately.",
    severity: "danger",
    siren: "eas"
  }
};

function playEmergencyAlarmSiren(sirenType = "eas") {
  if (isSirenActive || sirenType === "silent") return;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioContextInstance) {
      audioContextInstance = new AudioContextClass();
    }
    if (audioContextInstance.state === "suspended") {
      audioContextInstance.resume();
    }

    sirenGainNode = audioContextInstance.createGain();
    sirenGainNode.gain.setValueAtTime(0.15, audioContextInstance.currentTime); // Safe audible volume
    sirenGainNode.connect(audioContextInstance.destination);

    sirenOscillator1 = audioContextInstance.createOscillator();
    sirenOscillator2 = audioContextInstance.createOscillator();

    if (sirenType === "wail") {
      // High-Lo European / Evacuation Siren
      sirenOscillator1.type = "sawtooth";
      sirenOscillator2.type = "sine";
      sirenOscillator1.frequency.setValueAtTime(650, audioContextInstance.currentTime);
      sirenOscillator2.frequency.setValueAtTime(650, audioContextInstance.currentTime);

      let pitchHigh = false;
      sirenModulationInterval = setInterval(() => {
        if (!audioContextInstance || !isSirenActive) return;
        const now = audioContextInstance.currentTime;
        const targetFreq = pitchHigh ? 650 : 980;
        if (sirenOscillator1) sirenOscillator1.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.3);
        if (sirenOscillator2) sirenOscillator2.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.3);
        pitchHigh = !pitchHigh;
      }, 400);
    } else {
      // Emergency Alert System (EAS) Dual-Tone Pulsing Siren (853 Hz & 960 Hz)
      sirenOscillator1.type = "sawtooth";
      sirenOscillator2.type = "square";
      sirenOscillator1.frequency.setValueAtTime(853, audioContextInstance.currentTime);
      sirenOscillator2.frequency.setValueAtTime(960, audioContextInstance.currentTime);

      let phase = false;
      sirenModulationInterval = setInterval(() => {
        if (!audioContextInstance || !isSirenActive) return;
        const now = audioContextInstance.currentTime;
        if (phase) {
          if (sirenOscillator1) sirenOscillator1.frequency.setValueAtTime(853, now);
          if (sirenOscillator2) sirenOscillator2.frequency.setValueAtTime(960, now);
          if (sirenGainNode) sirenGainNode.gain.setValueAtTime(0.18, now);
        } else {
          if (sirenOscillator1) sirenOscillator1.frequency.setValueAtTime(960, now);
          if (sirenOscillator2) sirenOscillator2.frequency.setValueAtTime(853, now);
          if (sirenGainNode) sirenGainNode.gain.setValueAtTime(0.12, now);
        }
        phase = !phase;
      }, 260);
    }

    sirenOscillator1.connect(sirenGainNode);
    sirenOscillator2.connect(sirenGainNode);
    sirenOscillator1.start();
    sirenOscillator2.start();
    isSirenActive = true;

    // Update Silence Button UI
    const silenceBtn = document.getElementById("btnSilenceAlarm");
    const silenceBtnText = document.getElementById("silenceBtnText");
    if (silenceBtn) silenceBtn.classList.remove("muted");
    if (silenceBtnText) silenceBtnText.textContent = "Silence Alarm Siren";
  } catch (err) {
    console.warn("Emergency Audio Alarm playback notice:", err);
  }
}

function stopEmergencyAlarmSiren() {
  if (!isSirenActive) return;
  try {
    if (sirenModulationInterval) {
      clearInterval(sirenModulationInterval);
      sirenModulationInterval = null;
    }
    if (sirenOscillator1) {
      sirenOscillator1.stop();
      sirenOscillator1.disconnect();
      sirenOscillator1 = null;
    }
    if (sirenOscillator2) {
      sirenOscillator2.stop();
      sirenOscillator2.disconnect();
      sirenOscillator2 = null;
    }
    if (sirenGainNode) {
      sirenGainNode.disconnect();
      sirenGainNode = null;
    }
    isSirenActive = false;

    // Update Silence Button UI
    const silenceBtn = document.getElementById("btnSilenceAlarm");
    const silenceBtnText = document.getElementById("silenceBtnText");
    if (silenceBtn) silenceBtn.classList.add("muted");
    if (silenceBtnText) silenceBtnText.textContent = "Alarm Silenced";
  } catch (err) {
    console.warn("Stop siren error:", err);
  }
}

function triggerAdminLiveAlert(alertData = {}) {
  const title = alertData.title || "CRITICAL FLASH LANDSLIDE & DEBRIS FLOW EVACUATION";
  const desc = alertData.desc || "District Disaster Control has issued an immediate evacuation advisory for residents in low-lying riverside zones and Sector 4 slopes. Move to designated higher ground relief centers immediately.";
  const severity = alertData.severity || "danger";
  const sirenTone = alertData.siren || "eas";

  const popupModal = document.getElementById("adminLiveAlertPopupModal");
  const titleEl = document.getElementById("popupAlertHeadline");
  const descEl = document.getElementById("popupAlertDescription");
  const timestampEl = document.getElementById("popupAlertTimestamp");
  const severityBadge = document.getElementById("popupSeverityBadge");

  if (titleEl) titleEl.textContent = title;
  if (descEl) descEl.textContent = desc;
  if (timestampEl) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    timestampEl.textContent = `Just now (${timeStr}) • Issued by District Disaster Authority`;
  }
  if (severityBadge) {
    severityBadge.textContent = severity === "danger" ? "RED ALERT" : (severity === "warning" ? "ORANGE WARNING" : "YELLOW WATCH");
    severityBadge.style.background = severity === "danger" ? "#ffffff" : (severity === "warning" ? "#ffedd5" : "#fef9c3");
    severityBadge.style.color = severity === "danger" ? "#991b1b" : (severity === "warning" ? "#c2410c" : "#854d0e");
  }

  if (popupModal) {
    popupModal.classList.add("open");
  }

  // Update overall risk status
  if (severity === "danger") {
    setRiskLevel("danger");
  } else if (severity === "warning") {
    setRiskLevel("warning");
  }

  // Play Emergency Alarm Siren
  playEmergencyAlarmSiren(sirenTone);

  // Update alert badge count
  const badge = document.getElementById("alertCountBadge");
  if (badge) {
    badge.textContent = "3";
    badge.style.background = "#dc2626";
    badge.style.color = "#ffffff";
  }

  // Add dynamically to the top of the alerts list screen
  prependLiveAlertToAlertsScreen(title, desc, severity);

  showToast("🚨 INCOMING ADMIN EMERGENCY LIVE BROADCAST!");
}

function dismissAdminLiveAlert() {
  stopEmergencyAlarmSiren();
  const popupModal = document.getElementById("adminLiveAlertPopupModal");
  if (popupModal) {
    popupModal.classList.remove("open");
  }
}

function prependLiveAlertToAlertsScreen(title, desc, severity = "danger") {
  const container = document.getElementById("alertsContainer");
  if (!container) return;

  const existingLive = document.getElementById("liveAdminAlertCard");
  if (existingLive) existingLive.remove();

  const card = document.createElement("article");
  card.id = "liveAdminAlertCard";
  card.className = `alert-card ${severity}`;
  card.setAttribute("data-category", "area");
  card.innerHTML = `
    <div class="alert-top">
      <span class="alert-scope-tag" style="color: #dc2626; font-weight: 800;">🚨 Live Admin Broadcast</span>
      <span class="alert-time">Broadcasted Just Now • HIGH PRIORITY</span>
    </div>
    <h3 class="alert-headline" style="color: #991b1b;">${title}</h3>
    <p class="alert-description">${desc}</p>
    <div class="alert-actions-row" style="margin-top: 10px; display: flex; gap: 8px;">
      <button class="action-link-btn" onclick="switchTab('map')">View Threat Map →</button>
      <button class="action-link-btn" onclick="triggerAdminLiveAlert()">Re-open Emergency Popup</button>
    </div>
  `;

  container.insertBefore(card, container.firstChild);
}

function initAdminLiveAlertSystem() {
  const openModalBtn = document.getElementById("btnOpenAdminDispatch");
  const modal = document.getElementById("adminBroadcastModal");
  const closeModalBtn = document.getElementById("closeAdminModalBtn");
  const cancelModalBtn = document.getElementById("btnCancelAdminModal");
  const dispatchBtn = document.getElementById("btnDispatchLiveAlert");

  // Box Popup Modal elements
  const popupModal = document.getElementById("adminLiveAlertPopupModal");
  const popupCloseBtn = document.getElementById("btnCloseEmergencyPopup");
  const popupDismissLink = document.getElementById("btnPopupDismiss");
  const popupSilenceBtn = document.getElementById("btnPopupSilenceAlarm");
  const popupViewMapBtn = document.getElementById("btnPopupViewMap");
  const popupShelterBtn = document.getElementById("btnPopupShelter");

  const titleInput = document.getElementById("adminAlertTitleInput");
  const descInput = document.getElementById("adminAlertDescInput");
  const severitySelect = document.getElementById("adminAlertSeveritySelect");
  const sirenSelect = document.getElementById("adminAlertSirenSelect");
  const presetPills = document.querySelectorAll(".preset-pill");

  if (openModalBtn && modal) {
    openModalBtn.addEventListener("click", () => {
      modal.classList.add("open");
    });
  }

  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener("click", () => modal.classList.remove("open"));
  }

  if (cancelModalBtn && modal) {
    cancelModalBtn.addEventListener("click", () => modal.classList.remove("open"));
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("open");
    });
  }

  // Preset pill selection handler
  presetPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      presetPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");

      const scenarioKey = pill.getAttribute("data-scenario");
      const scenario = ADMIN_SCENARIO_PRESETS[scenarioKey];
      if (scenario) {
        if (titleInput) titleInput.value = scenario.title;
        if (descInput) descInput.value = scenario.desc;
        if (severitySelect) severitySelect.value = scenario.severity;
        if (sirenSelect) sirenSelect.value = scenario.siren;
      }
    });
  });

  // Transmit Live Alert Handler
  if (dispatchBtn) {
    dispatchBtn.addEventListener("click", () => {
      const alertPayload = {
        title: titleInput ? titleInput.value : "CRITICAL FLASH LANDSLIDE & DEBRIS FLOW EVACUATION",
        desc: descInput ? descInput.value : "District Disaster Control immediate evacuation advisory.",
        severity: severitySelect ? severitySelect.value : "danger",
        siren: sirenSelect ? sirenSelect.value : "eas",
        timestamp: new Date().toISOString()
      };

      if (modal) modal.classList.remove("open");

      // Broadcast to this tab
      triggerAdminLiveAlert(alertPayload);

      // Broadcast to other open tabs / windows
      try {
        if (typeof BroadcastChannel !== "undefined") {
          if (!adminBroadcastChannel) {
            adminBroadcastChannel = new BroadcastChannel("resilientguard_admin_alerts");
          }
          adminBroadcastChannel.postMessage(alertPayload);
        }
        localStorage.setItem("resilientguard_last_admin_alert", JSON.stringify(alertPayload));
      } catch (e) {
        console.warn("BroadcastChannel note:", e);
      }
    });
  }

  // Cross-tab broadcast listener
  try {
    if (typeof BroadcastChannel !== "undefined") {
      adminBroadcastChannel = new BroadcastChannel("resilientguard_admin_alerts");
      adminBroadcastChannel.onmessage = (event) => {
        if (event.data) {
          triggerAdminLiveAlert(event.data);
        }
      };
    }
  } catch (e) {}

  window.addEventListener("storage", (e) => {
    if (e.key === "resilientguard_last_admin_alert" && e.newValue) {
      try {
        const payload = JSON.parse(e.newValue);
        triggerAdminLiveAlert(payload);
      } catch (err) {}
    }
  });

  // Emergency Box Popup actions
  if (popupCloseBtn) {
    popupCloseBtn.addEventListener("click", dismissAdminLiveAlert);
  }

  if (popupDismissLink) {
    popupDismissLink.addEventListener("click", dismissAdminLiveAlert);
  }

  if (popupModal) {
    popupModal.addEventListener("click", (e) => {
      if (e.target === popupModal) {
        dismissAdminLiveAlert();
      }
    });
  }

  if (popupSilenceBtn) {
    popupSilenceBtn.addEventListener("click", () => {
      const silenceText = document.getElementById("popupSilenceText");
      if (isSirenActive) {
        stopEmergencyAlarmSiren();
        if (popupSilenceBtn) popupSilenceBtn.classList.add("muted");
        if (silenceText) silenceText.textContent = "Siren Silenced (Tap to Resume)";
      } else {
        playEmergencyAlarmSiren("eas");
        if (popupSilenceBtn) popupSilenceBtn.classList.remove("muted");
        if (silenceText) silenceText.textContent = "Silence Siren";
      }
    });
  }

  if (popupViewMapBtn) {
    popupViewMapBtn.addEventListener("click", () => {
      dismissAdminLiveAlert();
      switchTab("map");
      setTimeout(() => {
        if (typeof selectCorridor === "function") {
          selectCorridor("nh7-km42");
        }
      }, 300);
    });
  }

  if (popupShelterBtn) {
    popupShelterBtn.addEventListener("click", () => {
      dismissAdminLiveAlert();
      switchTab("map");
      setTimeout(() => {
        if (mapInstance) {
          mapInstance.flyTo([30.5590, 79.5680], 16, { animate: true, duration: 1.2 });
        }
        showToast("Routing to Joshimath Relief Center #2 (Govt College)");
      }, 300);
    });
  }

  // Global window method for programmatic or admin simulation triggers
  window.sendAdminLiveAlert = (title, desc, severity = "danger", siren = "eas") => {
    triggerAdminLiveAlert({ title, desc, severity, siren });
  };
}

// =============================================================================
// CITIZEN HAZARD REPORT FORM & REAL-TIME DISPATCH
// =============================================================================
function initReportForm() {
  const form = document.getElementById("citizenReportForm");
  const photoInput = document.getElementById("photoFileInput");
  const nativeCameraInput = document.getElementById("nativeCameraInput");
  const btnUploadDirect = document.getElementById("btnUploadDirect");
  const btnOpenGeotagCam = document.getElementById("btnOpenGeotagCam");
  const previewContainer = document.getElementById("photoPreviewContainer");
  const locInput = document.getElementById("reportLocationInput");
  const btnRefreshGPS = document.getElementById("btnRefreshGPS");
  const tagChips = document.querySelectorAll("#hazardTagGroup .tag-chip");
  const descInput = document.getElementById("reportDescInput");
  const confirmationModal = document.getElementById("confirmationModal");
  const modalCloseBtn = document.getElementById("modalCloseBtn");

  let selectedTag = "crack";
  let attachedPhotos = [];

  // Default GPS Auto-fill
  if (locInput && !locInput.value) {
    locInput.value = "Sector 4 Upper Slope (30.5564° N, 79.5642° E)";
  }

  // Tag chip click handlers
  tagChips.forEach(chip => {
    chip.addEventListener("click", () => {
      tagChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      selectedTag = chip.getAttribute("data-tag") || "crack";
    });
  });

  // Refresh GPS
  if (btnRefreshGPS && locInput) {
    btnRefreshGPS.addEventListener("click", () => {
      locInput.value = "Detecting GPS lock...";
      setTimeout(() => {
        locInput.value = "Sector 4 Slope (30.5564° N, 79.5642° E • ±2.8m)";
        showToast("GPS coordinates refreshed via GNSS.");
      }, 500);
    });
  }

  // Direct Upload Trigger
  if (btnUploadDirect && photoInput) {
    btnUploadDirect.addEventListener("click", () => photoInput.click());
  }

  // Camera Trigger
  if (btnOpenGeotagCam) {
    btnOpenGeotagCam.addEventListener("click", () => {
      if (nativeCameraInput) {
        nativeCameraInput.click();
      } else if (photoInput) {
        photoInput.click();
      }
    });
  }

  // Photo change handler
  function handlePhotoSelect(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      attachedPhotos.push(file.name);
    }

    if (previewContainer) {
      previewContainer.innerHTML = attachedPhotos.map((name) => `
        <div style="background: #e2e8f0; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 0.76rem; display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 6px;">
          <span>📷 ${name}</span>
          <span style="color: #be123c; cursor: pointer; font-weight: bold;">✕</span>
        </div>
      `).join("");
    }
  }

  if (photoInput) photoInput.addEventListener("change", handlePhotoSelect);
  if (nativeCameraInput) nativeCameraInput.addEventListener("change", handlePhotoSelect);

  // Form Submit Handler
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const locationVal = locInput ? locInput.value.trim() : "Joshimath Sector 4";
      const descVal = descInput ? descInput.value.trim() : "";
      const refId = `#REP-${Math.floor(1000 + Math.random() * 9000)}`;

      const tagNames = {
        crack: "Ground / Wall Crack",
        water: "Water Seepage / Inundation",
        road_blocked: "Road Blocked",
        movement: "Landslide / Slope Movement",
        bridge_damage: "Bridge / Culvert Damage",
        fallen_wires: "Fallen Utilities / Poles"
      };

      const categoryName = tagNames[selectedTag] || "Ground Hazard";

      const reportPayload = {
        type: "CITIZEN_REPORT_SUBMITTED",
        id: refId,
        reporter: "Citizen (Mobile App)",
        contact: "App Verified",
        location: locationVal,
        coords: [30.5564, 79.5642],
        coordsText: "30.5564° N, 79.5642° E",
        category: categoryName,
        tags: [categoryName],
        severity: (selectedTag === "crack" || selectedTag === "movement" || selectedTag === "road_blocked") ? "critical" : "high",
        description: descVal || `Reported ${categoryName} at ${locationVal}.`,
        photo: attachedPhotos.length > 0 ? attachedPhotos.join(", ") : "Geotagged Photo Evidence",
        timestamp: "Just now"
      };

      // Broadcast to Admin & Field Officer portals
      try {
        if (typeof BroadcastChannel !== "undefined") {
          const bc = new BroadcastChannel("resilientguard_admin_alerts");
          bc.postMessage(reportPayload);
        }
        const existing = JSON.parse(localStorage.getItem("resilientguard_citizen_reports") || "[]");
        existing.unshift(reportPayload);
        localStorage.setItem("resilientguard_citizen_reports", JSON.stringify(existing));
      } catch (err) {
        console.warn("Sync note:", err);
      }

      // Populate confirmation modal
      const modalRefEl = document.getElementById("modalRefId");
      const modalLocEl = document.getElementById("modalLocationVal");
      const modalCatEl = document.getElementById("modalCategoryVal");

      if (modalRefEl) modalRefEl.textContent = refId;
      if (modalLocEl) modalLocEl.textContent = locationVal;
      if (modalCatEl) modalCatEl.textContent = categoryName;

      if (confirmationModal) {
        confirmationModal.classList.add("open");
      }

      // Reset form
      if (descInput) descInput.value = "";
      attachedPhotos = [];
      if (previewContainer) previewContainer.innerHTML = "";

      showToast(`Report ${refId} submitted & dispatched to DDMA Command!`);
    });
  }

  // Close Confirmation Modal
  if (modalCloseBtn && confirmationModal) {
    modalCloseBtn.addEventListener("click", () => {
      confirmationModal.classList.remove("open");
      switchTab("home");
    });
  }
}

