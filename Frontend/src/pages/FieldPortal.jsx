import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../styles/field.css';
import {
  OFFICER_LOCATION,
  FIELD_HARDWARE_DEVICES,
  FIELD_CITIZEN_REPORTS,
  INITIAL_FIELD_ROADS
} from '../utils/fieldData';
import { ZONES_DATABASE } from '../utils/adminData';

export default function FieldPortal() {
  // Navigation: 'hardware', 'citizen', 'roads', 'map', 'log'
  const [activeTab, setActiveTab] = useState('hardware');

  // Hardware State
  const [hardwareDevices, setHardwareDevices] = useState(FIELD_HARDWARE_DEVICES);
  const [hardwareFilter, setHardwareFilter] = useState('all');
  const [runningDiagnostics, setRunningDiagnostics] = useState({});
  const [diagnosticLogs, setDiagnosticLogs] = useState({});

  // Citizen Reports State
  const [citizenReports, setCitizenReports] = useState(FIELD_CITIZEN_REPORTS);
  const [reportFilter, setReportFilter] = useState('all');
  const [reportInputs, setReportInputs] = useState({});

  // Road Corridors State
  const [roadCorridors, setRoadCorridors] = useState(() => {
    try {
      const saved = localStorage.getItem('resilientguard_roads_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read saved roads data:', e);
    }
    return INITIAL_FIELD_ROADS;
  });
  const [editingRoads, setEditingRoads] = useState({});

  // Ground Finding State
  const [selectedFindingTags, setSelectedFindingTags] = useState(['Tension Crack']);
  const [findingSeverity, setFindingSeverity] = useState('critical');
  const [findingNotes, setFindingNotes] = useState('');
  const [obsPhotoPreview, setObsPhotoPreview] = useState(null);

  // Map and UI state
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [mapTarget, setMapTarget] = useState('my-location');
  const [mapLayers, setMapLayers] = useState({
    hardware: true,
    reports: true,
    roads: true,
    zones: true
  });
  const [isMapReady, setIsMapReady] = useState(false);

  const fieldMapRef = useRef(null);
  const fieldMapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const showFieldToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  // Broadcast Channel & Storage synchronization
  useEffect(() => {
    let channel;
    const processIncoming = (data) => {
      if (!data) return;
      if (data.type === 'EMERGENCY_BROADCAST') {
        showFieldToast(`COMMAND ADVISORY: ${data.headline || 'Evacuation Order Dispatched'}`);
      } else if (data.type === 'CITIZEN_REPORT_SUBMITTED') {
        const newRep = {
          id: `REP-${Math.floor(920 + Math.random() * 80)}`,
          reporter: data.reporter || 'Resident (App)',
          contact: data.contact || '+91-94360-XXXXX',
          location: data.location || data.zone || 'Shillong Sector',
          coords: data.coords || [25.5780, 91.8900],
          coordsText: data.coordsText || '25.5780° N, 91.8900° E',
          timestamp: 'Just now',
          urgency: data.severity || 'high',
          category: data.category || 'Ground Observation',
          description: data.description || 'New citizen hazard report submitted.',
          evidencePhoto: data.photo || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
          tags: data.tags || ['Citizen Report'],
          status: 'pending',
          fieldVerification: null
        };
        setCitizenReports(prev => [newRep, ...prev]);
        showFieldToast(`NEW CITIZEN REPORT ASSIGNED: ${newRep.category} at ${newRep.location}`);
      } else if (data.type === 'ROAD_STATUS_UPDATED') {
        if (data.roadId && data.roadsData) {
          setRoadCorridors(data.roadsData);
        }
      }
    };

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('resilientguard_admin_alerts');
        channel.onmessage = (e) => processIncoming(e.data);
      }
    } catch (err) {
      console.warn('Field broadcast listener notice:', err);
    }

    const handleStorage = (e) => {
      if (e.key === 'resilientguard_latest_alert' && e.newValue) {
        try {
          processIncoming(JSON.parse(e.newValue));
        } catch (err) {}
      }
      if (e.key === 'resilientguard_roads_data' && e.newValue) {
        try {
          setRoadCorridors(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // -------------------------------------------------------------
  // MAP INITIALIZATION & RESIZING OBSERVER
  // -------------------------------------------------------------
  useEffect(() => {
    if (activeTab !== 'map' || !fieldMapRef.current) return;

    let resizeObserver = null;

    const containerHasCanvas = fieldMapRef.current.querySelector('.maplibregl-canvas');
    if (!fieldMapInstanceRef.current || !containerHasCanvas) {
      if (fieldMapInstanceRef.current) {
        try { fieldMapInstanceRef.current.remove(); } catch (e) {}
        fieldMapInstanceRef.current = null;
      }
      try {
        const map = new maplibregl.Map({
          container: fieldMapRef.current,
          style: {
            version: 8,
            sources: {
              'satellite-tiles': {
                type: 'raster',
                tiles: [
                  'https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                  'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                  'https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                  'https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
                ],
                tileSize: 256,
                attribution: '&copy; Google Satellite'
              }
            },
            layers: [
              {
                id: 'field-satellite-layer',
                type: 'raster',
                source: 'satellite-tiles',
                minzoom: 0,
                maxzoom: 20
              }
            ]
          },
          center: [OFFICER_LOCATION.pos[1], OFFICER_LOCATION.pos[0]],
          zoom: 14.5,
          pitch: 45,
          bearing: 10,
          attributionControl: false
        });

        map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

        map.on('load', () => {
          map.resize();
          setIsMapReady(true);
        });

        fieldMapInstanceRef.current = map;
      } catch (err) {
        console.error('MapLibre GL init error in FieldPortal:', err);
      }
    } else {
      const map = fieldMapInstanceRef.current;
      map.resize();
      const t1 = setTimeout(() => map.resize(), 50);
      const t2 = setTimeout(() => map.resize(), 200);
      const t3 = setTimeout(() => map.resize(), 500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }

    // Attach ResizeObserver to keep canvas sized accurately
    if (fieldMapRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (fieldMapInstanceRef.current) {
          fieldMapInstanceRef.current.resize();
        }
      });
      resizeObserver.observe(fieldMapRef.current);
    }

    const t1 = setTimeout(() => {
      if (fieldMapInstanceRef.current) fieldMapInstanceRef.current.resize();
    }, 100);
    const t2 = setTimeout(() => {
      if (fieldMapInstanceRef.current) fieldMapInstanceRef.current.resize();
    }, 350);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [activeTab]);

  // Clean up map on unmount only
  useEffect(() => {
    return () => {
      if (fieldMapInstanceRef.current) {
        fieldMapInstanceRef.current.remove();
        fieldMapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Map Markers & GeoJSON Layers safely
  useEffect(() => {
    const map = fieldMapInstanceRef.current;
    if (!map || !isMapReady) return;

    // Clear old HTML markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // 1. Officer Marker with animated radar pulse
    const officerEl = document.createElement('div');
    officerEl.className = 'user-marker-wrapper';
    officerEl.innerHTML = `
      <div class="user-gps-pin">
        <div class="user-gps-pulse" style="background:rgba(37,99,235,0.45); animation:radarPing 1.8s infinite;"></div>
        <div class="user-gps-dot" style="width:28px; height:28px; background:#2563eb; display:flex; align-items:center; justify-content:center; border:2.5px solid #ffffff; box-shadow:0 0 16px rgba(37,99,235,0.9); font-size:12px; color:white;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
      </div>
    `;

    const officerPopup = new maplibregl.Popup({ offset: 14 }).setHTML(`
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.82rem; padding: 4px;">
        <strong style="color:#2563eb;">${OFFICER_LOCATION.name}</strong><br/>
        Heading: ${OFFICER_LOCATION.heading}<br/>
        Lock: ${OFFICER_LOCATION.accuracy} (${OFFICER_LOCATION.elevation})
      </div>
    `);

    const offMarker = new maplibregl.Marker({ element: officerEl })
      .setLngLat([OFFICER_LOCATION.pos[1], OFFICER_LOCATION.pos[0]])
      .setPopup(officerPopup)
      .addTo(map);
    markersRef.current.push(offMarker);

    // 2. Hardware Devices Markers
    if (mapLayers.hardware) {
      hardwareDevices.forEach(dev => {
        if (!dev.coords) return;
        const color = dev.status === 'critical' ? '#dc2626' : (dev.status === 'warning' ? '#ea580c' : '#16a34a');
        const code = dev.type === 'gateway' ? 'GW' : (dev.type === 'inclinometer' ? 'INC' : (dev.type === 'piezometer' ? 'PZ' : (dev.type === 'raingauge' ? 'RG' : 'SN')));

        const devEl = document.createElement('div');
        devEl.style.cssText = `width: 28px; height: 28px; border-radius: 6px; background: ${color}; border: 2.5px solid #ffffff; box-shadow: 0 0 12px ${color}; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 800; cursor: pointer; letter-spacing: 0.5px;`;
        devEl.innerHTML = code;

        const devPopup = new maplibregl.Popup({ offset: 14 }).setHTML(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.8rem; padding: 4px; max-width: 230px;">
            <div style="font-size: 0.68rem; font-weight: 800; color: ${color}; text-transform: uppercase;">${dev.typeLabel}</div>
            <strong style="color: #0f172a; font-size: 0.88rem;">${dev.name} (${dev.id})</strong>
            <div style="margin: 4px 0; color: #475569; font-size: 0.74rem;">${dev.location}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; background: #f1f5f9; padding: 6px; border-radius: 4px; font-size: 0.72rem; margin-top: 4px;">
              <div><strong>Battery:</strong> ${dev.battery}</div>
              <div><strong>Signal:</strong> ${dev.signal}</div>
              <div style="grid-column: span 2;"><strong>Status:</strong> <span style="color:${color}; font-weight:700;">${dev.statusText}</span></div>
            </div>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: devEl })
          .setLngLat([dev.coords[1], dev.coords[0]])
          .setPopup(devPopup)
          .addTo(map);
        markersRef.current.push(marker);
      });
    }

    // 3. Citizen Reports Markers
    if (mapLayers.reports) {
      citizenReports.forEach(rep => {
        if (!rep.coords) return;
        const color = rep.status === 'verified' ? '#dc2626' : (rep.status === 'resolved' ? '#16a34a' : '#ea580c');
        const repEl = document.createElement('div');
        repEl.style.cssText = `width: 26px; height: 26px; border-radius: 50%; background: ${color}; border: 2.5px solid #ffffff; box-shadow: 0 0 12px ${color}; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer;`;
        repEl.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

        const repPopup = new maplibregl.Popup({ offset: 14 }).setHTML(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.8rem; padding: 4px; max-width: 240px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:0.68rem; font-weight:800; color:${color};">${rep.id}</span>
              <span style="font-size:0.66rem; background:#fee2e2; color:#991b1b; padding:1px 5px; border-radius:3px; font-weight:700;">${rep.status.toUpperCase()}</span>
            </div>
            <strong style="color:#0f172a; font-size:0.86rem; display:block; margin:2px 0;">${rep.category}</strong>
            <p style="font-size:0.72rem; color:#475569; margin:4px 0;">${rep.description}</p>
            <div style="font-size:0.7rem; color:#64748b;">${rep.reporter} • ${rep.contact}</div>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: repEl })
          .setLngLat([rep.coords[1], rep.coords[0]])
          .setPopup(repPopup)
          .addTo(map);
        markersRef.current.push(marker);
      });
    }

    // 4. GeoJSON Danger Zones
    const zoneFeatures = Object.keys(ZONES_DATABASE).map(k => {
      const z = ZONES_DATABASE[k];
      return {
        type: 'Feature',
        properties: {
          id: k,
          name: z.name,
          color: z.severity === 'critical' ? '#dc2626' : (z.severity === 'high' ? '#ea580c' : '#d97706'),
          fillOpacity: 0.35
        },
        geometry: {
          type: 'Polygon',
          coordinates: [z.polygon.map(p => [p[1], p[0]])]
        }
      };
    });

    const labelsLayerId = map.getLayer('field-labels-layer') ? 'field-labels-layer' : undefined;

    if (map.getSource('field-zones-source')) {
      map.getSource('field-zones-source').setData({
        type: 'FeatureCollection',
        features: mapLayers.zones ? zoneFeatures : []
      });
    } else if (mapLayers.zones) {
      map.addSource('field-zones-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: zoneFeatures
        }
      });
      map.addLayer({
        id: 'field-zones-fill',
        type: 'fill',
        source: 'field-zones-source',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': ['get', 'fillOpacity']
        }
      }, labelsLayerId);
      map.addLayer({
        id: 'field-zones-line',
        type: 'line',
        source: 'field-zones-source',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 3.5,
          'line-dasharray': [3, 2]
        }
      }, labelsLayerId);
    }

    // 5. GeoJSON Road Corridors
    const roadFeatures = roadCorridors
      .filter(r => r.coords && r.coords.length > 0)
      .map(road => ({
        type: 'Feature',
        properties: {
          id: road.id,
          name: road.name,
          status: road.status,
          color: road.status === 'Blocked' ? '#dc2626' : (road.status === 'At-Risk' ? '#ea580c' : '#16a34a')
        },
        geometry: {
          type: 'LineString',
          coordinates: road.coords.map(c => [c[1], c[0]])
        }
      }));

    if (map.getSource('field-roads-source')) {
      map.getSource('field-roads-source').setData({
        type: 'FeatureCollection',
        features: mapLayers.roads ? roadFeatures : []
      });
    } else if (mapLayers.roads) {
      map.addSource('field-roads-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: roadFeatures
        }
      });
      map.addLayer({
        id: 'field-roads-line',
        type: 'line',
        source: 'field-roads-source',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 5,
          'line-opacity': 0.95
        }
      }, labelsLayerId);
    }

    // 6. Alternate Detour Routes
    const altFeatures = roadCorridors
      .filter(r => r.alternateRoute && r.alternateRoute.coords && r.alternateRoute.coords.length > 0)
      .map(road => ({
        type: 'Feature',
        properties: {
          name: road.alternateRoute.name,
          distance: road.alternateRoute.distance
        },
        geometry: {
          type: 'LineString',
          coordinates: road.alternateRoute.coords.map(c => [c[1], c[0]])
        }
      }));

    if (map.getSource('field-alt-roads-source')) {
      map.getSource('field-alt-roads-source').setData({
        type: 'FeatureCollection',
        features: mapLayers.roads ? altFeatures : []
      });
    } else if (mapLayers.roads) {
      map.addSource('field-alt-roads-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: altFeatures
        }
      });
      map.addLayer({
        id: 'field-alt-roads-lines',
        type: 'line',
        source: 'field-alt-roads-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#06b6d4',
          'line-width': 4,
          'line-dasharray': [2, 2],
          'line-opacity': 0.9
        }
      });
    }

  }, [isMapReady, hardwareDevices, citizenReports, roadCorridors, mapLayers]);

  // -------------------------------------------------------------
  // 1. HARDWARE DIAGNOSTICS & CHECKS
  // -------------------------------------------------------------
  const runDeviceDiagnostic = (deviceId) => {
    setRunningDiagnostics(prev => ({ ...prev, [deviceId]: true }));
    setDiagnosticLogs(prev => ({
      ...prev,
      [deviceId]: [
        `[00.0s] Initializing diagnostic handshake with ${deviceId}...`,
        `[00.4s] Pinging LoRa Mesh relay station (868.1 MHz)...`,
      ]
    }));

    setTimeout(() => {
      setDiagnosticLogs(prev => ({
        ...prev,
        [deviceId]: [
          ...(prev[deviceId] || []),
          `[01.1s] RF Link Quality: RSSI -76 dBm | SNR +9.2 dB [OK]`,
          `[01.6s] ADC sensor voltage check: 3.58V nominal (LiSOCl2 cell) [OK]`,
          `[02.2s] Reading MEMS dual-axis accelerometer offsets...`,
        ]
      }));
    }, 900);

    setTimeout(() => {
      const device = hardwareDevices.find(d => d.id === deviceId);
      const isCritical = device?.status === 'critical';

      setDiagnosticLogs(prev => ({
        ...prev,
        [deviceId]: [
          ...(prev[deviceId] || []),
          isCritical
            ? `[02.9s] ALERT: Subsurface shear displacement rate 4.8°/hr exceeds safe threshold (>1.5°/hr)!`
            : `[02.9s] Telemetry streaming verified. Zero packet loss in last 128 frames.`,
          `[03.4s] Self-test complete: ${isCritical ? 'CRITICAL GEOTECHNICAL DISPLACEMENT CONFIRMED' : 'ALL SUBSYSTEMS NOMINAL'}.`
        ]
      }));
      setRunningDiagnostics(prev => ({ ...prev, [deviceId]: false }));
      showFieldToast(`Diagnostic completed for ${deviceId}`);
    }, 2200);
  };

  const handleCalibrateSensor = (deviceId) => {
    setHardwareDevices(prev => prev.map(dev => {
      if (dev.id === deviceId) {
        return {
          ...dev,
          status: 'active',
          statusText: 'Calibrated & Stream Online',
          lastPing: 'Just now'
        };
      }
      return dev;
    }));
    showFieldToast(`Calibrated sensor zero-point for ${deviceId}. Telemetry baseline reset.`);
  };

  // -------------------------------------------------------------
  // 2. CITIZEN REPORT FIELD VERIFICATION
  // -------------------------------------------------------------
  const handleReportInputChange = (reportId, field, value) => {
    setReportInputs(prev => ({
      ...prev,
      [reportId]: {
        ...(prev[reportId] || {}),
        [field]: value
      }
    }));
  };

  const handleVerifyCitizenReport = (reportId, actionType) => {
    const inputs = reportInputs[reportId] || {};
    const report = citizenReports.find(r => r.id === reportId);
    if (!report) return;

    let newStatus = 'verified';
    let statusLabel = 'VERIFIED GROUND HAZARD';
    if (actionType === 'resolve') {
      newStatus = 'resolved';
      statusLabel = 'RESOLVED / CLEAR';
    } else if (actionType === 'escalate') {
      newStatus = 'escalated';
      statusLabel = 'ESCALATED FOR EVACUATION';
    }

    const updatedVerification = {
      measuredCrackWidth: inputs.crackWidth || report.fieldVerification?.measuredCrackWidth || '8.5 cm',
      displacementRate: inputs.rate || report.fieldVerification?.displacementRate || '1.2 cm/hr',
      soilSaturation: inputs.saturation || report.fieldVerification?.soilSaturation || '85%',
      officerNotes: inputs.notes || report.fieldVerification?.officerNotes || `Ground verified by ${OFFICER_LOCATION.name}. Cones & barriers positioned.`
    };

    setCitizenReports(prev => prev.map(rep => {
      if (rep.id === reportId) {
        return {
          ...rep,
          status: newStatus,
          fieldVerification: updatedVerification
        };
      }
      return rep;
    }));

    // Broadcast update to Admin & Citizen portals
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('resilientguard_admin_alerts');
        channel.postMessage({
          type: 'CITIZEN_REPORT_VERIFIED',
          reportId: reportId,
          status: newStatus,
          statusLabel: statusLabel,
          officer: OFFICER_LOCATION.name,
          verification: updatedVerification,
          location: report.location
        });
        channel.postMessage({
          type: 'FIELD_TASK_RESOLVED',
          taskId: reportId,
          taskTitle: report.category,
          resolution: statusLabel,
          officer: OFFICER_LOCATION.name,
          notes: updatedVerification.officerNotes
        });
        channel.close();
      }
    } catch (err) {
      console.warn('Broadcast report verification notice:', err);
    }

    showFieldToast(`Report ${reportId} marked as ${statusLabel}`);
  };

  // -------------------------------------------------------------
  // 3. ROAD CORRIDOR & AVAILABILITY MANAGEMENT
  // -------------------------------------------------------------
  const handleRoadEditChange = (roadId, field, value) => {
    setEditingRoads(prev => ({
      ...prev,
      [roadId]: {
        ...(prev[roadId] || {}),
        [field]: value
      }
    }));
  };

  const handleUpdateRoadStatus = (roadId, newStatus) => {
    const editData = editingRoads[roadId] || {};
    const updated = roadCorridors.map(road => {
      if (road.id === roadId) {
        const badgeClass = newStatus === 'Blocked' ? 'blocked' : (newStatus === 'At-Risk' ? 'at-risk' : 'open');
        const transitStatus = newStatus === 'Blocked' ? 'Closed for Transit' : (newStatus === 'At-Risk' ? 'Single-Lane Escort' : 'Open & Clear');
        return {
          ...road,
          status: newStatus,
          badgeClass: badgeClass,
          transitStatus: editData.transitStatus || transitStatus,
          clearanceETA: editData.clearanceETA || road.clearanceETA,
          blockageReason: editData.blockageReason || road.blockageReason,
          advisory: editData.advisory || road.advisory
        };
      }
      return road;
    });

    setRoadCorridors(updated);
    try {
      localStorage.setItem('resilientguard_roads_data', JSON.stringify(updated));
    } catch (e) {}

    // Broadcast live road status update across all browser tabs
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('resilientguard_admin_alerts');
        channel.postMessage({
          type: 'ROAD_STATUS_UPDATED',
          roadId: roadId,
          newStatus: newStatus,
          roadsData: updated,
          officer: OFFICER_LOCATION.name,
          timestamp: new Date().toLocaleTimeString()
        });
        channel.close();
      }
    } catch (err) {
      console.warn('Road broadcast notice:', err);
    }

    showFieldToast(`Road "${roadId}" updated to [${newStatus.toUpperCase()}] and synced across all portals.`);
  };

  // -------------------------------------------------------------
  // 4. LOG GROUND OBSERVATION
  // -------------------------------------------------------------
  const handleFindingSubmit = (e) => {
    e.preventDefault();
    const newReportId = `REP-${Math.floor(950 + Math.random() * 40)}`;
    const newReport = {
      id: newReportId,
      reporter: `${OFFICER_LOCATION.name} (Field Patrol)`,
      contact: '+91-SDRF-COMMAND',
      location: 'Shillong Urban Ridge Sector',
      coords: OFFICER_LOCATION.pos,
      coordsText: `${OFFICER_LOCATION.pos[0]}° N, ${OFFICER_LOCATION.pos[1]}° E`,
      timestamp: 'Just now',
      urgency: findingSeverity,
      category: selectedFindingTags.join(', '),
      description: findingNotes || 'Ground inspection finding logged by patrol unit.',
      evidencePhoto: obsPhotoPreview || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
      tags: selectedFindingTags,
      status: 'verified',
      fieldVerification: {
        measuredCrackWidth: '10.5 cm',
        displacementRate: '1.8 cm/hr',
        soilSaturation: '86%',
        officerNotes: findingNotes || 'Observation logged and verified in field.'
      }
    };

    setCitizenReports(prev => [newReport, ...prev]);

    // Broadcast to Admin & Citizen portals
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('resilientguard_admin_alerts');
        channel.postMessage({
          type: 'CITIZEN_REPORT_SUBMITTED',
          reporter: newReport.reporter,
          contact: newReport.contact,
          zone: 'Shillong Urban Ridge',
          location: newReport.location,
          coords: OFFICER_LOCATION.pos,
          coordsText: newReport.coordsText,
          category: newReport.category,
          tags: selectedFindingTags,
          severity: findingSeverity,
          description: newReport.description,
          photo: newReport.evidencePhoto
        });
        channel.close();
      }
    } catch (err) {
      console.warn('Field finding broadcast error:', err);
    }

    showFieldToast('Observation logged and synced with DDMA Command Center.');
    setFindingNotes('');
    setObsPhotoPreview(null);
    setActiveTab('citizen');
  };

  const toggleFindingTag = (tag) => {
    if (selectedFindingTags.includes(tag)) {
      if (selectedFindingTags.length > 1) {
        setSelectedFindingTags(prev => prev.filter(t => t !== tag));
      }
    } else {
      setSelectedFindingTags(prev => [...prev, tag]);
    }
  };

  const handleFocusMapTarget = (targetVal) => {
    setMapTarget(targetVal);
    if (!fieldMapInstanceRef.current) return;
    const map = fieldMapInstanceRef.current;

    if (targetVal === 'my-location') {
      map.flyTo({ center: [OFFICER_LOCATION.pos[1], OFFICER_LOCATION.pos[0]], zoom: 15, pitch: 50, essential: true });
      showFieldToast('Centered on Officer GPS Location');
    } else if (targetVal === 'gw-sh01') {
      map.flyTo({ center: [91.8900, 25.5830], zoom: 16, pitch: 55, essential: true });
      showFieldToast('Focused on Gateway GW-SH01');
    } else if (targetVal === 'sh-101') {
      map.flyTo({ center: [91.8910, 25.5810], zoom: 16, pitch: 55, essential: true });
      showFieldToast('Focused on Inclinometer SH-101');
    } else if (targetVal === 'rep-904') {
      map.flyTo({ center: [91.8900, 25.5750], zoom: 16, pitch: 55, essential: true });
      showFieldToast('Focused on Citizen Report #904');
    } else if (targetVal === 'gs-road') {
      map.flyTo({ center: [91.8900, 25.5750], zoom: 15, pitch: 45, essential: true });
      showFieldToast('Focused on GS Road Urban Corridor');
    }
  };

  const jumpToMapDevice = (coords, name) => {
    setActiveTab('map');
    setTimeout(() => {
      if (fieldMapInstanceRef.current && coords) {
        fieldMapInstanceRef.current.resize();
        fieldMapInstanceRef.current.flyTo({
          center: [coords[1], coords[0]],
          zoom: 16,
          pitch: 55,
          essential: true
        });
        showFieldToast(`Focused on ${name}`);
      }
    }, 150);
  };

  const jumpToMapReport = (coords, reportId) => {
    setActiveTab('map');
    setTimeout(() => {
      if (fieldMapInstanceRef.current && coords) {
        fieldMapInstanceRef.current.resize();
        fieldMapInstanceRef.current.flyTo({
          center: [coords[1], coords[0]],
          zoom: 16,
          pitch: 55,
          essential: true
        });
        showFieldToast(`Focused on ${reportId}`);
      }
    }, 150);
  };

  // Filtered devices & reports
  const filteredHardware = hardwareDevices.filter(dev => {
    if (hardwareFilter === 'all') return true;
    return dev.type === hardwareFilter;
  });

  const filteredReports = citizenReports.filter(rep => {
    if (reportFilter === 'all') return true;
    return rep.status === reportFilter;
  });

  return (
    <div className="field-body">
      {/* Top Field Command Bar */}
      <header className="field-header">
        <div className="field-brand-wrap">
          <div className="field-badge-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="field-brand-title">ResilientGuard</span>
              <span className="field-role-tag">Field Officer &amp; SDRF</span>
            </div>
            <div className="field-officer-id">{OFFICER_LOCATION.name}</div>
          </div>
        </div>

        {/* Navigation Tab Bar */}
        <nav className="field-nav-tabs">
          <button
            type="button"
            className={`field-tab-btn ${activeTab === 'hardware' ? 'active' : ''}`}
            onClick={() => setActiveTab('hardware')}
          >
            Hardware &amp; Devices
            <span className="tab-badge-count" style={{ background: '#dc2626' }}>
              {hardwareDevices.filter(d => d.status === 'critical' || d.status === 'warning').length}
            </span>
          </button>

          <button
            type="button"
            className={`field-tab-btn ${activeTab === 'citizen' ? 'active' : ''}`}
            onClick={() => setActiveTab('citizen')}
          >
            Assigned Reports
            <span className="tab-badge-count" style={{ background: '#ea580c' }}>
              {citizenReports.filter(r => r.status === 'pending' || r.status === 'investigating').length}
            </span>
          </button>

          <button
            type="button"
            className={`field-tab-btn ${activeTab === 'roads' ? 'active' : ''}`}
            onClick={() => setActiveTab('roads')}
          >
            Roads &amp; Availability
            <span className="tab-badge-count" style={{ background: '#2563eb' }}>
              {roadCorridors.filter(r => r.status === 'Blocked' || r.status === 'At-Risk').length}
            </span>
          </button>

          <button
            type="button"
            className={`field-tab-btn ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            Tactical Map
          </button>

          <button
            type="button"
            className={`field-tab-btn ${activeTab === 'log' ? 'active' : ''}`}
            onClick={() => setActiveTab('log')}
          >
            Log Finding
          </button>
        </nav>

        {/* Header Actions & Offline Sync Indicator */}
        <div className="field-header-actions">
          <div className="field-sync-pill" title="LoRa Mesh &amp; Cloud Relay Online">
            <span className="sync-dot"></span>
            <span>Mesh Online</span>
          </div>

          <Link to="/login" className="btn-field-link btn-logout" title="Sign out / Switch Role">
            Logout
          </Link>
        </div>
      </header>

      {/* =====================================================================
           TAB 1: HARDWARE & SENSOR DEVICES (MAJOR VIEW & DIAGNOSTICS)
           ===================================================================== */}
      <main className={`field-page-view ${activeTab === 'hardware' ? 'active' : ''}`}>
        <div className="field-container">
          {/* Quick Hardware Stats Bar */}
          <div className="field-hardware-stats-bar">
            <div className="hardware-stat-card">
              <span className="hardware-stat-label">Total Hardware Nodes</span>
              <span className="hardware-stat-val" style={{ color: '#0f172a' }}>{hardwareDevices.length} Stations</span>
            </div>
            <div className="hardware-stat-card">
              <span className="hardware-stat-label">Critical Tilt / Pore Alarms</span>
              <span className="hardware-stat-val" style={{ color: '#dc2626' }}>
                {hardwareDevices.filter(d => d.status === 'critical').length} Critical
              </span>
            </div>
            <div className="hardware-stat-card">
              <span className="hardware-stat-label">LoRa Gateways Active</span>
              <span className="hardware-stat-val" style={{ color: '#0284c7' }}>
                {hardwareDevices.filter(d => d.type === 'gateway').length} Gateways
              </span>
            </div>
            <div className="hardware-stat-card">
              <span className="hardware-stat-label">Mesh Health &amp; Battery</span>
              <span className="hardware-stat-val" style={{ color: '#16a34a' }}>98.2% Nominal</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="field-filter-bar">
            <div className="filter-pills-row">
              <button
                type="button"
                className={`filter-pill ${hardwareFilter === 'all' ? 'active' : ''}`}
                onClick={() => setHardwareFilter('all')}
              >
                All Hardware ({hardwareDevices.length})
              </button>
              <button
                type="button"
                className={`filter-pill ${hardwareFilter === 'gateway' ? 'active' : ''}`}
                onClick={() => setHardwareFilter('gateway')}
              >
                Gateways ({hardwareDevices.filter(d => d.type === 'gateway').length})
              </button>
              <button
                type="button"
                className={`filter-pill ${hardwareFilter === 'inclinometer' ? 'active' : ''}`}
                onClick={() => setHardwareFilter('inclinometer')}
              >
                Inclinometers ({hardwareDevices.filter(d => d.type === 'inclinometer').length})
              </button>
              <button
                type="button"
                className={`filter-pill ${hardwareFilter === 'piezometer' ? 'active' : ''}`}
                onClick={() => setHardwareFilter('piezometer')}
              >
                Piezometers ({hardwareDevices.filter(d => d.type === 'piezometer').length})
              </button>
              <button
                type="button"
                className={`filter-pill ${hardwareFilter === 'raingauge' ? 'active' : ''}`}
                onClick={() => setHardwareFilter('raingauge')}
              >
                Rain Gauges ({hardwareDevices.filter(d => d.type === 'raingauge').length})
              </button>
              <button
                type="button"
                className={`filter-pill ${hardwareFilter === 'extensometer' ? 'active' : ''}`}
                onClick={() => setHardwareFilter('extensometer')}
              >
                Extensometers ({hardwareDevices.filter(d => d.type === 'extensometer').length})
              </button>
              <button
                type="button"
                className={`filter-pill ${hardwareFilter === 'geophone' ? 'active' : ''}`}
                onClick={() => setHardwareFilter('geophone')}
              >
                Geophones ({hardwareDevices.filter(d => d.type === 'geophone').length})
              </button>
              <button
                type="button"
                className={`filter-pill ${hardwareFilter === 'arduino' ? 'active' : ''}`}
                onClick={() => setHardwareFilter('arduino')}
              >
                Edge IoT Nodes ({hardwareDevices.filter(d => d.type === 'arduino').length})
              </button>
            </div>
            <div className="sort-tag-text">Real-time Telemetry Stream: <strong>Active (2.4s interval)</strong></div>
          </div>

          {/* Hardware Cards Grid */}
          <div className="hardware-cards-grid">
            {filteredHardware.map((device) => {
              const isRunning = runningDiagnostics[device.id];
              const logs = diagnosticLogs[device.id];

              return (
                <div
                  key={device.id}
                  className={`hardware-card ${device.status === 'critical' ? 'critical' : (device.status === 'warning' ? 'warning' : 'active')}`}
                >
                  <div className="hardware-card-header">
                    <div>
                      <div className="hardware-device-id">{device.id} • {device.typeLabel}</div>
                      <h3 className="hardware-device-title">{device.name}</h3>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {device.location} ({device.coordsText})
                      </div>
                    </div>
                    <span className={`status-pill ${device.status === 'critical' ? 'critical' : (device.status === 'warning' ? 'high' : 'open')}`}>
                      {device.statusText}
                    </span>
                  </div>

                  {/* Telemetry Breakdown Box */}
                  <div className="hardware-telemetry-box">
                    <div className="telemetry-item">
                      <span className="telemetry-item-label">Battery Voltage</span>
                      <span className="telemetry-item-val" style={{ color: device.batteryPct < 70 ? '#ea580c' : '#16a34a' }}>
                        {device.battery} ({device.batteryPct}%)
                      </span>
                    </div>
                    <div className="telemetry-item">
                      <span className="telemetry-item-label">LoRa Signal (RSSI)</span>
                      <span className="telemetry-item-val">{device.signal}</span>
                    </div>
                    {device.telemetry?.tiltRate && (
                      <div className="telemetry-item">
                        <span className="telemetry-item-label">Tilt Acceleration Rate</span>
                        <span className="telemetry-item-val" style={{ color: '#dc2626' }}>{device.telemetry.tiltRate}</span>
                      </div>
                    )}
                    {device.telemetry?.porePressure && (
                      <div className="telemetry-item">
                        <span className="telemetry-item-label">Pore Water Pressure</span>
                        <span className="telemetry-item-val" style={{ color: '#dc2626' }}>{device.telemetry.porePressure}</span>
                      </div>
                    )}
                    {device.telemetry?.currentRainfall && (
                      <div className="telemetry-item">
                        <span className="telemetry-item-label">Precipitation Rate</span>
                        <span className="telemetry-item-val">{device.telemetry.currentRainfall}</span>
                      </div>
                    )}
                    {device.telemetry?.crackDisplacement && (
                      <div className="telemetry-item">
                        <span className="telemetry-item-label">Crack Displacement</span>
                        <span className="telemetry-item-val" style={{ color: '#ea580c' }}>{device.telemetry.crackDisplacement}</span>
                      </div>
                    )}
                    {device.telemetry?.acousticEvents && (
                      <div className="telemetry-item">
                        <span className="telemetry-item-label">Acoustic Fracture Events</span>
                        <span className="telemetry-item-val" style={{ color: '#dc2626' }}>{device.telemetry.acousticEvents}</span>
                      </div>
                    )}
                    {device.telemetry?.loraFrequency && (
                      <div className="telemetry-item">
                        <span className="telemetry-item-label">Frequency / Uptime</span>
                        <span className="telemetry-item-val">{device.telemetry.loraFrequency} ({device.telemetry.uptime})</span>
                      </div>
                    )}
                  </div>

                  {/* Connected Sensors List */}
                  {device.sensorsAttached && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      <strong>Sensors &amp; Probes:</strong> {device.sensorsAttached.join(', ')}
                    </div>
                  )}

                  {/* Notes */}
                  {device.notes && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                      {device.notes}
                    </p>
                  )}

                  {/* Conduct Checks Button & Actions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      className="btn-run-diagnostics"
                      onClick={() => runDeviceDiagnostic(device.id)}
                      disabled={isRunning}
                    >
                      {isRunning ? 'Running Diagnostic...' : 'Conduct Ping & Diagnostic Check'}
                    </button>
                    <button
                      type="button"
                      className="btn-field-link"
                      onClick={() => handleCalibrateSensor(device.id)}
                      title="Calibrate Zero Point"
                      style={{ padding: '0 12px' }}
                    >
                      Calibrate
                    </button>
                    <button
                      type="button"
                      className="btn-field-link"
                      onClick={() => jumpToMapDevice(device.coords, device.name)}
                      title="Locate on Tactical Map"
                      style={{ padding: '0 12px' }}
                    >
                      Map
                    </button>
                  </div>

                  {/* Live Diagnostic Logs Console */}
                  {logs && (
                    <div className="diagnostic-test-panel">
                      <strong style={{ color: '#7dd3fc', fontSize: '0.76rem', marginBottom: '2px' }}>
                        Diagnostic Stream: {device.id}
                      </strong>
                      {logs.map((line, idx) => (
                        <div key={idx} style={{ fontFamily: 'var(--font-mono)' }}>{line}</div>
                      ))}
                    </div>
                  )}

                  <div className="hardware-meta-row">
                    <span>Ping: <strong>{device.lastPing}</strong></span>
                    <span>Nodes Linked: <strong>{device.connectedNodes}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* =====================================================================
           TAB 2: ASSIGNED CITIZEN REPORTS & VERIFICATION
           ===================================================================== */}
      <main className={`field-page-view ${activeTab === 'citizen' ? 'active' : ''}`}>
        <div className="field-container">
          {/* Quick Header */}
          <div className="field-filter-bar">
            <div className="filter-pills-row">
              <button
                type="button"
                className={`filter-pill ${reportFilter === 'all' ? 'active' : ''}`}
                onClick={() => setReportFilter('all')}
              >
                All Assigned ({citizenReports.length})
              </button>
              <button
                type="button"
                className={`filter-pill ${reportFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setReportFilter('pending')}
              >
                Pending Check ({citizenReports.filter(r => r.status === 'pending').length})
              </button>
              <button
                type="button"
                className={`filter-pill ${reportFilter === 'investigating' ? 'active' : ''}`}
                onClick={() => setReportFilter('investigating')}
              >
                Investigating ({citizenReports.filter(r => r.status === 'investigating').length})
              </button>
              <button
                type="button"
                className={`filter-pill ${reportFilter === 'verified' ? 'active' : ''}`}
                onClick={() => setReportFilter('verified')}
              >
                Verified Hazards ({citizenReports.filter(r => r.status === 'verified').length})
              </button>
              <button
                type="button"
                className={`filter-pill ${reportFilter === 'resolved' ? 'active' : ''}`}
                onClick={() => setReportFilter('resolved')}
              >
                Resolved ({citizenReports.filter(r => r.status === 'resolved').length})
              </button>
            </div>
            <div className="sort-tag-text">Citizen SOS Triage: <strong>Direct Officer Assignment</strong></div>
          </div>

          {/* Citizen Reports Grid */}
          <div className="citizen-reports-grid">
            {filteredReports.map((report) => {
              const currentInput = reportInputs[report.id] || {};

              return (
                <div
                  key={report.id}
                  className={`citizen-report-card ${report.status === 'verified' ? 'critical' : (report.urgency === 'critical' ? 'critical' : 'high')}`}
                >
                  <div className="task-card-top-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="task-id-badge">{report.id}</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {report.reporter} • {report.contact}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span className={`status-pill ${report.status === 'verified' ? 'critical' : (report.status === 'resolved' ? 'open' : 'high')}`}>
                        {report.status.toUpperCase()}
                      </span>
                      <button
                        type="button"
                        className="btn-field-link"
                        onClick={() => jumpToMapReport(report.coords, report.id)}
                        style={{ padding: '2px 8px' }}
                      >
                        View Map
                      </button>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0' }}>
                    {report.category}
                  </h3>

                  <div className="report-evidence-wrap">
                    {report.evidencePhoto && (
                      <img
                        src={report.evidencePhoto}
                        alt="Citizen Ground Evidence"
                        className="report-thumbnail-img"
                      />
                    )}
                    <div className="report-details-body">
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {report.location} • {report.timestamp}
                      </div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0', lineHeight: 1.45 }}>
                        {report.description}
                      </p>
                      {report.tags && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                          {report.tags.map(t => (
                            <span key={t} style={{ fontSize: '0.7rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, color: '#475569' }}>
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Field Verification & Measurements Input Box */}
                  <div className="ground-check-box">
                    <span className="ground-check-title">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                      Conduct Officer Field Verification Check
                    </span>

                    <div className="ground-check-inputs-grid">
                      <div className="check-input-group">
                        <label className="check-input-label">Measured Crack Width</label>
                        <input
                          type="text"
                          className="check-input-field"
                          placeholder={report.fieldVerification?.measuredCrackWidth || "e.g. 9.2 cm"}
                          value={currentInput.crackWidth !== undefined ? currentInput.crackWidth : (report.fieldVerification?.measuredCrackWidth || '')}
                          onChange={(e) => handleReportInputChange(report.id, 'crackWidth', e.target.value)}
                        />
                      </div>

                      <div className="check-input-group">
                        <label className="check-input-label">Displacement Velocity</label>
                        <input
                          type="text"
                          className="check-input-field"
                          placeholder={report.fieldVerification?.displacementRate || "e.g. 1.4 cm/hr"}
                          value={currentInput.rate !== undefined ? currentInput.rate : (report.fieldVerification?.displacementRate || '')}
                          onChange={(e) => handleReportInputChange(report.id, 'rate', e.target.value)}
                        />
                      </div>

                      <div className="check-input-group">
                        <label className="check-input-label">Soil Saturation %</label>
                        <input
                          type="text"
                          className="check-input-field"
                          placeholder={report.fieldVerification?.soilSaturation || "e.g. 88%"}
                          value={currentInput.saturation !== undefined ? currentInput.saturation : (report.fieldVerification?.soilSaturation || '')}
                          onChange={(e) => handleReportInputChange(report.id, 'saturation', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="check-input-group" style={{ marginTop: '4px' }}>
                      <label className="check-input-label">Officer Inspection Log &amp; Safety Actions Taken:</label>
                      <input
                        type="text"
                        className="check-input-field"
                        placeholder={report.fieldVerification?.officerNotes || "e.g. Visual inspection confirmed road tension fault. Barricades placed."}
                        value={currentInput.notes !== undefined ? currentInput.notes : (report.fieldVerification?.officerNotes || '')}
                        onChange={(e) => handleReportInputChange(report.id, 'notes', e.target.value)}
                      />
                    </div>

                    {/* Action Verification Buttons */}
                    <div className="report-action-buttons-row">
                      <button
                        type="button"
                        className="btn-report-action danger"
                        onClick={() => handleVerifyCitizenReport(report.id, 'verify')}
                      >
                        Confirm Hazard &amp; Deploy PWD
                      </button>
                      <button
                        type="button"
                        className="btn-report-action success"
                        onClick={() => handleVerifyCitizenReport(report.id, 'resolve')}
                      >
                        Mark Resolved / Clear
                      </button>
                      <button
                        type="button"
                        className="btn-report-action warning"
                        onClick={() => handleVerifyCitizenReport(report.id, 'escalate')}
                      >
                        Escalate Evacuation
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* =====================================================================
           TAB 3: ROAD CORRIDORS & AVAILABILITY STATUS UPDATE
           ===================================================================== */}
      <main className={`field-page-view ${activeTab === 'roads' ? 'active' : ''}`}>
        <div className="field-container">
          <div style={{ background: '#0f172a', color: '#ffffff', padding: '16px 20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Road Corridor Transit &amp; Availability Control</h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '4px 0 0' }}>
                Field officers have direct clearance authority. Updates instantly re-route civilian navigation &amp; emergency convoys.
              </p>
            </div>
            <span style={{ fontSize: '0.74rem', background: '#1e293b', border: '1px solid #334155', color: '#38bdf8', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>
              Live Cloud Sync Active
            </span>
          </div>

          {/* Road Corridors Grid */}
          <div className="field-roads-grid">
            {roadCorridors.map((road) => {
              const edit = editingRoads[road.id] || {};
              const currentStatus = edit.status || road.status;

              return (
                <div
                  key={road.id}
                  className={`field-road-card ${road.status === 'Blocked' ? 'blocked' : (road.status === 'At-Risk' ? 'atrisk' : 'open')}`}
                >
                  <div className="road-header-row">
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {road.locationMeta}
                      </div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0' }}>
                        {road.name}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Hindi: {road.nameHi}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`status-pill ${road.status === 'Blocked' ? 'critical' : (road.status === 'At-Risk' ? 'high' : 'open')}`}>
                        {road.status.toUpperCase()}
                      </span>
                      <button
                        type="button"
                        className="btn-field-link"
                        onClick={() => {
                          setActiveTab('map');
                          setTimeout(() => {
                            if (fieldMapInstanceRef.current && road.center) {
                              fieldMapInstanceRef.current.resize();
                              fieldMapInstanceRef.current.flyTo({ center: [road.center[1], road.center[0]], zoom: 15, pitch: 45, essential: true });
                            }
                          }, 150);
                        }}
                      >
                        View Corridor
                      </button>
                    </div>
                  </div>

                  {/* Road Condition Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.78rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>Blockage / Hazard Cause:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{road.blockageReason}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>Debris Mass:</span>
                      <strong>{road.debrisVolume}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>Current Clearance ETA:</span>
                      <strong style={{ color: '#0284c7' }}>{road.clearanceETA}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>Transit Mode:</span>
                      <strong>{road.transitStatus}</strong>
                    </div>
                  </div>

                  {/* Alternate Route Info */}
                  {road.alternateRoute && (
                    <div style={{ background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: '8px', padding: '10px 14px', fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: '#0e7490' }}>Active Detour: {road.alternateRoute.name}</strong>
                        <span style={{ fontWeight: 800, color: '#0891b2' }}>{road.alternateRoute.distance} ({road.alternateRoute.extraTime})</span>
                      </div>
                      <div style={{ color: '#155e75', marginTop: '2px' }}>{road.alternateRoute.notes}</div>
                    </div>
                  )}

                  {/* Officer Road Status & Availability Updater */}
                  <div className="road-status-controls-box">
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Update Road Corridor Status &amp; Availability:
                    </span>

                    {/* Status Selector Buttons */}
                    <div className="road-status-btn-group">
                      <button
                        type="button"
                        className={`road-status-select-btn blocked-btn ${currentStatus === 'Blocked' ? 'selected' : ''}`}
                        onClick={() => handleRoadEditChange(road.id, 'status', 'Blocked')}
                      >
                        BLOCKED (Hazard Active)
                      </button>
                      <button
                        type="button"
                        className={`road-status-select-btn atrisk-btn ${currentStatus === 'At-Risk' ? 'selected' : ''}`}
                        onClick={() => handleRoadEditChange(road.id, 'status', 'At-Risk')}
                      >
                        AT-RISK (Single-Lane Escort)
                      </button>
                      <button
                        type="button"
                        className={`road-status-select-btn open-btn ${currentStatus === 'Open' ? 'selected' : ''}`}
                        onClick={() => handleRoadEditChange(road.id, 'status', 'Open')}
                      >
                        OPEN &amp; AVAILABLE (Clear)
                      </button>
                    </div>

                    {/* Edit fields */}
                    <div className="road-edit-fields-row">
                      <div>
                        <label className="check-input-label">Clearance ETA &amp; PWD Machinery Status:</label>
                        <input
                          type="text"
                          className="road-edit-input"
                          placeholder={road.clearanceETA}
                          value={edit.clearanceETA !== undefined ? edit.clearanceETA : ''}
                          onChange={(e) => handleRoadEditChange(road.id, 'clearanceETA', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="check-input-label">Transit Advisory / Public Guidance:</label>
                        <input
                          type="text"
                          className="road-edit-input"
                          placeholder={road.advisory || "e.g. Use Peak Link Bypass (+15m)"}
                          value={edit.advisory !== undefined ? edit.advisory : ''}
                          onChange={(e) => handleRoadEditChange(road.id, 'advisory', e.target.value)}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-broadcast-road-update"
                      onClick={() => handleUpdateRoadStatus(road.id, currentStatus)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                      Broadcast Road Status Update to All Portals
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* =====================================================================
           TAB 4: TACTICAL MAP VIEW OF EVERYTHING
           ===================================================================== */}
      <main className={`field-page-view ${activeTab === 'map' ? 'active' : ''}`} style={{ flex: 1, height: 'calc(100vh - 65px)', padding: 0 }}>
        <div className="field-map-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
          <div id="fieldTacticalMap" ref={fieldMapRef} style={{ width: '100%', height: '100%' }}></div>

          {/* Floating Top Control Bar */}
          <div className="field-map-top-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>Focus:</span>
              <select
                className="field-map-select"
                value={mapTarget}
                onChange={(e) => handleFocusMapTarget(e.target.value)}
              >
                <option value="my-location">Officer Patrol GPS (Shillong)</option>
                <option value="gw-sh01">Gateway GW-SH01 (Mast)</option>
                <option value="sh-101">Inclinometer SH-101 (Borehole)</option>
                <option value="rep-904">Citizen Report #904 (GS Road)</option>
                <option value="gs-road">GS Road Urban Corridor</option>
              </select>

              {/* Layer Toggles */}
              <div className="tactical-map-layer-bar">
                <button
                  type="button"
                  className={`map-layer-toggle-btn ${mapLayers.hardware ? 'active' : ''}`}
                  onClick={() => setMapLayers(prev => ({ ...prev, hardware: !prev.hardware }))}
                >
                  Hardware ({hardwareDevices.length})
                </button>
                <button
                  type="button"
                  className={`map-layer-toggle-btn ${mapLayers.reports ? 'active' : ''}`}
                  onClick={() => setMapLayers(prev => ({ ...prev, reports: !prev.reports }))}
                >
                  Reports ({citizenReports.length})
                </button>
                <button
                  type="button"
                  className={`map-layer-toggle-btn ${mapLayers.roads ? 'active' : ''}`}
                  onClick={() => setMapLayers(prev => ({ ...prev, roads: !prev.roads }))}
                >
                  Roads &amp; Detours
                </button>
                <button
                  type="button"
                  className={`map-layer-toggle-btn ${mapLayers.zones ? 'active' : ''}`}
                  onClick={() => setMapLayers(prev => ({ ...prev, zones: !prev.zones }))}
                >
                  Danger Zones
                </button>
              </div>
            </div>

            <button
              type="button"
              className="btn-locate-gps"
              onClick={() => handleFocusMapTarget('my-location')}
            >
              Center GPS
            </button>
          </div>

          {/* Floating Map Legend */}
          <div className="field-map-legend">
            <span><strong style={{ color: '#2563eb' }}>[GPS]</strong> My GPS</span>
            <span><strong style={{ color: '#dc2626' }}>[NODE]</strong> Hardware</span>
            <span><strong style={{ color: '#ea580c' }}>[REP]</strong> Citizen Reports</span>
            <span><strong style={{ color: '#dc2626' }}>━</strong> Blocked Road</span>
            <span><strong style={{ color: '#ea580c' }}>━</strong> At-Risk Road</span>
            <span><strong style={{ color: '#16a34a' }}>━</strong> Open Road</span>
            <span><strong style={{ color: '#06b6d4' }}>╍</strong> Alternate Route</span>
          </div>
        </div>
      </main>

      {/* =====================================================================
           TAB 5: LOG GROUND FINDING
           ===================================================================== */}
      <main className={`field-page-view ${activeTab === 'log' ? 'active' : ''}`}>
        <div className="field-container" style={{ maxWidth: '800px' }}>
          <div className="field-card">
            <div className="field-card-header-clean">
              <div>
                <h2>Log Field Observation &amp; Ground Check</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Record new hazard discovery. Automatically buffered offline and synced across DDMA command.
                </p>
              </div>
              <span className="status-pill open">Buffer Ready</span>
            </div>

            <form onSubmit={handleFindingSubmit}>
              {/* Auto-Filled GPS Location */}
              <div className="form-group">
                <label className="form-label">GPS Location (Auto-detected):</label>
                <div className="gps-readout-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                      {OFFICER_LOCATION.pos[0]}° N, {OFFICER_LOCATION.pos[1]}° E ({OFFICER_LOCATION.elevation} • {OFFICER_LOCATION.accuracy})
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-refresh-gps"
                    onClick={() => showFieldToast('GPS fixed with RTK precision.')}
                  >
                    Refresh GPS
                  </button>
                </div>
              </div>

              {/* Quick-Select Hazard Tags */}
              <div className="form-group">
                <label className="form-label">Hazard Tags (Select all that apply):</label>
                <div className="hazard-chips-grid">
                  {['Tension Crack', 'Water Seepage', 'Soil Creep', 'Road Blocked', 'Damaged Sensor / Gateway', 'Rockfall Debris', 'Retaining Wall Bulge'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className={`hazard-chip ${selectedFindingTags.includes(tag) ? 'active' : ''}`}
                      onClick={() => toggleFindingTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity Rating */}
              <div className="form-group">
                <label className="form-label">Urgency &amp; Severity:</label>
                <div className="severity-radio-group">
                  <label className="severity-radio-label critical">
                    <input
                      type="radio"
                      name="obsSeverity"
                      value="critical"
                      checked={findingSeverity === 'critical'}
                      onChange={() => setFindingSeverity('critical')}
                    />
                    <span>Critical / Immediate</span>
                  </label>
                  <label className="severity-radio-label warning">
                    <input
                      type="radio"
                      name="obsSeverity"
                      value="high"
                      checked={findingSeverity === 'high'}
                      onChange={() => setFindingSeverity('high')}
                    />
                    <span>Elevated Watch</span>
                  </label>
                  <label className="severity-radio-label info">
                    <input
                      type="radio"
                      name="obsSeverity"
                      value="moderate"
                      checked={findingSeverity === 'moderate'}
                      onChange={() => setFindingSeverity('moderate')}
                    />
                    <span>Routine Note</span>
                  </label>
                </div>
              </div>

              {/* Observation Photo Attachment */}
              <div className="form-group">
                <label className="form-label">Ground Photo Evidence:</label>
                <div className="photo-upload-box" onClick={() => document.getElementById('obsPhotoFileInput').click()}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>{obsPhotoPreview ? 'Ground photo attached ✓' : 'Tap to attach photo'}</span>
                  <input
                    type="file"
                    id="obsPhotoFileInput"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files.length > 0) {
                        setObsPhotoPreview(URL.createObjectURL(e.target.files[0]));
                        showFieldToast('Attached observation photo.');
                      }
                    }}
                  />
                </div>
              </div>

              {/* Descriptive Notes */}
              <div className="form-group">
                <label className="form-label" htmlFor="obsNotesInputField">Field Notes &amp; Measurements:</label>
                <textarea
                  className="form-textarea"
                  id="obsNotesInputField"
                  rows="3"
                  value={findingNotes}
                  onChange={(e) => setFindingNotes(e.target.value)}
                  placeholder="e.g. 3.2m continuous tension crack along GS Road outer cut, 9cm wide, muddy slurry discharging downhill..."
                ></textarea>
              </div>

              {/* Submit Button */}
              <div style={{ marginTop: '14px' }}>
                <button type="submit" className="btn-field-submit">
                  Submit Observation to DDMA Command Center
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Field Operational Toast Notification */}
      <div className={`field-toast ${showToast ? 'show' : ''}`}>
        {toastMessage}
      </div>
    </div>
  );
}
