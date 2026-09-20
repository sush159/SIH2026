import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../styles/field.css';
import { OFFICER_LOCATION, INITIAL_FIELD_TASKS } from '../utils/fieldData';

export default function FieldPortal() {
  const [activePage, setActivePage] = useState('page1'); // 'page1', 'page2', 'page3', 'page4'
  const [selectedTaskId, setSelectedTaskId] = useState('TASK-101');
  const [taskFilter, setTaskFilter] = useState('all');
  const [tasks, setTasks] = useState(INITIAL_FIELD_TASKS);
  const [selectedFindingTags, setSelectedFindingTags] = useState(['Tension Crack']);
  const [findingSeverity, setFindingSeverity] = useState('critical');
  const [findingNotes, setFindingNotes] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [obsPhotoPreview, setObsPhotoPreview] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [mapTarget, setMapTarget] = useState('my-location');

  const fieldMapRef = useRef(null);
  const fieldMapInstanceRef = useRef(null);
  const officerMarkerRef = useRef(null);

  const selectedTask = tasks[selectedTaskId] || tasks['TASK-101'];

  // Listen for Live Admin Emergency Broadcasts & Physical Rescue Dispatches
  useEffect(() => {
    let channel;
    const processFieldIncoming = (data) => {
      if (!data) return;
      if (data.type === 'EMERGENCY_BROADCAST') {
        showFieldToast(`🚨 COMMAND ADVISORY: ${data.headline || 'Evacuation Order Dispatched'}`);
      } else if (data.type === 'SDRF_PHYSICAL_DISPATCH') {
        const newTaskId = data.taskId || `RESCUE-${Math.floor(200 + Math.random() * 800)}`;
        const rescueTask = {
          id: newTaskId,
          type: 'sdrf',
          typeLabel: 'Physical Rescue Welfare Check',
          title: `URGENT WELFARE RESCUE: ${data.residentName}`,
          location: data.location,
          coords: [25.5788, 91.8933],
          coordsText: data.location,
          distance: '0.4 km (Immediate Priority)',
          urgency: 'critical',
          urgencyText: 'CRITICAL / LIFE SAFETY (NON-RESPONDER)',
          summary: data.summary || `Resident failed to turn off emergency evacuation alarm. Immediate physical dispatch required to verify safety and assist manual evacuation to ${data.shelter}. Contact: ${data.phone}`,
          citizenReport: {
            reportId: `#RESCUE-${newTaskId}`,
            reporter: data.residentName,
            contact: data.phone,
            timestamp: 'Just now',
            description: data.summary,
            tags: ['Non-Responder', 'Physical Evacuation Check', 'Immediate Rescue']
          },
          status: 'pending'
        };
        setTasks(prev => ({ [newTaskId]: rescueTask, ...prev }));
        setSelectedTaskId(newTaskId);
        showFieldToast(`🚨 URGENT RESCUE DISPATCH: Physical Welfare Check for ${data.residentName}`);
      }
    };

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('resilientguard_admin_alerts');
        channel.onmessage = (e) => {
          processFieldIncoming(e.data);
        };
      }
    } catch (err) {
      console.warn('Field broadcast listener notice:', err);
    }

    const handleStorage = (e) => {
      if (e.key === 'resilientguard_latest_alert' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          processFieldIncoming(parsed);
        } catch (err) {}
      }
      if (e.key === 'resilientguard_field_rescue_task' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          processFieldIncoming(parsed);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const showFieldToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const handleTaskResolution = (taskId, resolution) => {
    setTasks(prev => {
      const updated = { ...prev };
      if (updated[taskId]) {
        updated[taskId].status = resolution === 'rejected' ? 'rejected' : 'completed';
        updated[taskId].urgencyText = resolution.toUpperCase();
      }
      return updated;
    });

    // Broadcast resolution to Admin console
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('resilientguard_admin_alerts');
        channel.postMessage({
          type: 'FIELD_TASK_RESOLVED',
          taskId: taskId,
          taskTitle: tasks[taskId]?.title || taskId,
          resolution: resolution,
          officer: OFFICER_LOCATION.name,
          notes: actionNotes || `Action logged by field officer: ${resolution}`
        });
        channel.close();
      }
    } catch (err) {
      console.warn('Field broadcast notice:', err);
    }

    showFieldToast(`Task ${taskId} marked as ${resolution.toUpperCase()}`);
    setActionNotes('');
    setTimeout(() => {
      setActivePage('page1');
    }, 600);
  };

  const handleFindingSubmit = (e) => {
    e.preventDefault();
    const newTaskId = `TASK-${Math.floor(106 + Math.random() * 50)}`;
    const newTask = {
      id: newTaskId,
      type: 'citizen',
      typeLabel: 'Ground Observation',
      title: `${selectedFindingTags.join(', ')} reported at ${OFFICER_LOCATION.name}`,
      location: 'Field Patrol GPS Sector (Shillong)',
      coords: OFFICER_LOCATION.pos,
      coordsText: `${OFFICER_LOCATION.pos[0]}° N, ${OFFICER_LOCATION.pos[1]}° E`,
      distance: '0.1 km (Local)',
      urgency: findingSeverity,
      urgencyText: findingSeverity === 'critical' ? 'CRITICAL / IMMEDIATE' : 'PATROL LOGGED',
      summary: findingNotes || 'Ground finding logged by field unit.',
      citizenReport: {
        reportId: `#PATROL-${newTaskId}`,
        reporter: OFFICER_LOCATION.name,
        timestamp: 'Just now',
        description: findingNotes || 'Observation logged on patrol.',
        tags: selectedFindingTags
      },
      status: 'pending'
    };

    setTasks(prev => ({ [newTaskId]: newTask, ...prev }));

    // Broadcast finding to Admin console
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('resilientguard_admin_alerts');
        channel.postMessage({
          type: 'CITIZEN_REPORT_SUBMITTED',
          reporter: OFFICER_LOCATION.name,
          contact: 'SDRF Patrol Verified',
          zone: 'Shillong Urban Ridge',
          location: 'Field Patrol GPS Sector',
          coords: OFFICER_LOCATION.pos,
          coordsText: `${OFFICER_LOCATION.pos[0]}° N, ${OFFICER_LOCATION.pos[1]}° E`,
          category: selectedFindingTags.join(', ').toUpperCase(),
          tags: selectedFindingTags,
          severity: findingSeverity,
          description: findingNotes || 'Observation logged on patrol.'
        });
        channel.close();
      }
    } catch (err) {
      console.warn('Field finding broadcast error:', err);
    }

    showFieldToast('Observation logged and synced with DDMA Command Center.');
    setFindingNotes('');
    setObsPhotoPreview(null);
    setActivePage('page1');
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

  // Tactical Map Initialization (MapLibre GL 3D)
  useEffect(() => {
    if (activePage === 'page4' && fieldMapRef.current) {
      if (!fieldMapInstanceRef.current) {
        const map = new maplibregl.Map({
          container: fieldMapRef.current,
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
              }
            },
            layers: [
              {
                id: 'topo-layer',
                type: 'raster',
                source: 'topo-tiles',
                minzoom: 0,
                maxzoom: 17
              }
            ]
          },
          center: [OFFICER_LOCATION.pos[1], OFFICER_LOCATION.pos[0]],
          zoom: 14,
          pitch: 50,
          bearing: 15,
          attributionControl: false
        });

        map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

        // Officer GPS Pinpoint Marker
        const officerEl = document.createElement('div');
        officerEl.className = 'field-officer-marker';
        officerEl.style.cssText = 'width: 26px; height: 26px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 0 14px #2563eb; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;';
        officerEl.innerHTML = '👮';

        const officerPopup = new maplibregl.Popup({ offset: 12 }).setHTML(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.82rem; padding: 4px;">
            <strong style="color:#2563eb;">${OFFICER_LOCATION.name}</strong><br/>
            Heading: ${OFFICER_LOCATION.heading}<br/>
            Lock: ${OFFICER_LOCATION.accuracy}
          </div>
        `);

        new maplibregl.Marker({ element: officerEl })
          .setLngLat([OFFICER_LOCATION.pos[1], OFFICER_LOCATION.pos[0]])
          .setPopup(officerPopup)
          .addTo(map);

        // Render Task Markers
        Object.values(tasks).forEach(task => {
          if (task.coords) {
            const markerColor = task.urgency === 'critical' ? '#dc2626' : (task.urgency === 'high' ? '#ea580c' : '#16a34a');
            const el = document.createElement('div');
            el.className = 'field-task-marker';
            el.style.cssText = `width: 22px; height: 22px; border-radius: 50%; background: ${markerColor}; border: 2px solid #ffffff; box-shadow: 0 0 8px ${markerColor}; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 800; cursor: pointer;`;
            el.innerHTML = task.urgency === 'critical' ? '!' : '✓';

            const popup = new maplibregl.Popup({ offset: 12 }).setHTML(`
              <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.82rem; padding: 4px;">
                <strong style="color:${markerColor};">${task.title}</strong><br/>
                Status: <span style="color:${markerColor}; font-weight:700;">${task.status.toUpperCase()}</span><br/>
                Distance: ${task.distance}
              </div>
            `);

            new maplibregl.Marker({ element: el })
              .setLngLat([task.coords[1], task.coords[0]])
              .setPopup(popup)
              .addTo(map);
          }
        });

        fieldMapInstanceRef.current = map;
      } else {
        setTimeout(() => {
          fieldMapInstanceRef.current.resize();
        }, 100);
      }
    }
  }, [activePage, tasks]);

  const handleFocusMapTarget = (targetVal) => {
    setMapTarget(targetVal);
    if (!fieldMapInstanceRef.current) return;

    if (targetVal === 'my-location') {
      fieldMapInstanceRef.current.flyTo({ center: [OFFICER_LOCATION.pos[1], OFFICER_LOCATION.pos[0]], zoom: 15, pitch: 50, essential: true });
      showFieldToast('Centered on Officer GPS Location');
    } else if (targetVal === 'gw-04') {
      fieldMapInstanceRef.current.flyTo({ center: [91.8900, 25.5830], zoom: 16, pitch: 55, essential: true });
      showFieldToast('Focused on Gateway GW-SH01');
    } else if (targetVal === 'report-904') {
      fieldMapInstanceRef.current.flyTo({ center: [91.8900, 25.5750], zoom: 16, pitch: 55, essential: true });
      showFieldToast('Focused on Citizen Report #904');
    } else {
      fieldMapInstanceRef.current.flyTo({ center: [OFFICER_LOCATION.pos[1], OFFICER_LOCATION.pos[0]], zoom: 14, pitch: 45, essential: true });
    }
  };

  const filteredTasks = Object.values(tasks).filter(task => {
    if (taskFilter === 'all') return true;
    return task.type === taskFilter;
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
              <span className="field-role-tag">Field Patrol</span>
            </div>
            <div className="field-officer-id">{OFFICER_LOCATION.name}</div>
          </div>
        </div>

        {/* Navigation Tab Bar */}
        <nav className="field-nav-tabs">
          <button
            type="button"
            className={`field-tab-btn ${activePage === 'page1' ? 'active' : ''}`}
            id="tabBtnPage1"
            onClick={() => setActivePage('page1')}
          >
            Tasks
            <span className="tab-badge-count" id="taskCountBadge">
              {Object.values(tasks).filter(t => t.status === 'pending').length}
            </span>
          </button>
          <button
            type="button"
            className={`field-tab-btn ${activePage === 'page2' ? 'active' : ''}`}
            id="tabBtnPage2"
            onClick={() => setActivePage('page2')}
          >
            Task Detail
          </button>
          <button
            type="button"
            className={`field-tab-btn ${activePage === 'page3' ? 'active' : ''}`}
            id="tabBtnPage3"
            onClick={() => setActivePage('page3')}
          >
            Log Finding
          </button>
          <button
            type="button"
            className={`field-tab-btn ${activePage === 'page4' ? 'active' : ''}`}
            id="tabBtnPage4"
            onClick={() => setActivePage('page4')}
          >
            Tactical Map
          </button>
        </nav>

        {/* Header Actions & Offline Sync Indicator */}
        <div className="field-header-actions">
          <div className="field-sync-pill" id="fieldSyncPill" title="Mesh Sync Active">
            <span className="sync-dot"></span>
            <span id="fieldSyncStatusText">Mesh Online</span>
          </div>

          <Link to="/login" className="btn-field-link btn-logout" title="Sign out / Switch Role">
            Logout
          </Link>
        </div>
      </header>

      {/* =====================================================================
           PAGE 1 — ASSIGNED TASKS
           ===================================================================== */}
      <main className={`field-page-view ${activePage === 'page1' ? 'active' : ''}`} id="viewFieldPage1">
        <div className="field-container">
          
          {/* Quick Status & Filters Bar */}
          <div className="field-filter-bar">
            <div className="filter-pills-row">
              <button
                type="button"
                className={`filter-pill ${taskFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTaskFilter('all')}
              >
                All ({Object.keys(tasks).length})
              </button>
              <button
                type="button"
                className={`filter-pill ${taskFilter === 'hardware' ? 'active' : ''}`}
                onClick={() => setTaskFilter('hardware')}
              >
                Hardware ({Object.values(tasks).filter(t => t.type === 'hardware').length})
              </button>
              <button
                type="button"
                className={`filter-pill ${taskFilter === 'citizen' ? 'active' : ''}`}
                onClick={() => setTaskFilter('citizen')}
              >
                Citizen Reports ({Object.values(tasks).filter(t => t.type === 'citizen').length})
              </button>
              <button
                type="button"
                className={`filter-pill ${taskFilter === 'zone' ? 'active' : ''}`}
                onClick={() => setTaskFilter('zone')}
              >
                Zone Check ({Object.values(tasks).filter(t => t.type === 'zone').length})
              </button>
            </div>
            <div className="sort-tag-text">Sort: <strong>Proximity &amp; Urgency</strong></div>
          </div>

          {/* Tasks List Container */}
          <div className="tasks-list-grid" id="tasksListContainer">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`task-card ${task.urgency === 'critical' ? 'critical' : (task.urgency === 'high' ? 'warning' : '')}`}
                onClick={() => {
                  setSelectedTaskId(task.id);
                  setActivePage('page2');
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="task-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="task-type-badge">{task.typeLabel}</span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{task.id}</span>
                  </div>
                  <span className={`status-pill ${task.urgency === 'critical' ? 'critical' : (task.urgency === 'high' ? 'high' : 'open')}`}>
                    {task.urgencyText}
                  </span>
                </div>

                <h3 className="task-title" style={{ fontSize: '1.02rem', fontWeight: 800, margin: '6px 0 4px', color: 'var(--text-primary)' }}>
                  {task.title}
                </h3>

                <div className="task-meta-row" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', marginBottom: '8px' }}>
                  <span>📍 {task.location}</span>
                  <span>⚡ {task.distance}</span>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  {task.summary}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: task.status === 'completed' ? '#16a34a' : (task.status === 'rejected' ? '#dc2626' : '#ea580c') }}>
                    Status: {task.status.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-accent)', fontWeight: 700 }}>
                    Inspect Task →
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>

      {/* =====================================================================
           PAGE 2 — REPORT / TASK DETAIL
           ===================================================================== */}
      <main className={`field-page-view ${activePage === 'page2' ? 'active' : ''}`} id="viewFieldPage2">
        <div className="field-container">
          
          {/* Top Ribbon */}
          <div className="detail-top-ribbon">
            <button type="button" className="btn-field-link" onClick={() => setActivePage('page1')}>
              ← Back to Tasks
            </button>
            <span className="detail-task-id-tag" id="detailTaskIdBadge">{selectedTask.id}</span>
          </div>

          {/* Task Detail Card */}
          <div className="field-card" id="taskDetailCard">
            
            {/* Header Info */}
            <div className="task-detail-header">
              <div>
                <div className="task-type-sub" id="detailTaskTypeLabel">{selectedTask.typeLabel.toUpperCase()}</div>
                <h2 className="task-detail-title" id="detailTaskTitle">{selectedTask.title}</h2>
                <div className="task-meta-line" id="detailTaskMeta">
                  {selectedTask.location} • {selectedTask.distance} • {selectedTask.coordsText}
                </div>
              </div>
              <div id="detailTaskUrgencyContainer">
                <span className={`status-pill ${selectedTask.urgency === 'critical' ? 'critical' : 'high'}`}>
                  {selectedTask.urgencyText}
                </span>
              </div>
            </div>

            {/* Task Specific Body Content */}
            <div className="task-content-body" id="taskContentBody">
              {selectedTask.diagnostics && (
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>Telemetry Diagnostics</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                    <div><strong>Station:</strong> {selectedTask.diagnostics.station}</div>
                    <div><strong>Last Signal:</strong> {selectedTask.diagnostics.lastTelemetry}</div>
                    <div><strong>Battery:</strong> {selectedTask.diagnostics.batteryVoltage}</div>
                    <div><strong>Sensors:</strong> {selectedTask.diagnostics.connectedSensors}</div>
                  </div>
                </div>
              )}

              {selectedTask.citizenReport && (
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>Citizen Ground Evidence</h4>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <p style={{ margin: '0 0 6px' }}><strong>Reporter:</strong> {selectedTask.citizenReport.reporter} ({selectedTask.citizenReport.timestamp})</p>
                    <p style={{ margin: '0 0 6px' }}><strong>Observation:</strong> {selectedTask.citizenReport.description}</p>
                    <p style={{ margin: 0 }}><strong>Tags:</strong> {selectedTask.citizenReport.tags?.join(', ')}</p>
                  </div>
                </div>
              )}

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {selectedTask.summary}
              </p>
            </div>

            {/* Officer Field Action & Verification Form */}
            <div className="field-action-section">
              <h4 className="action-section-title">Field Verification &amp; Resolution</h4>
              
              <div className="form-group">
                <label className="form-label" htmlFor="fieldActionNotes">Patrol Inspection Notes:</label>
                <textarea
                  className="form-textarea"
                  id="fieldActionNotes"
                  rows="2"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Visual observations, crack width, or hardware condition..."
                ></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">Attach Ground Photo:</label>
                <div className="photo-upload-box" onClick={() => document.getElementById('taskPhotoInput').click()}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span id="taskPhotoInputLabel">{photoPreview ? 'Photo attached ✓' : 'Attach field photo'}</span>
                  <input
                    type="file"
                    id="taskPhotoInput"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files.length > 0) {
                        setPhotoPreview(URL.createObjectURL(e.target.files[0]));
                        showFieldToast('Attached ground photo evidence.');
                      }
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="task-action-btn-row" id="taskActionBtnContainer" style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  className="btn-field-submit"
                  style={{ background: '#dc2626', flex: 1 }}
                  onClick={() => handleTaskResolution(selectedTask.id, 'Hazard Confirmed & Clearing Deployed')}
                >
                  Confirm &amp; Dispatch Bulldozer
                </button>
                <button
                  type="button"
                  className="btn-field-submit"
                  style={{ background: '#16a34a', flex: 1 }}
                  onClick={() => handleTaskResolution(selectedTask.id, 'resolved')}
                >
                  Clear / False Alarm
                </button>
                <button
                  type="button"
                  className="btn-field-submit"
                  style={{ background: '#d97706', flex: 1 }}
                  onClick={() => handleTaskResolution(selectedTask.id, 'Backup Requested')}
                >
                  Request Backup
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* =====================================================================
           PAGE 3 — SUBMIT OBSERVATION
           ===================================================================== */}
      <main className={`field-page-view ${activePage === 'page3' ? 'active' : ''}`} id="viewFieldPage3">
        <div className="field-container" style={{ maxWidth: '800px' }}>
          
          <div className="field-card">
            <div className="field-card-header-clean">
              <div>
                <h2>Log Field Observation</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Record ground hazard. Automatically buffered offline and synced via mesh.
                </p>
              </div>
              <span className="status-pill open" id="offlineBufferStatus">Buffer Ready</span>
            </div>

            <form id="observationForm" onSubmit={handleFindingSubmit}>
              
              {/* Auto-Filled GPS Location */}
              <div className="form-group">
                <label className="form-label">GPS Location (Auto-detected):</label>
                <div className="gps-readout-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span id="obsGpsText" style={{ fontFamily: 'var(--font-main)', fontWeight: 700, fontSize: '0.82rem' }}>
                      {OFFICER_LOCATION.pos[0]}° N, {OFFICER_LOCATION.pos[1]}° E ({OFFICER_LOCATION.elevation} • {OFFICER_LOCATION.accuracy})
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-refresh-gps"
                    onClick={() => showFieldToast('GPS fixed with RTK precision.')}
                    title="Refresh GPS"
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
                <label className="form-label">Ground Photo:</label>
                <div className="photo-upload-box" onClick={() => document.getElementById('obsPhotoFile').click()}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span id="obsPhotoLabel">{obsPhotoPreview ? 'Ground photo attached ✓' : 'Tap to attach photo'}</span>
                  <input
                    type="file"
                    id="obsPhotoFile"
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
                <label className="form-label" htmlFor="obsNotesInput">Field Notes (Optional):</label>
                <textarea
                  className="form-textarea"
                  id="obsNotesInput"
                  rows="2"
                  value={findingNotes}
                  onChange={(e) => setFindingNotes(e.target.value)}
                  placeholder="e.g. 3.2m crack along road edge, 8cm wide with water runoff..."
                ></textarea>
              </div>

              {/* Submit Button */}
              <div style={{ marginTop: '14px' }}>
                <button type="submit" className="btn-field-submit">
                  Submit Observation to DDMA Command
                </button>
              </div>

            </form>
          </div>

        </div>
      </main>

      {/* =====================================================================
           PAGE 4 — FIELD TACTICAL MAP
           ===================================================================== */}
      <main className={`field-page-view ${activePage === 'page4' ? 'active' : ''}`} id="viewFieldPage4">
        <div className="field-map-container">
          
          {/* Tactical Leaflet Map Canvas */}
          <div id="fieldTacticalMap" ref={fieldMapRef}></div>

          {/* Map Floating Top Overlay */}
          <div className="field-map-top-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>Target:</span>
              <select
                className="field-map-select"
                id="mapTargetSelect"
                value={mapTarget}
                onChange={(e) => handleFocusMapTarget(e.target.value)}
              >
                <option value="my-location">My Patrol Location (Shillong)</option>
                <option value="gw-04">Gateway GW-SH01 (Offline • Ridge)</option>
                <option value="report-904">Citizen Report #904 (Crack)</option>
              </select>
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
            <span><strong style={{ color: '#2563eb' }}>●</strong> My GPS</span>
            <span><strong style={{ color: '#dc2626' }}>x</strong> Tasks</span>
            <span><strong style={{ color: '#16a34a' }}>▲</strong> Sensors</span>
            <span><strong style={{ color: '#be123c' }}>■</strong> Silent Gateway</span>
            <span><strong style={{ color: '#d97706' }}>▱</strong> Zones</span>
          </div>

        </div>
      </main>

      {/* Field Operational Toast Notification */}
      <div className={`field-toast ${showToast ? 'show' : ''}`} id="fieldToast">
        {toastMessage}
      </div>

    </div>
  );
}
