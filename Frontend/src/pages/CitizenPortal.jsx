import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../styles/styles.css';
import { TRANSLATIONS, RISK_DATA, ROADS_DATA, LOCATIONS_DATA, SHELTERS_DATA, HEATMAP_CIRCLES } from '../utils/citizenData';
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
  const [reportLocationText, setReportLocationText] = useState('Shillong Urban Ridge, Meghalaya (Lat: 25.5788° N, Long: 91.8933° E)');
  const [isGeotagActive, setIsGeotagActive] = useState(true);
  const [geotagCoords, setGeotagCoords] = useState({ lat: 25.5788, lng: 91.8933 });
  const [reportDesc, setReportDesc] = useState('');
  const [reportPhotos, setReportPhotos] = useState([]);
  const [savedRouteIds, setSavedRouteIds] = useState(['shillong-corridor', 'cherrapunji-road']);
  const [allRoutesList, setAllRoutesList] = useState(ROADS_DATA);
  const [routeModalTab, setRouteModalTab] = useState('browse'); // 'browse', 'custom'
  const [customRouteName, setCustomRouteName] = useState('');
  const [customRouteOrigin, setCustomRouteOrigin] = useState('');
  const [customRouteDest, setCustomRouteDest] = useState('');
  const [customRouteNotes, setCustomRouteNotes] = useState('');
  
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
      showAppToast(`Playing ${tone ? tone.toUpperCase() : 'EAS'} siren tone... Click again to stop.`);
    }
  };

  // Camera video ref
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const riskInfo = RISK_DATA[currentRisk] || RISK_DATA.safe;

  // Realistic Basemap Layer State
  const [mapBasemap, setMapBasemap] = useState('topo'); // 'topo' | 'osm' | 'hot'

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const roadLayersRef = useRef({});
  const heatmapLayersRef = useRef([]);
  const altLayerRef = useRef(null);

  const handleSwitchBasemap = (mode) => {
    setMapBasemap(mode);
    if (mapInstanceRef.current) {
      ['topo-layer', 'osm-layer', 'hot-layer'].forEach(layerId => {
        if (mapInstanceRef.current.getLayer(layerId)) {
          mapInstanceRef.current.setLayoutProperty(
            layerId,
            'visibility',
            layerId.startsWith(mode) ? 'visible' : 'none'
          );
        }
      });
      showAppToast(`Basemap switched to ${mode === 'topo' ? '🏔️ Realistic Topo Relief' : (mode === 'osm' ? '🗺️ OpenStreetMap Streets' : '🚑 Disaster HOT')}`);
    }
  };

  // Localized getters for the Live Emergency Alert Popup Modal
  const getPopupHeadline = () => {
    if (lang === 'hi') {
      if (emergencyAlertPayload?.headlineHi) return emergencyAlertPayload.headlineHi;
      const raw = emergencyAlertPayload?.headline || '';
      const upper = raw.toUpperCase();
      if (upper.includes('CRITICAL FLASH FLOOD') || upper.includes('FLASH FLOOD')) {
        return 'अति गंभीर बाढ़ एवं भूस्खलन निकासी चेतावनी';
      }
      if (upper.includes('HIGH LANDSLIDE EVACUATION ALERT') || upper.includes('EVACUATION ALERT')) {
        const locName = selectedLocation.nameHi || selectedLocation.name;
        return `उच्च भूस्खलन निकासी चेतावनी: ${locName}`;
      }
      if (upper.includes('HIGH LANDSLIDE PROBABILITY') || upper.includes('SHILLONG RIDGE')) {
        return t.alert1Headline || 'भूस्खलन की अत्यधिक संभावना: शिलांग कटक ढलान';
      }
      if (upper.includes('GS ROAD CORRIDOR BLOCKAGE') || upper.includes('GS ROAD')) {
        return t.alert2Headline || 'जीएस रोड पर सड़क अवरुद्ध (शिलांग-गुवाहाटी लिंक)';
      }
      if (raw) {
        return raw.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
      }
      return `उच्च भूस्खलन निकासी चेतावनी: ${selectedLocation.nameHi || selectedLocation.name}`;
    }
    return (emergencyAlertPayload?.headline || `HIGH LANDSLIDE EVACUATION ALERT: ${selectedLocation.name.toUpperCase()}`).replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  };

  const getPopupDesc = () => {
    if (lang === 'hi') {
      if (emergencyAlertPayload?.descHi) return emergencyAlertPayload.descHi;
      const raw = emergencyAlertPayload?.desc || '';
      if (raw.includes('Immediate evacuation ordered') || raw.includes('Critical slope instability') || raw.includes('District Disaster Control advises')) {
        return 'गंभीर ढलान अस्थिरता और अत्यधिक वर्षा के कारण तत्काल निकासी का आदेश दिया गया है। कृपया तुरंत निकटतम सुरक्षित आश्रय की ओर बढ़ें।';
      }
      if (raw.includes('District Disaster Control has issued an immediate evacuation advisory for residents in low-lying')) {
        return 'जिला आपदा नियंत्रण ने निचले नदी तटीय क्षेत्रों और शिलांग कटक ढलानों के निवासियों के लिए तत्काल निकासी सलाह जारी की है। तुरंत सुरक्षित आश्रय में जाएं।';
      }
      if (raw.includes('Satellite InSAR ground analysis') || raw.includes('52 mm/h')) {
        return t.alert1Desc || 'लगातार बारिश के बाद उपग्रह इनसार विश्लेषण ने विस्थापन दर्ज किया। ढलान के निवासियों को राहत केंद्र जाने की सलाह दी जाती है।';
      }
      if (raw.includes('Slope debris and runoff have closed both lanes')) {
        return t.alert2Desc || 'मलबे और भू-कटाव के कारण मुख्य मार्ग बंद है। सड़क निकासी टीमें तैनात हैं।';
      }
      if (raw) return raw;
      return t.popupDefaultDesc || 'गंभीर ढलान अस्थिरता के कारण तत्काल निकासी का आदेश दिया गया है। कृपया तुरंत निकटतम सुरक्षित आश्रय की ओर बढ़ें।';
    }
    return emergencyAlertPayload?.desc || 'Immediate evacuation ordered due to severe slope instability. Proceed to the nearest safe shelter immediately.';
  };

  const getPopupShelterName = () => {
    if (lang === 'hi') {
      if (emergencyAlertPayload?.shelterHi) return emergencyAlertPayload.shelterHi;
      const s = emergencyAlertPayload?.shelter || (SHELTERS_DATA && SHELTERS_DATA[0] ? SHELTERS_DATA[0].name : '');
      if (s.includes('Shillong Municipal Relief Center') || s.includes('Shillong Relief Camp')) return 'शिलांग नगर राहत केंद्र #1';
      if (s.includes('Polo Ground')) return 'शिलांग पोलो ग्राउंड राहत केंद्र #1';
      if (s.includes('Mawlai')) return 'मावलाई उच्चतर माध्यमिक राहत क्षेत्र';
      if (s.includes('St. Anthony')) return 'सेंट एंथोनी राहत सुरक्षित क्षेत्र';
      return s || t.popupShelterDefault || 'शिलांग नगर राहत केंद्र #1';
    }
    return emergencyAlertPayload?.shelter || (SHELTERS_DATA && SHELTERS_DATA[0] ? SHELTERS_DATA[0].name : 'Shillong Relief Camp #1');
  };

  const getPopupShelterMeta = () => {
    if (lang === 'hi') {
      if (emergencyAlertPayload?.shelterDetailsHi) return emergencyAlertPayload.shelterDetailsHi;
      return t.popupShelterMeta || '1.1 किमी • चिकित्सा सहायता तैयार';
    }
    return emergencyAlertPayload?.shelterDetails || '1.1 km • Medical Ready';
  };

  const getPopupCorridorName = () => {
    if (lang === 'hi') {
      if (emergencyAlertPayload?.corridorHi) return emergencyAlertPayload.corridorHi;
      const c = emergencyAlertPayload?.corridor || 'Upper Helang Bypass';
      if (c.includes('Upper Helang')) return 'अपर हेलंग बाईपास';
      if (c.includes('Shillong Peak')) return 'शिलांग पीक लिंक बाईपास';
      if (c.includes('Nohkalikai')) return 'नोहकलिकाई कटक पारगमन मार्ग';
      if (c.includes('Valley Low')) return 'घाटी निचला बाईपास मार्ग';
      return c || t.popupRouteDefault || 'अपर हेलंग बाईपास';
    }
    return emergencyAlertPayload?.corridor || 'Upper Helang Bypass';
  };

  const getPopupCorridorMeta = () => {
    if (lang === 'hi') {
      if (emergencyAlertPayload?.corridorDetailsHi) return emergencyAlertPayload.corridorDetailsHi;
      if (emergencyAlertPayload?.corridorStatus) {
        return emergencyAlertPayload.corridorStatus.includes('BLOCKED') ? 'मार्ग खुला • NH-7 अवरुद्ध' : emergencyAlertPayload.corridorStatus;
      }
      return t.popupRouteMeta || 'मार्ग खुला • NH-7 अवरुद्ध';
    }
    return emergencyAlertPayload?.corridorDetails || (emergencyAlertPayload?.corridorStatus ? `Clear • ${emergencyAlertPayload.corridorStatus}` : 'Clear • NH-7 Blocked');
  };

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
    showAppToast(`INCOMING DISTRICT DISASTER ALERT: ${(data.headline || 'Evacuation Warning').replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim()}`);
    
    // Broadcast initial delivery status as unacknowledged / ringing
    broadcastCitizenStatus('Alert Delivered • Alarm Siren Ringing', 'unresponsive');
  };

  // Cleanup emergency audio when unmounting
  useEffect(() => {
    return () => {
      stopAllEmergencyAudio();
    };
  }, []);

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

    // Custom in-memory event listener (for same-window transitions)
    const handleCustomAlert = (e) => {
      if (e.detail) {
        handleIncomingAdminAlert(e.detail);
      }
    };
    window.addEventListener('resilientguard_alert_dispatched', handleCustomAlert);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('resilientguard_alert_dispatched', handleCustomAlert);
    };
  }, []);

  // Update selected location telemetry & risk level
  const handleSelectLocation = (loc) => {
    setSelectedLocation(loc);
    setCurrentRisk(loc.risk || 'safe');
    setReportLocationText(`${loc.name} (Lat: ${loc.lat.toFixed(4)}° N, Long: ${loc.lng.toFixed(4)}° E)`);
    setGeotagCoords({ lat: loc.lat, lng: loc.lng, accuracy: '±5m', locked: true });
    setIsGeotagActive(true);
    setShowLocationModal(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({ center: [loc.lng, loc.lat], zoom: 13, essential: true });
    }
    showAppToast(`Location updated: ${loc.name}`);
  };

  // Auto-detect GPS (Acquire real Latitude & Longitude and match nearest monitored region)
  const handleAutoDetectLocation = () => {
    showAppToast('Acquiring live GPS coordinates...');
    setIsGeotagActive(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          
          // Match closest sector
          let closest = LOCATIONS_DATA[0];
          let minDist = Infinity;
          LOCATIONS_DATA.forEach(loc => {
            const d = Math.hypot(loc.lat - lat, loc.lng - lng);
            if (d < minDist) {
              minDist = d;
              closest = loc;
            }
          });

          const detectedLoc = {
            ...closest,
            name: `${closest.name} (GPS Locked)`,
            lat: lat,
            lng: lng,
            isAutodetected: true
          };

          setSelectedLocation(detectedLoc);
          setCurrentRisk(closest.risk || 'safe');
          setReportLocationText(`${closest.name} (Lat: ${lat.toFixed(4)}° N, Long: ${lng.toFixed(4)}° E)`);
          setGeotagCoords({ lat, lng, accuracy: '±5m', locked: true });
          setShowLocationModal(false);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo({ center: [lng, lat], zoom: 14, essential: true });
          }
          showAppToast(`GPS Locked: Lat ${lat.toFixed(4)}° N, Long ${lng.toFixed(4)}° E (Nearest: ${closest.name})`);
        },
        () => {
          const defaultLoc = LOCATIONS_DATA[0];
          handleSelectLocation(defaultLoc);
          showAppToast(`GPS permission denied. Defaulted to ${defaultLoc.name}`);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      const defaultLoc = LOCATIONS_DATA[0];
      handleSelectLocation(defaultLoc);
      showAppToast(`GPS not supported by browser. Defaulted to ${defaultLoc.name}`);
    }
  };

  // Helper to generate GeoJSON circle polygon
  const createGeoJSONCircle = (centerLat, centerLng, radiusInMeters, points = 64) => {
    const km = radiusInMeters / 1000;
    const ret = [];
    const distanceX = km / (111.320 * Math.cos((centerLat * Math.PI) / 180));
    const distanceY = km / 110.574;

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      ret.push([centerLng + x, centerLat + y]);
    }
    ret.push(ret[0]);
    return ret;
  };

  // MapLibre GL 3D Map setup and lifecycle
  useEffect(() => {
    if (activeTab === 'map' && mapContainerRef.current) {
      if (!mapInstanceRef.current) {
        // Build GeoJSON features for danger zones
        const activeHeatmaps = HEATMAP_CIRCLES.filter(z => !z.locationId || z.locationId === selectedLocation.id);
        const circlesToRender = activeHeatmaps.length > 0 ? activeHeatmaps : HEATMAP_CIRCLES.slice(0, 2);

        const dangerFeatures = [];
        circlesToRender.forEach(zone => {
          const isCrit = zone.severity === 'critical';
          const outerRing = createGeoJSONCircle(zone.center[0], zone.center[1], zone.outerRadius || 1200);
          const innerRing = createGeoJSONCircle(zone.center[0], zone.center[1], zone.innerRadius || 650);

          dangerFeatures.push({
            type: 'Feature',
            properties: {
              id: `${zone.id}-halo`,
              name: zone.name,
              color: isCrit ? '#dc2626' : '#ea580c',
              fillColor: isCrit ? '#dc2626' : '#ea580c',
              fillOpacity: isCrit ? 0.32 : 0.26,
              riskScore: zone.riskScore,
              displacement: zone.displacement,
              saturation: zone.saturation,
              description: zone.description,
              isCore: false
            },
            geometry: { type: 'Polygon', coordinates: [outerRing] }
          });

          dangerFeatures.push({
            type: 'Feature',
            properties: {
              id: `${zone.id}-core`,
              name: zone.name,
              color: isCrit ? '#b91c1c' : '#c2410c',
              fillColor: isCrit ? '#ef4444' : '#f97316',
              fillOpacity: isCrit ? 0.65 : 0.55,
              riskScore: zone.riskScore,
              displacement: zone.displacement,
              saturation: zone.saturation,
              description: zone.description,
              isCore: true
            },
            geometry: { type: 'Polygon', coordinates: [innerRing] }
          });
        });

        // Build GeoJSON features for Road Corridors
        const roadFeatures = ROADS_DATA.map(road => ({
          type: 'Feature',
          properties: {
            id: road.id,
            name: road.name,
            status: road.status,
            statusText: road.statusText,
            color: road.status === 'Blocked' ? '#dc2626' : (road.status === 'At-Risk' ? '#ea580c' : '#16a34a'),
            isBlocked: road.status === 'Blocked'
          },
          geometry: {
            type: 'LineString',
            coordinates: road.coords.map(c => [c[1], c[0]])
          }
        }));

        const map = new maplibregl.Map({
          container: mapContainerRef.current,
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
              'osm-tiles': {
                type: 'raster',
                tiles: [
                  'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
                ],
                tileSize: 256,
                attribution: '&copy; OpenStreetMap contributors'
              },
              'hot-tiles': {
                type: 'raster',
                tiles: [
                  'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
                  'https://b.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
                ],
                tileSize: 256,
                attribution: '&copy; Humanitarian OpenStreetMap Team'
              },
              'danger-zones-source': {
                type: 'geojson',
                data: {
                  type: 'FeatureCollection',
                  features: dangerFeatures
                }
              },
              'roads-source': {
                type: 'geojson',
                data: {
                  type: 'FeatureCollection',
                  features: roadFeatures
                }
              },
              'alt-route-source': {
                type: 'geojson',
                data: {
                  type: 'FeatureCollection',
                  features: []
                }
              }
            },
            layers: [
              {
                id: 'topo-layer',
                type: 'raster',
                source: 'topo-tiles',
                layout: { visibility: 'visible' },
                minzoom: 0,
                maxzoom: 17
              },
              {
                id: 'osm-layer',
                type: 'raster',
                source: 'osm-tiles',
                layout: { visibility: 'none' },
                minzoom: 0,
                maxzoom: 19
              },
              {
                id: 'hot-layer',
                type: 'raster',
                source: 'hot-tiles',
                layout: { visibility: 'none' },
                minzoom: 0,
                maxzoom: 19
              },
              {
                id: 'danger-zones-fill',
                type: 'fill',
                source: 'danger-zones-source',
                paint: {
                  'fill-color': ['get', 'fillColor'],
                  'fill-opacity': ['get', 'fillOpacity']
                }
              },
              {
                id: 'danger-zones-outline',
                type: 'line',
                source: 'danger-zones-source',
                paint: {
                  'line-color': ['get', 'color'],
                  'line-width': ['case', ['get', 'isCore'], 3.5, 2],
                  'line-opacity': 0.95
                }
              },
              {
                id: 'roads-glow',
                type: 'line',
                source: 'roads-source',
                paint: {
                  'line-color': ['get', 'color'],
                  'line-width': 12,
                  'line-opacity': 0.35,
                  'line-blur': 3
                }
              },
              {
                id: 'roads-line',
                type: 'line',
                source: 'roads-source',
                paint: {
                  'line-color': ['get', 'color'],
                  'line-width': 5.5,
                  'line-opacity': 0.95
                }
              },
              {
                id: 'roads-line-dash',
                type: 'line',
                source: 'roads-source',
                filter: ['==', ['get', 'isBlocked'], true],
                paint: {
                  'line-color': '#ffffff',
                  'line-width': 2.5,
                  'line-dasharray': [2, 2]
                }
              },
              {
                id: 'alt-route-glow',
                type: 'line',
                source: 'alt-route-source',
                paint: {
                  'line-color': '#10b981',
                  'line-width': 14,
                  'line-opacity': 0.4,
                  'line-blur': 4
                }
              },
              {
                id: 'alt-route-line',
                type: 'line',
                source: 'alt-route-source',
                paint: {
                  'line-color': '#10b981',
                  'line-width': 6.5,
                  'line-opacity': 0.95
                }
              },
              {
                id: 'alt-route-dash',
                type: 'line',
                source: 'alt-route-source',
                paint: {
                  'line-color': '#ecfdf5',
                  'line-width': 3,
                  'line-dasharray': [2, 2]
                }
              }
            ]
          },
          center: [selectedLocation.lng, selectedLocation.lat],
          zoom: 13,
          pitch: 50, // 3D slope perspective
          bearing: 15,
          maxPitch: 85,
          attributionControl: false
        });

        map.on('load', () => {
          map.resize();
        });

        // Add Shelters as Markers
        SHELTERS_DATA.forEach(shelter => {
          const el = document.createElement('div');
          el.className = 'maplibre-shelter-marker';
          el.style.cssText = 'width: 28px; height: 28px; border-radius: 50%; background: #0284c7; border: 2.5px solid #ffffff; box-shadow: 0 3px 10px rgba(2,132,199,0.5); display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; font-weight: 800; font-size: 13px;';
          el.innerHTML = '🏠';

          const popup = new maplibregl.Popup({ offset: 15 }).setHTML(`
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.8rem; padding: 4px;">
              <strong style="color:#0284c7;">${shelter.name}</strong><br/>
              Occupancy: ${shelter.capacity}<br/>
              Supplies: ${shelter.supplies}
            </div>
          `);

          new maplibregl.Marker({ element: el })
            .setLngLat([shelter.lng, shelter.lat])
            .setPopup(popup)
            .addTo(map);
        });

        // Add Danger Zone Center Badges with Pulse Rings
        circlesToRender.forEach(zone => {
          const isCrit = zone.severity === 'critical';
          const badgeEl = document.createElement('div');
          badgeEl.className = `maplibre-danger-marker ${isCrit ? 'critical' : 'warning'}`;
          badgeEl.innerHTML = `
            <div class="danger-marker-pulse ${isCrit ? 'red-pulse' : 'orange-pulse'}"></div>
            <div class="danger-marker-pill ${isCrit ? 'red-pill' : 'orange-pill'}">
              <span>${isCrit ? '🔴' : '🟠'}</span>
              <span>${zone.name}</span>
              <span class="danger-marker-tag">${isCrit ? 'CRITICAL DANGER' : 'AT-RISK WARNING'}</span>
            </div>
          `;

          const popup = new maplibregl.Popup({ offset: 20 }).setHTML(`
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.82rem; padding: 6px; min-width: 230px;">
              <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                <span style="font-size:1.1rem;">${isCrit ? '🔴' : '🟠'}</span>
                <strong style="color: ${isCrit ? '#dc2626' : '#ea580c'}; font-size: 0.9rem;">${zone.name}</strong>
              </div>
              <div style="background: ${isCrit ? '#fef2f2' : '#fff7ed'}; border-radius: 6px; padding: 6px 8px; margin: 4px 0 8px; border-left: 3px solid ${isCrit ? '#dc2626' : '#ea580c'};">
                <div style="font-size: 0.76rem; font-weight:700; color: ${isCrit ? '#991b1b' : '#9a3412'};">Risk Score: ${zone.riskScore}</div>
                <div style="font-size: 0.74rem; color: #475569;">InSAR Shift: ${zone.displacement}</div>
                <div style="font-size: 0.74rem; color: #475569;">Soil Saturation: ${zone.saturation}</div>
              </div>
              <p style="margin: 0; font-size: 0.74rem; color: #64748b; line-height: 1.4;">
                ${zone.description}
              </p>
            </div>
          `);

          new maplibregl.Marker({ element: badgeEl })
            .setLngLat([zone.center[1], zone.center[0]])
            .setPopup(popup)
            .addTo(map);
        });

        // Click on Road lines for inspection popup
        map.on('click', 'roads-line', (e) => {
          if (!e.features || !e.features[0]) return;
          const feat = e.features[0];
          const matchedRoad = ROADS_DATA.find(r => r.id === feat.properties.id);
          if (matchedRoad) {
            setSelectedRoad(matchedRoad);
          }
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.82rem; padding: 4px;">
                <strong style="color:${feat.properties.color}; font-size:0.88rem;">${feat.properties.name}</strong><br/>
                <strong>Status:</strong> <span style="font-weight:700; color:${feat.properties.color};">${feat.properties.status}</span><br/>
                <span>${feat.properties.statusText || ''}</span>
              </div>
            `)
            .addTo(map);
        });

        // Cursor pointer on roads and zones
        map.on('mouseenter', 'roads-line', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'roads-line', () => { map.getCanvas().style.cursor = ''; });
        map.on('mouseenter', 'danger-zones-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'danger-zones-fill', () => { map.getCanvas().style.cursor = ''; });

        map.on('click', 'danger-zones-fill', (e) => {
          if (!e.features || !e.features[0]) return;
          const p = e.features[0].properties;
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.82rem; padding: 4px; min-width: 220px;">
                <strong style="color: ${p.color}; font-size: 0.88rem;">${p.name}</strong><br/>
                <div style="font-size: 0.75rem; margin-top:3px;"><strong>Risk Level:</strong> ${p.riskScore}</div>
                <div style="font-size: 0.75rem;"><strong>InSAR Velocity:</strong> ${p.displacement}</div>
                <div style="font-size: 0.75rem;"><strong>Soil Saturation:</strong> ${p.saturation}</div>
                <p style="margin: 5px 0 0; font-size: 0.73rem; color: #64748b; line-height: 1.4;">
                  ${p.description}
                </p>
              </div>
            `)
            .addTo(map);
        });

        mapInstanceRef.current = map;
      } else {
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.resize();
            mapInstanceRef.current.flyTo({ center: [selectedLocation.lng, selectedLocation.lat], zoom: 13 });
          }
        }, 100);
      }

      const timer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.resize();
        }
      }, 300);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [activeTab, selectedLocation]);

  // Apply alternate route on map with permanent bypass badge
  const handleApplyAlternateRoute = (road) => {
    if (!road || !road.alternateRoute) return;
    setActiveTab('map');
    setTimeout(() => {
      if (mapInstanceRef.current) {
        const altCoords = road.alternateRoute.coords.map(c => [c[1], c[0]]);
        const source = mapInstanceRef.current.getSource('alt-route-source');
        if (source) {
          source.setData({
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {
                  name: road.alternateRoute.name,
                  distance: road.alternateRoute.distance,
                  extraTime: road.alternateRoute.extraTime,
                  notes: road.alternateRoute.notes
                },
                geometry: {
                  type: 'LineString',
                  coordinates: altCoords
                }
              }
            ]
          });
        }

        // Compute bounding box and fit bounds
        const bounds = altCoords.reduce(
          (b, coord) => b.extend(coord),
          new maplibregl.LngLatBounds(altCoords[0], altCoords[0])
        );
        mapInstanceRef.current.fitBounds(bounds, { padding: 60, maxZoom: 15 });

        new maplibregl.Popup()
          .setLngLat(altCoords[Math.floor(altCoords.length / 2)])
          .setHTML(`
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.8rem; padding: 4px;">
              <strong style="color:#10b981;">Recommended Alternate Route: ${road.alternateRoute.name}</strong><br/>
              Distance: ${road.alternateRoute.distance} (${road.alternateRoute.extraTime})<br/>
              <em>${road.alternateRoute.notes}</em>
            </div>
          `)
          .addTo(mapInstanceRef.current);

        showAppToast(`Switched to alternate route: ${road.alternateRoute.name}`);
      }
    }, 200);
  };

  // Toggle saving road to saved commutes
  const handleToggleSaveRoute = (roadId) => {
    if (savedRouteIds.includes(roadId)) {
      setSavedRouteIds(prev => prev.filter(id => id !== roadId));
      showAppToast('Route removed from Tracked Commutes');
    } else {
      setSavedRouteIds(prev => [...prev, roadId]);
      showAppToast('Route added to Tracked Commutes');
    }
  };

  // Add custom user commute route
  const handleAddCustomRoute = (e) => {
    e.preventDefault();
    if (!customRouteName.trim()) {
      showAppToast('Please enter a Route / Highway Name');
      return;
    }
    const newId = `custom-route-${Date.now()}`;
    const newRoad = {
      id: newId,
      name: customRouteName.trim(),
      status: 'Open',
      badgeClass: 'open',
      transitStatus: 'Open & Clear',
      advisory: 'Monitored Commute Route',
      description: `${customRouteOrigin.trim() ? `${customRouteOrigin.trim()} → ` : ''}${customRouteDest.trim() || selectedLocation.name}${customRouteNotes.trim() ? ` • ${customRouteNotes.trim()}` : ' • Active Citizen Monitored Corridor'}`,
      locationMeta: `${selectedLocation.name} • Custom Route`,
      center: [selectedLocation.lat, selectedLocation.lng],
      coords: [
        [selectedLocation.lat - 0.007, selectedLocation.lng - 0.007],
        [selectedLocation.lat, selectedLocation.lng],
        [selectedLocation.lat + 0.007, selectedLocation.lng + 0.007]
      ],
      alternateRoute: null
    };

    setAllRoutesList(prev => [newRoad, ...prev]);
    setSavedRouteIds(prev => [newId, ...prev]);
    setShowRouteModal(false);
    setCustomRouteName('');
    setCustomRouteOrigin('');
    setCustomRouteDest('');
    setCustomRouteNotes('');
    setRouteModalTab('browse');
    showAppToast(`Added and tracking alerts for: ${newRoad.name}`);
  };

  // Detect GPS (Acquire Latitude & Longitude)
  const handleDetectGPS = () => {
    setIsGeotagActive(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setGeotagCoords({ lat, lng, accuracy: '±6m', locked: true });
          setReportLocationText(`${selectedLocation.name} (Lat: ${lat.toFixed(4)}° N, Long: ${lng.toFixed(4)}° E)`);
          showAppToast(`GPS Locked: Lat ${lat.toFixed(4)}° N, Long ${lng.toFixed(4)}° E`);
        },
        () => {
          const defaultLat = selectedLocation.lat || 25.5788;
          const defaultLng = selectedLocation.lng || 91.8933;
          setGeotagCoords({ lat: defaultLat, lng: defaultLng, accuracy: '±8m', locked: true });
          setReportLocationText(`${selectedLocation.name} (Lat: ${defaultLat.toFixed(4)}° N, Long: ${defaultLng.toFixed(4)}° E)`);
          showAppToast(`Locked Sector GPS: Lat ${defaultLat.toFixed(4)}° N, Long ${defaultLng.toFixed(4)}° E`);
        }
      );
    } else {
      const defaultLat = selectedLocation.lat || 25.5788;
      const defaultLng = selectedLocation.lng || 91.8933;
      setGeotagCoords({ lat: defaultLat, lng: defaultLng, accuracy: '±8m', locked: true });
      setReportLocationText(`${selectedLocation.name} (Lat: ${defaultLat.toFixed(4)}° N, Long: ${defaultLng.toFixed(4)}° E)`);
      showAppToast(`Locked Sector GPS: Lat ${defaultLat.toFixed(4)}° N, Long ${defaultLng.toFixed(4)}° E`);
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
    setIsGeotagActive(true);
    if (!geotagCoords) {
      setGeotagCoords({ lat: selectedLocation.lat || 25.5788, lng: selectedLocation.lng || 91.8933, accuracy: '±5m', locked: true });
    }
    handleCloseGeotagCam();
    showAppToast('Geotagged photo captured with GPS watermark & coordinates attached.');
  };

  // Submit report (Geotag is Optional)
  const handleReportSubmit = (e) => {
    e.preventDefault();
    const ref = `REP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const hasGeotag = isGeotagActive && geotagCoords !== null;
    const coordsText = hasGeotag
      ? `${geotagCoords.lat.toFixed(4)}° N, ${geotagCoords.lng.toFixed(4)}° E`
      : 'Location Name Only (No Geotag)';
    const locationDisplay = reportLocationText.trim() || selectedLocation.name;

    const newReport = {
      refId: ref,
      status: 'Verified & Synced',
      location: locationDisplay,
      hasGeotag: hasGeotag,
      coords: hasGeotag ? [geotagCoords.lat, geotagCoords.lng] : null,
      coordsText: coordsText,
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
          location: locationDisplay,
          hasGeotag: hasGeotag,
          coords: hasGeotag ? [geotagCoords.lat, geotagCoords.lng] : null,
          coordsText: coordsText,
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
      broadcastCitizenStatus('Alarm Siren Resumed by Citizen', 'unresponsive');
      playEmergencySequence(emergencyAlertPayload || { headline: adminHeadline, desc: adminAdvisory, siren: adminSiren });
      showAppToast('Alarm siren & voice advisory resumed.');
    } else {
      setIsMuted(true);
      stopAllEmergencyAudio();
      broadcastCitizenStatus('Alarm Silenced by Citizen (User Responsive)', 'acknowledged');
      showAppToast('Alarm siren & voice muted. Response logged with Disaster Control.');
    }
  };

  // Dismiss emergency popup
  const handleDismissEmergency = (shelter = null) => {
    stopAllEmergencyAudio();
    setShowEmergencyPopup(false);
    broadcastCitizenStatus('Alarm Turned Off & Evacuation Acknowledged', 'evacuating', shelter || 'Shillong Municipal Relief Center #1');
    showAppToast('Evacuation status acknowledged & synced with Disaster Control.');
  };

  return (
    <div className="app-container">
      {/* Brand Header — Exact Admin Style */}
      <header className="app-header">
        <div className="admin-brand-wrap">
          <div className="admin-shield-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="brand-title">ResilientGuard</span>
          <span className="admin-badge-role">{lang === 'hi' ? 'नागरिक सुरक्षा पोर्टल' : 'Citizen Safety Portal'}</span>
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
            <svg className="chevron-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
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
                    <div className="sub-loc" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span id="homeLocationSub">{selectedLocation.subtitle || 'Meghalaya • Live Feeds'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowLocationModal(true)}
                        style={{
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          borderRadius: '12px',
                          padding: '2px 9px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#dbeafe'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#eff6ff'; }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></svg>
                        <span>Auto-Detect / Change</span>
                      </button>
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

                  {/* Direct Emergency Evacuation Alert Trigger */}
                  <button
                    type="button"
                    id="btnHomeSoundEmergencyAlert"
                    onClick={() => {
                      unlockAudio();
                      const payload = liveAdminAlerts[0] || {
                        type: 'EMERGENCY_BROADCAST',
                        refId: '#ALERT-LIVE-EMERGENCY',
                        zoneName: selectedLocation.name,
                        headline: `HIGH LANDSLIDE EVACUATION ALERT: ${selectedLocation.name.toUpperCase()}`,
                        headlineHi: `उच्च भूस्खलन निकासी चेतावनी: ${(selectedLocation.nameHi || selectedLocation.name).toUpperCase()}`,
                        desc: `Critical slope instability, ground saturation, and heavy precipitation detected in ${selectedLocation.name}. District Disaster Control advises immediate evacuation to nearest safe shelter.`,
                        descHi: `गंभीर ढलान अस्थिरता, मिट्टी की नमी एवं अत्यधिक वर्षा दर्ज की गई है। आपदा नियंत्रण कक्ष तुरंत निकटतम सुरक्षित आश्रय में जाने की सलाह देता है।`,
                        severity: 'danger',
                        shelter: 'Shillong Municipal Relief Center #1',
                        shelterHi: 'शिलांग नगर राहत केंद्र #1',
                        shelterDetails: 'Govt College Campus • 1.1 km • Medical Aid Ready',
                        shelterDetailsHi: 'शासकीय कॉलेज परिसर • 1.1 किमी • चिकित्सा सहायता तैयार',
                        corridor: 'Upper Helang Bypass',
                        corridorHi: 'अपर हेलंग बाईपास',
                        corridorDetails: 'Designated Transit Route • Km 42 Avoided • Open',
                        corridorDetailsHi: 'निर्धारित पारगमन मार्ग • किमी 42 से बचाव • खुला',
                        corridorStatus: 'NH-7 BLOCKED',
                        corridorStatusHi: 'मार्ग खुला • NH-7 अवरुद्ध',
                        siren: 'eas',
                        timestamp: `Just now (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })})`
                      };
                      setEmergencyAlertPayload(payload);
                      setShowEmergencyPopup(true);
                      setIsMuted(false);
                      playEmergencySequence(payload);
                    }}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '13px 18px',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                      letterSpacing: '0.01em',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span>{lang === 'hi' ? 'आपातकालीन सायरन बजाएं एवं निर्देश देखें' : 'Sound Emergency Siren & View Evacuation Directive'}</span>
                  </button>

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
                  <span
                    className="status-indicator"
                    style={{ color: selectedLocation.telemetry?.rainfallColor || riskInfo.rainfallColor || riskInfo.color }}
                    id="telRainfallStat"
                  >
                    {selectedLocation.telemetry?.rainfallStat || riskInfo.rainfallStat}
                  </span>
                </div>

                <div className="telemetry-card">
                  <span className="label" data-i18n="telemetrySoil">{t.telemetrySoil}</span>
                  <span className="value" id="telSoil">{selectedLocation.telemetry?.soil || riskInfo.soil}</span>
                  <span
                    className="status-indicator"
                    style={{ color: selectedLocation.telemetry?.soilColor || riskInfo.soilColor || riskInfo.color }}
                    id="telSoilStat"
                  >
                    {selectedLocation.telemetry?.soilStat || riskInfo.soilStat}
                  </span>
                </div>

                <div className="telemetry-card">
                  <span className="label" data-i18n="telemetrySlope">{t.telemetrySlope}</span>
                  <span className="value" id="telSlope">{selectedLocation.telemetry?.slope || riskInfo.slope}</span>
                  <span
                    className="status-indicator"
                    style={{ color: selectedLocation.telemetry?.slopeColor || riskInfo.slopeColor || riskInfo.color }}
                    id="telSlopeStat"
                  >
                    {selectedLocation.telemetry?.slopeStat || riskInfo.slopeStat}
                  </span>
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

              {/* Top Left: Live Status & Basemap Layer Switcher */}
              <div className="map-top-left-controls">
                <div className="map-api-status-badge" id="mapApiStatusBadge">
                  <span className="api-status-pulse"></span>
                  <span className="api-status-text" id="mapApiStatusText">Live Telemetry Active</span>
                </div>

                <div className="map-basemap-switcher" id="mapBasemapSwitcher">
                  <button
                    type="button"
                    className={`basemap-switcher-btn ${mapBasemap === 'topo' ? 'active' : ''}`}
                    onClick={() => handleSwitchBasemap('topo')}
                    title="Realistic Topographic Mountain Elevation & Contour Relief"
                  >
                    🏔️ Realistic Topo
                  </button>
                  <button
                    type="button"
                    className={`basemap-switcher-btn ${mapBasemap === 'osm' ? 'active' : ''}`}
                    onClick={() => handleSwitchBasemap('osm')}
                    title="Standard OpenStreetMap Streets & Urban Grid"
                  >
                    🗺️ Streets
                  </button>
                  <button
                    type="button"
                    className={`basemap-switcher-btn ${mapBasemap === 'hot' ? 'active' : ''}`}
                    onClick={() => handleSwitchBasemap('hot')}
                    title="Humanitarian Disaster Response Mapping"
                  >
                    🚑 Disaster HOT
                  </button>
                </div>
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
                  id="btnMapToggle3D"
                  title="Toggle 3D Mountain Slope Perspective"
                  onClick={() => {
                    if (mapInstanceRef.current) {
                      const currentPitch = mapInstanceRef.current.getPitch();
                      mapInstanceRef.current.easeTo({
                        pitch: currentPitch > 20 ? 0 : 60,
                        duration: 800
                      });
                      showAppToast(currentPitch > 20 ? 'Switched to 2D Plan View' : 'Switched to 3D Mountain Slope Perspective');
                    }
                  }}
                >
                  🏔️
                </button>
                <button
                  type="button"
                  className="map-tool-btn"
                  id="btnMapRecenter"
                  title="Recenter on Selected Zone"
                  onClick={() => mapInstanceRef.current && mapInstanceRef.current.flyTo({ center: [selectedLocation.lng, selectedLocation.lat], zoom: 13, pitch: 50 })}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M12 3v18" /></svg>
                </button>
              </div>

              {/* Bottom Left: Corridor Status Legend & Hint */}
              <div className="map-bottom-left-overlay">
                <div className="map-legend-pill">
                  <div className="legend-chip" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
                    <span className="legend-dot" style={{ background: '#dc2626' }}></span>
                    <span style={{ fontWeight: 800, color: '#dc2626' }}>Red:</span> Blocked
                  </div>
                  <div className="legend-chip" style={{ background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
                    <span className="legend-dot" style={{ background: '#ea580c' }}></span>
                    <span style={{ fontWeight: 800, color: '#ea580c' }}>Orange:</span> At-Risk
                  </div>
                  <div className="legend-chip" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
                    <span className="legend-dot" style={{ background: '#16a34a' }}></span>
                    <span style={{ fontWeight: 800, color: '#16a34a' }}>Green:</span> Safe
                  </div>
                  <div className="legend-chip" style={{ background: '#f0f9ff', color: '#075985', border: '1px solid #bae6fd', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
                    <span className="legend-dot" style={{ background: '#0284c7' }}></span>
                    <span style={{ fontWeight: 800, color: '#0284c7' }}>Blue:</span> Shelter
                  </div>
                </div>

                <div className="map-inspect-hint">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                  <span>Click any corridor to inspect road &amp; alternate bypass</span>
                </div>
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
                      <span>{selectedRoad.locationMeta || selectedRoad.name}</span>
                    </div>
                  </div>

                  {/* Simple Citizen Summary Pills */}
                  <div className="inspector-stat-row" id="inspectorStatRow">
                    <div className="inspector-stat-pill">
                      <span className="inspector-stat-label">Road Status</span>
                      <span className="inspector-stat-val" style={{ color: selectedRoad.status === 'Blocked' ? '#dc2626' : '#16a34a', fontWeight: 800, fontSize: '0.84rem' }} id="inspectorValTransit">
                        {selectedRoad.status === 'Blocked' ? 'Closed for Transit' : 'Open & Clear'}
                      </span>
                    </div>
                    <div className="inspector-stat-pill">
                      <span className="inspector-stat-label">Advisory</span>
                      <span className="inspector-stat-val" style={{ fontWeight: 800, fontSize: '0.84rem' }} id="inspectorValAdvisory">
                        {selectedRoad.alternateRoute ? `Use Bypass (${selectedRoad.alternateRoute.extraTime})` : 'Clear Corridor'}
                      </span>
                    </div>
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
                  <div className="inspector-action-bar" style={{ padding: '10px 14px', background: '#ffffff', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-save-route-toggle"
                      id="btnSaveCorridorRoute"
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '9px 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', border: '1px solid var(--border-light)', background: '#f8fafc', color: 'var(--text-primary)' }}
                      onClick={() => handleToggleSaveRoute(selectedRoad.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                      <span id="btnSaveCorridorRouteText">{savedRouteIds.includes(selectedRoad.id) ? 'Saved in Commutes' : 'Save to My Commutes'}</span>
                    </button>
                  </div>
                </div>

                {/* Corridor Places Quick Selector Chips (Placed at the END) */}
                <div style={{ marginTop: '16px', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                      Select Monitored Corridor
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '2px 7px', borderRadius: '10px' }}>
                      {ROADS_DATA.length} corridors
                    </span>
                  </div>
                  <div className="inspector-route-selector-chips" title="Switch corridor to inspect">
                    {ROADS_DATA.map(road => {
                      const isSel = selectedRoad.id === road.id;
                      const isBlk = road.status === 'Blocked';
                      const isRisk = road.status === 'At-Risk';
                      const chipType = isBlk ? 'blocked' : (isRisk ? 'at-risk' : 'open');
                      return (
                        <button
                          key={road.id}
                          type="button"
                          className={`route-chip-btn ${isSel ? 'active' : ''} ${chipType}`}
                          onClick={() => {
                            setSelectedRoad(road);
                            if (mapInstanceRef.current) {
                              const source = mapInstanceRef.current.getSource('alt-route-source');
                              if (source) {
                                source.setData({ type: 'FeatureCollection', features: [] });
                              }
                              if (road.center) {
                                mapInstanceRef.current.flyTo({ center: [road.center[1], road.center[0]], zoom: 13, essential: true });
                              }
                            }
                          }}
                        >
                          <span className="route-chip-dot"></span>
                          <span className="route-chip-name">{road.name.split(' (')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

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

            {/* Filter Pills & Add Route Action Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
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
                  Tracked Routes ({savedRouteIds.length})
                </button>
              </div>

              {alertFilter === 'route' && (
                <button
                  type="button"
                  className="btn-add-route-alert"
                  id="btnAddAlertRoute"
                  onClick={() => {
                    setRouteModalTab('browse');
                    setShowRouteModal(true);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '9999px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>+ Add / Track More Routes</span>
                </button>
              )}
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
                    <span className="alert-scope-tag" style={{ color: '#dc2626', fontWeight: 800 }}>LIVE DISTRICT BROADCAST</span>
                    <span className="alert-time">{alert.timestamp || 'Just now'} • HIGH PRIORITY</span>
                  </div>
                  <h3 className="alert-headline" style={{ color: '#991b1b', marginTop: '4px' }}>{alert.headline}</h3>
                  <p className="alert-description" style={{ margin: '6px 0 10px' }}>{alert.desc}</p>
                  <div className="alert-actions-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="action-link-btn"
                      onClick={() => setActiveTab('map')}
                      style={{ background: 'var(--bg-card)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-light)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      View Threat Map →
                    </button>
                    <button
                      type="button"
                      className="action-link-btn"
                      onClick={() => {
                        unlockAudio();
                        setEmergencyAlertPayload(alert);
                        setShowEmergencyPopup(true);
                        setIsMuted(false);
                        playEmergencySequence(alert);
                      }}
                      style={{ background: '#dc2626', color: '#fff', padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                      <span>{lang === 'hi' ? 'निकासी निर्देश पुनः खोलें एवं सायरन बजाएं' : 'Re-open Evacuation Directive & Sound Siren'}</span>
                    </button>
                  </div>
                </article>
              ))}

              {/* Alert 1: Area Threat Risk (Shown on All & Area) */}
              {(alertFilter === 'all' || alertFilter === 'area') && (
                <article className="alert-card danger" data-category="area" style={{ borderLeft: '4px solid #dc2626' }}>
                  <div className="alert-top">
                    <span className="alert-scope-tag" style={{ color: '#dc2626', fontWeight: 800 }} data-i18n="alertScopeArea">{t.alertScopeArea}</span>
                    <span className="alert-time">{lang === 'hi' ? '14 मिनट पहले जारी • सक्रिय' : 'Issued 14 min ago • Active now'}</span>
                  </div>
                  <h3 className="alert-headline" style={{ marginTop: '4px' }} data-i18n="alert1Headline">{t.alert1Headline}</h3>
                  <p className="alert-description" style={{ margin: '6px 0 10px' }} data-i18n="alert1Desc">
                    {t.alert1Desc}
                  </p>
                  
                  <div className="alert-actions-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '2px', marginBottom: '4px' }}>
                    <button
                      type="button"
                      className="action-link-btn"
                      onClick={() => {
                        unlockAudio();
                        const payload = {
                          type: 'EMERGENCY_BROADCAST',
                          refId: '#ALERT-AREA-1',
                          zoneName: selectedLocation.name,
                          headline: t.alert1Headline,
                          headlineHi: 'भूस्खलन की अत्यधिक संभावना: शिलांग कटक ढलान',
                          desc: t.alert1Desc,
                          descHi: 'लगातार 52 मिमी/घंटा बारिश के बाद उपग्रह इनसार विश्लेषण ने विस्थापन दर्ज किया। ढलान के निवासियों को राहत केंद्र जाने की सलाह दी जाती है।',
                          severity: 'danger',
                          shelter: 'Shillong Municipal Relief Center #1',
                          shelterHi: 'शिलांग नगर राहत केंद्र #1',
                          shelterDetails: 'Govt College Campus • 1.1 km • Medical Aid Ready',
                          shelterDetailsHi: 'शासकीय कॉलेज परिसर • 1.1 किमी • चिकित्सा सहायता तैयार',
                          corridor: 'Upper Helang Bypass',
                          corridorHi: 'अपर हेलंग बाईपास',
                          corridorDetails: 'Designated Transit Route • Km 42 Avoided • Open',
                          corridorDetailsHi: 'निर्धारित पारगमन मार्ग • किमी 42 से बचाव • खुला',
                          corridorStatus: 'NH-7 BLOCKED',
                          corridorStatusHi: 'मार्ग खुला • NH-7 अवरुद्ध',
                          siren: 'eas',
                          timestamp: lang === 'hi' ? '14 मिनट पहले जारी (सक्रिय निर्देश)' : 'Issued 14 min ago (Active Directive)'
                        };
                        setEmergencyAlertPayload(payload);
                        setShowEmergencyPopup(true);
                        setIsMuted(false);
                        playEmergencySequence(payload);
                      }}
                      style={{ background: '#dc2626', color: '#fff', padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                      <span>{lang === 'hi' ? 'निकासी सायरन बजाएं एवं निर्देश देखें' : 'Sound Evacuation Siren & View Directive'}</span>
                    </button>
                    <button
                      type="button"
                      className="action-link-btn"
                      onClick={() => setActiveTab('map')}
                      style={{ background: '#f8fafc', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 700 }}
                    >
                      {lang === 'hi' ? 'निकासी मानचित्र देखें →' : 'View Evacuation Map →'}
                    </button>
                  </div>

                  <div className="data-source-line" data-i18n="dataSourceLine1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                    <span>{t.dataSourceLine1}</span>
                  </div>
                </article>
              )}

              {/* General Route Closure on All Alerts view */}
              {alertFilter === 'all' && (
                <article className="alert-card warning" data-category="route">
                  <div className="alert-top">
                    <span className="alert-scope-tag" style={{ color: '#ea580c' }} data-i18n="alertScopeRoute">{t.alertScopeRoute}</span>
                    <span className="alert-time">Issued 28 min ago • Clearance ongoing</span>
                  </div>
                  <h3 className="alert-headline" data-i18n="alert2Headline">{t.alert2Headline}</h3>
                  <p className="alert-description" data-i18n="alert2Desc">
                    {t.alert2Desc}
                  </p>
                  <div className="alternate-road-card">
                    <div className="alternate-meta">
                      <h4 data-i18n="alternateAvailableHeader">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                        <span>{t.alternateAvailableHeader}</span>
                      </h4>
                      <p data-i18n="alternateRouteSub">{t.alternateRouteSub}</p>
                    </div>
                    <button
                      type="button"
                      className="switch-route-btn"
                      id="btnSwitchRoute"
                      onClick={() => handleApplyAlternateRoute(ROADS_DATA[0])}
                      data-i18n="applyAlternateRoute"
                    >
                      {t.applyAlternateRoute}
                    </button>
                  </div>
                </article>
              )}

              {/* Dynamic Tracked Commute Route Alerts (Shown ONLY when alertFilter === 'route') */}
              {alertFilter === 'route' && (
                allRoutesList.filter(r => savedRouteIds.includes(r.id)).map(road => {
                  const isBlk = road.status === 'Blocked';
                  const isRisk = road.status === 'At-Risk';
                  const cardSev = isBlk ? 'warning' : (isRisk ? 'warning' : 'safe');
                  const statusColor = isBlk ? '#dc2626' : (isRisk ? '#ea580c' : '#16a34a');

                  return (
                    <article key={road.id} className={`alert-card ${cardSev}`} data-category="route" style={{ borderLeft: `4px solid ${statusColor}` }}>
                      <div className="alert-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="alert-scope-tag" style={{ color: statusColor, fontWeight: 800 }}>
                            TRACKED ROUTE: {road.name}
                          </span>
                          <span className={`road-badge ${isBlk ? 'blocked' : (isRisk ? 'at-risk' : 'open')}`}>
                            {road.status.toUpperCase()}
                          </span>
                        </div>
                        <span className="alert-time">Live Telemetry Synchronized</span>
                      </div>

                      <h3 className="alert-headline" style={{ marginTop: '4px' }}>
                        {isBlk ? `Road Blockage Detected: ${road.name}` : (isRisk ? `Slope Warning Advisory: ${road.name}` : `Corridor Clear: ${road.name}`)}
                      </h3>
                      
                      <p className="alert-description">
                        {road.description}
                      </p>

                      {/* Alternate Route Box if available */}
                      {road.alternateRoute && (
                        <div className="alternate-road-card">
                          <div className="alternate-meta">
                            <h4 data-i18n="alternateAvailableHeader">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                              <span>Recommended Bypass: {road.alternateRoute.name}</span>
                            </h4>
                            <p>{road.alternateRoute.notes} ({road.alternateRoute.extraTime} • {road.alternateRoute.distance})</p>
                          </div>
                          <button
                            type="button"
                            className="switch-route-btn"
                            onClick={() => handleApplyAlternateRoute(road)}
                          >
                            Use Alternate Route →
                          </button>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap', gap: '8px' }}>
                        <div className="data-source-line">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          </svg>
                          <span>Highway Sensors + Satellite Landslide Feeds</span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRoad(road);
                              setActiveTab('map');
                            }}
                            style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}
                          >
                            Inspect on Map →
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleSaveRoute(road.id)}
                            style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.74rem', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Untrack
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}

              {/* Quick Prompt Card to Track More Routes (Shown ONLY on Tracked Routes tab) */}
              {alertFilter === 'route' && (
                <div
                  onClick={() => {
                    setRouteModalTab('browse');
                    setShowRouteModal(true);
                  }}
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.background = '#f0f9ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.background = '#f8fafc';
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', marginBottom: '8px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </div>
                  <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#1e3a8a', margin: '0 0 4px 0' }}>+ Add or Track Another Route</h4>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>Add your office commute, school road, or highway link to receive instant alerts and landslide bypass suggestions.</p>
                </div>
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

              {/* Step 1: Geotag Photo (Optional on top) */}
              <div className="form-section">
                <label className="form-label">
                  <span>Geotag Photo</span>
                  <span className="optional" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Optional</span>
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
                      <h5>Direct Photo Upload</h5>
                      <p>Select photos from device gallery / storage</p>
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
                      <span className="pulse-dot"></span> Optional GPS Stamp
                    </div>
                    <div className="photo-card-icon cam-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    </div>
                    <div className="photo-card-info">
                      <h5>Open Geotag Camera</h5>
                      <p>Capture photo with real-time GPS &amp; watermark</p>
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

              {/* Step 2: Location (Mandatory - Clicking it acquires Latitude & Longitude) */}
              <div className="form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    <span>Hazard Location</span>
                  </label>
                  <span style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.74rem' }}>Mandatory *</span>
                </div>

                <div className="location-input-group" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="text-input"
                    id="reportLocationInput"
                    value={reportLocationText}
                    onChange={(e) => setReportLocationText(e.target.value)}
                    placeholder="Auto-detect GPS or select from monitored sectors..."
                    style={{ flex: '1 1 240px' }}
                    required
                  />
                  <button
                    type="button"
                    className="auto-loc-btn"
                    id="btnRefreshGPS"
                    onClick={handleAutoDetectLocation}
                    title="Auto-detect current GPS latitude & longitude"
                    style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                    </svg>
                    <span>Auto-Detect GPS</span>
                  </button>
                  <button
                    type="button"
                    className="auto-loc-btn"
                    id="btnSelectSectorOption"
                    onClick={() => setShowLocationModal(true)}
                    title="Select from list of monitored sectors"
                    style={{ background: '#f1f5f9', color: 'var(--text-primary)', border: '1px solid var(--border-light)', padding: '8px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  >
                    <span>Choose Sector</span>
                  </button>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Use auto-detect for instant GPS locking, or choose a monitored sector from the options.
                </div>
              </div>

              {/* Step 3: Select Type of Issue Category (Mandatory) */}
              <div className="form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    <span>Select Type of Issue</span>
                  </label>
                  <span style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.74rem' }}>Mandatory *</span>
                </div>
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

              {/* Step 4: Additional Remarks / Text Message (Optional) */}
              <div className="form-section">
                <label className="form-label">
                  <span>Additional Remarks / Message</span>
                  <span className="optional" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Optional</span>
                </label>
                <textarea
                  className="textarea-input"
                  id="reportDescInput"
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Describe extent of hazard, visible land movement, or safety concerns (optional)..."
                  rows="3"
                ></textarea>
              </div>

              {/* Step 5: Submit or Complain */}
              <button type="submit" className="submit-btn" id="submitReportBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                <span id="submitBtnText">Submit Hazard Report</span>
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
                <span>Geotag / GPS:</span>
                <span style={{ fontWeight: 700, color: submittedReport?.hasGeotag ? '#059669' : '#64748b' }}>
                  {submittedReport?.hasGeotag ? `Attached (${submittedReport?.coordsText})` : 'None (Location Name Only)'}
                </span>
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
          <div className="confirmation-card" style={{ maxWidth: '540px', textAlign: 'left', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Location &amp; Sector Settings</h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Auto-detect live coordinates or select a monitored regional sector</span>
              </div>
              <button
                type="button"
                id="closeLocationModalBtn"
                onClick={() => setShowLocationModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>

            {/* Option 1: Auto-Detect GPS Card */}
            <div
              className="location-autodetect-card"
              id="btnAutoDetectGPSCard"
              onClick={handleAutoDetectLocation}
              style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '1.5px solid #3b82f6',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                marginTop: '14px',
                marginBottom: '14px',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.12)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.12)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1e3a8a' }}>Auto-Detect My GPS Location</div>
                  <div style={{ fontSize: '0.74rem', color: '#3b82f6' }}>Locks device GPS &amp; matches nearest early warning radar</div>
                </div>
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1d4ed8', background: '#ffffff', padding: '6px 14px', borderRadius: '20px', border: '1px solid #bfdbfe', whiteSpace: 'nowrap' }}>
                Use GPS →
              </span>
            </div>

            {/* Option 2: Select from Options */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                  Or Select Monitored Sector ({LOCATIONS_DATA.length})
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click to switch</span>
              </div>

              <div className="road-list" id="locationList" style={{ maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                {LOCATIONS_DATA.map(loc => {
                  const isSelected = selectedLocation.id === loc.id || selectedLocation.name.startsWith(loc.name.split(',')[0]);
                  return (
                    <div
                      key={loc.name}
                      className={`road-item ${isSelected ? 'active-selected' : ''}`}
                      onClick={() => handleSelectLocation(loc)}
                      style={{ cursor: 'pointer', border: isSelected ? '1.5px solid var(--primary)' : undefined, background: isSelected ? '#f0fdf4' : undefined }}
                    >
                      <div className="road-item-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="road-name">{loc.title}</span>
                          {isSelected && (
                            <span style={{ fontSize: '0.62rem', fontWeight: 800, background: '#059669', color: '#fff', padding: '1px 6px', borderRadius: '10px' }}>
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span className={`road-badge ${loc.risk === 'danger' ? 'blocked' : (loc.risk === 'warning' ? 'at-risk' : 'open')}`}>
                          {loc.risk.toUpperCase()}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{loc.subtitle}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =====================================================================
           SAVED COMMUTE ROUTE MANAGER MODAL
           ===================================================================== */}
      {/* =====================================================================
           SAVED COMMUTE ROUTE MANAGER MODAL (WITH ADD CUSTOM ROUTE)
           ===================================================================== */}
      {showRouteModal && (
        <div className="modal-backdrop" id="savedRouteModal" style={{ display: 'flex' }}>
          <div className="confirmation-card" style={{ maxWidth: '540px', textAlign: 'left', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>Manage Tracked Commute Routes</h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Get instant blockage &amp; landslide evacuation alerts for your daily roads</span>
              </div>
              <button
                type="button"
                id="closeRouteModalBtn"
                onClick={() => setShowRouteModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', gap: '8px', margin: '12px 0 8px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
              <button
                type="button"
                className={`filter-pill ${routeModalTab === 'browse' ? 'active' : ''}`}
                onClick={() => setRouteModalTab('browse')}
                style={{ flex: 1, padding: '7px 12px', fontSize: '0.78rem', borderRadius: '6px' }}
              >
                Browse Corridors ({allRoutesList.length})
              </button>
              <button
                type="button"
                className={`filter-pill ${routeModalTab === 'custom' ? 'active' : ''}`}
                onClick={() => setRouteModalTab('custom')}
                style={{ flex: 1, padding: '7px 12px', fontSize: '0.78rem', borderRadius: '6px' }}
              >
                + Add Custom Route
              </button>
            </div>

            {routeModalTab === 'browse' ? (
              <>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 8px' }}>
                  Select any corridor below to add or remove it from your active real-time alert notifications:
                </p>

                <div className="road-list" id="savedRoutesSelectionList" style={{ maxHeight: '280px', overflowY: 'auto', margin: '6px 0 12px' }}>
                  {allRoutesList.map(road => {
                    const isSaved = savedRouteIds.includes(road.id);
                    return (
                      <div
                        key={road.id}
                        className="road-item"
                        onClick={() => handleToggleSaveRoute(road.id)}
                        style={{ cursor: 'pointer', borderLeft: isSaved ? '3px solid #1e3a8a' : '3px solid transparent', background: isSaved ? '#f8fafc' : '#ffffff' }}
                      >
                        <div className="road-item-top">
                          <span className="road-name" style={{ fontWeight: 800 }}>{road.name}</span>
                          <span className={`road-badge ${isSaved ? 'open' : 'blocked'}`} style={{ background: isSaved ? '#eff6ff' : '#f1f5f9', color: isSaved ? '#1e40af' : '#64748b', borderColor: isSaved ? '#bfdbfe' : '#e2e8f0' }}>
                            {isSaved ? '✓ Tracking Alerts' : '+ Click to Track'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{road.description}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={() => setRouteModalTab('custom')}
                    style={{ background: '#f8fafc', color: '#1e293b', border: '1.5px dashed #cbd5e1', fontSize: '0.82rem', padding: '9px 14px' }}
                  >
                    + Add New Custom Route
                  </button>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={() => setShowRouteModal(false)}
                    style={{ flex: 1, background: '#1e293b', color: '#ffffff', fontSize: '0.82rem', padding: '9px 14px' }}
                  >
                    Done ({savedRouteIds.length} Tracked)
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleAddCustomRoute} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  Enter details for your daily travel route or commute corridor to monitor sensor radar &amp; blockage feeds:
                </p>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '3px' }}>
                    <span>Route / Highway Name *</span>
                  </label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="e.g. Shillong to Jowai Highway (NH-44)"
                    value={customRouteName}
                    onChange={(e) => setCustomRouteName(e.target.value)}
                    required
                    style={{ fontSize: '0.84rem', padding: '8px 12px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '3px' }}>
                      <span>Start / Origin</span>
                    </label>
                    <input
                      type="text"
                      className="text-input"
                      placeholder="e.g. Police Bazar"
                      value={customRouteOrigin}
                      onChange={(e) => setCustomRouteOrigin(e.target.value)}
                      style={{ fontSize: '0.84rem', padding: '8px 12px' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '3px' }}>
                      <span>Destination</span>
                    </label>
                    <input
                      type="text"
                      className="text-input"
                      placeholder="e.g. Jowai Junction"
                      value={customRouteDest}
                      onChange={(e) => setCustomRouteDest(e.target.value)}
                      style={{ fontSize: '0.84rem', padding: '8px 12px' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '3px' }}>
                    <span>Commute Notes / Landmark</span>
                    <span className="optional" style={{ color: '#94a3b8' }}>Optional</span>
                  </label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="e.g. Monitored daily for landslide roadcuts"
                    value={customRouteNotes}
                    onChange={(e) => setCustomRouteNotes(e.target.value)}
                    style={{ fontSize: '0.84rem', padding: '8px 12px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={() => setRouteModalTab('browse')}
                    style={{ background: '#f8fafc', color: '#64748b', border: '1px solid var(--border-light)', fontSize: '0.82rem', padding: '9px 14px' }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="modal-close-btn"
                    style={{ flex: 1, background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', color: '#ffffff', fontSize: '0.84rem', fontWeight: 800, padding: '9px 14px' }}
                  >
                    Save &amp; Track This Route
                  </button>
                </div>
              </form>
            )}

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
                    {isTestingSiren ? 'Stop Tone' : 'Preview Tone'}
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
           POPUP MODAL: LIVE DISTRICT EMERGENCY BROADCAST ALERT (MINIMAL & ACTIONABLE)
           ========================================================================= */}
      {showEmergencyPopup && (
        <div className="emergency-popup-backdrop open" id="adminLiveAlertPopupModal" style={{ display: 'flex', zIndex: 99999 }}>
          <div
            className="emergency-popup-box emergency-box-blinking"
            role="alertdialog"
            aria-modal="true"
            style={{
              maxWidth: '560px',
              width: '94%',
              background: '#0a0e17',
              borderRadius: '12px',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderTop: '4px solid #ef4444',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.95), 0 0 35px rgba(239, 68, 68, 0.25)',
              padding: '22px 24px',
              color: '#ffffff'
            }}
          >
            {/* Header badges & controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  background: emergencyAlertPayload?.severity === 'warning' ? '#d97706' : '#dc2626',
                  color: '#ffffff',
                  padding: '3px 9px',
                  borderRadius: '4px',
                  textTransform: 'uppercase'
                }}>
                  {emergencyAlertPayload?.severity === 'warning' ? (t.popupBadgeWarning || 'ORANGE WARNING') : (t.popupBadgeDanger || 'RED ALERT')}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                  {t.popupAuthority || 'District Disaster Authority'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  id="btnPopupSilenceAlarm"
                  title={isMuted ? (t.popupUnmuteTitle || 'Unmute Alarm Siren') : (t.popupMuteTitle || 'Mute Alarm Siren')}
                  onClick={handleToggleMute}
                  style={{
                    background: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    border: isMuted ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                    color: isMuted ? '#fca5a5' : '#e2e8f0',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    height: '28px',
                    padding: '0 10px',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  {isMuted ? (t.popupUnmute || 'Unmute') : (t.popupMute || 'Mute')}
                </button>
                <button
                  type="button"
                  id="btnCloseEmergencyPopup"
                  aria-label={t.modalClose || "Close"}
                  onClick={() => handleDismissEmergency()}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#94a3b8',
                    fontSize: '1rem',
                    width: '28px',
                    height: '28px',
                    borderRadius: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Clear, bold headline */}
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.3, margin: '0 0 8px', letterSpacing: '-0.01em' }}>
              {getPopupHeadline()}
            </h2>

            {/* Minimal 1-line essential instruction */}
            <p style={{ margin: '0 0 14px', color: '#e2e8f0', fontSize: '0.86rem', lineHeight: 1.5 }}>
              {getPopupDesc()}
            </p>

            {/* Action Tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              {/* Tile 1: Nearest Shelter */}
              <div
                role="button"
                tabIndex={0}
                id="btnPopupCardNavigateShelter"
                onClick={() => {
                  setActiveTab('map');
                  handleDismissEmergency(emergencyAlertPayload?.shelter || 'Shillong Municipal Relief Center #1');
                  setTimeout(() => {
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo({ center: [91.8950, 25.5840], zoom: 15, pitch: 50, essential: true });
                    }
                  }, 300);
                }}
                style={{
                  background: '#0d1a19',
                  border: '1px solid rgba(16, 185, 129, 0.45)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#10b981';
                  e.currentTarget.style.background = '#102523';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.45)';
                  e.currentTarget.style.background = '#0d1a19';
                }}
              >
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#34d399' }}>
                  {t.popupShelterTag || 'DESIGNATED SHELTER'}
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                  {getPopupShelterName()}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  {getPopupShelterMeta()}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, marginTop: '4px' }}>
                  {t.popupNavigateShelter || 'Navigate to Shelter →'}
                </div>
              </div>

              {/* Tile 2: Evacuation Route */}
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
                  border: '1px solid rgba(217, 119, 6, 0.45)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#f59e0b';
                  e.currentTarget.style.background = '#281e14';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(217, 119, 6, 0.45)';
                  e.currentTarget.style.background = '#1c1611';
                }}
              >
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fbbf24' }}>
                  {t.popupRouteTag || 'SAFE ROUTE (OPEN)'}
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                  {getPopupCorridorName()}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  {getPopupCorridorMeta()}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700, marginTop: '4px' }}>
                  {t.popupViewRoute || 'View Safe Route →'}
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                  padding: '11px 16px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
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
                {t.popupAcknowledge || 'Acknowledge & Silence Siren'}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#64748b' }}>
                {t.popupAcknowledgeSub || 'Silences alarm and confirms your safety with Disaster Control'}
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
