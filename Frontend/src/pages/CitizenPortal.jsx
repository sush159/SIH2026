import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import '../styles/styles.css';
import { TRANSLATIONS, RISK_DATA, ROADS_DATA, LOCATIONS_DATA, SHELTERS_DATA } from '../utils/citizenData';
import {
  unlockAudio,
  playAlarmSiren,
  stopAlarmSiren,
  playEmergencySequence,
  stopAllEmergencyAudio
} from '../utils/audioAlarm';

export default function CitizenPortal() {
  const [lang, setLang] = useState('en');
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'map', 'alerts', 'report'
  const [currentRisk, setCurrentRisk] = useState('safe'); // 'safe', 'watch', 'warning', 'danger'
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS_DATA[0]);
  const [selectedRoad, setSelectedRoad] = useState(ROADS_DATA[0]);
  const [alertFilter, setAlertFilter] = useState('all'); // 'all', 'area', 'route'
  const [selectedTag, setSelectedTag] = useState('crack');
  const [reportLocationText, setReportLocationText] = useState('Shillong Urban Ridge, Meghalaya (25.5788° N, 91.8933° E)');
  const [reportDesc, setReportDesc] = useState('');
  const [reportPhotos, setReportPhotos] = useState([]);
  const [savedRouteIds, setSavedRouteIds] = useState(['shillong-corridor', 'cherrapunji-road']);
  
  // Modals state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showRouteDetailsModal, setShowRouteDetailsModal] = useState(false);
  const [modalActiveRoad, setModalActiveRoad] = useState(ROADS_DATA[0]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [showGeotagCamera, setShowGeotagCamera] = useState(false);
  const [showAdminBroadcastModal, setShowAdminBroadcastModal] = useState(false);
  const [showEmergencyPopup, setShowEmergencyPopup] = useState(false);
  const [emergencyAlertPayload, setEmergencyAlertPayload] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  
  // Banner state
  const [isOffline, setIsOffline] = useState(false);
  const [showColdStartBanner, setShowColdStartBanner] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Admin broadcast form state
  const [adminScenario, setAdminScenario] = useState('landslide');
  const [adminHeadline, setAdminHeadline] = useState('CRITICAL FLASH FLOOD & LANDSLIDE EVACUATION');
  const [adminAdvisory, setAdminAdvisory] = useState('District Disaster Control has issued an immediate evacuation advisory for residents in low-lying riverside zones and Shillong ridge slopes. Move to higher ground or nearest shelter immediately.');
  const [adminSeverity, setAdminSeverity] = useState('danger');
  const [adminSiren, setAdminSiren] = useState('eas');
  const [isTestingSiren, setIsTestingSiren] = useState(false);

  // Toggle quick standalone siren audio test
  const handleToggleSirenTest = (tone = adminSiren) => {
    if (isTestingSiren) {
      stopAlarmSiren();
      setIsTestingSiren(false);
      showAppToast('Siren audio stopped.');
    } else {
      unlockAudio();
      playAlarmSiren(tone || 'eas', 0.6);
      setIsTestingSiren(true);
      showAppToast(`🔊 Playing ${tone ? tone.toUpperCase() : 'EAS'} siren tone... Click again to stop.`);
    }
  };

  // Camera video ref
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const riskInfo = RISK_DATA[currentRisk] || RISK_DATA.safe;

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const roadLayersRef = useRef({});
  const altLayerRef = useRef(null);

  const showAppToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const [liveAdminAlerts, setLiveAdminAlerts] = useState([]);
  const lastProcessedAlertRef = useRef(null);
  const citizenDeviceIdRef = useRef(`CIT-SH-${Math.floor(100 + Math.random() * 900)}`);

  // Broadcast citizen alarm turn-off / response telemetry to Admin console
  const broadcastCitizenStatus = (action, status, shelter = null) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const payload = {
      type: 'CITIZEN_ALARM_RESPONSE',
      citizenId: citizenDeviceIdRef.current,
      name: `Resident App User (${selectedLocation.name})`,
      phone: '+91 98765-LIVE-APP',
      zone: selectedLocation.name,
      location: `${selectedLocation.name} (${selectedLocation.lat.toFixed(4)}° N, ${selectedLocation.lng.toFixed(4)}° E)`,
      status: status, // 'unresponsive', 'acknowledged', 'evacuating'
      actionText: action,
      lastUpdate: 'Just now',
      timestamp: timeStr,
      shelterTarget: shelter || 'Shillong Municipal Relief Center #1'
    };

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('resilientguard_admin_alerts');
        channel.postMessage(payload);
        channel.close();
      }
    } catch (err) {}

    try {
      localStorage.setItem('resilientguard_citizen_response', JSON.stringify({ ...payload, updateId: Date.now() }));
    } catch (err) {}
  };

  // Global click listener to unlock Web Audio API on first user interaction
  useEffect(() => {
    const handleUserGesture = () => {
      unlockAudio();
    };
    window.addEventListener('click', handleUserGesture, { once: true });
    window.addEventListener('keydown', handleUserGesture, { once: true });
    return () => {
      window.removeEventListener('click', handleUserGesture, { once: true });
      window.removeEventListener('keydown', handleUserGesture, { once: true });
    };
  }, []);

  // Handle live alert dispatched from Admin Console
  const handleIncomingAdminAlert = (data) => {
    if (!data || data.type !== 'EMERGENCY_BROADCAST') return;
    const alertKey = `${data.refId || ''}_${data.triggerId || data.timestamp || ''}`;
    if (lastProcessedAlertRef.current === alertKey) return;
    lastProcessedAlertRef.current = alertKey;

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const formattedData = {
      ...data,
      timestamp: data.timestamp && !data.timestamp.includes('11:29') && data.timestamp !== 'Just now'
        ? (data.timestamp.startsWith('Just now') ? data.timestamp : `Just now (${data.timestamp})`)
        : `Just now (${timeFormatted})`
    };

    unlockAudio();
    setEmergencyAlertPayload(formattedData);
    setShowEmergencyPopup(true);
    setCurrentRisk('danger');
    setIsMuted(false);
    playEmergencySequence(formattedData);
    setLiveAdminAlerts(prev => [formattedData, ...prev.filter(a => a.refId !== data.refId)]);
    showAppToast(`🚨 INCOMING DISTRICT DISASTER ALERT: ${data.headline || 'Evacuation Warning'}`);
    
    // Broadcast initial delivery status as unacknowledged / ringing
    broadcastCitizenStatus('⚠️ Alert Delivered • Alarm Siren Ringing', 'unresponsive');
  };

  // Cross-tab BroadcastChannel & LocalStorage receiver for real alerts from Admin
  useEffect(() => {
    let channel;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('resilientguard_admin_alerts');
        channel.onmessage = (e) => {
          if (e.data) {
            handleIncomingAdminAlert(e.data);
          }
        };
      }
    } catch (err) {
      console.warn('Broadcast channel init notice:', err);
    }

    // Storage listener for cross-window / cross-tab alert synchronization
    const handleStorageChange = (e) => {
      if (e.key === 'resilientguard_latest_alert' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          handleIncomingAdminAlert(parsed);
        } catch (err) {
          console.warn('Error parsing storage alert:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Update selected location telemetry & risk level
  const handleSelectLocation = (loc) => {
    setSelectedLocation(loc);
    setCurrentRisk(loc.risk || 'safe');
    setReportLocationText(`${loc.name} (${loc.lat.toFixed(4)}° N, ${loc.lng.toFixed(4)}° E)`);
    setShowLocationModal(false);
    showAppToast(`Location updated: ${loc.name}`);
  };

  // Leaflet map setup and lifecycle
  useEffect(() => {
    if (activeTab === 'map' && mapContainerRef.current) {
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [selectedLocation.lat, selectedLocation.lng],
          zoom: 13,
          zoomControl: false,
          attributionControl: false
        });

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19
        }).addTo(map);

        L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19
        }).addTo(map);

        // Add monitored corridors
        ROADS_DATA.forEach(road => {
          const color = road.status === 'Blocked' ? '#dc2626' : (road.status === 'At-Risk' ? '#ea580c' : '#16a34a');
          const polyline = L.polyline(road.coords, {
            color: color,
            weight: 5,
            opacity: 0.9,
            dashArray: road.status === 'Blocked' ? '8, 8' : null
          }).addTo(map);

          polyline.bindPopup(`
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.8rem; padding: 4px;">
              <strong>${road.name}</strong><br/>
              Status: <span style="color:${color}; font-weight:700;">${road.status}</span><br/>
              <p style="margin:4px 0 0; font-size:0.75rem;">${road.description}</p>
            </div>
          `);

          polyline.on('click', () => {
            setSelectedRoad(road);
          });

          roadLayersRef.current[road.id] = polyline;
        });

        // Add shelters
        SHELTERS_DATA.forEach(shelter => {
          L.circleMarker([shelter.lat, shelter.lng], {
            radius: 8,
            fillColor: '#0284c7',
            color: '#ffffff',
            weight: 2,
            fillOpacity: 1
          }).addTo(map).bindPopup(`
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.8rem; padding: 4px;">
              <strong style="color:#0284c7;">${shelter.name}</strong><br/>
              Occupancy: ${shelter.capacity}<br/>
              Supplies: ${shelter.supplies}
            </div>
          `);
        });

        mapInstanceRef.current = map;
      } else {
        setTimeout(() => {
          mapInstanceRef.current.invalidateSize();
          mapInstanceRef.current.setView([selectedLocation.lat, selectedLocation.lng], 13);
        }, 100);
      }
    }
  }, [activeTab, selectedLocation]);

  // Apply alternate route on map
  const handleApplyAlternateRoute = (road) => {
    if (!road || !road.alternateRoute) return;
    setActiveTab('map');
    setTimeout(() => {
      if (mapInstanceRef.current) {
        if (altLayerRef.current) {
          mapInstanceRef.current.removeLayer(altLayerRef.current);
        }

        const altPoly = L.polyline(road.alternateRoute.coords, {
          color: '#16a34a',
          weight: 6,
          opacity: 0.95,
          dashArray: '6, 8'
        }).addTo(mapInstanceRef.current);

        altPoly.bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.8rem; padding: 4px;">
            <strong style="color:#16a34a;">Recommended Alternate Route: ${road.alternateRoute.name}</strong><br/>
            Distance: ${road.alternateRoute.distance} (${road.alternateRoute.extraTime})<br/>
            <em>${road.alternateRoute.notes}</em>
          </div>
        `).openPopup();

        altLayerRef.current = altPoly;
        mapInstanceRef.current.fitBounds(altPoly.getBounds(), { padding: [40, 40] });
        showAppToast(`Switched to alternate route: ${road.alternateRoute.name}`);
      }
    }, 200);
  };

  // Toggle saving road to saved commutes
  const handleToggleSaveRoute = (roadId) => {
    if (savedRouteIds.includes(roadId)) {
      setSavedRouteIds(prev => prev.filter(id => id !== roadId));
      showAppToast('Route removed from Saved Commutes');
    } else {
      setSavedRouteIds(prev => [...prev, roadId]);
      showAppToast('Route added to Saved Commutes');
    }
  };

  // Detect GPS
  const handleDetectGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coordsStr = `${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`;
          setReportLocationText(`Live GPS Lock: ${coordsStr}`);
          showAppToast('GPS coordinates locked successfully.');
        },
        () => {
          setReportLocationText(`Shillong Urban Ridge (25.5788° N, 91.8933° E)`);
          showAppToast('GPS locked to local sector station.');
        }
      );
    } else {
      showAppToast('GPS unavailable. Using regional sector pin.');
    }
  };

  // Photo file upload
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newUrls = files.map(file => URL.createObjectURL(file));
      setReportPhotos(prev => [...prev, ...newUrls]);
      showAppToast(`Attached ${files.length} hazard photo(s)`);
    }
  };

  // Start / Close Geotag camera
  const handleOpenGeotagCam = async () => {
    setShowGeotagCamera(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        cameraStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.warn('Camera stream notice:', err);
    }
  };

  const handleCloseGeotagCam = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    setShowGeotagCamera(false);
  };

  const handleCaptureGeotag = () => {
    const samplePhoto = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=60';
    setReportPhotos(prev => [...prev, samplePhoto]);
    handleCloseGeotagCam();
    showAppToast('Geotagged photo captured with live GPS watermark.');
  };

  // Submit report
  const handleReportSubmit = (e) => {
    e.preventDefault();
    const ref = `REP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReport = {
      refId: ref,
      status: 'Verified & Synced',
      location: reportLocationText || selectedLocation.name,
      category: selectedTag.replace('_', ' ').toUpperCase(),
      description: reportDesc || 'Ground observation logged via citizen portal.'
    };
    setSubmittedReport(newReport);
    setShowConfirmModal(true);

    // Broadcast report to Admin Console
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('resilientguard_admin_alerts');
        channel.postMessage({
          type: 'CITIZEN_REPORT_SUBMITTED',
          reporter: 'Citizen (App)',
          contact: 'App Verified',
          zone: selectedLocation.name,
          location: reportLocationText,
          coords: [selectedLocation.lat, selectedLocation.lng],
          coordsText: `${selectedLocation.lat}° N, ${selectedLocation.lng}° E`,
          category: selectedTag.replace('_', ' ').toUpperCase(),
          tags: [selectedTag],
          severity: currentRisk === 'danger' ? 'critical' : 'high',
          description: reportDesc || 'Hazard report submitted via Citizen portal.'
        });
        channel.close();
      }
    } catch (err) {
      console.warn('Report broadcast error:', err);
    }

    setReportDesc('');
  };

  // Admin Broadcast Dispatch simulation
  const handleDispatchLiveAlert = () => {
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const payload = {
      type: 'EMERGENCY_BROADCAST',
      refId: `#ALERT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      zoneName: selectedLocation.name,
      headline: adminHeadline,
      desc: adminAdvisory,
      severity: adminSeverity,
      siren: adminSiren,
      timestamp: `Just now (${timeFormatted})`
    };

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('resilientguard_admin_alerts');
        channel.postMessage(payload);
        channel.close();
      }
    } catch (err) {
      console.warn('Broadcast error:', err);
    }

    setShowAdminBroadcastModal(false);
    setEmergencyAlertPayload(payload);
    setShowEmergencyPopup(true);
    setCurrentRisk('danger');
    setIsMuted(false);
    playEmergencySequence(payload);
    showAppToast('Live emergency alert broadcast dispatched!');
  };

  // Silence / Unsilence audio alarm
  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      broadcastCitizenStatus('⚠️ Alarm Siren Resumed by Citizen', 'unresponsive');
      playEmergencySequence(emergencyAlertPayload || { headline: adminHeadline, desc: adminAdvisory, siren: adminSiren });
      showAppToast('Alarm siren & voice advisory resumed.');
    } else {
      setIsMuted(true);
      stopAllEmergencyAudio();
      broadcastCitizenStatus('🟢 Alarm Silenced by Citizen (User Responsive)', 'acknowledged');
      showAppToast('Alarm siren & voice muted. Response logged with Disaster Control.');
    }
  };

  // Dismiss emergency popup
  const handleDismissEmergency = (shelter = null) => {
    stopAllEmergencyAudio();
    setShowEmergencyPopup(false);
    broadcastCitizenStatus('🟢 Alarm Turned Off & Evacuation Acknowledged', 'evacuating', shelter || 'Shillong Municipal Relief Center #1');
    showAppToast('Evacuation status acknowledged & synced with Disaster Control.');
  };

  return (
    <div className="app-container">
      {/* Brand Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>
          <div className="brand-text">
            <h1 data-i18n="appTitle">{t.appTitle}</h1>
            <span data-i18n="appSubtitle">{t.appSubtitle}</span>
          </div>
        </div>

        <div className="header-right">
          {/* Location Selector Chip */}
          <button
            className="location-chip"
            id="locationSelectorBtn"
            title="Change or detect location"
            onClick={() => setShowLocationModal(true)}
          >
            <span className="gps-pulse"></span>
            <span id="headerLocationName">{selectedLocation.name}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {/* Language Switcher */}
          <div className="lang-switch">
            <button
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              id="langEnBtn"
              onClick={() => setLang('en')}
            >
              EN
            </button>
            <button
              className={`lang-btn ${lang === 'hi' ? 'active' : ''}`}
              id="langHiBtn"
              onClick={() => setLang('hi')}
            >
              हिन्दी
            </button>
          </div>

          {/* Login / Role Gateway Button */}
          <Link to="/login" className="header-login-btn" title="Sign In / Switch Role">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            <span>Login</span>
          </Link>
        </div>
      </header>

      {/* Contextual / Dynamic Banners */}
      <section className="banner-container" id="bannerContainer">
        {isOffline && (
          <div className="notice-banner offline" id="offlineBanner">
            <div className="banner-content">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
                <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
                <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                <line x1="12" y1="20" x2="12.01" y2="20"></line>
              </svg>
              <span id="offlineBannerText" data-i18n="offlineNotice">{t.offlineNotice}</span>
            </div>
            <button className="banner-action-btn" id="retrySyncBtn" onClick={() => showAppToast('Reconnected to live mesh network.')} data-i18n="retrySync">{t.retrySync}</button>
          </div>
        )}

        {showColdStartBanner && (
          <div className="notice-banner coldstart" id="coldStartBanner">
            <div className="banner-content">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span id="coldStartBannerText" data-i18n="coldStartNotice">{t.coldStartNotice}</span>
            </div>
            <button className="banner-action-btn" id="dismissColdStartBtn" onClick={() => setShowColdStartBanner(false)} data-i18n="dismiss">{t.dismiss}</button>
          </div>
        )}
      </section>

      {/* Main Navigation Bar */}
      <nav className="main-nav-bar" id="mainNavBar">
        <button
          className={`nav-tab-item ${activeTab === 'home' ? 'active' : ''}`}
          data-tab="home"
          id="navHome"
          onClick={() => setActiveTab('home')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span data-i18n="navMyArea">{t.navMyArea}</span>
        </button>

        <button
          className={`nav-tab-item ${activeTab === 'map' ? 'active' : ''}`}
          data-tab="map"
          id="navMap"
          onClick={() => setActiveTab('map')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
          <span data-i18n="navMap">{t.navMap}</span>
        </button>

        <button
          className={`nav-tab-item ${activeTab === 'alerts' ? 'active' : ''}`}
          data-tab="alerts"
          id="navAlerts"
          onClick={() => setActiveTab('alerts')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span data-i18n="navAlerts">{t.navAlerts}</span>
          <span
            className="nav-badge"
            id="alertCountBadge"
            style={{
              background: liveAdminAlerts.length > 0 ? '#dc2626' : undefined,
              color: liveAdminAlerts.length > 0 ? '#ffffff' : undefined,
              animation: liveAdminAlerts.length > 0 ? 'pulse 2s infinite' : undefined
            }}
          >
            {2 + liveAdminAlerts.length}
          </span>
        </button>

        <button
          className={`nav-tab-item ${activeTab === 'report' ? 'active' : ''}`}
          data-tab="report"
          id="navReport"
          onClick={() => setActiveTab('report')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span data-i18n="navReport">{t.navReport}</span>
        </button>
      </nav>

      {/* =====================================================================
           MAIN SCREEN VIEWPORTS
           ===================================================================== */}
      <main className="main-content app-viewport">
        
        {/* =================================================================
             SCREEN 1: MY AREA (DASHBOARD)
             ================================================================= */}
        <section className={`screen-view ${activeTab === 'home' ? 'active' : ''}`} id="screenHome">
          <div className="home-grid">
            
            {/* Left Column: Primary Hazard Status */}
            <div className="home-main-col">
              
              {/* Hero Risk Card */}
              <article className={`hero-risk-card ${currentRisk}`} id="heroRiskCard">
                <div className="hero-top-row">
                  <div className="location-info">
                    <h2 id="homeLocationTitle">{selectedLocation.title || selectedLocation.name}</h2>
                    <div className="sub-loc">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span id="homeLocationSub">{selectedLocation.subtitle || 'Meghalaya • Live Feeds'}</span>
                    </div>
                  </div>

                  {/* Status Badge: Level, Color + Icon */}
                  <div className={`risk-status-badge ${currentRisk}`} id="homeRiskBadge">
                    <span className="risk-icon-wrap" id="homeRiskIcon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <polyline points="9 12 11 14 15 10" />
                      </svg>
                    </span>
                    <span id="homeRiskLevelText">{riskInfo.level || 'SAFE'}</span>
                  </div>
                </div>

                {/* One-line plain language reason */}
                <div className="risk-reason-box">
                  <div className="reason-header" data-i18n="primaryReasonHeader">{t.primaryReasonHeader}</div>
                  <div className="reason-text" id="homeRiskReason">
                    {lang === 'hi' ? riskInfo.reasonHi : riskInfo.reasonEn}
                  </div>
                  {/* Trend line below Primary Factor text */}
                  <div className="trend-line" id="homeTrendLine" style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    <span id="homeTrendLineText" data-i18n="trendLineText">{lang === 'hi' ? riskInfo.trendHi : riskInfo.trendEn}</span>
                  </div>
                </div>

                {/* Freshness / Confidence Line */}
                <div className="freshness-row">
                  <div className="freshness-indicator">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span id="homeFreshnessText" data-i18n="freshnessText">{t.freshnessText}</span>
                  </div>
                  <div className="confidence-pill" id="homeConfidencePill" data-i18n="highConfidence">
                    {t.highConfidence}
                  </div>
                </div>
              </article>

              {/* Emergency Section - Visible ONLY when place is in DANGER */}
              {currentRisk === 'danger' && (
                <article className="emergency-card" id="emergencySection" style={{ marginTop: '20px', display: 'block' }}>
                  <div className="emergency-header">
                    <div className="emergency-title">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      <span data-i18n="emergencyActionsHeader">{t.emergencyActionsHeader}</span>
                    </div>
                    <span className="confidence-pill" style={{ background: '#ffe4e6', borderColor: '#fecdd3', color: '#9f1239' }} data-i18n="sosActive">{t.sosActive}</span>
                  </div>

                  <div className="sos-action-grid">
                    <a href="tel:112" className="sos-btn" id="sosCall112">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <span data-i18n="callEmergency112">{t.callEmergency112}</span>
                    </a>

                    <a href="tel:1077" className="sos-btn" style={{ background: '#be123c' }} id="sosCall1077">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <span data-i18n="callDisasterControl">{t.callDisasterControl}</span>
                    </a>
                  </div>

                  {/* Nearest Shelter Card */}
                  <div className="shelter-info-box">
                    <div className="shelter-details">
                      <h4 id="shelterName" data-i18n="shelterName">{t.shelterName}</h4>
                      <p id="shelterMeta" data-i18n="shelterMeta">{t.shelterMeta}</p>
                    </div>
                    <button className="shelter-route-btn" id="viewShelterMapBtn" onClick={() => setActiveTab('map')} data-i18n="navigateShelter">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="3 11 22 2 13 21 11 13 3 11" />
                      </svg>
                      <span>{t.navigateShelter}</span>
                    </button>
                  </div>
                </article>
              )}

              {/* Key Telemetry */}
              <div className="telemetry-grid" style={{ marginTop: '20px' }}>
                <div className="telemetry-card">
                  <span className="label" data-i18n="telemetryRainfall">{t.telemetryRainfall}</span>
                  <span className="value" id="telRainfall">{selectedLocation.telemetry?.rainfall || riskInfo.rainfall}</span>
                  <span className="status-indicator" style={{ color: '#059669' }} id="telRainfallStat">{selectedLocation.telemetry?.rainfallStat || riskInfo.rainfallStat}</span>
                </div>

                <div className="telemetry-card">
                  <span className="label" data-i18n="telemetrySoil">{t.telemetrySoil}</span>
                  <span className="value" id="telSoil">{selectedLocation.telemetry?.soil || riskInfo.soil}</span>
                  <span className="status-indicator" style={{ color: '#059669' }} id="telSoilStat">{selectedLocation.telemetry?.soilStat || riskInfo.soilStat}</span>
                </div>

                <div className="telemetry-card">
                  <span className="label" data-i18n="telemetrySlope">{t.telemetrySlope}</span>
                  <span className="value" id="telSlope">{selectedLocation.telemetry?.slope || riskInfo.slope}</span>
                  <span className="status-indicator" style={{ color: '#059669' }} id="telSlopeStat">{selectedLocation.telemetry?.slopeStat || riskInfo.slopeStat}</span>
                </div>
              </div>

            </div>

            {/* Right Column: Saved Commuter Corridor & Status */}
            <div className="home-sidebar">
              
              <div className="sidebar-card" id="savedCommutesSidebarCard">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                  <h3 data-i18n="savedRoutesHeader" style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                    <span>{t.savedRoutesHeader}</span>
                  </h3>
                  <button
                    type="button"
                    id="btnOpenRouteModal"
                    title="Manage your saved commute routes"
                    style={{ background: 'none', border: 'none', fontSize: '0.76rem', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', padding: '2px 6px' }}
                    onClick={() => setShowRouteModal(true)}
                  >
                    + Manage
                  </button>
                </div>
                
                {/* Dynamically populated saved commute corridor cards */}
                <div id="homeSavedRoutesList" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                  {ROADS_DATA.filter(r => savedRouteIds.includes(r.id)).map(road => (
                    <div
                      key={road.id}
                      className="road-item"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setModalActiveRoad(road);
                        setShowRouteDetailsModal(true);
                      }}
                    >
                      <div className="road-item-top">
                        <span className="road-name">{road.name}</span>
                        <span className={`road-badge ${road.status.toLowerCase().replace('-', '')}`}>{road.status}</span>
                      </div>
                      <span className="road-subtext">{road.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safeguard Rules */}
              <div className="sidebar-card">
                <h3 data-i18n="advisoryHeader">{t.advisoryHeader}</h3>
                <ul style={{ paddingLeft: '18px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li data-i18n="advisory1">{t.advisory1}</li>
                  <li data-i18n="advisory2">{t.advisory2}</li>
                  <li data-i18n="advisory3">{t.advisory3}</li>
                  <li data-i18n="advisory4">{t.advisory4}</li>
                </ul>
              </div>

              {/* Quick Action: Admin Broadcast Simulation Trigger & Siren Audio Test */}
              <div className="sidebar-card" style={{ background: '#f8fafc', border: '1px dashed var(--border-light)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Emergency Siren Audio</span>
                    <span style={{ fontSize: '0.72rem', color: isTestingSiren ? '#dc2626' : 'var(--text-muted)', fontWeight: 700 }}>
                      {isTestingSiren ? '🔊 SIREN ACTIVE' : 'Audio Ready'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      style={{
                        flex: 1,
                        background: isTestingSiren ? '#dc2626' : '#1e293b',
                        color: '#ffffff',
                        border: 'none',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                      onClick={() => handleToggleSirenTest(adminSiren)}
                    >
                      <span>{isTestingSiren ? '⏹️' : '🔊'}</span>
                      <span>{isTestingSiren ? 'Stop Siren' : 'Test Siren Sound'}</span>
                    </button>
                    <button
                      type="button"
                      style={{
                        background: '#be123c',
                        color: '#ffffff',
                        border: 'none',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onClick={() => setShowAdminBroadcastModal(true)}
                    >
                      <span>🚨</span> Broadcast Alert
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* =================================================================
             SCREEN 2: INTERACTIVE GEOSPATIAL MAP
             ================================================================= */}
        <section className={`screen-view ${activeTab === 'map' ? 'active' : ''}`} id="screenMap">
          <div className="map-view-container">
            
            {/* Map Canvas Wrapper */}
            <div className="map-wrapper">
              <div id="disasterMap" ref={mapContainerRef}></div>

              {/* Top Left: Live Map API Connectivity Pill */}
              <div className="map-api-status-badge" id="mapApiStatusBadge">
                <span className="api-status-pulse"></span>
                <span className="api-status-text" id="mapApiStatusText">Map API Connected: OSM &amp; OSRM Engine</span>
              </div>

              {/* Top Right: Satellite Mode Indicator Badge */}
              <div className="map-satellite-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /><line x1="2" y1="12" x2="22" y2="12" /></svg>
                <span>Live Satellite View</span>
              </div>

              {/* Bottom Right: Floating Quick Actions */}
              <div className="map-floating-tools">
                <button
                  type="button"
                  className="map-tool-btn"
                  id="btnMapZoomIn"
                  title="Zoom In"
                  onClick={() => mapInstanceRef.current && mapInstanceRef.current.zoomIn()}
                >
                  +
                </button>
                <button
                  type="button"
                  className="map-tool-btn"
                  id="btnMapZoomOut"
                  title="Zoom Out"
                  onClick={() => mapInstanceRef.current && mapInstanceRef.current.zoomOut()}
                >
                  &minus;
                </button>
                <button
                  type="button"
                  className="map-tool-btn"
                  id="btnMapLocateMe"
                  title="Find My Live GPS Location"
                  onClick={handleDetectGPS}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="9" /><line x1="12" y1="1" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="23" /><line x1="1" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="23" y2="12" /></svg>
                </button>
                <button
                  type="button"
                  className="map-tool-btn"
                  id="btnMapRecenter"
                  title="Recenter on Shillong (Meghalaya)"
                  onClick={() => mapInstanceRef.current && mapInstanceRef.current.setView([selectedLocation.lat, selectedLocation.lng], 13)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M12 3v18" /></svg>
                </button>
              </div>

              {/* Bottom Left: Reverse Geocoding Hint Pill */}
              <div className="map-inspect-hint">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                <span>Click any corridor to inspect road &amp; alternate bypass</span>
              </div>
            </div>

            {/* Map Side Inspector Panel */}
            <div className="map-sidebar">

              {/* Sidebar Title Header */}
              <div className="map-sidebar-header">
                <div className="map-sidebar-title-row">
                  <h3 data-i18n="mapInspectorHeader">{t.mapInspectorHeader}</h3>
                  <span className="sidebar-live-pill">Live Telemetry</span>
                </div>
              </div>

              {/* Inspector Active Card */}
              <div className="map-sidebar-inspector">
                <div className="inspector-card" id="mapInspectorCard">
                  {/* Colored header band */}
                  <div className={`inspector-zone-header ${selectedRoad.status === 'Blocked' ? 'danger' : 'safe'}`} id="inspectorZoneHeader">
                    <div className="inspector-zone-top-tag">
                      <span className="inspector-zone-type" id="inspectorZoneType">ROAD CORRIDOR</span>
                      <span className={`inspector-risk-badge ${selectedRoad.status.toLowerCase().replace('-', '')}`} id="inspectorBadge">{selectedRoad.status.toUpperCase()}</span>
                    </div>
                    <h4 className="inspector-title" id="inspectorTitle">{selectedRoad.name}</h4>
                    <div className="inspector-zone-meta" id="inspectorZoneMeta">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" /><circle cx="12" cy="10" r="3" /></svg>
                      <span>{selectedRoad.description}</span>
                    </div>
                  </div>

                  {/* Simple Citizen Summary Pills */}
                  <div className="inspector-stat-row" id="inspectorStatRow">
                    <div className="inspector-stat-pill">
                      <span className="inspector-stat-label">Road Status</span>
                      <span className="inspector-stat-val" style={{ color: selectedRoad.status === 'Blocked' ? '#dc2626' : '#16a34a' }} id="inspectorValTransit">
                        {selectedRoad.status === 'Blocked' ? 'Closed for Transit' : 'Open & Clear'}
                      </span>
                    </div>
                    <div className="inspector-stat-pill">
                      <span className="inspector-stat-label">Advisory</span>
                      <span className="inspector-stat-val" id="inspectorValAdvisory">
                        {selectedRoad.alternateRoute ? `Use Bypass (${selectedRoad.alternateRoute.extraTime})` : 'Clear Corridor'}
                      </span>
                    </div>
                  </div>

                  {/* Plain language status text */}
                  <div className="inspector-body">
                    <p className="inspector-desc" id="inspectorDesc">
                      {selectedRoad.description}. Monitored continuously via satellite radar and traffic sensors.
                    </p>
                  </div>

                  {/* Alternate Route Box */}
                  {selectedRoad.alternateRoute ? (
                    <div className="inspector-alt-route-box" id="inspectorAltBox">
                      <div className="alt-route-tag">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                        <span>Alternate Route Available</span>
                      </div>
                      <div className="alt-route-title" id="inspectorAltName">{selectedRoad.alternateRoute.name}</div>
                      <div className="alt-route-stats" id="inspectorAltStats">
                        <span className="alt-stat-pill safe" id="inspectorAltStatus">Open</span>
                        <span id="inspectorAltTime">{selectedRoad.alternateRoute.extraTime}</span>
                        <span>&bull;</span>
                        <span id="inspectorAltDist">{selectedRoad.alternateRoute.distance}</span>
                      </div>
                      <div className="alt-route-note" id="inspectorAltNote">{selectedRoad.alternateRoute.notes}</div>
                      <button
                        type="button"
                        className="btn-activate-alt-route"
                        id="btnInspectorApplyAlt"
                        onClick={() => handleApplyAlternateRoute(selectedRoad)}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                        <span>Use Alternate Route</span>
                      </button>
                    </div>
                  ) : (
                    <div className="inspector-no-alt-box" id="inspectorNoAltBox">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>No alternate route available &mdash; contact local authorities</span>
                    </div>
                  )}

                  {/* Save Corridor Route to Commutes Action Bar */}
                  <div className="inspector-action-bar" style={{ padding: '12px 18px', background: '#ffffff', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-save-route-toggle"
                      id="btnSaveCorridorRoute"
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', border: '1px solid var(--border-light)', background: '#f8fafc', color: 'var(--text-primary)' }}
                      onClick={() => handleToggleSaveRoute(selectedRoad.id)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                      <span id="btnSaveCorridorRouteText">{savedRouteIds.includes(selectedRoad.id) ? 'Saved in Commutes' : 'Save to My Commutes'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Corridor Selection List */}
              <div className="sidebar-section-header">
                <h4 data-i18n="monitoredRoadsHeader">{t.monitoredRoadsHeader}</h4>
                <span className="sidebar-section-count">{ROADS_DATA.length} routes</span>
              </div>
              <div className="road-list">
                {ROADS_DATA.map(road => (
                  <div
                    key={road.id}
                    className={`road-item ${selectedRoad.id === road.id ? 'active-selected' : ''}`}
                    data-road-id={road.id}
                    onClick={() => {
                      setSelectedRoad(road);
                      if (mapInstanceRef.current && roadLayersRef.current[road.id]) {
                        mapInstanceRef.current.fitBounds(roadLayersRef.current[road.id].getBounds(), { padding: [50, 50] });
                      }
                    }}
                  >
                    <div className="road-item-top">
                      <span className="road-name">{road.name}</span>
                      <span className={`road-badge ${road.status.toLowerCase().replace('-', '')}`}>{road.status}</span>
                    </div>
                    <span className="road-subtext">{road.description}</span>
                  </div>
                ))}
              </div>

            </div>

          </div>
        </section>

        {/* =================================================================
             SCREEN 3: ALERTS & ROUTES
             ================================================================= */}
        <section className={`screen-view ${activeTab === 'alerts' ? 'active' : ''}`} id="screenAlerts">
          <div className="alerts-container">
            
            <div className="alerts-page-header">
              <h2 data-i18n="alertsPageTitle">{t.alertsPageTitle}</h2>
              <p data-i18n="alertsPageSub">{t.alertsPageSub}</p>
            </div>

            {/* Filter Pills */}
            <div className="alerts-filter-bar">
              <button
                className={`filter-pill ${alertFilter === 'all' ? 'active' : ''}`}
                onClick={() => setAlertFilter('all')}
                data-filter="all"
                data-i18n="filterAll"
              >
                {t.filterAll}
              </button>
              <button
                className={`filter-pill ${alertFilter === 'area' ? 'active' : ''}`}
                onClick={() => setAlertFilter('area')}
                data-filter="area"
                data-i18n="filterArea"
              >
                {t.filterArea}
              </button>
              <button
                className={`filter-pill ${alertFilter === 'route' ? 'active' : ''}`}
                onClick={() => setAlertFilter('route')}
                data-filter="route"
                data-i18n="filterRoute"
              >
                {t.filterRoute}
              </button>
            </div>

            <div className="alerts-list" id="alertsContainer">
              {/* Real-time Live Admin Broadcast Alert Cards */}
              {liveAdminAlerts.map(alert => (
                <article
                  key={alert.refId}
                  className="alert-card danger"
                  id="liveAdminAlertCard"
                  data-category="area"
                  style={{
                    borderLeft: '4px solid #dc2626',
                    background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.08), rgba(185, 28, 28, 0.02))',
                    boxShadow: '0 4px 14px rgba(220, 38, 38, 0.12)'
                  }}
                >
                  <div className="alert-top">
                    <span className="alert-scope-tag" style={{ color: '#dc2626', fontWeight: 800 }}>⚡ LIVE DISTRICT BROADCAST</span>
                    <span className="alert-time">{alert.timestamp || 'Just now'} • HIGH PRIORITY</span>
                  </div>
                  <h3 className="alert-headline" style={{ color: '#991b1b', marginTop: '4px' }}>{alert.headline}</h3>
                  <p className="alert-description" style={{ margin: '6px 0 10px' }}>{alert.desc}</p>
                  <div className="alert-actions-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="action-link-btn"
                      onClick={() => setActiveTab('map')}
                      style={{ background: 'var(--bg-card)', padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border-light)', fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      View Threat Map →
                    </button>
                    <button
                      type="button"
                      className="action-link-btn"
                      onClick={() => {
                        setShowEmergencyPopup(true);
                        playEmergencySequence(alert);
                      }}
                      style={{ background: '#dc2626', color: '#fff', padding: '5px 10px', borderRadius: '6px', border: 'none', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Re-open Emergency Popup
                    </button>
                  </div>
                </article>
              ))}
              {/* Alert 1: Landslide Risk */}
              {(alertFilter === 'all' || alertFilter === 'area') && (
                <article className="alert-card danger" data-category="area">
                  <div className="alert-top">
                    <span className="alert-scope-tag" style={{ color: '#dc2626' }} data-i18n="alertScopeArea">{t.alertScopeArea}</span>
                    <span className="alert-time">Issued 14 min ago • Active now</span>
                  </div>
                  <h3 className="alert-headline" data-i18n="alert1Headline">{t.alert1Headline}</h3>
                  <p className="alert-description" data-i18n="alert1Desc">
                    {t.alert1Desc}
                  </p>
                  <div className="data-source-line" data-i18n="dataSourceLine1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                    <span>{t.dataSourceLine1}</span>
                  </div>
                </article>
              )}

              {/* Alert 2: Route Closure with Alternate Bypass */}
              {(alertFilter === 'all' || alertFilter === 'route') && (
                <article className="alert-card warning" data-category="route">
                  <div className="alert-top">
                    <span className="alert-scope-tag" style={{ color: '#ea580c' }} data-i18n="alertScopeRoute">{t.alertScopeRoute}</span>
                    <span className="alert-time">Issued 28 min ago • Clearance ongoing</span>
                  </div>
                  <h3 className="alert-headline" data-i18n="alert2Headline">{t.alert2Headline}</h3>
                  <p className="alert-description" data-i18n="alert2Desc">
                    {t.alert2Desc}
                  </p>

                  {/* Alternate Route Card */}
                  <div className="alternate-road-card">
                    <div className="alternate-meta">
                      <h4 data-i18n="alternateAvailableHeader">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                        <span>{t.alternateAvailableHeader}</span>
                      </h4>
                      <p data-i18n="alternateRouteSub">{t.alternateRouteSub}</p>
                    </div>
                    <button
                      className="switch-route-btn"
                      id="btnSwitchRoute"
                      onClick={() => handleApplyAlternateRoute(ROADS_DATA[0])}
                      data-i18n="applyAlternateRoute"
                    >
                      {t.applyAlternateRoute}
                    </button>
                  </div>

                  <div className="data-source-line" data-i18n="dataSourceLine2">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                    <span>{t.dataSourceLine2}</span>
                  </div>
                </article>
              )}
            </div>

          </div>
        </section>

        {/* =================================================================
             SCREEN 4: CITIZEN REPORT
             ================================================================= */}
        <section className={`screen-view ${activeTab === 'report' ? 'active' : ''}`} id="screenReport">
          <div className="report-container">
            
            <form className="report-card" id="citizenReportForm" onSubmit={handleReportSubmit}>
              <div className="report-card-header">
                <h2 data-i18n="reportTitle">{t.reportTitle}</h2>
                <p data-i18n="reportSubtitle">{t.reportSubtitle}</p>
              </div>

              {/* 1. Photo Capture / Upload */}
              <div className="form-section">
                <label className="form-label">
                  <span data-i18n="reportPhotoLabel">{t.reportPhotoLabel}</span>
                  <span className="optional" data-i18n="optionalTag">{t.optionalTag}</span>
                </label>

                {/* Dual Photo Options */}
                <div className="photo-options-grid">
                  {/* Option 1: Direct File Upload */}
                  <div
                    className="photo-action-card direct-upload-card"
                    id="btnUploadDirect"
                    onClick={() => document.getElementById('photoFileInput').click()}
                  >
                    <input
                      type="file"
                      id="photoFileInput"
                      accept="image/*"
                      style={{ display: 'none' }}
                      multiple
                      onChange={handlePhotoUpload}
                    />
                    <div className="photo-card-icon direct-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <div className="photo-card-info">
                      <h5 data-i18n="uploadDirectTitle">{t.uploadDirectTitle}</h5>
                      <p data-i18n="uploadDirectSub">{t.uploadDirectSub}</p>
                    </div>
                    <div className="photo-card-action">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                      <span>Browse Files</span>
                    </div>
                  </div>

                  {/* Option 2: Live Geotag Camera */}
                  <div
                    className="photo-action-card geotag-cam-card"
                    id="btnOpenGeotagCam"
                    onClick={handleOpenGeotagCam}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="cam-live-indicator">
                      <span className="pulse-dot"></span> Live GPS Stamp
                    </div>
                    <div className="photo-card-icon cam-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    </div>
                    <div className="photo-card-info">
                      <h5 data-i18n="geotagCamTitle">{t.geotagCamTitle}</h5>
                      <p data-i18n="geotagCamSub">{t.geotagCamSub}</p>
                    </div>
                    <div className="photo-card-action cam-action">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>
                      <span>Open Camera</span>
                    </div>
                  </div>
                </div>

                {/* Preview Grid */}
                {reportPhotos.length > 0 && (
                  <div className="photo-preview-grid" id="photoPreviewContainer" style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {reportPhotos.map((url, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                        <img src={url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => setReportPhotos(prev => prev.filter((_, i) => i !== idx))}
                          style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '10px' }}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Auto-filled, Editable Location */}
              <div className="form-section">
                <label className="form-label">
                  <span data-i18n="reportLocationLabel">{t.reportLocationLabel}</span>
                  <span className="optional" data-i18n="autoDetectedTag">{t.autoDetectedTag}</span>
                </label>
                <div className="location-input-group">
                  <input
                    type="text"
                    className="text-input"
                    id="reportLocationInput"
                    value={reportLocationText}
                    onChange={(e) => setReportLocationText(e.target.value)}
                    placeholder="Detecting your GPS location…"
                    required
                  />
                  <button type="button" className="auto-loc-btn" id="btnRefreshGPS" onClick={handleDetectGPS}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="22" y1="12" x2="18" y2="12" />
                      <line x1="6" y1="12" x2="2" y2="12" />
                      <line x1="12" y1="6" x2="12" y2="2" />
                      <line x1="12" y1="22" x2="12" y2="18" />
                    </svg>
                    <span data-i18n="btnDetectGPS">{t.btnDetectGPS}</span>
                  </button>
                </div>
              </div>

              {/* 3. Quick-Select Issue Tags */}
              <div className="form-section">
                <label className="form-label">
                  <span data-i18n="reportHazardTypeLabel">{t.reportHazardTypeLabel}</span>
                  <span className="optional" data-i18n="singleSelectTag">{t.singleSelectTag}</span>
                </label>
                <div className="tag-chips-grid" id="hazardTagGroup">
                  <div
                    className={`tag-chip ${selectedTag === 'crack' ? 'active' : ''}`}
                    data-tag="crack"
                    onClick={() => setSelectedTag('crack')}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                    <span data-i18n="tagCrack">{t.tagCrack}</span>
                  </div>
                  <div
                    className={`tag-chip ${selectedTag === 'water' ? 'active' : ''}`}
                    data-tag="water"
                    onClick={() => setSelectedTag('water')}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>
                    <span data-i18n="tagWater">{t.tagWater}</span>
                  </div>
                  <div
                    className={`tag-chip ${selectedTag === 'road_blocked' ? 'active' : ''}`}
                    data-tag="road_blocked"
                    onClick={() => setSelectedTag('road_blocked')}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
                    <span data-i18n="tagRoadBlocked">{t.tagRoadBlocked}</span>
                  </div>
                  <div
                    className={`tag-chip ${selectedTag === 'movement' ? 'active' : ''}`}
                    data-tag="movement"
                    onClick={() => setSelectedTag('movement')}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3l4 8 5-5 5 15H2L8 3z" /></svg>
                    <span data-i18n="tagMovement">{t.tagMovement}</span>
                  </div>
                  <div
                    className={`tag-chip ${selectedTag === 'bridge_damage' ? 'active' : ''}`}
                    data-tag="bridge_damage"
                    onClick={() => setSelectedTag('bridge_damage')}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="14" width="18" height="4" rx="1" /><line x1="6" y1="14" x2="6" y2="20" /><line x1="18" y1="14" x2="18" y2="20" /><path d="M3 14c4-6 14-6 18 0" /></svg>
                    <span data-i18n="tagBridge">{t.tagBridge}</span>
                  </div>
                  <div
                    className={`tag-chip ${selectedTag === 'fallen_wires' ? 'active' : ''}`}
                    data-tag="fallen_wires"
                    onClick={() => setSelectedTag('fallen_wires')}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                    <span data-i18n="tagWires">{t.tagWires}</span>
                  </div>
                </div>
              </div>

              {/* 4. Optional Text Note */}
              <div className="form-section">
                <label className="form-label">
                  <span data-i18n="reportDescLabel">{t.reportDescLabel}</span>
                  <span className="optional" data-i18n="optionalTag">{t.optionalTag}</span>
                </label>
                <textarea
                  className="textarea-input"
                  id="reportDescInput"
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Describe extent of crack, flow of water, or visible signs of ongoing movement..."
                  rows="3"
                ></textarea>
              </div>

              {/* 5. Submit Button */}
              <button type="submit" className="submit-btn" id="submitReportBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                <span id="submitBtnText" data-i18n="btnSubmitOnline">{t.btnSubmitOnline}</span>
              </button>

            </form>

          </div>
        </section>

      </main>

      {/* =====================================================================
           SUBMISSION CONFIRMATION MODAL
           ===================================================================== */}
      {showConfirmModal && (
        <div className="modal-backdrop" id="confirmationModal" style={{ display: 'flex' }}>
          <div className="confirmation-card">
            <div className="confirm-icon-circle">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }} data-i18n="modalConfirmTitle">
              {t.modalConfirmTitle}
            </h3>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }} id="modalConfirmMessage" data-i18n="modalConfirmSub">
              {t.modalConfirmSub}
            </p>

            <div className="confirm-details-box">
              <div className="row">
                <span data-i18n="confirmRefId">{t.confirmRefId}</span>
                <span id="modalRefId">{submittedReport?.refId || '#REP-2026-9184'}</span>
              </div>
              <div className="row">
                <span data-i18n="confirmStatus">{t.confirmStatus}</span>
                <span id="modalSyncStatus" style={{ color: '#059669' }}>{submittedReport?.status || 'Verified & Synced'}</span>
              </div>
              <div className="row">
                <span data-i18n="confirmLocation">{t.confirmLocation}</span>
                <span id="modalLocationVal">{submittedReport?.location || 'Shillong, East Khasi Hills'}</span>
              </div>
              <div className="row">
                <span data-i18n="confirmCategory">{t.confirmCategory}</span>
                <span id="modalCategoryVal">{submittedReport?.category || 'Ground / Wall Crack'}</span>
              </div>
            </div>

            <button
              className="modal-close-btn"
              id="modalCloseBtn"
              style={{ marginTop: '14px' }}
              onClick={() => setShowConfirmModal(false)}
              data-i18n="modalClose"
            >
              {t.modalClose}
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
           LOCATION / RISK ZONE SELECTOR MODAL
           ===================================================================== */}
      {showLocationModal && (
        <div className="modal-backdrop" id="locationModal" style={{ display: 'flex' }}>
          <div className="confirmation-card" style={{ maxWidth: '520px', textAlign: 'left', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>Select Monitored NER Area</h3>
              <button
                type="button"
                id="closeLocationModalBtn"
                onClick={() => setShowLocationModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Choose a sector to view live Earth Engine satellite analytics, weather radar alerts, and local risk level:
            </p>

            <div className="road-list" id="locationList" style={{ margin: '12px 0' }}>
              {LOCATIONS_DATA.map(loc => (
                <div
                  key={loc.name}
                  className="road-item"
                  onClick={() => handleSelectLocation(loc)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="road-item-top">
                    <span className="road-name">{loc.title}</span>
                    <span className={`road-badge ${loc.risk === 'danger' ? 'blocked' : (loc.risk === 'warning' ? 'at-risk' : 'open')}`}>
                      {loc.risk.toUpperCase()}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{loc.subtitle}</span>
                </div>
              ))}
            </div>

            <button
              className="modal-close-btn"
              id="btnAutoDetectLoc"
              onClick={handleDetectGPS}
              style={{ background: 'var(--bg-card-muted)', color: 'var(--text-primary)', border: '1px solid var(--border-light)', fontSize: '0.85rem', padding: '10px' }}
            >
              Detect Live GPS Location
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
           SAVED COMMUTE ROUTE MANAGER MODAL
           ===================================================================== */}
      {showRouteModal && (
        <div className="modal-backdrop" id="savedRouteModal" style={{ display: 'flex' }}>
          <div className="confirmation-card" style={{ maxWidth: '520px', textAlign: 'left', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>Manage Saved Commute Route</h3>
              <button
                type="button"
                id="closeRouteModalBtn"
                onClick={() => setShowRouteModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Choose your primary daily commute or travel corridor to receive proactive blockage alerts and alternate bypass recommendations:
            </p>

            <div className="road-list" id="savedRoutesSelectionList" style={{ margin: '12px 0' }}>
              {ROADS_DATA.map(road => {
                const isSaved = savedRouteIds.includes(road.id);
                return (
                  <div
                    key={road.id}
                    className="road-item"
                    onClick={() => handleToggleSaveRoute(road.id)}
                    style={{ cursor: 'pointer', borderLeft: isSaved ? '3px solid var(--primary)' : 'none' }}
                  >
                    <div className="road-item-top">
                      <span className="road-name">{road.name}</span>
                      <span className={`road-badge ${road.status.toLowerCase().replace('-', '')}`}>
                        {isSaved ? '✓ Saved' : '+ Track'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{road.description}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
           ROUTE DETAILS INTERACTIVE MODAL
           ===================================================================== */}
      {showRouteDetailsModal && modalActiveRoad && (
        <div className="modal-backdrop" id="routeDetailsModal" style={{ display: 'flex' }}>
          <div className="confirmation-card" style={{ maxWidth: '520px', textAlign: 'left', alignItems: 'stretch', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px' }}>
              <div>
                <span className="inspector-zone-type" id="modalRouteType">MONITORED CORRIDOR</span>
                <h3 id="modalRouteTitle" style={{ fontSize: '1.12rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{modalActiveRoad.name}</h3>
                <div id="modalRouteMeta" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" /><circle cx="12" cy="10" r="3" /></svg>
                  <span id="modalRouteMetaText">{modalActiveRoad.description}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`inspector-risk-badge ${modalActiveRoad.status.toLowerCase().replace('-', '')}`} id="modalRouteBadge">{modalActiveRoad.status.toUpperCase()}</span>
                <button
                  type="button"
                  id="closeRouteDetailsBtn"
                  onClick={() => setShowRouteDetailsModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Quick Status Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '14px 0' }}>
              <div style={{ background: 'var(--bg-card-muted)', padding: '10px 12px', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Transit Status</span>
                <div id="modalRouteTransit" style={{ fontSize: '0.88rem', fontWeight: 800, color: modalActiveRoad.status === 'Blocked' ? '#dc2626' : '#16a34a', marginTop: '2px' }}>
                  {modalActiveRoad.status === 'Blocked' ? 'Closed for Transit' : 'Open & Clear'}
                </div>
              </div>
              <div style={{ background: 'var(--bg-card-muted)', padding: '10px 12px', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Advisory</span>
                <div id="modalRouteAdvisory" style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {modalActiveRoad.alternateRoute ? `Use Bypass (${modalActiveRoad.alternateRoute.extraTime})` : 'Normal Transit'}
                </div>
              </div>
            </div>

            {/* Verified Description */}
            <div style={{ marginBottom: '14px' }}>
              <h5 style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Hazard Intelligence</h5>
              <p id="modalRouteDesc" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, background: '#ffffff', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                {modalActiveRoad.description}. Monitored continuously via satellite radar and traffic sensors.
              </p>
            </div>

            {/* Alternate Bypass Section */}
            {modalActiveRoad.alternateRoute && (
              <div id="modalRouteAltSection" style={{ marginBottom: '16px', background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', padding: '14px', borderRadius: '14px', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                    Recommended Bypass Route
                  </span>
                  <span className="alt-stat-pill safe" id="modalRouteAltStatus">Open</span>
                </div>
                <div id="modalRouteAltName" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{modalActiveRoad.alternateRoute.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }} id="modalRouteAltDetails">
                  {modalActiveRoad.alternateRoute.distance} • {modalActiveRoad.alternateRoute.extraTime} extra • {modalActiveRoad.alternateRoute.notes}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                className="btn-primary"
                id="btnModalInspectOnMap"
                style={{ flex: 1, padding: '10px', fontSize: '0.85rem', fontWeight: 700, borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onClick={() => {
                  setSelectedRoad(modalActiveRoad);
                  setShowRouteDetailsModal(false);
                  setActiveTab('map');
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
                <span>Inspect on Live Map</span>
              </button>
              <button
                type="button"
                className="btn-save-route-toggle"
                id="btnModalToggleSaveRoute"
                style={{ padding: '10px 16px', fontSize: '0.85rem', fontWeight: 700, borderRadius: '12px', border: '1px solid var(--border-light)', background: '#f8fafc', color: 'var(--text-primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => handleToggleSaveRoute(modalActiveRoad.id)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                <span id="btnModalToggleSaveText">{savedRouteIds.includes(modalActiveRoad.id) ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
           LIVE GEOTAG CAMERA MODAL
           ===================================================================== */}
      {showGeotagCamera && (
        <div className="modal-backdrop camera-modal-backdrop" id="geotagCameraModal" style={{ display: 'flex' }}>
          <div className="camera-modal-container">
            {/* Camera Top Bar */}
            <div className="camera-top-bar">
              <div className="camera-badge-row">
                <span className="cam-status-pill">
                  <span className="cam-record-dot"></span>
                  <span>GEOTAG CAMERA</span>
                </span>
                <span className="cam-gps-pill" id="camGpsStatus">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>
                  <span id="camGpsStatusText">GPS Fixed (±3m)</span>
                </span>
              </div>
              <button
                type="button"
                className="camera-close-btn"
                id="closeCameraModalBtn"
                onClick={handleCloseGeotagCam}
                aria-label="Close Camera"
              >
                &times;
              </button>
            </div>

            {/* Camera Viewfinder */}
            <div className="camera-viewfinder" id="cameraViewfinder">
              <video ref={videoRef} autoPlay playsInline muted id="cameraVideo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}></video>
              
              {/* Viewfinder Overlays */}
              <div className="viewfinder-grid">
                <div className="vf-corner tl"></div>
                <div className="vf-corner tr"></div>
                <div className="vf-corner bl"></div>
                <div className="vf-corner br"></div>
                <div className="vf-crosshair"></div>
              </div>

              {/* Live Geotag HUD Overlay */}
              <div className="viewfinder-hud">
                <div className="hud-top-meta">
                  <div className="hud-item">
                    <span className="hud-label">COORDINATES</span>
                    <span className="hud-val" id="camCoordinatesHud">25.5788° N, 91.8933° E</span>
                  </div>
                  <div className="hud-item">
                    <span className="hud-label">ELEVATION</span>
                    <span className="hud-val" id="camElevationHud">1,525 m AMSL</span>
                  </div>
                </div>
                <div className="hud-bottom-meta">
                  <div className="hud-item">
                    <span className="hud-label">DATE &amp; TIME</span>
                    <span className="hud-val" id="camTimestampHud">{new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString()} IST</span>
                  </div>
                  <div className="hud-watermark">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" /></svg>
                    <span>RESILIENTGUARD VERIFIED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Camera Controls Bar */}
            <div className="camera-controls-bar">
              <button type="button" className="cam-tool-btn" id="btnSwitchCamera" title="Switch Camera View">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 4v5h-.5a7 7 0 0 0-12 5.5M4 20v-5h.5a7 7 0 0 0 12-5.5" />
                </svg>
              </button>

              <button type="button" className="cam-shutter-btn" id="btnCaptureShutter" onClick={handleCaptureGeotag} title="Take Geotagged Photo">
                <div className="shutter-inner"></div>
              </button>

              <button
                type="button"
                className="cam-tool-btn"
                id="btnNativeCameraFallback"
                onClick={() => {
                  handleCloseGeotagCam();
                  document.getElementById('photoFileInput').click();
                }}
                title="Use Device Gallery"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
           ADMIN LIVE ALERT BROADCAST DISPATCHER MODAL
           ===================================================================== */}
      {showAdminBroadcastModal && (
        <div className="modal-backdrop admin-modal-backdrop" id="adminBroadcastModal" style={{ display: 'flex' }}>
          <div className="modal-card admin-broadcast-card">
            <div className="modal-header-row">
              <div className="modal-title-wrap">
                <div className="admin-modal-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <h3>Admin Emergency Live Broadcast Console</h3>
                  <p>Transmit instant high-priority disaster warnings to all citizen devices</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-icon-btn"
                id="closeAdminModalBtn"
                onClick={() => setShowAdminBroadcastModal(false)}
                aria-label="Close Admin Modal"
              >
                &times;
              </button>
            </div>

            <div className="admin-presets-section">
              <label className="form-label">Select Emergency Scenario Preset</label>
              <div className="preset-pill-grid">
                <button
                  type="button"
                  className={`preset-pill ${adminScenario === 'landslide' ? 'active' : ''}`}
                  onClick={() => {
                    setAdminScenario('landslide');
                    setAdminHeadline('CRITICAL LANDSLIDE & DEBRIS FLOW EVACUATION');
                    setAdminAdvisory('District Disaster Control has issued an immediate evacuation order for Shillong Ridge Slopes. Proceed to Shillong Polo Ground Camp #1.');
                    setAdminSeverity('danger');
                  }}
                >
                  Shillong Ridge Landslide &amp; Debris Flow
                </button>
                <button
                  type="button"
                  className={`preset-pill ${adminScenario === 'flood' ? 'active' : ''}`}
                  onClick={() => {
                    setAdminScenario('flood');
                    setAdminHeadline('WAH UMKHRAH FLASH FLOOD SURGE WARNING');
                    setAdminAdvisory('Water levels rising rapidly in low-lying riverside zones. Move immediately to designated high-ground shelters.');
                    setAdminSeverity('danger');
                  }}
                >
                  Wah Umkhrah Flash Flood Surge
                </button>
                <button
                  type="button"
                  className={`preset-pill ${adminScenario === 'mudflow' ? 'active' : ''}`}
                  onClick={() => {
                    setAdminScenario('mudflow');
                    setAdminHeadline('CHERRAPUNJI SOHRA GORGE CORRIDOR BLOCKADE');
                    setAdminAdvisory('Massive rockfall on Sohra Escarpment road. All commuter traffic diverted to Nohkalikai Ridge bypass.');
                    setAdminSeverity('warning');
                  }}
                >
                  Cherrapunji Sohra Gorge Blockade
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '14px' }}>
              <label className="form-label" htmlFor="adminAlertTitleInput">Alert Headline</label>
              <input
                type="text"
                className="text-input"
                id="adminAlertTitleInput"
                value={adminHeadline}
                onChange={(e) => setAdminHeadline(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-label" htmlFor="adminAlertDescInput">Citizen Action &amp; Evacuation Advisory</label>
              <textarea
                className="textarea-input"
                id="adminAlertDescInput"
                rows="3"
                value={adminAdvisory}
                onChange={(e) => setAdminAdvisory(e.target.value)}
              ></textarea>
            </div>

            <div className="form-row-dual" style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Alert Severity Level</label>
                <select
                  className="text-input"
                  id="adminAlertSeveritySelect"
                  value={adminSeverity}
                  onChange={(e) => setAdminSeverity(e.target.value)}
                >
                  <option value="danger">RED ALERT (Immediate Evacuation)</option>
                  <option value="warning">ORANGE WARNING (High Risk / Blockade)</option>
                  <option value="watch">YELLOW WATCH (Precautionary Advisory)</option>
                </select>
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Audio Siren Tone</label>
                  <button
                    type="button"
                    style={{
                      background: isTestingSiren ? '#dc2626' : '#e2e8f0',
                      color: isTestingSiren ? '#ffffff' : '#0f172a',
                      border: 'none',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleToggleSirenTest(adminSiren)}
                  >
                    {isTestingSiren ? '⏹️ Stop Tone' : '🔊 Preview Tone'}
                  </button>
                </div>
                <select
                  className="text-input"
                  id="adminAlertSirenSelect"
                  value={adminSiren}
                  onChange={(e) => {
                    const newTone = e.target.value;
                    setAdminSiren(newTone);
                    if (isTestingSiren) {
                      playAlarmSiren(newTone, 0.6);
                    }
                  }}
                >
                  <option value="eas">Dual-Tone EAS Siren Alarm (853 + 960 Hz)</option>
                  <option value="wail">High-Lo Evacuation Sweeping Wail</option>
                  <option value="yelp">Rapid Yelp Disaster Alarm</option>
                  <option value="hi-lo">European Hi-Lo Alternating Siren</option>
                  <option value="silent">Visual Only (No Siren)</option>
                </select>
              </div>
            </div>

            <div className="admin-modal-actions" style={{ marginTop: '18px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" id="btnCancelAdminModal" onClick={() => setShowAdminBroadcastModal(false)}>Cancel</button>
              <button
                type="button"
                className="btn-primary admin-broadcast-send-btn"
                id="btnDispatchLiveAlert"
                onClick={handleDispatchLiveAlert}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4.93 4.93a10 10 0 0 1 14.14 0" /><path d="M7.76 7.76a6 6 0 0 1 8.48 0" /><line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" /><line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" /></svg>
                <span>Transmit Live Alert</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
           POPUP MODAL: LIVE DISTRICT EMERGENCY BROADCAST ALERT (MINIMAL DESIGN)
           ========================================================================= */}
      {showEmergencyPopup && (
        <div className="emergency-popup-backdrop open" id="adminLiveAlertPopupModal" style={{ display: 'flex', zIndex: 99999 }}>
          <div
            className="emergency-popup-box emergency-box-blinking"
            role="alertdialog"
            aria-modal="true"
            style={{
              maxWidth: '590px',
              width: '95%',
              background: '#090d16',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderTop: '3px solid #ef4444',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.95), 0 0 30px rgba(239, 68, 68, 0.18)',
              padding: '24px 26px',
              color: '#ffffff'
            }}
          >
            {/* Top header bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#94a3b8',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  textTransform: 'uppercase'
                }}>
                  DISASTER AUTHORITY ALERT
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  background: emergencyAlertPayload?.severity === 'warning' ? '#d97706' : '#dc2626',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  textTransform: 'uppercase'
                }}>
                  {emergencyAlertPayload?.severity === 'warning' ? 'ORANGE WARNING' : 'RED ALERT'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  id="btnPopupSilenceAlarm"
                  title={isMuted ? 'Unmute Alarm Siren' : 'Mute Alarm Siren'}
                  onClick={handleToggleMute}
                  style={{
                    background: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                    border: isMuted ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                    color: isMuted ? '#fca5a5' : '#e2e8f0',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    height: '30px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    letterSpacing: '0.02em'
                  }}
                >
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>
                <button
                  type="button"
                  id="btnCloseEmergencyPopup"
                  aria-label="Close"
                  onClick={() => handleDismissEmergency()}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#94a3b8',
                    fontSize: '1.1rem',
                    width: '30px',
                    height: '30px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    lineHeight: 1
                  }}
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Timestamp */}
            <div style={{ color: '#f87171', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px', letterSpacing: '0.01em' }}>
              {emergencyAlertPayload?.timestamp && !emergencyAlertPayload.timestamp.includes('11:29')
                ? emergencyAlertPayload.timestamp
                : `Just now (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })})`} &bull; Issued by District Disaster Authority
            </div>

            {/* Headline (no emojis) */}
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.35, letterSpacing: '-0.01em', margin: '0 0 14px' }}>
              {(emergencyAlertPayload?.headline || `HIGH LANDSLIDE EVACUATION ALERT: ${selectedLocation.name.toUpperCase()}`).replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim()}
            </h2>

            {/* Description Card */}
            <div style={{
              background: '#111726',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderLeft: '3px solid #ef4444',
              borderRadius: '6px',
              padding: '12px 16px',
              marginBottom: '14px'
            }}>
              <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.88rem', lineHeight: 1.55 }}>
                {emergencyAlertPayload?.desc || emergencyAlertPayload?.description || 'Immediate evacuation advisory issued by District Disaster Control. Move to designated shelters immediately.'}
              </p>
            </div>

            {/* Two Direct Clickable Navigation Cards (Shelter & Corridor Bypass) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              {/* Left Clickable Card: Designated Relief Shelter */}
              <div
                role="button"
                tabIndex={0}
                id="btnPopupCardNavigateShelter"
                onClick={() => {
                  setActiveTab('map');
                  handleDismissEmergency(emergencyAlertPayload?.shelter || 'Shillong Municipal Relief Center #1');
                  setTimeout(() => {
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.setView([25.5840, 91.8950], 15);
                    }
                  }, 300);
                }}
                style={{
                  background: '#0d1a19',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#10b981';
                  e.currentTarget.style.background = '#102523';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                  e.currentTarget.style.background = '#0d1a19';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                    DESIGNATED RELIEF SHELTER
                  </span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 6px', borderRadius: '3px', textTransform: 'uppercase' }}>
                    ACTIVE SHELTER
                  </span>
                </div>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                  {emergencyAlertPayload?.shelter || (SHELTERS_DATA && SHELTERS_DATA[0] ? SHELTERS_DATA[0].name : 'Shillong Municipal Relief Center #1')}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  {emergencyAlertPayload?.shelterDetails || 'Govt College Campus • 1.1 km • Medical Aid Ready'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, marginTop: '6px', letterSpacing: '0.02em' }}>
                  Navigate to Shelter →
                </div>
              </div>

              {/* Right Clickable Card: Corridor Status Advisory */}
              <div
                role="button"
                tabIndex={0}
                id="btnPopupCardAlternateRoute"
                onClick={() => {
                  handleApplyAlternateRoute(selectedRoad || ROADS_DATA[0]);
                  handleDismissEmergency();
                }}
                style={{
                  background: '#1c1611',
                  border: '1px solid rgba(217, 119, 6, 0.4)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#f59e0b';
                  e.currentTarget.style.background = '#281e14';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(217, 119, 6, 0.4)';
                  e.currentTarget.style.background = '#1c1611';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                    CORRIDOR STATUS ADVISORY
                  </span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 6px', borderRadius: '3px', textTransform: 'uppercase' }}>
                    {emergencyAlertPayload?.corridorStatus || 'NH-7 BLOCKED'}
                  </span>
                </div>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                  {emergencyAlertPayload?.corridor || 'Upper Helang Bypass'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  {emergencyAlertPayload?.corridorDetails || 'Designated Transit Route • Km 42 Avoided • Open'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700, marginTop: '6px', letterSpacing: '0.02em' }}>
                  View Bypass Route →
                </div>
              </div>
            </div>

            {/* Noticeable & Professional Acknowledge & Accept Action (no icons/emojis) */}
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                id="btnPopupAcknowledgeAccept"
                onClick={() => handleDismissEmergency()}
                style={{
                  width: '100%',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#334155';
                  e.currentTarget.style.borderColor = '#64748b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#1e293b';
                  e.currentTarget.style.borderColor = '#475569';
                }}
              >
                Acknowledge &amp; Accept Advisory
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#64748b', letterSpacing: '0.01em' }}>
                Silences siren and logs citizen safety confirmation with Disaster Control
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Toast Notification element */}
      <div className={`toast-notification ${showToast ? 'show' : ''}`} id="appToast">
        {toastMessage}
      </div>

    </div>
  );
}
