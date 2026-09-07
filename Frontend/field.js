/**
 * ResilientGuard — Field Officer Patrol Console
 * field.js — 4-Page Operational System: Assigned Tasks, Verification, Observation, and Tactical Map
 */

// =========================================================================
// STATE & FIELD DATABASE
// =========================================================================
let currentFieldPage = "page1";
let selectedTaskId = "TASK-101";
let activeTaskFilter = "all";
let fieldMapInstance = null;
let fieldMapLayers = {
  officer: null,
  tasks: null,
  sensors: null,
  zones: null
};
let selectedObservationTags = new Set(["Tension Crack"]);
let fieldBroadcastChannel = null;

// Officer GPS Baseline (Sector 4 Patrol Position)
const OFFICER_LOCATION = {
  pos: [30.5564, 79.5638],
  name: "Patrol Unit #104 (Officer Sushanthi / SDRF)",
  heading: "North-West (310°)",
  elevation: "1,890m MSL",
  accuracy: "±3m (RTK Lock)"
};

// Field Assigned Tasks Database
const FIELD_TASKS = {
  "TASK-101": {
    id: "TASK-101",
    type: "hardware",
    typeLabel: "Hardware Alert",
    title: "Gateway GW-04 Offline Inspection",
    location: "Sector 4 Upper Slope",
    coords: [30.5592, 79.5620],
    coordsText: "30.5592° N, 79.5620° E (1,940m)",
    distance: "0.4 km NW",
    urgency: "critical",
    urgencyText: "CRITICAL / SILENT SPIKE",
    summary: "Gateway GW-04 silent post-tilt spike (4.8°/hr). Inspect antenna mast, solar feed, and slope shear.",
    diagnostics: {
      station: "Gateway GW-04 (LoRa Mesh)",
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
    location: "Sector 4 Spur Road",
    coords: [30.5550, 79.5625],
    coordsText: "30.5550° N, 79.5625° E (1,860m)",
    distance: "0.5 km SW",
    urgency: "high",
    urgencyText: "HIGH PRIORITY",
    summary: "Citizen Report #904 flagged 3.2m continuous ground crack forming along asphalt road edge.",
    citizenReport: {
      reportId: "#REP-904",
      reporter: "Ramesh Singh (Sector 4)",
      timestamp: "35m ago (00:05 IST)",
      description: "Asphalt along road edge cracked open 8-10cm. Water leaking through crack toward lower homes.",
      photoPreview: "Road asphalt separation with visible soil void",
      tags: ["Tension Crack", "Water Seepage"]
    },
    status: "pending"
  },

  "TASK-103": {
    id: "TASK-103",
    type: "zone",
    typeLabel: "Zone Check",
    title: "NH-7 Km 42 Cut-Slope Debris Clearance",
    location: "NH-7 Corridor (Km 42 Helang)",
    coords: [30.5518, 79.5590],
    coordsText: "30.5518° N, 79.5590° E (1,520m)",
    distance: "1.2 km S",
    urgency: "critical",
    urgencyText: "CRITICAL BLOCKADE",
    summary: "Verify BRO earthmover progress and ensure Upper Helang Bypass remains clear for light traffic.",
    zoneCheck: {
      sector: "Helang Km 42 Highway Cut",
      blockadeVolume: "3,800 m³ mud and boulder mass",
      bypassRoute: "Upper Helang Bypass (Open, 14.8 km)",
      safetyProtocol: "Commercial transit prohibited until slope stabilized"
    },
    status: "pending"
  },

  "TASK-104": {
    id: "TASK-104",
    type: "hardware",
    typeLabel: "Hardware Alert",
    title: "Inclinometer SN-401 Node Check",
    location: "Sector 4 Middle Ridge",
    coords: [30.5582, 79.5630],
    coordsText: "30.5582° N, 79.5630° E (1,910m)",
    distance: "0.6 km N",
    urgency: "high",
    urgencyText: "HIGH PRIORITY",
    summary: "Borehole sensor SN-401 recorded extreme tilt acceleration prior to silence. Inspect casing and wiring.",
    diagnostics: {
      station: "Node SN-401 (Inclinometer)",
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
    title: "Muddy Spring Seepage at Sunil Gaon",
    location: "Sunil Gaon Ridge",
    coords: [30.5625, 79.5710],
    coordsText: "30.5625° N, 79.5710° E (2,050m)",
    distance: "1.8 km NE",
    urgency: "moderate",
    urgencyText: "ELEVATED WATCH",
    summary: "Citizen Report #901 reported sudden muddy spring erupting from hill slope near water tank.",
    citizenReport: {
      reportId: "#REP-901",
      reporter: "Kavita Negi (Sunil Gaon)",
      timestamp: "1h ago (23:40 IST)",
      description: "Hillside discharging brown muddy water. Ground soft and spongy under foot.",
      photoPreview: "Turbid water pooling around terrace stone wall",
      tags: ["Muddy Seepage", "Soft Soil"]
    },
    status: "pending"
  }
};

// =========================================================================
// INITIALIZATION
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
  renderTasksList();
  populateTaskDetail(selectedTaskId);
  initBroadcastChannel();
});

