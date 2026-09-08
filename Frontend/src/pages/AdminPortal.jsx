import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import '../styles/admin.css';
import {
  ZONES_DATABASE,
  INITIAL_CITIZEN_REPORTS,
  INITIAL_DISPATCHED_ALERTS,
  INITIAL_REJECTED_ALERTS,
  INITIAL_CITIZEN_EVACUATION_TRACKING
} from '../utils/adminData';
import { connectArduino, sendToArduino } from '../utils/arduinoSerial';


export default function AdminPortal() {
  const [activePage, setActivePage] = useState('page1'); // 'page1', 'page2', 'page3', 'page4'
  const [selectedZoneKey, setSelectedZoneKey] = useState('shillong-meghalaya');
  const [citizenReports, setCitizenReports] = useState(INITIAL_CITIZEN_REPORTS);
  const [dispatchedAlerts, setDispatchedAlerts] = useState(INITIAL_DISPATCHED_ALERTS);
  const [rejectedAlerts, setRejectedAlerts] = useState(INITIAL_REJECTED_ALERTS);
  const [reportFilter, setReportFilter] = useState('all');
  const [reportSearch, setReportSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyZoneFilter, setHistoryZoneFilter] = useState('all');

  // Modals state
  const [showSatModal, setShowSatModal] = useState(false);
  const [satModalMode, setSatModalMode] = useState('sentinel-1'); // 'sentinel-1', 'sentinel-2', 'compare'
  const [satComparePos, setSatComparePos] = useState(50);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showStatModal, setShowStatModal] = useState(false);
  const [statModalType, setStatModalType] = useState('danger-zones');
  const [showCitizenModal, setShowCitizenModal] = useState(false);
  const [selectedCitizenReport, setSelectedCitizenReport] = useState(null);
  const [showPeopleModal, setShowPeopleModal] = useState(false);

  // Status & Time state
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [arduinoConnected, setArduinoConnected] = useState(false);
  const [clockTime, setClockTime] = useState('');

  const overviewMapRef = useRef(null);
  const overviewMapInstanceRef = useRef(null);
  const zoneMapRef = useRef(null);
  const zoneMapInstanceRef = useRef(null);
  const zoneLayersRef = useRef({});

  const zoneData = ZONES_DATABASE[selectedZoneKey] || ZONES_DATABASE['shillong-meghalaya'];

  const showOperationalToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClockTime(`${now.toLocaleTimeString('en-GB', { hour12: false })} IST`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const [citizenEvacuations, setCitizenEvacuations] = useState(INITIAL_CITIZEN_EVACUATION_TRACKING);

  // Dispatch Physical SDRF Rescue Team for Unresponsive Citizens
  const handleDispatchPhysicalRescue = (citizen) => {
    const qrtName = `SDRF Rescue Unit #${Math.floor(1 + Math.random() * 5)}`;
    setCitizenEvacuations(prev => prev.map(c => {
      if (c.id === citizen.id) {
        return {
          ...c,
          qrtDispatched: true,
          qrtTeam: qrtName,
          status: 'rescuing',
          actionText: `🚨 ${qrtName} Dispatched (Physical Welfare Check En Route)`
        };
      }
      return c;
    }));

    // Broadcast urgent task to Field Portal (SDRF officers)
    const taskPayload = {
      type: 'SDRF_PHYSICAL_DISPATCH',
      taskId: `RESCUE-${Math.floor(201 + Math.random() * 800)}`,
      residentName: citizen.name,
      location: citizen.location,
      phone: citizen.phone,
      zone: citizen.zone,
      urgency: 'CRITICAL / LIFE SAFETY',
      summary: `Non-responsive citizen after Level 4 disaster alarm. Alarm not turned off. Immediate physical welfare check and manual evacuation required to ${citizen.shelterTarget}.`,
      shelter: citizen.shelterTarget,
      assignedUnit: qrtName
    };

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('resilientguard_admin_alerts');
        channel.postMessage(taskPayload);
        channel.close();
      }
    } catch (e) {}

    try {
      localStorage.setItem('resilientguard_field_rescue_task', JSON.stringify({ ...taskPayload, triggerTime: Date.now() }));
    } catch (e) {}

    showOperationalToast(`🚨 Physical Rescue Dispatched: ${qrtName} assigned to ${citizen.name} (${citizen.location})`);
  };

  // Listen to cross-tab broadcast messages & Citizen Alarm Responses
  useEffect(() => {
    let channel;
    const processIncomingCitizenResponse = (data) => {
      if (!data) return;
      if (data.type === 'CITIZEN_ALARM_RESPONSE') {
        setCitizenEvacuations(prev => {
          const existingIdx = prev.findIndex(c => c.id === data.citizenId || c.name === data.name);
          if (existingIdx !== -1) {
            const updated = [...prev];
            updated[existingIdx] = {
              ...updated[existingIdx],
              status: data.status,
              actionText: data.actionText,
              lastUpdate: data.timestamp || 'Just now',
              shelterTarget: data.shelterTarget || updated[existingIdx].shelterTarget
            };
            return updated;
          } else {
            const newEntry = {
              id: data.citizenId || `CIT-LIVE-${Date.now()}`,
              name: data.name || 'Citizen App User (Live)',
              phone: data.phone || '+91 98765-LIVE-APP',
              zone: data.zone || 'Shillong Urban & Ridge Slopes (Meghalaya)',
              location: data.location || 'Monitored Danger Zone',
              status: data.status || 'acknowledged',
              actionText: data.actionText || '🟢 Alarm Turned Off / Evacuating',
              lastUpdate: data.timestamp || 'Just now',
              shelterTarget: data.shelterTarget || 'Shillong Municipal Relief Center #1',
              qrtDispatched: false,
              qrtTeam: null
            };
            return [newEntry, ...prev];
          }
        });
        showOperationalToast(`🔔 Citizen Evacuation Update: ${data.name || 'Resident'} — ${data.actionText}`);
      }
    };

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('resilientguard_admin_alerts');
        channel.onmessage = (e) => {
          const data = e.data;
          if (!data) return;

          if (data.type === 'CITIZEN_REPORT_SUBMITTED') {
            const newRep = {
              id: `REP-${Math.floor(100 + Math.random() * 900)}`,
              reporter: data.reporter || 'Citizen (App)',
              contact: data.contact || 'App Verified',
              zoneKey: 'shillong-meghalaya',
              zone: data.zone || 'Shillong Urban Ridge',
              location: data.location || 'Shillong Sector',
              coords: data.coords || [25.5788, 91.8933],
              coordsText: data.coordsText || '25.5788° N, 91.8933° E',
              category: data.category || 'Tension Crack',
              tags: data.tags || ['Field Finding'],
              severity: data.severity || 'high',
              urgencyText: data.severity === 'critical' ? 'Critical' : 'Elevated Watch',
              description: data.description || 'Ground observation logged via citizen portal.',
              photo: 'Photo evidence captured',
              timestamp: 'Just now',
              status: 'pending',
              statusText: 'Pending Field Check',
              patrolOfficer: 'Unassigned',
              patrolNotes: '',
              dispatchedQrt: null
            };
            setCitizenReports(prev => [newRep, ...prev]);
            showOperationalToast(`New Citizen Hazard Report Received: ${newRep.id}`);
          } else if (data.type === 'FIELD_TASK_RESOLVED') {
            showOperationalToast(`Field Task ${data.taskId} resolved as ${data.resolution.toUpperCase()}`);
          } else if (data.type === 'CITIZEN_ALARM_RESPONSE') {
            processIncomingCitizenResponse(data);
          }
        };
      }
    } catch (err) {
      console.warn('Admin broadcast notice:', err);
    }

    const handleStorage = (e) => {
      if (e.key === 'resilientguard_citizen_response' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          processIncomingCitizenResponse(parsed);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Overview Map initialization
  useEffect(() => {
    if (activePage === 'page1' && overviewMapRef.current) {
      if (!overviewMapInstanceRef.current) {
        const map = L.map(overviewMapRef.current, {
          center: [26.2, 92.9],
          zoom: 7,
          zoomControl: true,
          attributionControl: false
        });

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19
        }).addTo(map);

        L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19
        }).addTo(map);

        // Render all zones on overview map
        Object.keys(ZONES_DATABASE).forEach(key => {
          const z = ZONES_DATABASE[key];
          const color = z.severity === 'critical' ? '#dc2626' : (z.severity === 'high' ? '#ea580c' : '#d97706');
          
          if (z.polygon) {
            L.polygon(z.polygon, {
              color: color,
              weight: 2,
              fillColor: color,
              fillOpacity: 0.4
            }).addTo(map).bindPopup(`
              <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.8rem; padding: 4px;">
                <strong>${z.name}</strong><br/>
                Risk Level: <strong style="color:${color};">${z.finalRisk}</strong><br/>
                Window: ${z.riskWindow}
              </div>
            `);
          }

          L.circleMarker(z.center, {
            radius: 8,
            fillColor: color,
            color: '#ffffff',
            weight: 2,
            fillOpacity: 1
          }).addTo(map).bindPopup(`
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.8rem; padding: 4px;">
              <strong>${z.name}</strong><br/>
              Status: <span style="color:${color}; font-weight:700;">${z.severity.toUpperCase()}</span>
            </div>
          `);
        });

        overviewMapInstanceRef.current = map;
      } else {
        setTimeout(() => {
          overviewMapInstanceRef.current.invalidateSize();
        }, 100);
      }
    }
  }, [activePage]);

  // Zone Tactical Map initialization
  useEffect(() => {
    if (activePage === 'page2' && zoneMapRef.current) {
      if (!zoneMapInstanceRef.current) {
        const map = L.map(zoneMapRef.current, {
          center: zoneData.center,
          zoom: zoneData.zoom || 15,
          zoomControl: true,
          attributionControl: false
        });

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19
        }).addTo(map);

        L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19
        }).addTo(map);

        zoneLayersRef.current.perimeter = L.layerGroup().addTo(map);
        zoneLayersRef.current.sensors = L.layerGroup().addTo(map);

        zoneMapInstanceRef.current = map;
      }

      const map = zoneMapInstanceRef.current;
      map.setView(zoneData.center, zoneData.zoom || 15);

      if (zoneLayersRef.current.perimeter) zoneLayersRef.current.perimeter.clearLayers();
      if (zoneLayersRef.current.sensors) zoneLayersRef.current.sensors.clearLayers();

      if (zoneData.polygon) {
        const sevColor = zoneData.severity === 'critical' ? '#dc2626' : (zoneData.severity === 'high' ? '#ea580c' : '#d97706');
        L.polygon(zoneData.polygon, {
          color: sevColor,
          weight: 3,
          fillColor: sevColor,
          fillOpacity: 0.4,
          dashArray: '6, 6'
        }).addTo(zoneLayersRef.current.perimeter).bindPopup(`
          <strong>${zoneData.name}</strong><br>Risk: ${zoneData.finalRisk} (Confidence: ${zoneData.confidenceScore})
        `);
      }

      if (zoneData.sensors) {
        zoneData.sensors.forEach(s => {
          L.circleMarker(s.pos, {
            radius: 7,
            fillColor: s.color || '#38bdf8',
            color: '#ffffff',
            weight: 2,
            fillOpacity: 1
          }).addTo(zoneLayersRef.current.sensors).bindPopup(`
            <strong>${s.name}</strong><br>Status: ${s.val}
          `);
        });
      }

      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [activePage, selectedZoneKey, zoneData]);

  // Connect Arduino Web Serial
  const handleConnectArduino = async () => {
    const success = await connectArduino(showOperationalToast);
    setArduinoConnected(success);
  };

  // Disseminate alert
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
      severity: 'danger',
      shelter: zoneData.shelter,
      siren: 'eas',
      timestamp: timeStr
    };

    // Broadcast across tabs via BroadcastChannel
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('resilientguard_admin_alerts');
        channel.postMessage(payload);
        channel.close();
      }
    } catch (err) {
      console.warn('Broadcast error:', err);
    }

    // Secondary Cross-Tab / Window Synchronization via LocalStorage
    try {
      localStorage.setItem('resilientguard_latest_alert', JSON.stringify(payload));
    } catch (err) {
      console.warn('LocalStorage alert sync notice:', err);
    }

    const newDispatch = {
      refId: refId,
      zone: zoneData.name,
      time: timeStr,
      reach: 'Laitumkhrah (99%), Police Bazar (96%), Polo (98%)',
      channel: 'App Push + SMS + Siren',
      delivery: '98.8%',
      status: 'Active'
    };

    setDispatchedAlerts(prev => [newDispatch, ...prev]);
    setShowConfirmModal(false);
    showOperationalToast(`🚨 Emergency Broadcast & Siren Dispatched for ${zoneData.name}`);
  };

  // Accept and verify zone alert
  const acceptAndVerifyZoneAlert = () => {
    showOperationalToast(`Zone "${zoneData.name}" verified and accepted as operational danger priority.`);
  };

  // Reject / False alarm
  const promptRejectAlert = () => {
    const refId = `#REJ-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const timeStr = `${String(now.getDate()).padStart(2, '0')}-Sep ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST`;

    const newRej = {
      refId: refId,
      zone: zoneData.name,
      time: timeStr,
      officer: 'Officer Sushanthi / Command 104',
      reason: 'Terrain telemetry analyzed. Risk classified as false alarm / stable ground.',
      status: 'Archived'
    };

    setRejectedAlerts(prev => [newRej, ...prev]);
    showOperationalToast(`Alert for "${zoneData.name}" archived to rejected log.`);
  };

  // Dispatch officer to citizen report
  const handleDispatchQRT = (reportId) => {
    setCitizenReports(prev => prev.map(r => {
      if (r.id === reportId) {
        return {
          ...r,
          status: 'verified',
          statusText: 'QRT Patrol Dispatched',
          patrolOfficer: 'Officer #104 (SDRF Squad 2)'
        };
      }
      return r;
    }));
    showOperationalToast(`Field QRT Officer #104 dispatched to report ${reportId}`);
    setShowCitizenModal(false);
  };

  // Mark report resolved
  const handleResolveReport = (reportId) => {
    setCitizenReports(prev => prev.map(r => {
      if (r.id === reportId) {
        return { ...r, status: 'resolved', statusText: 'Resolved & Clear' };
      }
      return r;
    }));
    showOperationalToast(`Report ${reportId} marked as resolved.`);
    setShowCitizenModal(false);
  };

  // Open stat detail modal
  const openStatDetailModal = (type) => {
    setStatModalType(type);
    setShowStatModal(true);
  };

  // Switch to zone details from overview list
  const openZoneDetails = (zoneKey) => {
    setSelectedZoneKey(zoneKey);
    setActivePage('page2');
  };

  const [selectedHistoryAlertRef, setSelectedHistoryAlertRef] = useState(dispatchedAlerts[0]?.refId || '#ALERT-2026-9041');
  const [historyResidentFilter, setHistoryResidentFilter] = useState('all'); // 'all', 'unresponsive', 'accepted', 'dispatched'

  // Filtered lists
  const filteredReports = citizenReports.filter(r => {
    const matchFilter = reportFilter === 'all' || r.status === reportFilter || (reportFilter === 'critical' && r.severity === 'critical');
    const matchSearch = reportSearch === '' || r.id.toLowerCase().includes(reportSearch.toLowerCase()) || r.location.toLowerCase().includes(reportSearch.toLowerCase()) || r.reporter.toLowerCase().includes(reportSearch.toLowerCase());
    return matchFilter && matchSearch;
  });

  const filteredHistory = dispatchedAlerts.filter(a => {
    const zoneName = (a.zone || a.zoneName || '').toLowerCase();
    const ref = (a.refId || '').toLowerCase();
    const matchZone = historyZoneFilter === 'all' || zoneName.includes(historyZoneFilter.toLowerCase());
    const matchSearch = historySearch === '' || ref.includes(historySearch.toLowerCase()) || zoneName.includes(historySearch.toLowerCase());
    return matchZone && matchSearch;
  });

  return (
    <div className="admin-body">
      {/* Top Command Bar */}
      <header className="admin-header">
        <div className="admin-brand-wrap">
          <div className="admin-shield-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="brand-title">ResilientGuard</span>
          <span className="admin-badge-role">NER Landslide Command</span>
        </div>

        {/* Central Page Switcher Navigation */}
        <nav className="header-page-nav">
          <button
            type="button"
            className={`nav-page-btn ${activePage === 'page1' ? 'active' : ''}`}
            id="navBtnPage1"
            onClick={() => setActivePage('page1')}
          >
            Overview
          </button>
          <button
            type="button"
            className={`nav-page-btn ${activePage === 'page2' ? 'active' : ''}`}
            id="navBtnPage2"
            onClick={() => setActivePage('page2')}
          >
            Zone Details
          </button>
          <button
            type="button"
            className={`nav-page-btn ${activePage === 'page4' ? 'active' : ''}`}
            id="navBtnPage4"
            onClick={() => setActivePage('page4')}
          >
            Citizen Reports
            <span className="nav-tab-badge" id="citizenReportsNavBadge">
              {citizenReports.filter(r => r.status === 'pending').length}
            </span>
          </button>
          <button
            type="button"
            className={`nav-page-btn ${activePage === 'page3' ? 'active' : ''}`}
            id="navBtnPage3"
            onClick={() => setActivePage('page3')}
          >
            Alerts &amp; History
          </button>
        </nav>

        {/* Header Actions & Meta */}
        <div className="admin-header-actions">
          <div className="admin-live-pulse-badge">
            <span className="pulse-dot"></span>
            <span>Mesh Online</span>
          </div>

          <div className="admin-clock" id="adminLiveClock">{clockTime || 'IST Live'}</div>

          <Link
            to="/login"
            className="btn-portal-link"
            title="Sign out / Switch Role"
            style={{ color: 'var(--status-critical-text)' }}
          >
            Logout
          </Link>
        </div>
      </header>

      {/* =====================================================================
           PAGE 1 — OVERVIEW
           ===================================================================== */}
      <main className={`admin-page-view ${activePage === 'page1' ? 'active' : ''}`} id="viewPage1Overview">
        <div className="page-content-wrapper">

          {/* Top Row: Quick Stats (5 Interactive Metric Cards) */}
          <section className="overview-stats-row">

            <div
              className="stat-metric-card critical clickable"
              onClick={() => openStatDetailModal('danger-zones')}
              title="View danger zones breakdown"
            >
              <div className="stat-label-row">
                <span>Danger Zones</span>
                <span className="status-pill critical">1 Critical</span>
              </div>
              <div className="stat-value" id="statDangerZonesCount">3 Active</div>
              <div className="stat-subtext">1 Critical • 1 High • 1 Moderate</div>
            </div>

            <div
              className="stat-metric-card warning clickable"
              onClick={() => openStatDetailModal('villages')}
              title="View at-risk settlements"
            >
              <div className="stat-label-row">
                <span>At-Risk Settlements</span>
                <span className="status-pill high">High Scope</span>
              </div>
              <div className="stat-value" id="statVillagesCount">4 Sectors</div>
              <div className="stat-subtext">Shillong Ridge, Mawlai, Sohra, Walong</div>
            </div>

            <div
              className="stat-metric-card info clickable"
              onClick={() => openStatDetailModal('roads')}
              title="View road corridors"
            >
              <div className="stat-label-row">
                <span>Road Blockades</span>
                <span className="status-pill blocked">1 Blocked</span>
              </div>
              <div className="stat-value">1 Corridor</div>
              <div className="stat-subtext">GS Road Corridor (Shillong Bypass Active)</div>
            </div>

            <div
              className="stat-metric-card hardware clickable"
              onClick={() => openStatDetailModal('hardware')}
              title="View hardware status"
            >
              <div className="stat-label-row">
                <span>Offline Gateways</span>
                <span className="status-pill critical">Silent Spike</span>
              </div>
              <div className="stat-value" style={{ color: '#be123c' }}>1 Node</div>
              <div className="stat-subtext">GW-SH01 (Shillong post-tilt silence)</div>
            </div>

            <div
              className="stat-metric-card citizen clickable"
              onClick={() => setActivePage('page4')}
              title="View citizen reports feed"
            >
              <div className="stat-label-row">
                <span>Citizen Reports</span>
                <span className="status-pill high" id="statCitizenPendingBadge">
                  {citizenReports.filter(r => r.status === 'pending').length} Pending
                </span>
              </div>
              <div className="stat-value" style={{ color: '#2563eb' }} id="statCitizenReportsCount">
                {citizenReports.length} Filed
              </div>
              <div className="stat-subtext">
                {citizenReports.filter(r => r.status === 'verified').length} Verified • {citizenReports.filter(r => r.status === 'pending').length} Pending <span className="stat-tap-hint">View feed →</span>
              </div>
            </div>

          </section>

          {/* Hardware Health Bar */}
          <div
            className="hardware-health-bar clickable"
            onClick={() => openStatDetailModal('hardware')}
            title="Open hardware telemetry"
          >
            <span><strong>Telemetry:</strong> 1 Gateway offline (GW-04), 7 online • 24 sensors active</span>
            <span style={{ color: 'var(--color-accent)', fontWeight: 700, textDecoration: 'underline' }}>Hardware Status →</span>
          </div>

          {/* Main Layout: Live Heatmap + Danger Zones List */}
          <section className="overview-main-grid">

            {/* Live Risk Heatmap */}
            <div className="heatmap-panel-wrapper">
              <div id="leafletOverviewMap" ref={overviewMapRef}></div>
              <div className="heatmap-legend-badge">
                <span><strong style={{ color: '#dc2626' }}>■</strong> Critical (&gt;85%)</span>
                <span><strong style={{ color: '#ea580c' }}>■</strong> High (65-85%)</span>
                <span><strong style={{ color: '#d97706' }}>■</strong> Moderate (40-65%)</span>
                <span><strong style={{ color: '#16a34a' }}>■</strong> Low (&lt;40%)</span>
              </div>
            </div>

            {/* Danger Zones List Panel */}
            <div className="danger-zones-panel">
              <div className="panel-section-title">
                <span>Active Danger Zones (NER Feeds)</span>
              </div>

              {/* Zone 1: Shillong */}
              <div
                className={`zone-list-card ${selectedZoneKey === 'shillong-meghalaya' ? 'active-selected' : ''}`}
                onClick={() => openZoneDetails('shillong-meghalaya')}
              >
                <div className="zone-card-top">
                  <span className="zone-name-title">Shillong Urban &amp; Ridge Slopes</span>
                  <span className="status-pill critical">CRITICAL</span>
                </div>
                <div className="zone-card-metrics">
                  <span>Risk Score: <strong style={{ color: 'var(--color-critical)' }}>94.6%</strong></span>
                  <span>Window: <strong>~45 min</strong></span>
                </div>
                <div className="zone-card-cta">Inspect Earth Engine &amp; GIS →</div>
              </div>

              {/* Zone 2: Cherrapunji */}
              <div
                className={`zone-list-card ${selectedZoneKey === 'cherrapunji-meghalaya' ? 'active-selected' : ''}`}
                onClick={() => openZoneDetails('cherrapunji-meghalaya')}
              >
                <div className="zone-card-top">
                  <span className="zone-name-title">Cherrapunji (Sohra) Escarpment</span>
                  <span className="status-pill critical">CRITICAL</span>
                </div>
                <div className="zone-card-metrics">
                  <span>Risk Score: <strong style={{ color: 'var(--color-critical)' }}>98.0%</strong></span>
                  <span>Window: <strong>~30 min</strong></span>
                </div>
                <div className="zone-card-cta">Inspect Earth Engine &amp; GIS →</div>
              </div>

              {/* Zone 3: Remote Arunachal */}
              <div
                className={`zone-list-card ${selectedZoneKey === 'remote-arunachal' ? 'active-selected' : ''}`}
                onClick={() => openZoneDetails('remote-arunachal')}
              >
                <div className="zone-card-top">
                  <span className="zone-name-title">Remote Slopes, Arunachal Pradesh</span>
                  <span className="status-pill high">HIGH</span>
                </div>
                <div className="zone-card-metrics">
                  <span>Risk Score: <strong style={{ color: 'var(--color-high)' }}>72.4%</strong></span>
                  <span>Window: <strong>~4 hrs</strong></span>
                </div>
                <div className="zone-card-cta">Inspect Earth Engine &amp; GIS →</div>
              </div>

            </div>

          </section>

        </div>
      </main>

      {/* =====================================================================
           PAGE 2 — DANGER ZONE DETAILS
           ===================================================================== */}
      <main className={`admin-page-view ${activePage === 'page2' ? 'active' : ''}`} id="viewPage2Details">
        <div className="page-content-wrapper zone-details-container">

          {/* Top Zone Selection Ribbon */}
          <div className="zone-selector-ribbon">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Target Zone:</span>
              <select
                className="zone-select-dropdown"
                id="zoneDetailSelect"
                value={selectedZoneKey}
                onChange={(e) => setSelectedZoneKey(e.target.value)}
              >
                <option value="shillong-meghalaya">Shillong Urban &amp; Ridge (Critical • 94.6%)</option>
                <option value="cherrapunji-meghalaya">Cherrapunji (Sohra) Escarpment (Critical • 98.0%)</option>
                <option value="remote-arunachal">Remote Slopes, Arunachal Pradesh (High • 72.4%)</option>
              </select>
            </div>
            <button type="button" className="btn-portal-link" onClick={() => setActivePage('page1')}>
              ← Overview
            </button>
          </div>

          {/* Top Primary Zone Command Actions Bar */}
          <div className="zone-top-action-bar">
            <div className="zone-action-group-left">
              <button
                type="button"
                className="btn-zone-dispatch-primary"
                onClick={() => setShowConfirmModal(true)}
                title="Transmit Emergency Evacuation Alert to Citizens"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M4.93 4.93a10 10 0 0 1 14.14 0" />
                  <path d="M7.76 7.76a6 6 0 0 1 8.48 0" />
                  <line x1="12" y1="2" x2="12" y2="4" />
                  <line x1="12" y1="20" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="4" y2="12" />
                  <line x1="20" y1="12" x2="22" y2="12" />
                </svg>
                <span>Send Alert Broadcast</span>
              </button>
              <button
                type="button"
                className="btn-zone-accept"
                onClick={acceptAndVerifyZoneAlert}
                title="Verify and Accept Hazard Level"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Accept &amp; Verify</span>
              </button>
              <button
                type="button"
                className="btn-zone-reject"
                onClick={promptRejectAlert}
                title="Mark as False Alarm or Archive"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="6" />
                </svg>
                <span>Reject / False Alarm</span>
              </button>
            </div>
            <div className="zone-action-group-right">
              <button
                type="button"
                className="btn-sat-trigger"
                onClick={() => setShowSatModal(true)}
                title="Inspect Satellite Sentinel-1, Sentinel-2 &amp; Before/After"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="2" />
                  <path d="M4.93 4.93a10 10 0 0 1 14.14 0" />
                  <path d="M7.76 7.76a6 6 0 0 1 8.48 0" />
                  <line x1="12" y1="2" x2="12" y2="4" />
                  <line x1="12" y1="20" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="4" y2="12" />
                  <line x1="20" y1="12" x2="22" y2="12" />
                </svg>
                <span>Satellite ML Feeds</span>
              </button>
              <button
                type="button"
                className="btn-action-secondary"
                onClick={() => window.print()}
                title="Export PDF Dossier"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Header Section: Zone Name, Severity, Risk + Confidence, Risk Window */}
          <section className="zone-detail-header-card">
            <div className="zone-header-top-row">
              <div className="zone-header-title-col">
                <h2 id="detailZoneName">{zoneData.name}</h2>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-main)', marginTop: '2px' }}>
                  <span id="detailZoneCoords">{zoneData.coords}</span>
                </div>
              </div>
              <div id="detailSeverityBadgeContainer">
                <span className="status-pill critical" style={{ fontSize: '0.85rem', padding: '4px 10px' }}>
                  {zoneData.severityText || 'CRITICAL EVACUATION'}
                </span>
              </div>
            </div>

            <div className="zone-header-metrics-row">
              <div className="metric-pair-col">
                <span className="metric-pair-label">Risk &amp; Confidence</span>
                <div className="metric-pair-value" id="detailRiskAndConfidence">
                  <span style={{ color: 'var(--color-critical)' }}>{zoneData.finalRisk}</span> <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>(Conf: {zoneData.confidenceScore})</span>
                </div>
              </div>
              <div className="metric-pair-col">
                <span className="metric-pair-label">Risk Window</span>
                <div className="metric-pair-value" id="detailRiskWindow" style={{ color: 'var(--color-high)' }}>{zoneData.riskWindow}</div>
              </div>
              <div className="metric-pair-col">
                <span className="metric-pair-label">Relief Shelter</span>
                <div className="metric-pair-value" id="detailReliefShelter">{zoneData.shelter}</div>
              </div>
            </div>
          </section>

          {/* Active Threat & Telemetry Indicators */}
          {zoneData.flags && (
            <section className="threat-indicators-grid" id="detailFlagsContainer">
              {/* Downstream Surge */}
              {zoneData.flags.cascadingFlood?.active && (
                <div className="threat-indicator-card surge-card" id="flagCascadingFlood">
                  <div className="threat-card-header">
                    <span className="threat-card-title">Downstream Flash Surge</span>
                    <span className="status-pill critical" id="surgeStatusBadge">{zoneData.flags.cascadingFlood.badge}</span>
                  </div>
                  <div className="threat-card-details">
                    <div className="threat-detail-row">
                      <span className="detail-label">Trigger:</span>
                      <span className="detail-val" id="surgeTriggerVal">{zoneData.flags.cascadingFlood.trigger}</span>
                    </div>
                    <div className="threat-detail-row">
                      <span className="detail-label">Arrival:</span>
                      <span className="detail-val" id="surgeArrivalVal">{zoneData.flags.cascadingFlood.arrival}</span>
                    </div>
                    <div className="threat-detail-row">
                      <span className="detail-label">Action:</span>
                      <span className="detail-val" id="surgeActionVal" style={{ color: '#991b1b', fontWeight: 700 }}>
                        {zoneData.flags.cascadingFlood.action}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Hardware Status */}
              {zoneData.flags.dataSilence?.active && (
                <div className="threat-indicator-card hardware-card" id="flagDataSilence">
                  <div className="threat-card-header">
                    <span className="threat-card-title">Hardware Status</span>
                    <span className="status-pill critical" id="hardwareStatusBadge">{zoneData.flags.dataSilence.badge}</span>
                  </div>
                  <div className="threat-card-details">
                    <div className="threat-detail-row">
                      <span className="detail-label">Station:</span>
                      <span className="detail-val" id="hardwareStationVal">{zoneData.flags.dataSilence.station}</span>
                    </div>
                    <div className="threat-detail-row">
                      <span className="detail-label">Last Signal:</span>
                      <span className="detail-val" id="hardwareLastTxVal">{zoneData.flags.dataSilence.lastTx}</span>
                    </div>
                    <div className="threat-detail-row">
                      <span className="detail-label">Action:</span>
                      <span className="detail-val" id="hardwareActionVal" style={{ color: '#be123c', fontWeight: 700 }}>
                        {zoneData.flags.dataSilence.action}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Tactical Zone GIS Map & Contributing Telemetry Factors Grid */}
          <section className="zone-gis-telemetry-grid">

            {/* Left Column: Tactical GIS Map */}
            <div className="zone-gis-panel">
              <div className="panel-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Tactical GIS Map</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-main)' }} id="zoneGisMetaTag">Real-time Terrain</span>
              </div>

              <div className="zone-map-wrapper">
                <div id="leafletZoneDetailMap" ref={zoneMapRef}></div>
                <div className="heatmap-legend-badge">
                  <span><strong style={{ color: '#dc2626' }}>■</strong> Perimeter</span>
                  <span><strong style={{ color: '#2563eb' }}>●</strong> Sensors</span>
                  <span><strong style={{ color: '#9333ea' }}>▲</strong> Villages</span>
                  <span><strong style={{ color: '#dc2626' }}>x</strong> Road Block</span>
                </div>
              </div>
            </div>

            {/* Right Column: Contributing Factors Section */}
            <div className="operational-panel" style={{ marginBottom: 0 }}>
              <div className="panel-section-title">
                <span>Contributing Factors</span>
              </div>

              <div className="factors-list-grid" id="detailFactorsList">
                {zoneData.factors?.map((f, i) => (
                  <div key={i} className="factor-item-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border-light)', fontSize: '0.8rem' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{f.label}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{f.source}</div>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--color-critical)' }}>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </section>

          {/* =================================================================
               CITIZEN ALARM RESPONSE & NON-RESPONDER RESCUE TRIAGE
               ================================================================= */}
          <section className="operational-panel" style={{ borderLeft: '4px solid #dc2626', background: 'linear-gradient(to bottom, #ffffff, #fffdfd)' }}>
            <div className="panel-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.02rem', fontWeight: 800, color: '#991b1b' }}>🚨 Resident Alarm Status &amp; Physical Rescue Triage</span>
                <span className="status-pill critical" style={{ animation: 'pulse 2s infinite' }}>Live Sensor Telemetry</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.78rem' }}>
                <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#dcfce7', color: '#166534', fontWeight: 700 }}>
                  🟢 Responded / Safe: {citizenEvacuations.filter(c => c.status === 'acknowledged' || c.status === 'evacuating').length}
                </span>
                <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#fee2e2', color: '#991b1b', fontWeight: 700 }}>
                  🔴 Unresponsive (No Alarm Turn-Off): {citizenEvacuations.filter(c => c.status === 'unresponsive').length}
                </span>
                <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#eff6ff', color: '#1e40af', fontWeight: 700 }}>
                  🚨 Physical SDRF Units En Route: {citizenEvacuations.filter(c => c.qrtDispatched).length}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 12px' }}>
              Real-time monitoring of citizen emergency alarms in {zoneData.name}. Unresponsive households where alarms remain ringing without citizen acknowledgment are flagged for immediate physical SDRF rescue dispatch.
            </p>

            <table className="operational-table">
              <thead>
                <tr>
                  <th>Resident / Dwelling Sector</th>
                  <th>Zone Location</th>
                  <th>Alarm &amp; Evacuation Status</th>
                  <th>Target Relief Shelter</th>
                  <th>Action / Physical Rescue</th>
                </tr>
              </thead>
              <tbody>
                {citizenEvacuations.map((c) => (
                  <tr key={c.id} style={{ background: c.status === 'unresponsive' ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{c.name}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.phone} &bull; Ref: {c.id}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem' }}>{c.location}</span>
                    </td>
                    <td>
                      {c.status === 'unresponsive' ? (
                        <span className="status-pill critical" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px' }}>
                          <span style={{ width: '6px', height: '6px', background: '#fff', borderRadius: '50%', display: 'inline-block' }}></span>
                          <span>{c.actionText}</span>
                        </span>
                      ) : c.status === 'evacuating' || c.status === 'acknowledged' ? (
                        <span className="status-pill low" style={{ color: '#15803d', borderColor: '#bbf7d0', background: '#f0fdf4', padding: '3px 8px' }}>
                          <span>{c.actionText}</span>
                        </span>
                      ) : (
                        <span className="status-pill high" style={{ padding: '3px 8px' }}>
                          <span>{c.actionText}</span>
                        </span>
                      )}
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Updated {c.lastUpdate}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600 }}>{c.shelterTarget}</span>
                    </td>
                    <td>
                      {c.qrtDispatched ? (
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          <span>{c.qrtTeam} Dispatched</span>
                        </span>
                      ) : c.status === 'unresponsive' ? (
                        <button
                          type="button"
                          className="btn-action-primary"
                          onClick={() => handleDispatchPhysicalRescue(c)}
                          style={{
                            background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                            color: '#ffffff',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)'
                          }}
                          title="Dispatch Physical SDRF Rescue Team to check on unresponsive resident"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                          <span>Send Physical Rescue Team</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.76rem', color: '#16a34a', fontWeight: 600 }}>
                          ✓ Safe / Responsive
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Affected Villages Section */}
          <section className="operational-panel">
            <div className="panel-section-title">
              <span>Affected Villages</span>
            </div>

            <table className="operational-table">
              <thead>
                <tr>
                  <th>Village / Sector</th>
                  <th>Severity</th>
                  <th>Proximity</th>
                  <th>Road Access</th>
                  <th>Priority Score</th>
                </tr>
              </thead>
              <tbody id="detailVillagesTableBody">
                {zoneData.villages?.map((v, i) => (
                  <tr key={i}>
                    <td><strong>{v.name}</strong></td>
                    <td><span className={`status-pill ${v.severity}`}>{v.severity.toUpperCase()}</span></td>
                    <td>{v.proximity}</td>
                    <td><span className={`status-pill ${v.road}`}>{v.roadText}</span></td>
                    <td><strong style={{ color: v.severity === 'critical' ? 'var(--color-critical)' : 'var(--color-high)' }}>{v.score}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Affected Roads Section */}
          <section className="operational-panel">
            <div className="panel-section-title">
              <span>Affected Roads &amp; Corridors</span>
            </div>

            <table className="operational-table">
              <thead>
                <tr>
                  <th>Corridor</th>
                  <th>Status</th>
                  <th>Bypass Route</th>
                  <th>Detour &amp; Delay</th>
                </tr>
              </thead>
              <tbody id="detailRoadsTableBody">
                {zoneData.roads?.map((r, i) => (
                  <tr key={i}>
                    <td><strong>{r.name}</strong></td>
                    <td><span className={`status-pill ${r.status}`}>{r.statusText}</span></td>
                    <td>{r.bypass}</td>
                    <td>{r.delay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

        </div>
      </main>

      {/* =====================================================================
           PAGE 3 — ALERTS & HISTORY
           ===================================================================== */}
      <main className={`admin-page-view ${activePage === 'page3' ? 'active' : ''}`} id="viewPage3History">
        <div className="page-content-wrapper">

          {/* Filter & Search Bar */}
          <section className="history-filter-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="text"
                className="search-input-field"
                id="historySearchInput"
                placeholder="Filter by zone or date..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
              <select
                className="zone-select-dropdown"
                id="historyFilterZone"
                value={historyZoneFilter}
                onChange={(e) => setHistoryZoneFilter(e.target.value)}
              >
                <option value="all">All Zones</option>
                <option value="Shillong">Shillong</option>
                <option value="Cherrapunji">Cherrapunji</option>
                <option value="Arunachal">Arunachal</option>
              </select>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-main)' }}>
              Live Audit Log
            </div>
          </section>

          {/* Dispatched Alerts Audit */}
          <section className="operational-panel">
            <div className="panel-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span>Dispatched Alerts Audit</span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Click an alert row to inspect target resident evacuation status</span>
            </div>

            <table className="operational-table">
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Danger Zone</th>
                  <th>Time</th>
                  <th>Village Reach</th>
                  <th>Channel</th>
                  <th>Delivery</th>
                  <th>Status</th>
                  <th>Resident Tracking</th>
                </tr>
              </thead>
              <tbody id="dispatchedAlertsTableBody">
                {filteredHistory.map((a, i) => {
                  const isSelected = a.refId === selectedHistoryAlertRef;
                  const zoneStr = a.zone || a.zoneName || 'Shillong Urban & Ridge Slopes';
                  const timeStr = a.time || a.timestamp || 'Just now';
                  const reachStr = a.reach || a.villages || 'Shillong Peak (96%), Mawlai (95%)';
                  const channelStr = a.channel || a.channels || 'SMS + Siren + Voice';
                  const deliveryStr = a.delivery || a.deliveryRate || '98.4% Delivered';
                  const statusStr = a.status || 'Active Warning';

                  return (
                    <tr
                      key={i}
                      onClick={() => {
                        setSelectedHistoryAlertRef(a.refId);
                        setShowPeopleModal(true);
                      }}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                        borderLeft: isSelected ? '4px solid var(--color-accent)' : 'none',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td><code>{a.refId}</code></td>
                      <td><strong>{zoneStr}</strong></td>
                      <td>{timeStr}</td>
                      <td>{reachStr}</td>
                      <td><span className="status-pill low">{channelStr}</span></td>
                      <td><strong>{deliveryStr}</strong></td>
                      <td><span className="status-pill critical">{statusStr}</span></td>
                      <td>
                        <button
                          type="button"
                          className="btn-action-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHistoryAlertRef(a.refId);
                            setShowPeopleModal(true);
                          }}
                          style={{
                            background: isSelected ? 'var(--color-accent)' : 'var(--bg-card)',
                            color: isSelected ? '#ffffff' : 'var(--text-primary)',
                            border: '1px solid var(--border-light)',
                            padding: '5px 12px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                          }}
                        >
                          <span>View People</span>
                          <span style={{ background: '#dc2626', color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '0.65rem', fontWeight: 700 }}>
                            {citizenEvacuations.filter(c => c.status === 'unresponsive').length} Pending
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {/* Rejected Dispatches Log */}
          <section className="operational-panel">
            <div className="panel-section-title">
              <span>Rejected Dispatches Log</span>
            </div>

            <table className="operational-table">
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Danger Zone</th>
                  <th>Time</th>
                  <th>Officer</th>
                  <th>Reason / Notes</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="rejectedAlertsTableBody">
                {rejectedAlerts.map((r, i) => (
                  <tr key={i}>
                    <td><code>{r.refId}</code></td>
                    <td><strong>{r.zone}</strong></td>
                    <td>{r.time}</td>
                    <td>{r.officer}</td>
                    <td>{r.reason}</td>
                    <td><span className="status-pill open">{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

        </div>
      </main>

      {/* =====================================================================
           PAGE 4 — CITIZEN REPORTS & FIELD DISPATCH
           ===================================================================== */}
      <main className={`admin-page-view ${activePage === 'page4' ? 'active' : ''}`} id="viewPage4Reports">
        <div className="page-content-wrapper">

          {/* Top Filter & Search Bar */}
          <section className="history-filter-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="search-input-field"
                id="reportSearchInput"
                placeholder="Filter by report ID, location, or citizen..."
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
              />
              <div className="filter-pills-row" style={{ margin: 0 }}>
                <button
                  type="button"
                  className={`filter-pill ${reportFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setReportFilter('all')}
                >
                  All ({citizenReports.length})
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
                  className={`filter-pill ${reportFilter === 'verified' ? 'active' : ''}`}
                  onClick={() => setReportFilter('verified')}
                >
                  Verified ({citizenReports.filter(r => r.status === 'verified').length})
                </button>
                <button
                  type="button"
                  className={`filter-pill ${reportFilter === 'critical' ? 'active' : ''}`}
                  onClick={() => setReportFilter('critical')}
                >
                  Critical ({citizenReports.filter(r => r.severity === 'critical').length})
                </button>
              </div>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-main)' }}>
              Live Citizen Telemetry Feed
            </div>
          </section>

          {/* Citizen Reports List Grid */}
          <section className="reports-feed-grid" id="citizenReportsFeedContainer">
            {filteredReports.map((report) => (
              <div key={report.id} className="report-feed-card" style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-accent)' }}>{report.id}</span>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0' }}>{report.category}</h4>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{report.location} • {report.timestamp}</span>
                  </div>
                  <span className={`status-pill ${report.severity === 'critical' ? 'critical' : 'high'}`}>{report.urgencyText}</span>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  {report.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '10px', fontSize: '0.76rem' }}>
                  <span style={{ color: report.status === 'pending' ? '#ea580c' : '#16a34a', fontWeight: 700 }}>
                    Status: {report.statusText}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-action-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={() => {
                        setSelectedCitizenReport(report);
                        setShowCitizenModal(true);
                      }}
                    >
                      Inspect Evidence
                    </button>
                    {report.status === 'pending' && (
                      <button
                        type="button"
                        className="btn-action-primary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        onClick={() => handleDispatchQRT(report.id)}
                      >
                        Dispatch QRT
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </section>

        </div>
      </main>

      {/* =====================================================================
           CITIZEN REPORT EVIDENCE MODAL
           ===================================================================== */}
      {showCitizenModal && selectedCitizenReport && (
        <div className="modal-overlay-backdrop" id="citizenReportModal" style={{ display: 'flex' }}>
          <div className="modal-card-box" style={{ maxWidth: '680px' }}>
            <div className="modal-card-header">
              <span id="citizenModalTitle">Citizen Report Evidence &amp; Verification — {selectedCitizenReport.id}</span>
              <button
                type="button"
                onClick={() => setShowCitizenModal(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div className="modal-card-body" id="citizenModalBody">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Reporter</span>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{selectedCitizenReport.reporter} ({selectedCitizenReport.contact})</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>GPS Pin</span>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{selectedCitizenReport.coordsText}</div>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Citizen Observation</span>
                <p style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                  {selectedCitizenReport.description}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Attached Photo Evidence</span>
                <div style={{ width: '100%', height: '180px', borderRadius: '8px', overflow: 'hidden', marginTop: '6px', background: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                  <img
                    src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80"
                    alt="Ground Hazard Evidence"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              </div>
            </div>

            <div className="modal-card-footer" id="citizenModalFooter">
              <button type="button" className="btn-action-secondary" onClick={() => setShowCitizenModal(false)}>Close</button>
              {selectedCitizenReport.status === 'pending' && (
                <button type="button" className="btn-action-primary" onClick={() => handleDispatchQRT(selectedCitizenReport.id)}>
                  Dispatch Field QRT Officer
                </button>
              )}
              {selectedCitizenReport.status !== 'resolved' && (
                <button type="button" className="btn-zone-accept" style={{ padding: '6px 14px' }} onClick={() => handleResolveReport(selectedCitizenReport.id)}>
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
           CONFIRMATION STEP MODAL (BEFORE ALERT DISPATCH)
           ===================================================================== */}
      {showConfirmModal && (
        <div className="modal-overlay-backdrop" id="sendAlertConfirmModal" style={{ display: 'flex' }}>
          <div className="modal-card-box">
            <div className="modal-card-header">
              <span>Confirm Alert Broadcast — {zoneData.name}</span>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div className="modal-card-body">
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Review channel reachability before siren activation:
              </div>

              <table className="operational-table">
                <thead>
                  <tr>
                    <th>Settlement</th>
                    <th>Relief Shelter</th>
                    <th>Channel</th>
                    <th>Reachability</th>
                  </tr>
                </thead>
                <tbody id="modalFeasibilityTableBody">
                  <tr>
                    <td><strong>Shillong Peak Ridge Sector</strong></td>
                    <td>Shillong Municipal Relief Center #1</td>
                    <td><span className="status-pill low">App Push + SMS + Siren</span></td>
                    <td><strong>99%</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Mawlai Valley Settlement</strong></td>
                    <td>Mawlai Higher Secondary Camp</td>
                    <td><span className="status-pill low">SMS Fallback + LoRa</span></td>
                    <td><strong>95%</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Laitumkhrah Upper Slope</strong></td>
                    <td>St. Anthony Relief Safe Zone</td>
                    <td><span className="status-pill low">App + SMS</span></td>
                    <td><strong>97%</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Polo Ground Community Sector</strong></td>
                    <td>Polo Ground High Ground Camp</td>
                    <td><span className="status-pill high">Siren Tower #1 + Sat</span></td>
                    <td><strong>100%</strong></td>
                  </tr>
                </tbody>
              </table>

              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-xs)', padding: '8px 12px', fontSize: '0.76rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                <strong style={{ background: '#be123c', color: '#ffffff', padding: '1px 6px', borderRadius: '3px', fontSize: '0.68rem' }}>BROADCAST</strong>
                <span>Triggers district-wide sirens, emergency popups, and automatic sequential voice alerts (Buzzer → Hindi → Buzzer → English).</span>
              </div>
            </div>

            <div className="modal-card-footer">
              <button type="button" className="btn-action-secondary" onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button type="button" className="btn-action-primary" onClick={confirmAndDispatchAlert}>Transmit Broadcast</button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
           STAT DETAIL MODAL
           ===================================================================== */}
      {showStatModal && (
        <div className="modal-overlay-backdrop" id="statDetailModal" style={{ display: 'flex' }}>
          <div className="modal-card-box" style={{ maxWidth: '780px' }}>
            <div className="modal-card-header">
              <span id="statDetailModalTitle">Telemetry Breakdown — {statModalType.toUpperCase()}</span>
              <button
                type="button"
                onClick={() => setShowStatModal(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div className="modal-card-body" id="statDetailModalBody">
              {statModalType === 'danger-zones' && (
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Active monitored zones categorized by Machine Learning composite vulnerability scoring:
                  </p>
                  <table className="operational-table" style={{ marginTop: '10px' }}>
                    <thead>
                      <tr>
                        <th>Zone Name</th>
                        <th>Risk Score</th>
                        <th>Confidence</th>
                        <th>Action Window</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Shillong Urban &amp; Ridge Slopes</strong></td>
                        <td><span className="status-pill critical">94.6% CRITICAL</span></td>
                        <td>93.8%</td>
                        <td>~45 min</td>
                      </tr>
                      <tr>
                        <td><strong>Cherrapunji (Sohra) Escarpment</strong></td>
                        <td><span className="status-pill critical">98.0% CRITICAL</span></td>
                        <td>96.2%</td>
                        <td>~30 min</td>
                      </tr>
                      <tr>
                        <td><strong>Remote Slopes, Arunachal Pradesh</strong></td>
                        <td><span className="status-pill high">72.4% HIGH</span></td>
                        <td>88.4%</td>
                        <td>~4 hrs</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {statModalType === 'villages' && (
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Settlements with active early warning evacuation corridors:
                  </p>
                  <table className="operational-table" style={{ marginTop: '10px' }}>
                    <thead>
                      <tr>
                        <th>Settlement</th>
                        <th>Severity</th>
                        <th>Population Reach</th>
                        <th>Shelter Distance</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Shillong Peak Ridge Sector</strong></td>
                        <td><span className="status-pill critical">Critical</span></td>
                        <td>1,420 citizens</td>
                        <td>0.4 km (Municipal Camp #1)</td>
                      </tr>
                      <tr>
                        <td><strong>Mawlai Valley Settlement</strong></td>
                        <td><span className="status-pill critical">Critical</span></td>
                        <td>2,800 citizens</td>
                        <td>1.2 km (Mawlai Campus)</td>
                      </tr>
                      <tr>
                        <td><strong>Laitumkhrah Upper Slope</strong></td>
                        <td><span className="status-pill high">High</span></td>
                        <td>3,150 citizens</td>
                        <td>1.8 km (St. Anthony Safe Zone)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {statModalType === 'roads' && (
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Real-time traffic and slope corridor monitoring status:
                  </p>
                  <table className="operational-table" style={{ marginTop: '10px' }}>
                    <thead>
                      <tr>
                        <th>Road Corridor</th>
                        <th>Status</th>
                        <th>Bypass Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>GS Road Urban Corridor</strong></td>
                        <td><span className="status-pill blocked">Blocked</span></td>
                        <td>Shillong Peak Link Bypass (+15m)</td>
                      </tr>
                      <tr>
                        <td><strong>Sohra Escarpment Road</strong></td>
                        <td><span className="status-pill blocked">Blocked</span></td>
                        <td>Nohkalikai Ridge Transit Route (+20m)</td>
                      </tr>
                      <tr>
                        <td><strong>Shillong Bypass Highway</strong></td>
                        <td><span className="status-pill open">Open &amp; Clear</span></td>
                        <td>Direct Arterial Highway</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {statModalType === 'hardware' && (
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    LoRa mesh gateway network &amp; sensor telemetry status:
                  </p>
                  <table className="operational-table" style={{ marginTop: '10px' }}>
                    <thead>
                      <tr>
                        <th>Node ID</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Diagnostics</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>GW-SH01</strong></td>
                        <td>LoRa Gateway (Sector 4)</td>
                        <td><span className="status-pill critical">Silent Spike</span></td>
                        <td>Lost post 4.8°/hr tilt exceedance</td>
                      </tr>
                      <tr>
                        <td><strong>SN-101</strong></td>
                        <td>Inclinometer</td>
                        <td><span className="status-pill critical">Warning Alert</span></td>
                        <td>Tilt rate 4.8°/hr</td>
                      </tr>
                      <tr>
                        <td><strong>PZ-SH</strong></td>
                        <td>Piezometer</td>
                        <td><span className="status-pill high">High Saturation</span></td>
                        <td>89.2% pore pressure moisture</td>
                      </tr>
                      <tr>
                        <td><strong>GW-02..07</strong></td>
                        <td>Mesh Nodes (6)</td>
                        <td><span className="status-pill open">Online</span></td>
                        <td>Nominal 12.8V battery</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-card-footer">
              <button type="button" className="btn-action-secondary" onClick={() => setShowStatModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
           SATELLITE HIGH-RESOLUTION INSPECTOR MODAL
           ===================================================================== */}
      {showSatModal && (
        <div className="modal-overlay-backdrop" id="satelliteInspectorModal" style={{ display: 'flex' }}>
          <div className="modal-card-box" style={{ maxWidth: '960px', width: '95vw' }}>
            <div className="modal-card-header">
              <span id="satModalTitle">Satellite High-Resolution Earth Observation &amp; ML Vision Inspector</span>
              <button
                type="button"
                onClick={() => setShowSatModal(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div className="modal-card-body" id="satModalBody" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <button
                  type="button"
                  className={`filter-pill ${satModalMode === 'sentinel-1' ? 'active' : ''}`}
                  onClick={() => setSatModalMode('sentinel-1')}
                >
                  Sentinel-1 SAR InSAR (Ground Deformation)
                </button>
                <button
                  type="button"
                  className={`filter-pill ${satModalMode === 'sentinel-2' ? 'active' : ''}`}
                  onClick={() => setSatModalMode('sentinel-2')}
                >
                  Sentinel-2 Optical (NDVI / Moisture)
                </button>
                <button
                  type="button"
                  className={`filter-pill ${satModalMode === 'compare' ? 'active' : ''}`}
                  onClick={() => setSatModalMode('compare')}
                >
                  Split Compare (Before vs After)
                </button>
              </div>

              {satModalMode === 'sentinel-1' && (
                <div style={{ width: '100%', height: '340px', background: '#090d16', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                  <img
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80"
                    alt="Sentinel-1 SAR InSAR"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'hue-rotate(180deg) contrast(1.2)' }}
                  />
                  <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.75)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', color: '#ffffff' }}>
                    🛰️ InSAR Coherence: +15.8 mm/wk displacement anomaly on Shillong ridge slope
                  </div>
                </div>
              )}

              {satModalMode === 'sentinel-2' && (
                <div style={{ width: '100%', height: '340px', background: '#090d16', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                  <img
                    src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80"
                    alt="Sentinel-2 Optical"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.3)' }}
                  />
                  <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.75)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', color: '#ffffff' }}>
                    🛰️ MSI Optical NDVI: Severe colluvium saturation &amp; slope scar detection
                  </div>
                </div>
              )}

              {satModalMode === 'compare' && (
                <div style={{ width: '100%', height: '340px', background: '#090d16', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                  <img
                    src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80"
                    alt="After"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: `${satComparePos}%`,
                      overflow: 'hidden',
                      borderRight: '3px solid #38bdf8'
                    }}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80"
                      alt="Before"
                      style={{ width: '960px', height: '100%', objectFit: 'cover', maxWidth: 'none' }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={satComparePos}
                    onChange={(e) => setSatComparePos(e.target.value)}
                    style={{ position: 'absolute', bottom: 16, left: '10%', width: '80%', zIndex: 10 }}
                  />
                </div>
              )}
            </div>

            <div className="modal-card-footer">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-main)', marginRight: 'auto' }} id="satModalFooterMeta">
                ESA Copernicus Sentinel-1 SAR &amp; Sentinel-2 MSI Multi-Spectral Ingest • NER Landslide Monitoring
              </div>
              <button type="button" className="btn-action-secondary" onClick={() => setShowSatModal(false)}>Close Inspector</button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
           PEOPLE EVACUATION STATUS POPUP MODAL (PROFESSIONAL & EMOJI-FREE)
           ===================================================================== */}
      {showPeopleModal && (() => {
        const selectedAlertObj = dispatchedAlerts.find(a => a.refId === selectedHistoryAlertRef) || dispatchedAlerts[0] || {};
        const alertZoneName = selectedAlertObj.zone || selectedAlertObj.zoneName || 'Shillong Urban & Ridge Slopes';
        const alertRef = selectedAlertObj.refId || '#ALERT-2026-9041';

        const alertResidents = citizenEvacuations;
        const unresponsiveList = alertResidents.filter(c => c.status === 'unresponsive');
        const acceptedList = alertResidents.filter(c => c.status === 'acknowledged' || c.status === 'evacuating');

        return (
          <div className="modal-overlay-backdrop" style={{ display: 'flex', zIndex: 1100 }}>
            <div className="modal-card-box" style={{ maxWidth: '840px', width: '95%', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
              <div className="modal-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                    Resident Response Audit &mdash; {alertRef}
                  </span>
                  <span style={{ fontSize: '0.76rem', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    {alertZoneName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPeopleModal(false)}
                  style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}
                >
                  &times;
                </button>
              </div>

              <div className="modal-card-body" style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Live telemetry tracking of resident alert receipts and evacuation actions:
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', background: '#fee2e2', color: '#991b1b', padding: '3px 10px', borderRadius: '4px', fontWeight: 700, border: '1px solid #fecaca' }}>
                      {unresponsiveList.length} Unresponsive
                    </span>
                    <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '4px', fontWeight: 700, border: '1px solid #bbf7d0' }}>
                      {acceptedList.length} Acknowledged
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                  {/* UNRESPONSIVE / PENDING */}
                  <div style={{ background: '#fff9f9', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, color: '#991b1b', fontSize: '0.9rem', fontWeight: 800 }}>
                        Unresponsive / No Confirmation ({unresponsiveList.length})
                      </h4>
                      <span style={{ fontSize: '0.68rem', color: '#991b1b', fontWeight: 700, background: '#fee2e2', padding: '2px 6px', borderRadius: '3px' }}>
                        Action Required
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {unresponsiveList.length === 0 ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: '#166534', fontSize: '0.82rem', fontWeight: 700, background: '#ffffff', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                          All target residents have acknowledged the alert and silenced the alarm.
                        </div>
                      ) : (
                        unresponsiveList.map((c) => (
                          <div key={c.id} style={{ background: '#ffffff', border: '1px solid #fca5a5', borderRadius: '6px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1e293b' }}>{c.name}</div>
                              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>Contact: {c.phone} &bull; Sector: {c.location}</div>
                              <div style={{ fontSize: '0.7rem', color: '#b91c1c', fontWeight: 600, marginTop: '3px' }}>
                                Status: Alarm Active (No citizen response)
                              </div>
                            </div>
                            <div>
                              {c.qrtDispatched ? (
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e40af', background: '#eff6ff', padding: '4px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #bfdbfe', whiteSpace: 'nowrap' }}>
                                  Dispatched: {c.qrtTeam || 'SDRF Unit'}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDispatchPhysicalRescue(c)}
                                  style={{
                                    background: '#dc2626',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '6px 12px',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 1px 3px rgba(220, 38, 38, 0.25)'
                                  }}
                                >
                                  Dispatch Field Officer
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* ACKNOWLEDGED / SAFE */}
                  <div style={{ background: '#f6fdf9', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, color: '#166534', fontSize: '0.9rem', fontWeight: 800 }}>
                        Acknowledged &amp; Evacuating ({acceptedList.length})
                      </h4>
                      <span style={{ fontSize: '0.68rem', color: '#166534', fontWeight: 700, background: '#dcfce7', padding: '2px 6px', borderRadius: '3px' }}>
                        Safe Evacuation
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {acceptedList.length === 0 ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.82rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          No resident acknowledgments logged yet.
                        </div>
                      ) : (
                        acceptedList.map((c) => (
                          <div key={c.id} style={{ background: '#ffffff', border: '1px solid #86efac', borderRadius: '6px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1e293b' }}>{c.name}</div>
                              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>Contact: {c.phone} &bull; Sector: {c.location}</div>
                              <div style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 600, marginTop: '3px' }}>
                                Relief Site: {c.shelterTarget || 'Community Relief Center'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', background: '#dcfce7', padding: '3px 8px', borderRadius: '3px', border: '1px solid #bbf7d0' }}>
                                Confirmed
                              </span>
                              <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '3px' }}>{c.lastUpdate || 'Just now'}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-card-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px' }}>
                <button
                  type="button"
                  className="btn-action-secondary"
                  onClick={() => setShowPeopleModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Operational Toast Notification */}
      <div className={`operational-toast ${showToast ? 'show' : ''}`} id="operationalToast">
        {toastMessage}
      </div>

      {/* Connect Arduino Device button at bottom */}
      <button
        type="button"
        id="connectArduinoBtn"
        onClick={handleConnectArduino}
        className="btn-action-secondary"
        style={{ position: 'fixed', bottom: '16px', right: '16px', zIndex: 90, background: arduinoConnected ? '#16a34a' : 'var(--bg-surface)', color: arduinoConnected ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-medium)', borderRadius: '8px', padding: '6px 12px', fontSize: '0.78rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
      >
        🔌 {arduinoConnected ? 'Arduino Siren Active' : 'Connect LED Alert Device'}
      </button>

    </div>
  );
}
