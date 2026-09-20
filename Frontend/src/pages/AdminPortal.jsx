import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../styles/admin.css';
import {
  ZONES_DATABASE,
  INITIAL_CITIZEN_REPORTS,
  INITIAL_DISPATCHED_ALERTS,
  INITIAL_CITIZEN_EVACUATION_TRACKING
} from '../utils/adminData';
import { connectArduino, sendToArduino } from '../utils/arduinoSerial';

export default function AdminPortal() {
  const [activePage, setActivePage] = useState('page1'); // 'page1': Overview, 'page2': Zone Details, 'page4': Citizen Reports, 'page3': Alerts & History
  const [selectedZoneKey, setSelectedZoneKey] = useState('shillong-meghalaya');
  const [citizenReports, setCitizenReports] = useState(INITIAL_CITIZEN_REPORTS);
  const [dispatchedAlerts, setDispatchedAlerts] = useState(INITIAL_DISPATCHED_ALERTS);
  const [citizenEvacuations, setCitizenEvacuations] = useState(INITIAL_CITIZEN_EVACUATION_TRACKING);
  const [selectedCaseModal, setSelectedCaseModal] = useState(null);
  const [selectedHardwareModal, setSelectedHardwareModal] = useState(null);
  const [selectedZoneModal, setSelectedZoneModal] = useState(null);
  const [selectedRoadModal, setSelectedRoadModal] = useState(null);
  
  // Filters & Search
  const [reportFilter, setReportFilter] = useState('all');
  const [reportSearch, setReportSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [evacFilter, setEvacFilter] = useState('all'); // 'all' | 'not_turned_off' | 'turned_off' | 'dispatched'
  const [evacSearch, setEvacSearch] = useState('');
  const [hardwareFilter, setHardwareFilter] = useState('all');
  const [hardwareSearch, setHardwareSearch] = useState('');

  // Modals & UI States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [arduinoConnected, setArduinoConnected] = useState(false);
  const [clockTime, setClockTime] = useState('');

  // Map Refs
  const overviewMapRef = useRef(null);
  const overviewMapInstanceRef = useRef(null);
  const zoneMapRef = useRef(null);
  const zoneMapInstanceRef = useRef(null);

  const zoneData = ZONES_DATABASE[selectedZoneKey] || ZONES_DATABASE['shillong-meghalaya'];

  const showOperationalToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  // Clock Live Update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClockTime(`${now.toLocaleTimeString('en-GB', { hour12: false })} IST`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Real-time listener for Citizen alarm silence / acknowledgement responses
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'resilientguard_citizen_response' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          setCitizenEvacuations(prev => {
            const exists = prev.some(c => c.id === payload.citizenId);
            if (exists) {
              return prev.map(c => {
                if (c.id === payload.citizenId) {
                  return {
                    ...c,
                    alarmStatus: payload.status === 'unresponsive' ? 'not_turned_off' : 'turned_off',
                    status: payload.status,
                    actionText: payload.actionText || 'Alarm Turned Off (Silenced)',
                    ringingDuration: 'Silenced Live',
                    lastUpdate: 'Just now',
                    shelterTarget: payload.shelterTarget || c.shelterTarget
                  };
                }
                return c;
              });
            } else {
              return [
                {
                  id: payload.citizenId || `CIT-LIVE-${Date.now().toString().slice(-4)}`,
                  name: payload.name || 'Resident App User (Live)',
                  phone: payload.phone || '+91 98765-LIVE-APP',
                  zone: payload.zone || 'Shillong Urban Ridge',
                  location: payload.location || 'Urban Sector',
                  alarmStatus: payload.status === 'unresponsive' ? 'not_turned_off' : 'turned_off',
                  status: payload.status || 'evacuating',
                  actionText: payload.actionText || 'Alarm Turned Off (Silenced)',
                  ringingDuration: 'Silenced Live',
                  lastUpdate: 'Just now',
                  shelterTarget: payload.shelterTarget || 'Shillong Polo Ground Camp #1',
                  evacRoute: 'Primary Evacuation Link',
                  officerDispatched: false,
                  assignedOfficer: null
                },
                ...prev
              ];
            }
          });
          showOperationalToast(`Citizen Response: ${payload.name} has turned off the alarm siren`);
        } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Dispatch Field Officer Physical Rescue for Unresponsive Citizens
  const handleDispatchPhysicalRescue = (citizen) => {
    const officerName = `Field Officer #${Math.floor(101 + Math.random() * 20)}`;
    setCitizenEvacuations(prev => prev.map(c => {
      if (c.id === citizen.id) {
        return {
          ...c,
          alarmStatus: 'dispatched',
          officerDispatched: true,
          assignedOfficer: officerName,
          status: 'rescuing',
          actionText: `${officerName} En Route`
        };
      }
      return c;
    }));
    showOperationalToast(`Dispatched ${officerName} for ${citizen.name} (${citizen.location})`);
  };

  // Connect Arduino Serial Siren
  const handleConnectArduino = async () => {
    const success = await connectArduino(showOperationalToast);
    setArduinoConnected(success);
  };

  // Disseminate Emergency Alert Broadcast
  const confirmAndDispatchAlert = () => {
    const refId = `#ALERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const monthStr = now.toLocaleString('en-US', { month: 'short' });
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const timeStr = `Just now (${String(now.getDate()).padStart(2, '0')}-${monthStr} ${timeFormatted})`;

    sendToArduino('danger', showOperationalToast);

    const payload = {
      type: 'EMERGENCY_BROADCAST',
      refId: refId,
      triggerId: Date.now(),
      zoneKey: selectedZoneKey,
      zoneName: zoneData.name,
      headline: `HIGH LANDSLIDE EVACUATION ALERT: ${zoneData.name.toUpperCase()}`,
      desc: `Critical slope instability, ground saturation, and heavy precipitation detected. District Disaster Control advises immediate evacuation to ${zoneData.shelter}.`,
      severity: zoneData.severity || 'danger',
      shelter: zoneData.shelter,
      time: timeStr
    };

    try {
      localStorage.setItem('resilientguard_latest_alert', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('resilientguard_alert_dispatched', { detail: payload }));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('resilientguard_admin_alerts');
        bc.postMessage(payload);
        bc.close();
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    const newDispatchedItem = {
      refId: refId,
      time: timeStr,
      zone: zoneData.name,
      zoneKey: selectedZoneKey,
      severity: zoneData.severity === 'critical' ? 'critical' : 'high',
      channels: 'App Push, SMS, Siren Tower, LoRa Mesh',
      status: 'active',
      statusText: 'Active Broadcast',
      residentsCount: 1250,
      shelter: zoneData.shelter
    };

    setDispatchedAlerts(prev => [newDispatchedItem, ...prev]);
    setShowConfirmModal(false);
    showOperationalToast(`Emergency Evacuation Alert broadcasted for ${zoneData.name}`);
  };

  // Citizen Report Actions
  const handleDispatchFieldOfficer = (reportId) => {
    setCitizenReports(prev => prev.map(r => {
      if (r.id === reportId) {
        return {
          ...r,
          status: 'dispatched',
          statusText: 'Field Officer En Route',
          patrolOfficer: r.patrolOfficer && r.patrolOfficer !== 'Unassigned' ? r.patrolOfficer : 'Field Officer Unit 2',
          dispatchedOfficer: 'Field Officer Unit 2'
        };
      }
      return r;
    }));
    showOperationalToast(`Field Officer dispatched for Incident ${reportId}`);
  };

  const handleResolveReport = (reportId) => {
    setCitizenReports(prev => prev.map(r => {
      if (r.id === reportId) {
        return { ...r, status: 'resolved', statusText: 'Resolved & Clear' };
      }
      return r;
    }));
    showOperationalToast(`Report ${reportId} marked as resolved.`);
  };

  // Switch to zone details from overview list
  const openZoneDetails = (zoneKey) => {
    setSelectedZoneKey(zoneKey);
    setActivePage('page2');
  };

  // Filtered lists
  const filteredReports = citizenReports.filter(r => {
    const matchFilter = reportFilter === 'all' || r.status === reportFilter || (reportFilter === 'critical' && r.severity === 'critical');
    const matchSearch = reportSearch === '' || r.id.toLowerCase().includes(reportSearch.toLowerCase()) || r.location.toLowerCase().includes(reportSearch.toLowerCase()) || r.reporter.toLowerCase().includes(reportSearch.toLowerCase());
    return matchFilter && matchSearch;
  });

  const filteredHistory = dispatchedAlerts.filter(a => {
    const zoneName = (a.zone || a.zoneName || '').toLowerCase();
    const ref = (a.refId || '').toLowerCase();
    return historySearch === '' || ref.includes(historySearch.toLowerCase()) || zoneName.includes(historySearch.toLowerCase());
  });

  // Overview Map Initialization (Page 1)
  useEffect(() => {
    if (activePage === 'page1' && overviewMapRef.current) {
      if (!overviewMapInstanceRef.current) {
        const zoneFeatures = Object.keys(ZONES_DATABASE).map(key => {
          const z = ZONES_DATABASE[key];
          const isCritical = z.severity === 'critical';
          return {
            type: 'Feature',
            properties: {
              id: key,
              name: z.name,
              finalRisk: z.finalRisk,
              color: isCritical ? '#dc2626' : (z.severity === 'high' ? '#ea580c' : '#d97706'),
              fillOpacity: isCritical ? 0.35 : 0.25
            },
            geometry: {
              type: 'Polygon',
              coordinates: [z.polygon.map(c => [c[1], c[0]])]
            }
          };
        });

        const map = new maplibregl.Map({
          container: overviewMapRef.current,
          style: {
            version: 8,
            sources: {
              'topo-tiles': {
                type: 'raster',
                tiles: [
                  'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
                  'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
                  'https://c.tile.opentopomap.org/{z}/{x}/{y}.png'
                ],
                tileSize: 256,
                attribution: '&copy; OpenTopoMap contributors'
              },
              'overview-zones-source': {
                type: 'geojson',
                data: {
                  type: 'FeatureCollection',
                  features: zoneFeatures
                }
              }
            },
            layers: [
              {
                id: 'topo-layer',
                type: 'raster',
                source: 'topo-tiles',
                minzoom: 0,
                maxzoom: 17
              },
              {
                id: 'overview-zones-fill',
                type: 'fill',
                source: 'overview-zones-source',
                paint: {
                  'fill-color': ['get', 'color'],
                  'fill-opacity': ['get', 'fillOpacity']
                }
              },
              {
                id: 'overview-zones-line',
                type: 'line',
                source: 'overview-zones-source',
                paint: {
                  'line-color': ['get', 'color'],
                  'line-width': 3,
                  'line-dasharray': [3, 2]
                }
              }
            ]
          },
          center: [92.9, 26.2],
          zoom: 7,
          pitch: 35,
          bearing: 5,
          attributionControl: false
        });

        // Add Zone Pinpoint Markers
        Object.keys(ZONES_DATABASE).forEach(key => {
          const z = ZONES_DATABASE[key];
          const isCritical = z.severity === 'critical';
          const color = isCritical ? '#dc2626' : (z.severity === 'high' ? '#ea580c' : '#d97706');

          const el = document.createElement('div');
          el.className = 'admin-map-zone-marker';
          el.style.cssText = `width: 14px; height: 14px; border-radius: 50%; background: ${color}; border: 2.5px solid #ffffff; box-shadow: 0 0 10px ${color}; cursor: pointer;`;
          el.onclick = () => setSelectedZoneModal({ key, ...z });

          const popup = new maplibregl.Popup({ offset: 12 }).setHTML(`
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.82rem; padding: 4px;">
              <strong style="color:${color};">${z.name}</strong><br/>
              <span>Risk: <strong>${z.finalRisk}</strong></span><br/>
              <span style="font-size:0.75rem; color:#2563eb; font-weight:700;">Click for Hazard Dossier</span>
            </div>
          `);

          new maplibregl.Marker({ element: el })
            .setLngLat([z.center[1], z.center[0]])
            .setPopup(popup)
            .addTo(map);
        });

        // Click on Overview Zone Polygons to open Danger Zone details
        map.on('click', 'overview-zones-fill', (e) => {
          if (e.features && e.features.length > 0) {
            const f = e.features[0];
            const key = Object.keys(ZONES_DATABASE).find(k => ZONES_DATABASE[k].name === f.properties.name) || 'shillong-meghalaya';
            const z = ZONES_DATABASE[key] || ZONES_DATABASE['shillong-meghalaya'];
            setSelectedZoneModal({ key, ...z });
          }
        });
        map.on('mouseenter', 'overview-zones-fill', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'overview-zones-fill', () => {
          map.getCanvas().style.cursor = '';
        });

        overviewMapInstanceRef.current = map;
      } else {
        setTimeout(() => {
          if (overviewMapInstanceRef.current) {
            overviewMapInstanceRef.current.resize();
          }
        }, 100);
      }
    }
  }, [activePage]);

  // Tactical Zone Map Initialization (Page 2)
  useEffect(() => {
    if (activePage === 'page2' && zoneMapRef.current) {
      if (!zoneMapInstanceRef.current) {
        const polyCoords = zoneData.polygon.map(c => [c[1], c[0]]);
        const isCrit = zoneData.severity === 'critical';
        const sevColor = isCrit ? '#dc2626' : '#ea580c';

        const tacticalRoadFeatures = (zoneData.roads || []).map((r, idx) => ({
          type: 'Feature',
          properties: {
            id: `tactical-road-${idx}`,
            name: r.name,
            status: r.status,
            statusText: r.statusText,
            color: r.status === 'blocked' ? '#dc2626' : (r.status === 'restricted' ? '#ea580c' : '#16a34a')
          },
          geometry: {
            type: 'LineString',
            coordinates: (r.coords || []).map(c => [c[1], c[0]])
          }
        }));

        const map = new maplibregl.Map({
          container: zoneMapRef.current,
          style: {
            version: 8,
            sources: {
              'topo-tiles': {
                type: 'raster',
                tiles: [
                  'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
                  'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
                  'https://c.tile.opentopomap.org/{z}/{x}/{y}.png'
                ],
                tileSize: 256,
                attribution: '&copy; OpenTopoMap contributors'
              },
              'tactical-perimeter-source': {
                type: 'geojson',
                data: {
                  type: 'FeatureCollection',
                  features: [
                    {
                      type: 'Feature',
                      properties: {
                        name: zoneData.name,
                        finalRisk: zoneData.finalRisk,
                        color: sevColor
                      },
                      geometry: {
                        type: 'Polygon',
                        coordinates: [polyCoords]
                      }
                    }
                  ]
                }
              },
              'tactical-roads-source': {
                type: 'geojson',
                data: {
                  type: 'FeatureCollection',
                  features: tacticalRoadFeatures
                }
              }
            },
            layers: [
              {
                id: 'tactical-topo-layer',
                type: 'raster',
                source: 'topo-tiles',
                minzoom: 0,
                maxzoom: 17
              },
              {
                id: 'tactical-perimeter-fill',
                type: 'fill',
                source: 'tactical-perimeter-source',
                paint: {
                  'fill-color': ['get', 'color'],
                  'fill-opacity': 0.35
                }
              },
              {
                id: 'tactical-perimeter-line',
                type: 'line',
                source: 'tactical-perimeter-source',
                paint: {
                  'line-color': ['get', 'color'],
                  'line-width': 3.5,
                  'line-dasharray': [3, 2]
                }
              },
              {
                id: 'tactical-roads-line',
                type: 'line',
                source: 'tactical-roads-source',
                paint: {
                  'line-color': ['get', 'color'],
                  'line-width': 5.5,
                  'line-opacity': 0.92
                }
              }
            ]
          },
          center: [zoneData.center[1], zoneData.center[0]],
          zoom: zoneData.zoom || 14.5,
          pitch: 55,
          bearing: 20,
          attributionControl: false
        });

        // Add Markers for IoT Sensors
        (zoneData.sensors || []).forEach(s => {
          const el = document.createElement('div');
          el.className = 'admin-sensor-marker';
          const sColor = s.color || '#38bdf8';
          el.style.cssText = `width: 22px; height: 22px; border-radius: 50%; background: ${sColor}; border: 2px solid #ffffff; box-shadow: 0 0 10px ${sColor}; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 10px;`;
          el.innerHTML = s.type === 'tilt' ? 'T' : (s.type === 'rain' ? 'R' : (s.type === 'soil' ? 'S' : 'G'));

          const popup = new maplibregl.Popup({ offset: 12 }).setHTML(`
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.8rem; padding: 4px;">
              <strong style="color:${sColor};">${s.name}</strong><br/>
              <span>Telemetry: ${s.val}</span>
            </div>
          `);

          new maplibregl.Marker({ element: el })
            .setLngLat([s.pos[1], s.pos[0]])
            .setPopup(popup)
            .addTo(map);
        });

        // Click on Road Corridors to open Road Blockade & Bypass Dossier
        map.on('click', 'tactical-roads-line', (e) => {
          if (e.features && e.features.length > 0) {
            const roadId = e.features[0].properties.id;
            const roadIdx = parseInt(String(roadId).replace('tactical-road-', ''), 10);
            const r = (zoneData.roads || [])[roadIdx] || (zoneData.roads || [])[0];
            if (r) setSelectedRoadModal(r);
          }
        });
        map.on('mouseenter', 'tactical-roads-line', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'tactical-roads-line', () => {
          map.getCanvas().style.cursor = '';
        });

        // Click on Hazard Perimeter to open Danger Zone Dossier
        map.on('click', 'tactical-perimeter-fill', () => {
          setSelectedZoneModal({ key: selectedZoneKey, ...zoneData });
        });

        zoneMapInstanceRef.current = map;
      } else {
        const perimSource = zoneMapInstanceRef.current.getSource('tactical-perimeter-source');
        if (perimSource) {
          const polyCoords = zoneData.polygon.map(c => [c[1], c[0]]);
          const isCrit = zoneData.severity === 'critical';
          perimSource.setData({
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              properties: { name: zoneData.name, finalRisk: zoneData.finalRisk, color: isCrit ? '#dc2626' : '#ea580c' },
              geometry: { type: 'Polygon', coordinates: [polyCoords] }
            }]
          });
        }

        setTimeout(() => {
          zoneMapInstanceRef.current.resize();
          zoneMapInstanceRef.current.flyTo({
            center: [zoneData.center[1], zoneData.center[0]],
            zoom: zoneData.zoom || 14.5,
            pitch: 55,
            bearing: 20
          });
        }, 100);
      }
    }
  }, [activePage, selectedZoneKey, zoneData]);

  return (
    <div className="admin-body">
      {/* Top Command Bar */}
      <header className="admin-header">
        <div className="admin-brand-wrap">
          <div className="admin-shield-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="brand-title">ResilientGuard</span>
          <span className="admin-badge-role">Operations Command</span>
        </div>

        {/* Central Page Navigation Tabs */}
        <nav className="header-page-nav">
          <button
            type="button"
            className={`nav-page-btn ${activePage === 'page1' ? 'active' : ''}`}
            onClick={() => setActivePage('page1')}
          >
            Overview
          </button>
          <button
            type="button"
            className={`nav-page-btn ${activePage === 'page2' ? 'active' : ''}`}
            onClick={() => setActivePage('page2')}
          >
            Sector Details
          </button>
          <button
            type="button"
            className={`nav-page-btn ${activePage === 'page4' ? 'active' : ''}`}
            onClick={() => setActivePage('page4')}
          >
            Citizen Reports
            <span className="nav-tab-badge">
              {citizenReports.filter(r => r.status === 'pending').length}
            </span>
          </button>
          <button
            type="button"
            className={`nav-page-btn ${activePage === 'page3' ? 'active' : ''}`}
            onClick={() => setActivePage('page3')}
          >
            Alerts &amp; Evacuation
          </button>
        </nav>

        {/* Header Actions */}
        <div className="admin-header-actions">
          <button
            type="button"
            className={`btn-arduino-link ${arduinoConnected ? 'connected' : ''}`}
            onClick={handleConnectArduino}
            title={arduinoConnected ? 'Hardware Siren Interface Connected' : 'Connect Hardware Siren over USB Serial'}
          >
            <span className="pulse-dot"></span>
            {arduinoConnected ? 'Siren Synced' : 'Sync Hardware Siren'}
          </button>

          <div className="admin-clock">{clockTime || 'IST Live'}</div>

          <Link to="/login" className="btn-portal-link" style={{ color: 'var(--color-critical)' }}>
            Logout
          </Link>
        </div>
      </header>

      {/* =====================================================================
           PAGE 1: OVERVIEW DASHBOARD
           ===================================================================== */}
      {activePage === 'page1' && (
        <main className="admin-page-view active">
          <div className="page-content-wrapper">
            
            {/* Quick KPI Stat Row */}
            <section className="overview-stats-row">
              <div
                className="stat-metric-card critical clickable"
                onClick={() => setSelectedZoneModal({ key: selectedZoneKey, ...zoneData })}
                style={{ cursor: 'pointer' }}
                title="Click to view Danger Zone Hazard Dossier"
              >
                <div className="stat-label-row">
                  <span>Danger Zones</span>
                  <span className="status-pill critical">1 Critical</span>
                </div>
                <div className="stat-value">3 Active</div>
                <div className="stat-subtext">
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>Inspect Danger Zones →</span>
                </div>
              </div>

              <div
                className="stat-metric-card warning clickable"
                onClick={() => {
                  const blockedRoad = (zoneData.roads || []).find(r => r.status === 'blocked') || (zoneData.roads || [])[0];
                  setSelectedRoadModal(blockedRoad);
                }}
                style={{ cursor: 'pointer' }}
                title="Click to view Blocked Road & Bypass Dossier"
              >
                <div className="stat-label-row">
                  <span>Road Blockades</span>
                  <span className="status-pill high">1 Blocked</span>
                </div>
                <div className="stat-value">GS Road</div>
                <div className="stat-subtext">
                  <span style={{ color: '#ea580c', fontWeight: 700 }}>Inspect Blockade &amp; Bypass →</span>
                </div>
              </div>

              <div className="stat-metric-card info">
                <div className="stat-label-row">
                  <span>Citizen Distress Reports</span>
                  <span className="status-pill critical">
                    {citizenReports.filter(r => r.status === 'pending').length} Pending
                  </span>
                </div>
                <div className="stat-value">{citizenReports.length} Total</div>
                <div className="stat-subtext">
                  <span style={{ cursor: 'pointer', color: '#2563eb', fontWeight: 700 }} onClick={() => setActivePage('page4')}>
                    Review Triage Feed →
                  </span>
                </div>
              </div>

              <div className="stat-metric-card hardware">
                <div className="stat-label-row">
                  <span>IoT Mesh Nodes</span>
                  <span className="status-pill low">23/24 Live</span>
                </div>
                <div className="stat-value" style={{ color: '#16a34a' }}>96% Online</div>
                <div className="stat-subtext">
                  <span style={{ cursor: 'pointer', color: '#2563eb', fontWeight: 700 }} onClick={() => setActivePage('page2')}>
                    View Sensor &amp; Hardware Fleet →
                  </span>
                </div>
              </div>
            </section>

            {/* Overview Main Grid: 3D Map + Clean Zone Cards */}
            <section className="overview-main-grid">
              
              {/* Map Panel */}
              <div className="heatmap-panel-wrapper">
                <div id="leafletOverviewMap" ref={overviewMapRef}></div>
                <div className="heatmap-legend-badge">
                  <span><strong style={{ color: '#dc2626' }}>■</strong> Critical Risk (&gt;85%)</span>
                  <span><strong style={{ color: '#ea580c' }}>■</strong> Warning Zone (65–85%)</span>
                  <span><strong style={{ color: '#16a34a' }}>■</strong> Monitored</span>
                </div>
              </div>

              {/* Monitored Zones List */}
              <div className="danger-zones-panel">
                <div className="panel-section-title">
                  <span>Monitored Hazard Sectors</span>
                </div>

                <div className="zones-scroll-list">
                  {Object.keys(ZONES_DATABASE).map(key => {
                    const z = ZONES_DATABASE[key];
                    const isCrit = z.severity === 'critical';
                    return (
                      <div key={key} className={`zone-summary-card ${isCrit ? 'critical' : 'warning'}`}>
                        <div className="zone-card-header">
                          <div className="zone-title-wrap">
                            <span className="zone-name">{z.name}</span>
                            <span className={`status-pill ${isCrit ? 'critical' : 'high'}`}>
                              {z.finalRisk} Risk
                            </span>
                          </div>
                          <button
                            type="button"
                            className="btn-inspect-zone"
                            onClick={() => openZoneDetails(key)}
                          >
                            Inspect Sector →
                          </button>
                        </div>

                        <div className="zone-metrics-grid-2col">
                          <div className="zone-metric-box">
                            <span className="metric-lbl">InSAR Creep Rate</span>
                            <span className="metric-val" style={{ color: isCrit ? '#dc2626' : '#ea580c' }}>
                              {z.satellite?.insarVelocity || 'Nominal'}
                            </span>
                          </div>
                          <div className="zone-metric-box">
                            <span className="metric-lbl">24h Rainfall</span>
                            <span className="metric-val">
                              {z.factors?.[0]?.value?.split(' ')?.[0] || '118'} mm
                            </span>
                          </div>
                        </div>

                        <div className="zone-shelter-box">
                          <span className="shelter-tag-lbl">Evacuation Shelter</span>
                          <span className="shelter-name-val">{z.shelter?.split('(')?.[0]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </section>
          </div>
        </main>
      )}

      {/* =====================================================================
           PAGE 2: ZONE TACTICAL DETAILS & HARDWARE/SENSOR FLEET
           ===================================================================== */}
      {activePage === 'page2' && (
        <main className="admin-page-view active">
          <div className="page-content-wrapper">
            
            {/* Zone Selector & Emergency Dispatch Action Bar */}
            <div className="zone-tactical-header-bar">
              <div className="zone-selector-pills">
                {Object.keys(ZONES_DATABASE).map(key => {
                  const z = ZONES_DATABASE[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`zone-pill-btn ${selectedZoneKey === key ? 'active' : ''}`}
                      onClick={() => setSelectedZoneKey(key)}
                    >
                      {z.name.split(' (')[0]}
                    </button>
                  );
                })}
              </div>

              <div className="tactical-actions">
                <button
                  type="button"
                  className="btn-dispatch-emergency"
                  onClick={() => setShowConfirmModal(true)}
                >
                  Broadcast Evacuation Order
                </button>
              </div>
            </div>

            {/* Tactical Grid: 3D GIS Map + Live Telemetry Sensor Grid */}
            <div className="zone-detail-grid">
              
              {/* Tactical Sector Map */}
              <div className="tactical-map-container">
                <div id="tacticalZoneMap" ref={zoneMapRef}></div>
              </div>

              {/* Sensor Telemetry & Road Corridors */}
              <div className="tactical-telemetry-panel">
                <h3 className="section-heading">Key Sensor Telemetry &amp; Field Corridors</h3>

                <div className="sensor-kpi-grid">
                  <div className="sensor-card critical">
                    <div className="sensor-tag-badge">INCLINOMETER</div>
                    <div className="sensor-data">
                      <div className="sensor-title">Borehole Sensor SH-101</div>
                      <div className="sensor-val" style={{ color: '#dc2626' }}>4.8° / hr Tilt</div>
                      <div className="sensor-sub">Exceeds Critical Threshold</div>
                    </div>
                  </div>

                  <div className="sensor-card info">
                    <div className="sensor-tag-badge" style={{ color: '#0284c7' }}>RAIN GAUGE</div>
                    <div className="sensor-data">
                      <div className="sensor-title">IMD Doppler AWS Station</div>
                      <div className="sensor-val" style={{ color: '#0284c7' }}>118.0 mm / 24h</div>
                      <div className="sensor-sub">Torrential Monsoon Rate</div>
                    </div>
                  </div>

                  <div className="sensor-card warning">
                    <div className="sensor-tag-badge" style={{ color: '#ea580c' }}>PIEZOMETER</div>
                    <div className="sensor-data">
                      <div className="sensor-title">Pore Saturation Node</div>
                      <div className="sensor-val" style={{ color: '#ea580c' }}>89.2% Saturated</div>
                      <div className="sensor-sub">Liquefaction Hazard</div>
                    </div>
                  </div>

                  <div className="sensor-card sat">
                    <div className="sensor-tag-badge" style={{ color: '#7c3aed' }}>INSAR RADAR</div>
                    <div className="sensor-data">
                      <div className="sensor-title">Sentinel-1 Displacement</div>
                      <div className="sensor-val" style={{ color: '#7c3aed' }}>+15.8 mm / wk</div>
                      <div className="sensor-sub">Continuous Ground Creep</div>
                    </div>
                  </div>
                </div>

                {/* Road Corridors & Bypasses */}
                <h3 className="section-heading" style={{ marginTop: '16px' }}>Monitored Corridors &amp; Bypasses</h3>
                <div className="corridor-list-mini">
                  {(zoneData.roads || []).map((road, idx) => (
                    <div
                      key={idx}
                      className={`corridor-item-mini ${road.status}`}
                      onClick={() => setSelectedRoadModal(road)}
                      style={{ cursor: 'pointer' }}
                      title="Click to view full Road Corridor & Bypass Dossier"
                    >
                      <div className="corridor-top">
                        <span className="road-name">{road.name}</span>
                        <span className={`status-pill ${road.status === 'blocked' ? 'critical' : (road.status === 'restricted' ? 'high' : 'low')}`}>
                          {road.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="corridor-bypass">
                        <span>Bypass: <strong>{road.bypass}</strong></span>
                        <span className="delay-badge">{road.delay}</span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>

            {/* =========================================================
                 MASTER SENSOR & HARDWARE DIAGNOSTIC FLEET MATRIX
                 ========================================================= */}
            <section className="hardware-diagnostics-section">
              <div className="hardware-section-header">
                <div className="hardware-header-left">
                  <h3 className="hardware-section-title">
                    <span className="hw-icon">📡</span> Sensor Telemetry &amp; Hardware Diagnostics Fleet
                  </h3>
                  <p className="hardware-section-subtitle">
                    Live operational telemetry, battery levels, RF signal strength, and raw register data across all deployed hardware nodes in {zoneData.name.split(' (')[0]}.
                  </p>
                </div>

                {/* Fleet Health Summary Banner */}
                <div className="hardware-fleet-stats">
                  <div className="hw-fleet-kpi">
                    <span className="hw-kpi-label">Deployed Nodes</span>
                    <span className="hw-kpi-val">{(zoneData.hardwareNodes || []).length} Units</span>
                  </div>
                  <div className="hw-fleet-kpi">
                    <span className="hw-kpi-label">Operational Health</span>
                    <span className="hw-kpi-val" style={{ color: '#16a34a' }}>
                      {(zoneData.hardwareNodes || []).filter(n => n.online).length}/{(zoneData.hardwareNodes || []).length} Online
                    </span>
                  </div>
                  <div className="hw-fleet-kpi">
                    <span className="hw-kpi-label">Threshold Exceedances</span>
                    <span className="hw-kpi-val" style={{ color: '#dc2626' }}>
                      {(zoneData.hardwareNodes || []).filter(n => n.status === 'critical').length} Critical
                    </span>
                  </div>
                  <div className="hw-fleet-kpi">
                    <span className="hw-kpi-label">LoRa Mesh Uplink</span>
                    <span className="hw-kpi-val" style={{ color: '#2563eb' }}>99.8% Active</span>
                  </div>
                </div>
              </div>

              {/* Filter Toolbar & Live Search */}
              <div className="hardware-toolbar">
                <div className="filter-chips">
                  <button
                    type="button"
                    className={`filter-chip ${hardwareFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setHardwareFilter('all')}
                  >
                    All Hardware ({(zoneData.hardwareNodes || []).length})
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${hardwareFilter === 'inclinometer' ? 'active' : ''}`}
                    onClick={() => setHardwareFilter('inclinometer')}
                  >
                    Inclinometers &amp; Tilt
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${hardwareFilter === 'rain_gauge' ? 'active' : ''}`}
                    onClick={() => setHardwareFilter('rain_gauge')}
                  >
                    Rain Gauges AWS
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${hardwareFilter === 'piezometer' ? 'active' : ''}`}
                    onClick={() => setHardwareFilter('piezometer')}
                  >
                    Piezometers &amp; Soil TDR
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${hardwareFilter === 'network' ? 'active' : ''}`}
                    onClick={() => setHardwareFilter('network')}
                  >
                    Gateways, Radar &amp; Sirens
                  </button>
                </div>

                <input
                  type="text"
                  className="input-report-search"
                  placeholder="Search node ID, model, sensor metric..."
                  value={hardwareSearch}
                  onChange={(e) => setHardwareSearch(e.target.value)}
                  style={{ maxWidth: '320px' }}
                />
              </div>

              {/* Hardware Telemetry Roster Table */}
              <div className="hardware-table-container">
                <table className="admin-triage-table hardware-matrix-table">
                  <thead>
                    <tr>
                      <th>Hardware Node</th>
                      <th>Sensor Classification</th>
                      <th>Operational Health</th>
                      <th>Power / Battery</th>
                      <th>Signal &amp; Uplink</th>
                      <th>Live Telemetry Reading</th>
                      <th>Calibration / Threshold</th>
                      <th style={{ textAlign: 'right' }}>Diagnostics</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(zoneData.hardwareNodes || [])
                      .filter(node => {
                        const matchCategory =
                          hardwareFilter === 'all' ||
                          (hardwareFilter === 'inclinometer' && (node.category === 'inclinometer' || node.category === 'tiltmeter')) ||
                          (hardwareFilter === 'rain_gauge' && node.category === 'rain_gauge') ||
                          (hardwareFilter === 'piezometer' && (node.category === 'piezometer' || node.category === 'tdr_soil')) ||
                          (hardwareFilter === 'network' && (node.category === 'gateway' || node.category === 'siren_tower' || node.category === 'insar_radar'));
                        
                        const q = hardwareSearch.toLowerCase().trim();
                        const matchQuery =
                          !q ||
                          node.id.toLowerCase().includes(q) ||
                          node.name.toLowerCase().includes(q) ||
                          node.model.toLowerCase().includes(q) ||
                          node.typeLabel.toLowerCase().includes(q) ||
                          (node.primaryMetric && node.primaryMetric.toLowerCase().includes(q));

                        return matchCategory && matchQuery;
                      })
                      .map((node) => {
                        const isCrit = node.status === 'critical';
                        const isWarn = node.status === 'warning';

                        return (
                          <tr key={node.id} className={`hw-row ${isCrit ? 'row-critical' : isWarn ? 'row-warning' : ''}`}>
                            <td>
                              <div className="hw-node-identity">
                                <span className="hw-node-id">{node.id}</span>
                                <span className="hw-node-name">{node.name}</span>
                                <span className="hw-node-model">{node.model}</span>
                              </div>
                            </td>
                            <td>
                              <span className={`sensor-class-badge ${node.category}`}>
                                {node.typeLabel}
                              </span>
                            </td>
                            <td>
                              <div className="hw-status-cell">
                                <span className={`status-pill ${isCrit ? 'critical' : isWarn ? 'high' : 'low'}`}>
                                  <span className={`status-dot-pulse ${isCrit ? 'crit' : isWarn ? 'warn' : 'ok'}`}></span>
                                  {node.statusText}
                                </span>
                                <span className="hw-last-ping">Ping: {node.lastPing}</span>
                              </div>
                            </td>
                            <td>
                              <div className="hw-battery-cell">
                                <span className="battery-val">{node.battery}</span>
                                <span className="battery-sub">{node.battery.includes('Solar') ? '⚡ Solar Active' : '🔋 Direct Cell'}</span>
                              </div>
                            </td>
                            <td>
                              <div className="hw-signal-cell">
                                <span className="signal-rssi">{node.signal}</span>
                                <span className="signal-loss">Loss: {node.packetLoss}</span>
                              </div>
                            </td>
                            <td>
                              <div className="hw-metric-cell">
                                <span className="primary-metric-val" style={{ color: isCrit ? '#dc2626' : isWarn ? '#ea580c' : '#16a34a' }}>
                                  {node.primaryMetric}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className="hw-threshold-tag">
                                {node.threshold}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="btn-inspect-hardware"
                                onClick={() => setSelectedHardwareModal(node)}
                              >
                                Inspect Diagnostics →
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>

          </div>
        </main>
      )}

      {/* =====================================================================
           PAGE 4: CITIZEN DISTRESS REPORTS (PROFESSIONAL TRIAGE TABLE)
           ===================================================================== */}
      {activePage === 'page4' && (
        <main className="admin-page-view active">
          <div className="page-content-wrapper">
            
            {/* Filter & Search Bar */}
            <div className="report-triage-toolbar">
              <div className="filter-chips">
                <button
                  type="button"
                  className={`filter-chip ${reportFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setReportFilter('all')}
                >
                  All Incidents ({citizenReports.length})
                </button>
                <button
                  type="button"
                  className={`filter-chip ${reportFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setReportFilter('pending')}
                >
                  Pending Triage ({citizenReports.filter(r => r.status === 'pending').length})
                </button>
                <button
                  type="button"
                  className={`filter-chip ${reportFilter === 'critical' ? 'active' : ''}`}
                  onClick={() => setReportFilter('critical')}
                >
                  Critical Priority ({citizenReports.filter(r => r.severity === 'critical').length})
                </button>
                <button
                  type="button"
                  className={`filter-chip ${reportFilter === 'resolved' ? 'active' : ''}`}
                  onClick={() => setReportFilter('resolved')}
                >
                  Resolved ({citizenReports.filter(r => r.status === 'resolved').length})
                </button>
              </div>

              <input
                type="text"
                className="input-report-search"
                placeholder="Search by ID, reporter, sector..."
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
              />
            </div>

            {/* Professional Incident Triage Table */}
            <div className="report-table-container">
              <table className="admin-triage-table">
                <thead>
                  <tr>
                    <th>Incident ID</th>
                    <th>Reporter Details</th>
                    <th>Location Sector</th>
                    <th>Hazard Classification</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map(report => (
                    <tr
                      key={report.id}
                      className={`triage-row-item ${report.severity} clickable-case-row`}
                      onClick={() => setSelectedCaseModal(report)}
                      title="Click to view complete case dossier & diagnostics"
                    >
                      <td>
                        <span className="triage-ref-badge">{report.id}</span>
                        <div className="triage-time-sub">{report.timestamp || report.time || '14m ago'}</div>
                      </td>
                      <td>
                        <strong>{report.reporter}</strong>
                        <div className="triage-phone-sub">{report.contact || report.phone}</div>
                      </td>
                      <td>
                        <span className="triage-location-text">{report.location}</span>
                        {report.coordsText && (
                          <div className="triage-coords-sub">{report.coordsText}</div>
                        )}
                      </td>
                      <td>
                        <span className="triage-hazard-text">{report.category || report.type || 'Slope Debris / Fissure'}</span>
                        <div className="triage-desc-snippet">{report.description || report.desc}</div>
                      </td>
                      <td>
                        <span className={`status-pill ${report.severity === 'critical' ? 'critical' : 'high'}`}>
                          {report.severity === 'critical' ? 'CRITICAL' : 'WARNING'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${report.status === 'resolved' ? 'low' : (report.status === 'dispatched' ? 'high' : 'critical')}`}>
                          {report.status === 'resolved' ? 'RESOLVED' : (report.status === 'dispatched' ? 'OFFICER EN ROUTE' : 'PENDING')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="triage-action-cell" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="btn-table-details"
                            onClick={() => setSelectedCaseModal(report)}
                            title="View full case dossier"
                          >
                            View Details
                          </button>
                          {report.status !== 'resolved' ? (
                            <>
                              <button
                                type="button"
                                className="btn-table-dispatch"
                                onClick={() => handleDispatchFieldOfficer(report.id)}
                              >
                                Dispatch Field Officer
                              </button>
                              <button
                                type="button"
                                className="btn-table-resolve"
                                onClick={() => handleResolveReport(report.id)}
                              >
                                Mark Resolved
                              </button>
                            </>
                          ) : (
                            <span className="status-resolved-tag">Cleared</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </main>
      )}

      {/* =====================================================================
           PAGE 3: ALERTS & EVACUATION TRACKING
           ===================================================================== */}
      {activePage === 'page3' && (() => {
        const countTurnedOff = citizenEvacuations.filter(c => c.alarmStatus === 'turned_off' || c.status === 'evacuating' || c.status === 'sheltered' || c.status === 'acknowledged').length;
        const countNotTurnedOff = citizenEvacuations.filter(c => (c.alarmStatus === 'not_turned_off' || c.status === 'unresponsive') && !c.officerDispatched).length;
        const countDispatched = citizenEvacuations.filter(c => c.officerDispatched || c.alarmStatus === 'dispatched' || c.status === 'rescuing').length;

        const filteredEvacuations = citizenEvacuations.filter(c => {
          const isTurnedOff = c.alarmStatus === 'turned_off' || c.status === 'evacuating' || c.status === 'sheltered' || c.status === 'acknowledged';
          const isNotTurnedOff = (c.alarmStatus === 'not_turned_off' || c.status === 'unresponsive') && !c.officerDispatched;
          const isDispatched = c.officerDispatched || c.alarmStatus === 'dispatched' || c.status === 'rescuing';

          let matchFilter = true;
          if (evacFilter === 'turned_off') matchFilter = isTurnedOff;
          else if (evacFilter === 'not_turned_off') matchFilter = isNotTurnedOff;
          else if (evacFilter === 'dispatched') matchFilter = isDispatched;

          const query = evacSearch.trim().toLowerCase();
          const matchSearch = query === '' ||
            c.name.toLowerCase().includes(query) ||
            c.id.toLowerCase().includes(query) ||
            c.location.toLowerCase().includes(query) ||
            c.phone.toLowerCase().includes(query) ||
            (c.zone || '').toLowerCase().includes(query) ||
            (c.shelterTarget || '').toLowerCase().includes(query);

          return matchFilter && matchSearch;
        });

        return (
          <main className="admin-page-view active">
            <div className="page-content-wrapper">
              
              {/* Interactive Alarm & Evacuation KPI Summary Cards */}
              <section className="overview-stats-row">
                <div
                  className={`stat-metric-card info clickable ${evacFilter === 'all' ? 'active-filter-card' : ''}`}
                  onClick={() => setEvacFilter('all')}
                  title="Click to view all monitored residents"
                >
                  <div className="stat-label-row">
                    <span>Targeted Residents</span>
                    <span className="stat-tap-hint">View All</span>
                  </div>
                  <div className="stat-value">1,250</div>
                  <div className="stat-subtext">Across 4 Risk Sectors ({citizenEvacuations.length} Active Roster)</div>
                </div>

                <div
                  className={`stat-metric-card low clickable ${evacFilter === 'turned_off' ? 'active-filter-card' : ''}`}
                  onClick={() => setEvacFilter('turned_off')}
                  title="Click to view residents who have turned off their siren"
                >
                  <div className="stat-label-row">
                    <span>Alarm Turned Off</span>
                    <span className="status-pill low">{countTurnedOff} Live</span>
                  </div>
                  <div className="stat-value" style={{ color: '#16a34a' }}>1,100 (88%)</div>
                  <div className="stat-subtext">Alarm Silenced • En Route to Shelter</div>
                </div>

                <div
                  className={`stat-metric-card critical clickable ${evacFilter === 'not_turned_off' ? 'active-filter-card' : ''}`}
                  onClick={() => setEvacFilter('not_turned_off')}
                  title="Click to view residents whose alarms are still ringing (unresponsive)"
                >
                  <div className="stat-label-row">
                    <span>Alarm NOT Turned Off</span>
                    <span className="status-pill critical">{countNotTurnedOff} Urgent</span>
                  </div>
                  <div className="stat-value" style={{ color: '#dc2626' }}>150 (12%)</div>
                  <div className="stat-subtext">Siren Active 5m+ • Physical Welfare Check Needed</div>
                </div>

                <div
                  className={`stat-metric-card warning clickable ${evacFilter === 'dispatched' ? 'active-filter-card' : ''}`}
                  onClick={() => setEvacFilter('dispatched')}
                  title="Click to view residents with dispatched field rescue"
                >
                  <div className="stat-label-row">
                    <span>Field Officers Dispatched</span>
                    <span className="status-pill high">{countDispatched} Active</span>
                  </div>
                  <div className="stat-value" style={{ color: '#ea580c' }}>4 Units</div>
                  <div className="stat-subtext">Physical Welfare Check in Progress</div>
                </div>
              </section>

              {/* Roster Triage Toolbar */}
              <div className="triage-toolbar">
                <div className="triage-filters-group">
                  <button
                    type="button"
                    className={`btn-triage-filter ${evacFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setEvacFilter('all')}
                  >
                    All Residents ({citizenEvacuations.length})
                  </button>
                  <button
                    type="button"
                    className={`btn-triage-filter critical ${evacFilter === 'not_turned_off' ? 'active' : ''}`}
                    onClick={() => setEvacFilter('not_turned_off')}
                  >
                    Alarm NOT Turned Off ({countNotTurnedOff})
                  </button>
                  <button
                    type="button"
                    className={`btn-triage-filter low ${evacFilter === 'turned_off' ? 'active' : ''}`}
                    onClick={() => setEvacFilter('turned_off')}
                  >
                    Alarm Turned Off ({countTurnedOff})
                  </button>
                  <button
                    type="button"
                    className={`btn-triage-filter warning ${evacFilter === 'dispatched' ? 'active' : ''}`}
                    onClick={() => setEvacFilter('dispatched')}
                  >
                    Field Officer Dispatched ({countDispatched})
                  </button>
                </div>

                <input
                  type="text"
                  className="input-report-search"
                  placeholder="Search resident by name, household ID, sector, phone..."
                  value={evacSearch}
                  onChange={(e) => setEvacSearch(e.target.value)}
                />
              </div>

              {/* Resident Evacuation & Alarm Status Triage Table */}
              <div className="report-table-container">
                <table className="admin-triage-table">
                  <thead>
                    <tr>
                      <th>Resident / Household</th>
                      <th>Location Sector</th>
                      <th>Alarm Status</th>
                      <th>Designated Shelter &amp; Route</th>
                      <th style={{ textAlign: 'right' }}>Welfare Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvacuations.length > 0 ? (
                      filteredEvacuations.map(citizen => {
                        const isNotTurnedOff = (citizen.alarmStatus === 'not_turned_off' || citizen.status === 'unresponsive') && !citizen.officerDispatched;
                        const isTurnedOff = citizen.alarmStatus === 'turned_off' || citizen.status === 'evacuating' || citizen.status === 'acknowledged' || citizen.status === 'sheltered';
                        const isDispatched = citizen.officerDispatched || citizen.alarmStatus === 'dispatched' || citizen.status === 'rescuing';

                        return (
                          <tr key={citizen.id} className={`triage-row-item ${isNotTurnedOff ? 'critical' : (isDispatched ? 'warning' : 'low')}`}>
                            <td>
                              <span className="triage-ref-badge">{citizen.id}</span>
                              <strong style={{ display: 'block', marginTop: '3px', fontSize: '0.86rem' }}>{citizen.name}</strong>
                              <div className="triage-phone-sub">{citizen.phone}</div>
                            </td>

                            <td>
                              <span className="triage-location-text">{citizen.location}</span>
                              <div className="triage-coords-sub">{citizen.zone || 'Shillong Urban Ridge'}</div>
                            </td>

                            <td>
                              {isNotTurnedOff && (
                                <div>
                                  <span className="status-pill critical" style={{ fontWeight: 800 }}>
                                    ALARM NOT TURNED OFF
                                  </span>
                                  <div style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700, marginTop: '3px' }}>
                                    Active for {citizen.ringingDuration || citizen.lastUpdate || '6m+'}
                                  </div>
                                </div>
                              )}

                              {isTurnedOff && (
                                <div>
                                  <span className="status-pill low" style={{ fontWeight: 800 }}>
                                    ALARM TURNED OFF
                                  </span>
                                  <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, marginTop: '3px' }}>
                                    {citizen.actionText || 'Silenced & Evacuating'} ({citizen.ringingDuration || citizen.lastUpdate})
                                  </div>
                                </div>
                              )}

                              {isDispatched && (
                                <div>
                                  <span className="status-pill high" style={{ fontWeight: 800 }}>
                                    FIELD OFFICER EN ROUTE
                                  </span>
                                  <div style={{ fontSize: '0.72rem', color: '#ea580c', fontWeight: 600, marginTop: '3px' }}>
                                    {citizen.assignedOfficer || 'Field Officer Assigned'}
                                  </div>
                                </div>
                              )}
                            </td>

                            <td>
                              <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                                {citizen.shelterTarget || 'Shillong Polo Ground Camp #1'}
                              </strong>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                Route: {citizen.evacRoute || 'Primary Sector Corridor (Open)'}
                              </div>
                            </td>

                            <td style={{ textAlign: 'right' }}>
                              <div className="triage-action-cell">
                                {isNotTurnedOff ? (
                                  <button
                                    type="button"
                                    className="btn-table-dispatch"
                                    onClick={() => handleDispatchPhysicalRescue(citizen)}
                                    title="Dispatch field officer for immediate welfare rescue"
                                  >
                                    Dispatch Field Officer
                                  </button>
                                ) : isDispatched ? (
                                  <span className="status-resolved-tag" style={{ color: '#ea580c', background: '#fff7ed', borderColor: '#fed7aa' }}>
                                    {citizen.assignedOfficer || 'Officer'} En Route
                                  </span>
                                ) : (
                                  <span className="status-resolved-tag">
                                    Safe / Evacuating
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          No residents match the selected filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Dispatched Broadcasts Log Table */}
              <div className="history-table-panel" style={{ marginTop: '24px' }}>
                <div className="panel-section-title">
                  <span>Emergency Broadcast Dissemination History</span>
                </div>

                <table className="admin-history-table">
                  <thead>
                    <tr>
                      <th>Ref ID</th>
                      <th>Target Zone</th>
                      <th>Severity</th>
                      <th>Dissemination Channels</th>
                      <th>Timestamp</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((item, idx) => {
                      const sev = (item.severity || 'high').toLowerCase();
                      return (
                        <tr key={idx}>
                          <td><strong>{item.refId}</strong></td>
                          <td>{item.zone || item.zoneName || 'General Monitored Sector'}</td>
                          <td>
                            <span className={`status-pill ${sev === 'critical' ? 'critical' : 'high'}`}>
                              {sev.toUpperCase()}
                            </span>
                          </td>
                          <td>{item.channels || 'Multi-Channel Push & Siren'}</td>
                          <td>{item.time || item.timestamp || 'Recorded'}</td>
                          <td><span className="status-live-tag">Active</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          </main>
        );
      })()}

      {/* =====================================================================
           INCIDENT CASE DOSSIER FULL DETAILS MODAL
           ===================================================================== */}
      {selectedCaseModal && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedCaseModal(null)}>
          <div className="admin-case-dossier-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dossier-header">
              <div className="dossier-title-group">
                <span className="dossier-ref-tag">{selectedCaseModal.id}</span>
                <span className={`status-pill ${selectedCaseModal.severity === 'critical' ? 'critical' : 'high'}`}>
                  {selectedCaseModal.severity === 'critical' ? 'CRITICAL PRIORITY' : 'ELEVATED WARNING'}
                </span>
                <span className={`status-pill ${selectedCaseModal.status === 'resolved' ? 'low' : (selectedCaseModal.status === 'dispatched' ? 'high' : 'critical')}`}>
                  {selectedCaseModal.status === 'resolved' ? 'RESOLVED' : (selectedCaseModal.status === 'dispatched' ? 'FIELD OFFICER DISPATCHED' : 'PENDING INSPECTION')}
                </span>
              </div>
              <button
                type="button"
                className="btn-modal-close-icon"
                onClick={() => setSelectedCaseModal(null)}
                title="Close Dossier"
              >
                &times;
              </button>
            </div>

            <div className="dossier-body">
              {/* Incident Summary Banner */}
              <div className="dossier-summary-card">
                <div className="dossier-summary-label">Reported Hazard Classification</div>
                <div className="dossier-summary-title">{selectedCaseModal.category || selectedCaseModal.type || 'Ground Instability / Fissure'}</div>
                <div className="dossier-summary-desc">{selectedCaseModal.description || selectedCaseModal.desc}</div>
                {selectedCaseModal.tags && (
                  <div className="dossier-tags-row">
                    {selectedCaseModal.tags.map((tg, i) => (
                      <span key={i} className="dossier-tag-pill">#{tg}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="dossier-grid-2col">
                {/* Column 1: Reporter & Geospatial Info */}
                <div className="dossier-section-box">
                  <h4 className="dossier-section-heading">Reporter &amp; Location Details</h4>
                  
                  <div className="dossier-field-row">
                    <span className="dossier-field-label">Citizen Reporter:</span>
                    <span className="dossier-field-val"><strong>{selectedCaseModal.reporter}</strong></span>
                  </div>

                  <div className="dossier-field-row">
                    <span className="dossier-field-label">Contact Number:</span>
                    <span className="dossier-field-val" style={{ fontFamily: 'monospace' }}>
                      {selectedCaseModal.contact || selectedCaseModal.phone || 'N/A'}
                    </span>
                  </div>

                  <div className="dossier-field-row">
                    <span className="dossier-field-label">Logged Timestamp:</span>
                    <span className="dossier-field-val">{selectedCaseModal.timestamp || selectedCaseModal.time || 'Recent'}</span>
                  </div>

                  <div className="dossier-field-row">
                    <span className="dossier-field-label">Location Sector:</span>
                    <span className="dossier-field-val">{selectedCaseModal.location}</span>
                  </div>

                  <div className="dossier-field-row">
                    <span className="dossier-field-label">GPS Coordinates:</span>
                    <span className="dossier-field-val" style={{ color: selectedCaseModal.hasGeotag ? '#16a34a' : '#d97706', fontWeight: 700 }}>
                      {selectedCaseModal.coordsText || (selectedCaseModal.coords ? `${selectedCaseModal.coords[0]}° N, ${selectedCaseModal.coords[1]}° E` : 'Sector Reference (No GPS Lock)')}
                    </span>
                  </div>
                </div>

                {/* Column 2: Field Officer & Assessment */}
                <div className="dossier-section-box">
                  <h4 className="dossier-section-heading">Field Officer Verification</h4>
                  
                  <div className="dossier-field-row">
                    <span className="dossier-field-label">Assigned Officer:</span>
                    <span className="dossier-field-val">
                      <strong>{selectedCaseModal.patrolOfficer || selectedCaseModal.dispatchedOfficer || (selectedCaseModal.status === 'dispatched' ? 'Field Officer Unit 2' : 'Unassigned')}</strong>
                    </span>
                  </div>

                  <div className="dossier-field-row">
                    <span className="dossier-field-label">Inspection Status:</span>
                    <span className="dossier-field-val">
                      {selectedCaseModal.statusText || (selectedCaseModal.status === 'resolved' ? 'Resolved & Cleared' : (selectedCaseModal.status === 'dispatched' ? 'Field Officer En Route' : 'Awaiting Field Dispatch'))}
                    </span>
                  </div>

                  <div className="dossier-field-row">
                    <span className="dossier-field-label">Inspection Notes:</span>
                    <span className="dossier-field-val" style={{ fontStyle: selectedCaseModal.patrolNotes ? 'normal' : 'italic', color: selectedCaseModal.patrolNotes ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {selectedCaseModal.patrolNotes || 'No preliminary patrol notes logged. Awaiting field officer arrival.'}
                    </span>
                  </div>

                  <div className="dossier-field-row">
                    <span className="dossier-field-label">Photo Observation:</span>
                    <span className="dossier-field-val" style={{ color: '#2563eb' }}>
                      {selectedCaseModal.photo || 'Visual evidence captured on citizen submission'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="dossier-footer">
              <div className="dossier-footer-left">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  State Disaster Response Field Management Protocol
                </span>
              </div>
              <div className="dossier-footer-right">
                {selectedCaseModal.status !== 'resolved' && (
                  <>
                    <button
                      type="button"
                      className="btn-dossier-dispatch"
                      onClick={() => {
                        handleDispatchFieldOfficer(selectedCaseModal.id);
                        setSelectedCaseModal(prev => prev ? {
                          ...prev,
                          status: 'dispatched',
                          statusText: 'Field Officer En Route',
                          patrolOfficer: prev.patrolOfficer && prev.patrolOfficer !== 'Unassigned' ? prev.patrolOfficer : 'Field Officer Unit 2',
                          dispatchedOfficer: 'Field Officer Unit 2'
                        } : null);
                      }}
                    >
                      Dispatch Field Officer
                    </button>
                    <button
                      type="button"
                      className="btn-dossier-resolve"
                      onClick={() => {
                        handleResolveReport(selectedCaseModal.id);
                        setSelectedCaseModal(prev => prev ? { ...prev, status: 'resolved', statusText: 'Resolved & Clear' } : null);
                      }}
                    >
                      Mark Resolved
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="btn-dossier-close"
                  onClick={() => setSelectedCaseModal(null)}
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
           HARDWARE DIAGNOSTIC & TELEMETRY DOSSIER MODAL
           ===================================================================== */}
      {selectedHardwareModal && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedHardwareModal(null)}>
          <div className="admin-dossier-modal hardware-dossier-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dossier-header">
              <div className="dossier-title-group">
                <div className="dossier-id-badge" style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}>
                  <span style={{ color: '#0f172a', fontWeight: 800 }}>{selectedHardwareModal.id}</span>
                </div>
                <div>
                  <h3 className="dossier-title">{selectedHardwareModal.name}</h3>
                  <div className="dossier-subtitle">
                    Model: {selectedHardwareModal.model} • Deployed in {zoneData.name.split(' (')[0]}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`status-pill ${selectedHardwareModal.status === 'critical' ? 'critical' : selectedHardwareModal.status === 'warning' ? 'high' : 'low'}`}>
                  {selectedHardwareModal.statusText}
                </span>
                <button
                  type="button"
                  className="btn-modal-close-icon"
                  onClick={() => setSelectedHardwareModal(null)}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="dossier-body">
              {/* Top Telemetry KPI Bar */}
              <div className="diag-kpi-bar">
                <div className="diag-kpi-item">
                  <span className="lbl">Primary Sensor Telemetry</span>
                  <span className="val" style={{ color: selectedHardwareModal.status === 'critical' ? '#dc2626' : selectedHardwareModal.status === 'warning' ? '#ea580c' : '#16a34a' }}>
                    {selectedHardwareModal.primaryMetric}
                  </span>
                </div>
                <div className="diag-kpi-item">
                  <span className="lbl">Power / Voltage</span>
                  <span className="val">{selectedHardwareModal.battery}</span>
                </div>
                <div className="diag-kpi-item">
                  <span className="lbl">RF Link RSSI</span>
                  <span className="val">{selectedHardwareModal.signal}</span>
                </div>
                <div className="diag-kpi-item">
                  <span className="lbl">Packet Loss</span>
                  <span className="val" style={{ color: '#16a34a' }}>{selectedHardwareModal.packetLoss}</span>
                </div>
                <div className="diag-kpi-item">
                  <span className="lbl">Last Uplink Ping</span>
                  <span className="val">{selectedHardwareModal.lastPing}</span>
                </div>
              </div>

              {/* 2-Column Detailed Telemetry Grid */}
              <div className="dossier-grid-2col" style={{ marginTop: '16px' }}>
                {/* Column 1: Raw Register Data */}
                <div className="dossier-card">
                  <h4 className="dossier-card-title">Live Sensor Raw Registers &amp; Sub-Metrics</h4>
                  <div className="dossier-field-list">
                    {selectedHardwareModal.rawValues && Object.entries(selectedHardwareModal.rawValues).map(([key, val]) => (
                      <div key={key} className="dossier-field-row">
                        <span className="dossier-field-label" style={{ textTransform: 'capitalize' }}>
                          {key.replace(/([A-Z])/g, ' $1').replace(/_/g, '.')}:
                        </span>
                        <span className="dossier-field-val" style={{ fontWeight: 700, color: '#0f172a' }}>
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: Thresholds, Network & Calibration */}
                <div className="dossier-card">
                  <h4 className="dossier-card-title">Calibration, Thresholds &amp; Node Health</h4>
                  <div className="dossier-field-list">
                    <div className="dossier-field-row">
                      <span className="dossier-field-label">Safety Threshold:</span>
                      <span className="dossier-field-val" style={{ color: selectedHardwareModal.status === 'critical' ? '#dc2626' : '#ea580c', fontWeight: 700 }}>
                        {selectedHardwareModal.threshold}
                      </span>
                    </div>
                    <div className="dossier-field-row">
                      <span className="dossier-field-label">Sensor Category:</span>
                      <span className="dossier-field-val">{selectedHardwareModal.typeLabel}</span>
                    </div>
                    <div className="dossier-field-row">
                      <span className="dossier-field-label">Deployment Zone:</span>
                      <span className="dossier-field-val">{zoneData.name}</span>
                    </div>
                    <div className="dossier-field-row">
                      <span className="dossier-field-label">Coordinates:</span>
                      <span className="dossier-field-val">{zoneData.coords}</span>
                    </div>
                    <div className="dossier-field-row">
                      <span className="dossier-field-label">Firmware Protocol:</span>
                      <span className="dossier-field-val">Modbus-RTU / LoRaWAN v1.0.4 SEC-V2</span>
                    </div>
                    <div className="dossier-field-row">
                      <span className="dossier-field-label">Diagnostics Self-Check:</span>
                      <span className="dossier-field-val" style={{ color: '#16a34a', fontWeight: 700 }}>
                        PASS (Zero Drift: 0.02%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="dossier-footer">
              <div className="dossier-footer-left">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Hardware Telemetry Gateway • High-Frequency Polling Active (5s Loop)
                </span>
              </div>
              <div className="dossier-footer-right">
                <button
                  type="button"
                  className="btn-diag-action"
                  onClick={() => {
                    showOperationalToast(`Uplink ping sent to ${selectedHardwareModal.id}: Response 14ms (Healthy)`);
                  }}
                >
                  Ping Node
                </button>
                <button
                  type="button"
                  className="btn-diag-action"
                  onClick={() => {
                    showOperationalToast(`Zero-offset calibration routine completed for ${selectedHardwareModal.id}`);
                  }}
                >
                  Zero Calibrate
                </button>
                <button
                  type="button"
                  className="btn-diag-action"
                  onClick={() => {
                    showOperationalToast(`Diagnostic self-test completed for ${selectedHardwareModal.id}: All registers nominal`);
                  }}
                >
                  Run Self-Test
                </button>
                <button
                  type="button"
                  className="btn-dossier-close"
                  onClick={() => setSelectedHardwareModal(null)}
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
           DANGER ZONE HAZARD DOSSIER POPUP MODAL
           ===================================================================== */}
      {selectedZoneModal && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedZoneModal(null)}>
          <div className="admin-dossier-modal zone-dossier-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dossier-header">
              <div className="dossier-title-group">
                <div className="dossier-id-badge" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
                  <span style={{ color: '#dc2626', fontWeight: 800 }}>HAZARD SECTOR</span>
                </div>
                <div>
                  <h3 className="dossier-title">{selectedZoneModal.name}</h3>
                  <div className="dossier-subtitle">
                    {selectedZoneModal.coords}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`status-pill ${selectedZoneModal.severity === 'critical' ? 'critical' : 'high'}`}>
                  {selectedZoneModal.finalRisk} Risk • {selectedZoneModal.severityText || 'Active Alert'}
                </span>
                <button
                  type="button"
                  className="btn-modal-close-icon"
                  onClick={() => setSelectedZoneModal(null)}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="dossier-body">
              {/* Top Telemetry KPI Bar */}
              <div className="diag-kpi-bar">
                <div className="diag-kpi-item">
                  <span className="lbl">Hazard Susceptibility</span>
                  <span className="val" style={{ color: '#dc2626' }}>{selectedZoneModal.finalRisk}</span>
                </div>
                <div className="diag-kpi-item">
                  <span className="lbl">Model Confidence</span>
                  <span className="val" style={{ color: '#2563eb' }}>{selectedZoneModal.confidenceScore || '93.8%'}</span>
                </div>
                <div className="diag-kpi-item">
                  <span className="lbl">Est. Risk Window</span>
                  <span className="val" style={{ color: '#ea580c' }}>{selectedZoneModal.riskWindow || '~45 min'}</span>
                </div>
                <div className="diag-kpi-item">
                  <span className="lbl">InSAR Creep Rate</span>
                  <span className="val" style={{ color: '#7c3aed' }}>{selectedZoneModal.satellite?.insarVelocity || '+15.8 mm/wk'}</span>
                </div>
                <div className="diag-kpi-item">
                  <span className="lbl">Active Sensors</span>
                  <span className="val" style={{ color: '#16a34a' }}>{(selectedZoneModal.hardwareNodes || []).length || 4} Deployed Nodes</span>
                </div>
              </div>

              {/* 2-Column Detailed Hazard Dossier */}
              <div className="dossier-grid-2col" style={{ marginTop: '16px' }}>
                {/* Column 1: Landslide Trigger Factors */}
                <div className="dossier-card">
                  <h4 className="dossier-card-title">Contributing Landslide Factors &amp; Telemetry</h4>
                  <div className="dossier-field-list">
                    {(selectedZoneModal.factors || []).map((factor, idx) => (
                      <div key={idx} className="dossier-field-row">
                        <span className="dossier-field-label">{factor.label}:</span>
                        <span className="dossier-field-val" style={{ fontWeight: 700, color: '#0f172a' }}>
                          {factor.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: Evacuation & Critical Corridors */}
                <div className="dossier-card">
                  <h4 className="dossier-card-title">Evacuation Shelter &amp; Road Corridors</h4>
                  <div className="dossier-field-list">
                    <div className="dossier-field-row">
                      <span className="dossier-field-label">Designated Shelter:</span>
                      <span className="dossier-field-val" style={{ color: '#2563eb', fontWeight: 700 }}>
                        {selectedZoneModal.shelter}
                      </span>
                    </div>
                    <div className="dossier-field-row">
                      <span className="dossier-field-label">At-Risk Villages:</span>
                      <span className="dossier-field-val">
                        {(selectedZoneModal.villages || []).map(v => v.name).join(', ') || 'Ridge Settlement Sector'}
                      </span>
                    </div>
                    <div className="dossier-field-row">
                      <span className="dossier-field-label">Road Network Status:</span>
                      <span className="dossier-field-val" style={{ color: '#dc2626', fontWeight: 700 }}>
                        {(selectedZoneModal.roads || []).filter(r => r.status === 'blocked').length} Blocked • {(selectedZoneModal.roads || []).filter(r => r.status === 'restricted').length} Restricted
                      </span>
                    </div>
                    <div className="dossier-field-row">
                      <span className="dossier-field-label">Cascading Hazard:</span>
                      <span className="dossier-field-val" style={{ color: '#ea580c' }}>
                        {selectedZoneModal.flags?.cascadingFlood?.badge || 'Slope Debris Flow Encroachment'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="dossier-footer">
              <div className="dossier-footer-left">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  District Disaster Management Authority (DDMA) • Sector Risk Assessment
                </span>
              </div>
              <div className="dossier-footer-right">
                <button
                  type="button"
                  className="btn-dossier-dispatch"
                  onClick={() => {
                    const key = selectedZoneModal.key || Object.keys(ZONES_DATABASE).find(k => ZONES_DATABASE[k].name === selectedZoneModal.name) || 'shillong-meghalaya';
                    setSelectedZoneKey(key);
                    setActivePage('page2');
                    setSelectedZoneModal(null);
                  }}
                >
                  Inspect Tactical Sector →
                </button>
                <button
                  type="button"
                  className="btn-dossier-resolve"
                  onClick={() => {
                    const key = selectedZoneModal.key || Object.keys(ZONES_DATABASE).find(k => ZONES_DATABASE[k].name === selectedZoneModal.name) || 'shillong-meghalaya';
                    setSelectedZoneKey(key);
                    setSelectedZoneModal(null);
                    setShowConfirmModal(true);
                  }}
                >
                  Broadcast Evacuation Alert
                </button>
                <button
                  type="button"
                  className="btn-dossier-close"
                  onClick={() => setSelectedZoneModal(null)}
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
           BLOCKED ROAD & BYPASS DOSSIER POPUP MODAL
           ===================================================================== */}
      {selectedRoadModal && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedRoadModal(null)}>
          <div className="admin-dossier-modal road-dossier-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dossier-header">
              <div className="dossier-title-group">
                <div className="dossier-id-badge" style={{ background: selectedRoadModal.status === 'blocked' ? '#fef2f2' : '#fff7ed', borderColor: selectedRoadModal.status === 'blocked' ? '#fecaca' : '#fed7aa' }}>
                  <span style={{ color: selectedRoadModal.status === 'blocked' ? '#dc2626' : '#ea580c', fontWeight: 800 }}>ROAD CORRIDOR</span>
                </div>
                <div>
                  <h3 className="dossier-title">{selectedRoadModal.name}</h3>
                  <div className="dossier-subtitle">
                    Designated Bypass: {selectedRoadModal.bypass} ({selectedRoadModal.delay})
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`status-pill ${selectedRoadModal.status === 'blocked' ? 'critical' : (selectedRoadModal.status === 'restricted' ? 'high' : 'low')}`}>
                  {selectedRoadModal.status.toUpperCase()} • {selectedRoadModal.statusText || 'Active Incident'}
                </span>
                <button
                  type="button"
                  className="btn-modal-close-icon"
                  onClick={() => setSelectedRoadModal(null)}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="dossier-body">
              {/* Top Telemetry KPI Bar */}
              <div className="diag-kpi-bar">
                <div className="diag-kpi-item">
                  <span className="lbl">Corridor Status</span>
                  <span className="val" style={{ color: selectedRoadModal.status === 'blocked' ? '#dc2626' : '#ea580c' }}>
                    {selectedRoadModal.status.toUpperCase()}
                  </span>
                </div>
                <div className="diag-kpi-item">
                  <span className="lbl">Active Bypass Route</span>
                  <span className="val" style={{ color: '#2563eb' }}>{selectedRoadModal.bypass}</span>
                </div>
                <div className="diag-kpi-item">
                  <span className="lbl">Transit Delay</span>
                  <span className="val" style={{ color: '#dc2626' }}>{selectedRoadModal.delay}</span>
                </div>
                <div className="diag-kpi-item">
                  <span className="lbl">Traffic Patrol Assigned</span>
                  <span className="val" style={{ color: '#16a34a' }}>SDRF Traffic Unit #4</span>
                </div>
              </div>

              {/* 2-Column Detailed Road Information */}
              <div className="dossier-grid-2col" style={{ marginTop: '16px' }}>
                {/* Column 1: Hazard Cause & Road Blockade Summary */}
                <div className="dossier-card">
                  <h4 className="dossier-card-title">Hazard Assessment &amp; Obstruction Summary</h4>
                  <div className="dossier-field-list">
                    <div className="dossier-field-row">
                      <span className="dossier-field-label">Obstruction Cause:</span>
                      <span className="dossier-field-val" style={{ color: '#dc2626', fontWeight: 700 }}>
                        {selectedRoadModal.status === 'blocked' ? 'Colluvial slope failure & 120m mudflow debris across carriageway' : 'Slush and gravel runoff with active slope creep'}
                      </span>
                    </div>
                    <div className="dossier-field-row">
                      <span className="dossier-field-label">Affected Section:</span>
                      <span className="dossier-field-val">Km 42.6 to Km 43.1 (Upper Ridge Scarp)</span>
                    </div>
                    <div className="dossier-field-row">
                      <span className="dossier-field-label">Clearance Operations:</span>
                      <span className="dossier-field-val" style={{ color: '#2563eb', fontWeight: 700 }}>
                        2 JCB Excavators + SDRF Clearing Crew En Route
                      </span>
                    </div>
                    <div className="dossier-field-row">
                      <span className="dossier-field-label">Public Traffic Advisory:</span>
                      <span className="dossier-field-val">
                        Civilian transit halted on main corridor. All vehicles diverted via designated bypass.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Bypass Navigation & Detour Guidance */}
                <div className="dossier-card">
                  <h4 className="dossier-card-title">Designated Bypass Route &amp; Navigational Guidance</h4>
                  <div className="dossier-field-list">
                    <div className="dossier-field-row">
                      <span className="dossier-field-label">Bypass Name:</span>
                      <span className="dossier-field-val" style={{ fontWeight: 700, color: '#0f172a' }}>
                        {selectedRoadModal.bypass}
                      </span>
                    </div>
                    <div className="dossier-field-row">
                      <span className="dossier-field-label">Route Condition:</span>
                      <span className="dossier-field-val" style={{ color: '#16a34a', fontWeight: 700 }}>
                        Paved 2-lane road • Monitored &amp; Clear
                      </span>
                    </div>
                    <div className="dossier-field-row">
                      <span className="dossier-field-label">Detour Distance:</span>
                      <span className="dossier-field-val">{selectedRoadModal.delay}</span>
                    </div>
                    <div className="dossier-field-row">
                      <span className="dossier-field-label">Heavy Vehicle Restrictions:</span>
                      <span className="dossier-field-val">Multi-axle trucks restricted; LMVs &amp; Ambulances allowed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="dossier-footer">
              <div className="dossier-footer-left">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Traffic &amp; Corridor Management Protocol • Live GPS Tracking
                </span>
              </div>
              <div className="dossier-footer-right">
                <button
                  type="button"
                  className="btn-dossier-dispatch"
                  onClick={() => {
                    setActivePage('page2');
                    setSelectedRoadModal(null);
                  }}
                >
                  View on Tactical Sector Map →
                </button>
                <button
                  type="button"
                  className="btn-dossier-close"
                  onClick={() => setSelectedRoadModal(null)}
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
           EMERGENCY BROADCAST CONFIRMATION MODAL
           ===================================================================== */}
      {showConfirmModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowConfirmModal(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-danger">
              <h3>Confirm Emergency Evacuation Broadcast</h3>
            </div>

            <div className="modal-body-content">
              <p>You are about to issue a <strong>RED LEVEL EVACUATION ALERT</strong> for:</p>
              <div className="modal-target-box">
                <strong>{zoneData.name}</strong>
                <div>Designated Shelter: <strong>{zoneData.shelter}</strong></div>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px' }}>
                This will trigger multi-channel App Push notifications, Emergency SMS, and activate the synced physical siren.
              </p>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-dispatch"
                onClick={confirmAndDispatchAlert}
              >
                Confirm &amp; Dispatch Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Operational Toast */}
      {showToast && (
        <div className="admin-toast-pill">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