function initBroadcastChannel() {
  try {
    if (typeof BroadcastChannel !== "undefined") {
      fieldBroadcastChannel = new BroadcastChannel("resilientguard_admin_alerts");
    }
  } catch (e) {
    console.warn("BroadcastChannel:", e);
  }
}

// =========================================================================
// 4-PAGE SWITCHER NAVIGATION
// =========================================================================
function switchFieldPage(pageKey) {
  currentFieldPage = pageKey;

  // Update Buttons
  const tabBtn1 = document.getElementById("tabBtnPage1");
  const tabBtn2 = document.getElementById("tabBtnPage2");
  const tabBtn3 = document.getElementById("tabBtnPage3");
  const tabBtn4 = document.getElementById("tabBtnPage4");

  if (tabBtn1) tabBtn1.classList.toggle("active", pageKey === "page1");
  if (tabBtn2) tabBtn2.classList.toggle("active", pageKey === "page2");
  if (tabBtn3) tabBtn3.classList.toggle("active", pageKey === "page3");
  if (tabBtn4) tabBtn4.classList.toggle("active", pageKey === "page4");

  // Update Containers
  const view1 = document.getElementById("viewFieldPage1");
  const view2 = document.getElementById("viewFieldPage2");
  const view3 = document.getElementById("viewFieldPage3");
  const view4 = document.getElementById("viewFieldPage4");

  if (view1) view1.classList.toggle("active", pageKey === "page1");
  if (view2) view2.classList.toggle("active", pageKey === "page2");
  if (view3) view3.classList.toggle("active", pageKey === "page3");
  if (view4) view4.classList.toggle("active", pageKey === "page4");

  // If opening Map, initialize and invalidate size
  if (pageKey === "page4") {
    if (!fieldMapInstance) {
      initFieldTacticalMap();
    }
    setTimeout(() => {
      if (fieldMapInstance) {
        fieldMapInstance.invalidateSize();
      }
    }, 120);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// =========================================================================
// PAGE 1 — TASKS FILTERING & RENDERING
// =========================================================================
function filterTasks(type, btnEl) {
  activeTaskFilter = type;
  const filterBtns = document.querySelectorAll(".filter-pill");
  filterBtns.forEach(b => b.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");
  renderTasksList();
}

function renderTasksList() {
  const container = document.getElementById("tasksListContainer");
  if (!container) return;

  container.innerHTML = "";

  const taskKeys = Object.keys(FIELD_TASKS);
  let visibleCount = 0;

  taskKeys.forEach(key => {
    const task = FIELD_TASKS[key];
    if (activeTaskFilter !== "all" && task.type !== activeTaskFilter) return;

    visibleCount++;
    const card = document.createElement("div");
    card.className = `task-item-card ${task.urgency}`;
    card.onclick = () => openTaskDetail(task.id);

    const typeBadgeClass = task.type === "hardware" ? "hardware" : (task.type === "citizen" ? "citizen" : "zone");

    card.innerHTML = `
      <div class="task-card-top-row">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span class="task-id-badge">${task.id}</span>
          <span class="task-type-badge ${typeBadgeClass}">${task.typeLabel}</span>
        </div>
        <span class="status-pill ${task.urgency}">${task.urgencyText}</span>
      </div>

      <div class="task-title">${task.title}</div>
      <div class="task-summary-text">${task.summary}</div>

      <div class="task-meta-footer">
        <div>${task.location} • <span class="task-distance-pill">${task.distance}</span></div>
        <div class="task-cta-link">Inspect →</div>
      </div>
    `;

    container.appendChild(card);
  });

  const countBadge = document.getElementById("taskCountBadge");
  if (countBadge) countBadge.textContent = visibleCount;
}

function openTaskDetail(taskId) {
  selectedTaskId = taskId;
  populateTaskDetail(taskId);
  switchFieldPage("page2");
}

// =========================================================================
// PAGE 2 — TASK DETAIL & FIELD ACTIONS
// =========================================================================
function populateTaskDetail(taskId) {
  const task = FIELD_TASKS[taskId];
  if (!task) return;

  const idBadge = document.getElementById("detailTaskIdBadge");
  const typeLabel = document.getElementById("detailTaskTypeLabel");
  const titleEl = document.getElementById("detailTaskTitle");
  const metaEl = document.getElementById("detailTaskMeta");
  const urgencyContainer = document.getElementById("detailTaskUrgencyContainer");
  const bodyContainer = document.getElementById("taskContentBody");
  const actionContainer = document.getElementById("taskActionBtnContainer");

  if (idBadge) idBadge.textContent = task.id;
  if (typeLabel) typeLabel.textContent = task.typeLabel.toUpperCase();
  if (titleEl) titleEl.textContent = task.title;
  if (metaEl) metaEl.textContent = `${task.location} • ${task.distance} • GPS: ${task.coordsText}`;
  if (urgencyContainer) {
    urgencyContainer.innerHTML = `<span class="status-pill ${task.urgency}">${task.urgencyText}</span>`;
  }

  // Populate Content Body based on task type
  if (bodyContainer) {
    bodyContainer.innerHTML = "";

    if (task.type === "hardware") {
      bodyContainer.innerHTML = `
        <div class="hardware-diagnostics-grid">
          <div class="diag-item">
            <span class="diag-label">Station Hardware</span>
            <span class="diag-val">${task.diagnostics.station}</span>
          </div>
          <div class="diag-item">
            <span class="diag-label">Last Telemetry</span>
            <span class="diag-val" style="color: #dc2626;">${task.diagnostics.lastTelemetry}</span>
          </div>
          <div class="diag-item">
            <span class="diag-label">Power Status</span>
            <span class="diag-val">${task.diagnostics.batteryVoltage}</span>
          </div>
          <div class="diag-item">
            <span class="diag-label">Connected Probes</span>
            <span class="diag-val">${task.diagnostics.connectedSensors}</span>
          </div>
          <div class="diag-item" style="grid-column: span 2;">
            <span class="diag-label">Root Cause Assessment</span>
            <span class="diag-val" style="color: #be123c;">${task.diagnostics.failureMode}</span>
          </div>
        </div>
      `;
    } else if (task.type === "citizen") {
      bodyContainer.innerHTML = `
        <div class="report-evidence-box">
          <div class="report-photo-preview">
            [Ground Photo Preview]
          </div>
          <div class="report-desc-wrap">
            <div class="report-desc-title">Citizen Submission (${task.citizenReport.reportId}) • ${task.citizenReport.reporter} • ${task.citizenReport.timestamp}</div>
            <div class="report-desc-text">"${task.citizenReport.description}"</div>
            <div style="display: flex; gap: 6px; margin-top: 4px;">
              ${task.citizenReport.tags.map(t => `<span class="status-pill high">${t}</span>`).join(" ")}
            </div>
          </div>
        </div>
      `;
    } else if (task.type === "zone") {
      bodyContainer.innerHTML = `
        <div class="hardware-diagnostics-grid">
          <div class="diag-item">
            <span class="diag-label">Corridor</span>
            <span class="diag-val">${task.zoneCheck.sector}</span>
          </div>
          <div class="diag-item">
            <span class="diag-label">Debris Volume</span>
            <span class="diag-val" style="color: #dc2626;">${task.zoneCheck.blockadeVolume}</span>
          </div>
          <div class="diag-item">
            <span class="diag-label">Bypass Status</span>
            <span class="diag-val" style="color: #16a34a;">${task.zoneCheck.bypassRoute}</span>
          </div>
        </div>
      `;
    }
  }

  // Populate Action Buttons based on task type
  if (actionContainer) {
    actionContainer.innerHTML = "";

    if (task.type === "citizen") {
      actionContainer.innerHTML = `
        <button type="button" class="btn-action-verify" onclick="resolveTask('${task.id}', 'verified')">
          Verify &amp; Escalate
        </button>
        <button type="button" class="btn-action-reject" onclick="resolveTask('${task.id}', 'rejected')">
          Reject / False Alarm
        </button>
      `;
    } else if (task.type === "hardware") {
      actionContainer.innerHTML = `
        <button type="button" class="btn-action-repaired" onclick="resolveTask('${task.id}', 'working')">
          Checked — Working
        </button>
        <button type="button" class="btn-action-reject" onclick="resolveTask('${task.id}', 'needs_repair')">
          Needs Repair / Replacement
        </button>
      `;
    } else {
      actionContainer.innerHTML = `
        <button type="button" class="btn-action-verify" onclick="resolveTask('${task.id}', 'zone_cleared')">
          Confirm Zone Clearance
        </button>
      `;
    }
  }
}

function handleTaskPhotoUpload(input) {
  if (input.files && input.files[0]) {
    const label = document.getElementById("taskPhotoInputLabel");
    if (label) {
      label.textContent = `Attached: ${input.files[0].name} (${(input.files[0].size / 1024).toFixed(1)} KB)`;
    }
  }
}

function resolveTask(taskId, resolution) {
  const notesEl = document.getElementById("fieldActionNotes");
  const notes = notesEl ? notesEl.value.trim() : "";
  const task = FIELD_TASKS[taskId];
  if (!task) return;

  // Broadcast resolution to DDMA Admin Center
  try {
    if (fieldBroadcastChannel) {
      fieldBroadcastChannel.postMessage({
        type: "FIELD_TASK_RESOLVED",
        taskId: taskId,
        taskTitle: task.title,
        resolution: resolution,
        notes: notes || "Ground inspection completed by Patrol #104",
        officer: "Patrol Unit #104",
        timestamp: new Date().toISOString()
      });
    }
  } catch (e) {
    console.warn("Broadcast error:", e);
  }

  showFieldToast(`Task ${taskId} resolved: ${resolution.toUpperCase().replace("_", " ")}. Synced with DDMA.`);

  // Remove or update task
  delete FIELD_TASKS[taskId];
  renderTasksList();

  setTimeout(() => {
    switchFieldPage("page1");
  }, 1000);
}

// =========================================================================
// PAGE 3 — SUBMIT OBSERVATION (OFFLINE BUFFERED)
// =========================================================================
function toggleHazardChip(chipEl) {
  const tag = chipEl.getAttribute("data-tag");
  if (selectedObservationTags.has(tag)) {
    selectedObservationTags.delete(tag);
    chipEl.classList.remove("active");
  } else {
    selectedObservationTags.add(tag);
    chipEl.classList.add("active");
  }
}

function refreshFieldGps() {
  const textEl = document.getElementById("obsGpsText");
  if (textEl) {
    textEl.textContent = `30.5564° N, 79.5638° E (Elevation: 1,890m MSL • Accuracy: ±2.4m • Updated)`;
  }
  showFieldToast("GPS coordinates refreshed via RTK GNSS Lock.");
}

function handleObsPhotoUpload(input) {
  if (input.files && input.files[0]) {
    const label = document.getElementById("obsPhotoLabel");
    if (label) {
      label.textContent = `Photo Attached: ${input.files[0].name} (${(input.files[0].size / 1024).toFixed(1)} KB)`;
    }
  }
}

function submitFieldObservation(e) {
  e.preventDefault();
  const notes = document.getElementById("obsNotesInput").value.trim();
  const severityRadio = document.querySelector('input[name="obsSeverity"]:checked');
  const severity = severityRadio ? severityRadio.value : "high";
  const tagsArray = Array.from(selectedObservationTags);

  if (tagsArray.length === 0) {
    alert("Please select at least one observation category tag.");
    return;
  }

  const observationPayload = {
    id: `OBS-${Math.floor(1000 + Math.random() * 9000)}`,
    officer: "Patrol Unit #104 (SDRF)",
    location: OFFICER_LOCATION.pos,
    coordsText: "30.5564° N, 79.5638° E",
    elevation: "1,890m MSL",
    severity: severity,
    tags: tagsArray,
    notes: notes || "Visual field observation logged via mobile console.",
    timestamp: new Date().toISOString()
  };

  // 1. Store in offline buffer
  try {
    const buffer = JSON.parse(localStorage.getItem("resilientguard_field_obs_buffer") || "[]");
    buffer.unshift(observationPayload);
    localStorage.setItem("resilientguard_field_obs_buffer", JSON.stringify(buffer));
  } catch (err) {
    console.warn("Storage error:", err);
  }

  // 2. Broadcast to DDMA Admin Center
  try {
    if (fieldBroadcastChannel) {
      fieldBroadcastChannel.postMessage({
        type: "FIELD_OBSERVATION_SUBMITTED",
        payload: observationPayload
      });
    }
  } catch (err) {
    console.warn("Broadcast error:", err);
  }

  showFieldToast(`Observation #${observationPayload.id} logged and queued for DDMA Command sync!`);

  // Reset form
  document.getElementById("observationForm").reset();
  const photoLabel = document.getElementById("obsPhotoLabel");
  if (photoLabel) photoLabel.textContent = "Tap to capture or attach photo evidence";

  setTimeout(() => {
    switchFieldPage("page1");
  }, 1200);
}

// =========================================================================
// PAGE 4 — FIELD TACTICAL MAP & HARDWARE NAVIGATION
// =========================================================================
function initFieldTacticalMap() {
  const mapEl = document.getElementById("fieldTacticalMap");
  if (!mapEl || fieldMapInstance) return;

  fieldMapInstance = L.map("fieldTacticalMap", {
    center: OFFICER_LOCATION.pos,
    zoom: 15,
    zoomControl: true,
    attributionControl: false
  });

  // Satellite Terrain Basemap
  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 19
  }).addTo(fieldMapInstance);

  L.tileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 19
  }).addTo(fieldMapInstance);

  fieldMapLayers.officer = L.layerGroup().addTo(fieldMapInstance);
  fieldMapLayers.tasks = L.layerGroup().addTo(fieldMapInstance);
  fieldMapLayers.sensors = L.layerGroup().addTo(fieldMapInstance);
  fieldMapLayers.zones = L.layerGroup().addTo(fieldMapInstance);

  // 1. Current Officer Location Pin
  L.circleMarker(OFFICER_LOCATION.pos, {
    radius: 10,
    fillColor: "#2563eb",
    color: "#ffffff",
    weight: 3,
    fillOpacity: 1
  }).addTo(fieldMapLayers.officer)
    .bindPopup(`
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.8rem; padding: 3px;">
        <strong style="color: #2563eb;">${OFFICER_LOCATION.name}</strong><br>
        Current Location: ${OFFICER_LOCATION.elevation}<br>
        Accuracy: ${OFFICER_LOCATION.accuracy}
      </div>
    `);

  // 2. Hardware Stations & Gateways Pins (For direct hardware site navigation)
  const HARDWARE_NODES = [
    { id: "GW-04", name: "Gateway GW-04 (Offline Silent)", pos: [30.5592, 79.5620], color: "#be123c", status: "SILENT ANOMALY" },
    { id: "GW-01", name: "Gateway GW-01 (Control Mast)", pos: [30.5564, 79.5638], color: "#16a34a", status: "ONLINE (100% Solar)" },
    { id: "GW-02", name: "Gateway GW-02 (Helang Transit)", pos: [30.5512, 79.5585], color: "#16a34a", status: "ONLINE (95% Solar)" },
    { id: "GW-05", name: "Gateway GW-05 (Sector 5 Ridge)", pos: [30.5655, 79.5700], color: "#16a34a", status: "ONLINE (92% Solar)" },
    { id: "SN-401", name: "Inclinometer SN-401 (Borehole)", pos: [30.5582, 79.5630], color: "#dc2626", status: "TILT EXCEEDANCE (4.8°/hr)" },
    { id: "PZ-04", name: "Piezometer PZ-04 (Pore Pressure)", pos: [30.5570, 79.5650], color: "#2563eb", status: "88.4% Pore Moisture" }
  ];

  HARDWARE_NODES.forEach(n => {
    L.circleMarker(n.pos, {
      radius: 8,
      fillColor: n.color,
      color: "#ffffff",
      weight: 2,
      fillOpacity: 0.95
    }).addTo(fieldMapLayers.sensors)
      .bindPopup(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.78rem; padding: 3px;">
          <strong>${n.name}</strong><br>
          Status: <span style="color: ${n.color}; font-weight: 700;">${n.status}</span><br>
          <a href="javascript:void(0)" onclick="openTaskDetail('TASK-101')" style="color: #0284c7; font-weight: 700;">Inspect Site Details →</a>
        </div>
      `);
  });

  // 3. Task Pins
  Object.keys(FIELD_TASKS).forEach(k => {
    const t = FIELD_TASKS[k];
    L.circleMarker(t.coords, {
      radius: 7,
      fillColor: t.urgency === "critical" ? "#dc2626" : "#ea580c",
      color: "#ffffff",
      weight: 2,
      fillOpacity: 1
    }).addTo(fieldMapLayers.tasks)
      .bindPopup(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.78rem; padding: 3px;">
          <strong>[${t.id}] ${t.title}</strong><br>
          Distance: <strong>${t.distance}</strong><br>
          <a href="javascript:void(0)" onclick="openTaskDetail('${t.id}')" style="color: #0284c7; font-weight: 700;">Open Task Screen →</a>
        </div>
      `);
  });

  // 4. Sector 4 Polygon
  L.polygon([
    [30.5595, 79.5610],
    [30.5620, 79.5665],
    [30.5580, 79.5690],
    [30.5540, 79.5635]
  ], {
    color: "#dc2626",
    weight: 2,
    fillColor: "#ef4444",
    fillOpacity: 0.25,
    dashArray: "4, 6"
  }).addTo(fieldMapLayers.zones);
}

function focusMapTarget(targetKey) {
  if (!fieldMapInstance) return;

  if (targetKey === "my-location") {
    fieldMapInstance.setView(OFFICER_LOCATION.pos, 16);
  } else if (targetKey === "gw-04") {
    fieldMapInstance.setView([30.5592, 79.5620], 17);
  } else if (targetKey === "sn-401") {
    fieldMapInstance.setView([30.5582, 79.5630], 17);
  } else if (targetKey === "report-904") {
    fieldMapInstance.setView([30.5550, 79.5625], 17);
  } else if (targetKey === "nh7-km42") {
    fieldMapInstance.setView([30.5518, 79.5590], 16);
  } else if (targetKey === "gw-02") {
    fieldMapInstance.setView([30.5512, 79.5585], 16);
  }
}

function recenterOnOfficerLocation() {
  if (fieldMapInstance) {
    fieldMapInstance.setView(OFFICER_LOCATION.pos, 16);
    showFieldToast("Map centered on Patrol Unit #104 GPS position.");
  }
}

// =========================================================================
// TOAST UTILITY
// =========================================================================
function showFieldToast(msg) {
  const toast = document.getElementById("fieldToast");
  if (!toast) return;

  toast.textContent = msg;
  toast.classList.add("show");

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

// Expose globals for HTML event handlers
window.switchFieldPage = switchFieldPage;
window.filterTasks = filterTasks;
window.openTaskDetail = openTaskDetail;
window.resolveTask = resolveTask;
window.handleTaskPhotoUpload = handleTaskPhotoUpload;
window.toggleHazardChip = toggleHazardChip;
window.refreshFieldGps = refreshFieldGps;
window.handleObsPhotoUpload = handleObsPhotoUpload;
window.submitFieldObservation = submitFieldObservation;
window.focusMapTarget = focusMapTarget;
window.recenterOnOfficerLocation = recenterOnOfficerLocation;
