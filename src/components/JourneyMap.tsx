import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Journey, DinoTypeId } from '@/types/app';
import { cn } from '@/lib/utils';
import { Search, MapPin, MapPinOff, Loader2, History, X, Trash2, Eye, Crosshair, Navigation, NavigationOff } from 'lucide-react';
import { useDestinations, Destination } from '@/hooks/useDestinations';

// Import dinosaur images for map markers
import tRexImg from '@/assets/dinos/t-rex.png';
import triceratopsImg from '@/assets/dinos/triceratops.png';
import velociraptorImg from '@/assets/dinos/velociraptor.png';
import stegosaurusImg from '@/assets/dinos/stegosaurus.png';
import pterodactylImg from '@/assets/dinos/pterodactyl.png';
import brachiosaurusImg from '@/assets/dinos/brachiosaurus.png';
import ankylosaurusImg from '@/assets/dinos/ankylosaurus.png';
import spinosaurusImg from '@/assets/dinos/spinosaurus.png';

const DINO_IMAGES: Record<string, string> = {
  't-rex': tRexImg,
  'triceratops': triceratopsImg,
  'velociraptor': velociraptorImg,
  'stegosaurus': stegosaurusImg,
  'pterodactyl': pterodactylImg,
  'brachiosaurus': brachiosaurusImg,
  'ankylosaurus': ankylosaurusImg,
  'spinosaurus': spinosaurusImg,
};

interface GeocodingResult {
  id: string;
  place_name: string;
  center: [number, number];
}

interface JourneyMapProps {
  mapboxToken: string;
  journey: Journey | null;
  currentPosition: [number, number] | null;
  isActive: boolean;
  onSetStart?: (coords: [number, number]) => void;
  onSetEnd?: (coords: [number, number]) => void;
  onRouteCalculated?: (route: [number, number][]) => void;
  mode: 'setup' | 'active' | 'view';
  selectedDinoType?: DinoTypeId | null;
}

export function JourneyMap({
  mapboxToken,
  journey,
  currentPosition,
  isActive,
  onSetStart,
  onSetEnd,
  onRouteCalculated,
  mode,
  selectedDinoType,
}: JourneyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const checkpointMarkers = useRef<mapboxgl.Marker[]>([]);
  const startMarker = useRef<mapboxgl.Marker | null>(null);
  const endMarker = useRef<mapboxgl.Marker | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [setupStep, setSetupStep] = useState<'start' | 'end' | 'done'>('start');
  const [startCoords, setStartCoords] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  
  const [localPosition, setLocalPosition] = useState<[number, number] | null>(null);
  const [gpsUnavailable, setGpsUnavailable] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [compassEnabled, setCompassEnabled] = useState(false);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const initialPositionSet = useRef(false);

  const { destinations, loading: loadingDestinations, addDestination, deleteDestination } = useDestinations();

  // Use either passed currentPosition or locally fetched position
  const effectivePosition = currentPosition || localPosition;

  // Request current location
  const requestCurrentLocation = useCallback(() => {
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
        setLocalPosition(coords);
        setIsGettingLocation(false);
        
        // Auto-set as start point
        setStartCoords(coords);
        if (onSetStart) onSetStart(coords);
        setSetupStep('end');
        
        if (startMarker.current) startMarker.current.remove();
        const el = document.createElement('div');
        el.className = 'w-8 h-8 rounded-full bg-primary border-3 border-white shadow-lg flex items-center justify-center cursor-pointer';
        el.innerHTML = '<span class="text-sm font-bold text-white">S</span>';
        startMarker.current = new mapboxgl.Marker(el)
          .setLngLat(coords)
          .addTo(map.current!);
        
        map.current?.flyTo({
          center: coords,
          zoom: 15,
          duration: 1000,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onSetStart]);

  // Helper to safely add route to map
  const addRouteToMap = useCallback((routeCoords: [number, number][]) => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    if (map.current.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }

    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoords,
        },
      },
    });

    map.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#f97316',
        'line-width': 5,
        'line-opacity': 0.8,
      },
    });

    const bounds = new mapboxgl.LngLatBounds();
    routeCoords.forEach(coord => bounds.extend(coord));
    map.current.fitBounds(bounds, { padding: 80 });
  }, []);

  // Fetch pedestrian route from Mapbox Directions API
  const fetchPedestrianRoute = useCallback(async (start: [number, number], end: [number, number]) => {
    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${mapboxToken}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        const routeCoords = data.routes[0].geometry.coordinates as [number, number][];
        addRouteToMap(routeCoords);
        if (onRouteCalculated) {
          onRouteCalculated(routeCoords);
        }
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  }, [mapboxToken, addRouteToMap, onRouteCalculated]);

  // Search for addresses using Mapbox Geocoding API
  const searchAddress = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const encodedQuery = encodeURIComponent(query.trim());
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${mapboxToken}&limit=5`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.features) {
        setSearchResults(data.features.map((f: any) => ({
          id: f.id,
          place_name: f.place_name,
          center: f.center as [number, number],
        })));
      }
    } catch (error) {
      console.error('Error searching address:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [mapboxToken]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchAddress(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchAddress]);

  // Handle selecting a search result as destination
  const selectDestination = useCallback(async (coords: [number, number], name?: string, saveToHistory: boolean = true) => {
    if (onSetEnd) onSetEnd(coords);
    setSetupStep('done');
    setSearchQuery('');
    setSearchResults([]);
    setShowHistoryModal(false);
    
    // Save destination to history
    if (saveToHistory) {
      const destinationName = name || `📍 ${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}`;
      await addDestination(destinationName, coords);
    }
    
    if (endMarker.current) endMarker.current.remove();
    const el = document.createElement('div');
    el.className = 'w-8 h-8 rounded-full bg-accent border-3 border-white shadow-lg flex items-center justify-center cursor-pointer';
    el.innerHTML = '<span class="text-sm font-bold text-white">E</span>';
    endMarker.current = new mapboxgl.Marker(el)
      .setLngLat(coords)
      .addTo(map.current!);

    map.current?.flyTo({
      center: coords,
      zoom: 15,
      duration: 1000,
    });

    if (startCoords) {
      fetchPedestrianRoute(startCoords, coords);
    }
  }, [onSetEnd, startCoords, fetchPedestrianRoute, addDestination]);

  // Initialize map and auto-center on user location
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    // Start with a neutral center, will be updated with user location
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [0, 0],
      zoom: 2,
      pitch: 45,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
      setMapLoaded(false);
    };
  }, [mapboxToken]);

  // Auto-center on user location for all modes
  useEffect(() => {
    if (!mapLoaded || initialPositionSet.current) return;

    // If we have a position from props or journey, use that
    if (currentPosition) {
      initialPositionSet.current = true;
      setGpsUnavailable(false);
      setIsGettingLocation(false);
      map.current?.flyTo({
        center: currentPosition,
        zoom: 15,
        duration: 1000,
      });
      return;
    }

    // If we have a journey, center on that
    if (journey) {
      initialPositionSet.current = true;
      setGpsUnavailable(false);
      setIsGettingLocation(false);
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend(journey.startPoint);
      bounds.extend(journey.endPoint);
      journey.checkpoints.forEach(cp => bounds.extend(cp.coordinates));
      map.current?.fitBounds(bounds, { padding: 80, duration: 1000 });
      return;
    }

    // Otherwise try to get user location
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
        setLocalPosition(coords);
        setGpsUnavailable(false);
        setIsGettingLocation(false);
        initialPositionSet.current = true;
        map.current?.flyTo({
          center: coords,
          zoom: 15,
          duration: 1000,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGpsUnavailable(true);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [mapLoaded, currentPosition, journey]);

  // Zoom on user position when journey becomes active
  const previousMode = useRef<string | null>(null);
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    // Detect transition to active mode
    if (mode === 'active' && previousMode.current !== 'active' && currentPosition) {
      map.current.flyTo({
        center: currentPosition,
        zoom: 16, // Same zoom level as recenter button
        duration: 1200,
        pitch: 60, // Tilt for better immersion
      });
    }
    
    previousMode.current = mode;
  }, [mode, mapLoaded, currentPosition]);

  // Handle map clicks in setup mode
  useEffect(() => {
    if (!map.current || mode !== 'setup' || !mapLoaded) return;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      
      if (setupStep === 'start') {
        setStartCoords(coords);
        if (onSetStart) onSetStart(coords);
        setSetupStep('end');
        
        if (startMarker.current) startMarker.current.remove();
        const el = document.createElement('div');
        el.className = 'w-8 h-8 rounded-full bg-primary border-3 border-white shadow-lg flex items-center justify-center cursor-pointer';
        el.innerHTML = '<span class="text-sm font-bold text-white">S</span>';
        startMarker.current = new mapboxgl.Marker(el)
          .setLngLat(coords)
          .addTo(map.current!);
          
      } else if (setupStep === 'end') {
        // Save GPS point to history with coordinates as name
        selectDestination(coords, undefined, true);
      }
    };

    map.current.on('click', handleClick);
    return () => {
      map.current?.off('click', handleClick);
    };
  }, [mode, setupStep, startCoords, onSetStart, onSetEnd, mapLoaded, fetchPedestrianRoute]);

  // Update user position marker - always show during active journey
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    // Remove marker if no position
    if (!currentPosition) {
      if (userMarker.current) {
        userMarker.current.remove();
        userMarker.current = null;
      }
      return;
    }

    if (!userMarker.current) {
      const el = document.createElement('div');
      el.className = 'w-8 h-8 flex items-center justify-center';
      el.innerHTML = `
        <div class="absolute w-12 h-12 rounded-full bg-blue-500/20 animate-ping"></div>
        <div class="absolute w-10 h-10 rounded-full bg-blue-500/30"></div>
        <div class="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center z-10">
          <div class="w-2 h-2 rounded-full bg-white"></div>
        </div>
      `;
      userMarker.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(currentPosition)
        .addTo(map.current);
    } else {
      userMarker.current.setLngLat(currentPosition);
    }

    // In active mode, fit bounds to show user and next waypoint
    if (mode === 'active' && journey) {
      // Find next unvalidated checkpoint
      const nextCheckpoint = journey.checkpoints.find(cp => !cp.validated);
      
      if (nextCheckpoint) {
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend(currentPosition);
        bounds.extend(nextCheckpoint.coordinates);
        
        map.current.fitBounds(bounds, {
          padding: { top: 100, bottom: 150, left: 50, right: 50 },
          maxZoom: 17,
          duration: 500,
        });
      } else {
        // All checkpoints validated, just center on user
        const currentZoom = map.current.getZoom();
        map.current.easeTo({
          center: currentPosition,
          zoom: currentZoom,
          duration: 500,
        });
      }
    }
  }, [currentPosition, isActive, mapLoaded, mode]);

  // Update checkpoint markers when journey exists
  useEffect(() => {
    if (!map.current || !journey || !mapLoaded) return;

    checkpointMarkers.current.forEach(m => m.remove());
    checkpointMarkers.current = [];

    if (startMarker.current) startMarker.current.remove();
    const startEl = document.createElement('div');
    startEl.className = 'w-8 h-8 rounded-full bg-primary border-3 border-white shadow-lg flex items-center justify-center';
    startEl.innerHTML = '<span class="text-sm font-bold text-white">S</span>';
    startMarker.current = new mapboxgl.Marker(startEl)
      .setLngLat(journey.startPoint)
      .addTo(map.current);

    // Remove separate end marker - destination is now a checkpoint
    if (endMarker.current) endMarker.current.remove();
    endMarker.current = null;

    journey.checkpoints.forEach((checkpoint, index) => {
      const el = document.createElement('div');
      
      if (checkpoint.validated) {
        // Validated checkpoint - show checkmark
        el.className = 'w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 bg-success checkpoint-validated';
        el.innerHTML = '<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>';
      } else if (checkpoint.isDestination && selectedDinoType) {
        // Destination checkpoint - show dinosaur image
        const dinoImage = DINO_IMAGES[selectedDinoType];
        el.className = 'flex items-center justify-center shadow-lg transition-all duration-300';
        el.innerHTML = `
          <div class="relative w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-3 border-white shadow-xl flex items-center justify-center animate-pulse">
            <img src="${dinoImage}" alt="Dinosaure" class="w-10 h-10 object-contain" />
          </div>
        `;
      } else {
        // Regular egg-shaped marker with number
        el.className = 'flex items-center justify-center shadow-lg transition-all duration-300';
        el.innerHTML = `
          <div class="relative">
            <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="16" cy="22" rx="14" ry="16" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>
              <ellipse cx="16" cy="20" rx="12" ry="14" fill="#fcd34d"/>
              <ellipse cx="12" cy="16" rx="3" ry="4" fill="#fef3c7" opacity="0.6"/>
            </svg>
            <span class="absolute inset-0 flex items-center justify-center text-amber-800 font-bold text-sm pt-1">${index + 1}</span>
          </div>
        `;
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat(checkpoint.coordinates)
        .addTo(map.current!);

      checkpointMarkers.current.push(marker);
    });

    if (journey.routeCoordinates) {
      addRouteToMap(journey.routeCoordinates);
    }
  }, [journey, mapLoaded, addRouteToMap, selectedDinoType]);


  // Recenter map on current position
  const recenterOnPosition = useCallback(() => {
    if (currentPosition && map.current) {
      map.current.flyTo({
        center: currentPosition,
        zoom: 16,
        duration: 1000,
      });
    }
  }, [currentPosition]);

  // Toggle compass mode
  const toggleCompass = useCallback(() => {
    if (!compassEnabled) {
      // Request permission for device orientation on iOS 13+
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        (DeviceOrientationEvent as any).requestPermission()
          .then((response: string) => {
            if (response === 'granted') {
              setCompassEnabled(true);
            }
          })
          .catch(console.error);
      } else {
        setCompassEnabled(true);
      }
    } else {
      setCompassEnabled(false);
      // Reset map bearing when disabling
      if (map.current) {
        map.current.easeTo({ bearing: 0, duration: 300 });
      }
    }
  }, [compassEnabled]);

  // Handle device orientation for compass mode with smoothing
  const lastBearingUpdate = useRef<number>(0);
  const headingHistory = useRef<number[]>([]);
  const lastAppliedHeading = useRef<number | null>(null);
  const HEADING_HISTORY_SIZE = 5; // Number of readings for moving average
  const MIN_HEADING_CHANGE = 8; // Minimum degrees change to update (threshold)
  const THROTTLE_MS = 150; // Throttle updates to 150ms

  useEffect(() => {
    if (!compassEnabled || mode !== 'active') return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      // Throttle updates
      const now = Date.now();
      if (now - lastBearingUpdate.current < THROTTLE_MS) return;
      lastBearingUpdate.current = now;

      // Use webkitCompassHeading for iOS, or calculate from alpha for Android
      let heading: number | null = null;
      
      if ((event as any).webkitCompassHeading !== undefined) {
        // iOS provides compass heading directly
        heading = (event as any).webkitCompassHeading;
      } else if (event.alpha !== null) {
        // Android: alpha is the compass direction (0-360)
        // We need to invert it for map bearing
        heading = 360 - event.alpha;
      }

      if (heading !== null && map.current) {
        // Add to history for smoothing (moving average)
        headingHistory.current.push(heading);
        if (headingHistory.current.length > HEADING_HISTORY_SIZE) {
          headingHistory.current.shift();
        }

        // Calculate smoothed heading using circular mean (handles 0/360 wraparound)
        const sinSum = headingHistory.current.reduce((sum, h) => sum + Math.sin(h * Math.PI / 180), 0);
        const cosSum = headingHistory.current.reduce((sum, h) => sum + Math.cos(h * Math.PI / 180), 0);
        let smoothedHeading = Math.atan2(sinSum, cosSum) * 180 / Math.PI;
        if (smoothedHeading < 0) smoothedHeading += 360;

        // Check if change is significant enough (with wraparound handling)
        if (lastAppliedHeading.current !== null) {
          let diff = Math.abs(smoothedHeading - lastAppliedHeading.current);
          if (diff > 180) diff = 360 - diff; // Handle 0/360 wraparound
          if (diff < MIN_HEADING_CHANGE) return; // Skip small changes
        }

        lastAppliedHeading.current = smoothedHeading;
        setDeviceHeading(smoothedHeading);
        map.current.setBearing(smoothedHeading);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      // Reset history when disabling
      headingHistory.current = [];
      lastAppliedHeading.current = null;
    };
  }, [compassEnabled, mode]);

  return (
    <div className="absolute inset-0">
      <div ref={mapContainer} className="w-full h-full rounded-2xl overflow-hidden" />
      
      {/* Control buttons - only show during active journey */}
      {mode === 'active' && currentPosition && (
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
          {/* Compass toggle button */}
          <button
            onClick={toggleCompass}
            className={cn(
              "p-3 border rounded-full shadow-lg transition-all duration-200 hover:scale-105",
              compassEnabled 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-background/90 hover:bg-background border-border"
            )}
            title={compassEnabled ? "Désactiver l'orientation" : "Orienter selon la boussole"}
          >
            {compassEnabled ? (
              <Navigation className="w-5 h-5" />
            ) : (
              <NavigationOff className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          
          {/* Recenter button */}
          <button
            onClick={recenterOnPosition}
            className="p-3 bg-background/90 hover:bg-background border border-border rounded-full shadow-lg transition-all duration-200 hover:scale-105"
            title="Recentrer sur ma position"
          >
            <Crosshair className="w-5 h-5 text-primary" />
          </button>
        </div>
      )}
      
      {/* Loading indicator */}
      {isGettingLocation && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20 rounded-2xl">
          <div className="glass-card p-6 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-sm font-medium">Localisation en cours...</p>
          </div>
        </div>
      )}
      
      {/* GPS unavailable message */}
      {gpsUnavailable && !journey && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20 rounded-2xl">
          <div className="glass-card p-6 text-center space-y-4 max-w-xs">
            <MapPinOff className="w-12 h-12 text-destructive mx-auto" />
            <div className="space-y-2">
              <p className="font-semibold text-lg">GPS non disponible</p>
              <p className="text-sm text-muted-foreground">
                Active la localisation dans les paramètres de ton appareil pour utiliser la carte.
              </p>
            </div>
            <button
              onClick={() => {
                setGpsUnavailable(false);
                setIsGettingLocation(true);
                initialPositionSet.current = false;
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
                    setLocalPosition(coords);
                    setGpsUnavailable(false);
                    setIsGettingLocation(false);
                    initialPositionSet.current = true;
                    map.current?.flyTo({
                      center: coords,
                      zoom: 15,
                      duration: 1000,
                    });
                  },
                  () => {
                    setGpsUnavailable(true);
                    setIsGettingLocation(false);
                  },
                  { enableHighAccuracy: true, timeout: 10000 }
                );
              }}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}
      
      
      {mode === 'setup' && (
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="glass-card p-4 text-center space-y-3">
            {setupStep === 'start' && (
              <>
                <p className="text-sm font-medium">
                  📍 Touche la carte pour définir ton <span className="text-primary font-bold">point de départ</span>
                </p>
                <button
                  onClick={effectivePosition ? () => {
                    setStartCoords(effectivePosition);
                    if (onSetStart) onSetStart(effectivePosition);
                    setSetupStep('end');
                    
                    if (startMarker.current) startMarker.current.remove();
                    const el = document.createElement('div');
                    el.className = 'w-8 h-8 rounded-full bg-primary border-3 border-white shadow-lg flex items-center justify-center cursor-pointer';
                    el.innerHTML = '<span class="text-sm font-bold text-white">S</span>';
                    startMarker.current = new mapboxgl.Marker(el)
                      .setLngLat(effectivePosition)
                      .addTo(map.current!);
                    
                    map.current?.flyTo({
                      center: effectivePosition,
                      zoom: 15,
                      duration: 1000,
                    });
                  } : requestCurrentLocation}
                  disabled={isGettingLocation}
                  className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isGettingLocation ? '📍 Localisation en cours...' : '📍 Utiliser ma position actuelle'}
                </button>
              </>
            )}
            {setupStep === 'end' && (
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  🏁 Touche la carte ou recherche ta <span className="font-bold">destination</span>
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher une adresse..."
                      className="w-full pl-9 pr-4 py-2 bg-background/80 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      maxLength={200}
                    />
                  </div>
                  <button
                    onClick={() => setShowHistoryModal(true)}
                    className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                    title="Destinations récentes"
                  >
                    <History className="w-5 h-5" />
                  </button>
                </div>
                {isSearching && (
                  <p className="text-xs text-muted-foreground">Recherche en cours...</p>
                )}
                {searchResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => selectDestination(result.center, result.place_name)}
                        className="w-full flex items-start gap-2 p-2 text-left bg-background/60 hover:bg-background/80 rounded-lg transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        <span className="text-xs line-clamp-2">{result.place_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {setupStep === 'done' && (
              <p className="text-sm font-medium text-success">
                ✅ Route calculated! Tap "Create Journey" to begin
              </p>
            )}
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 rounded-2xl">
          <div className="glass-card m-4 p-4 max-w-sm w-full max-h-[80%] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">📍 Destinations récentes</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {loadingDestinations ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : destinations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Aucune destination récente
              </p>
            ) : (
              <div className="overflow-y-auto space-y-2 flex-1">
                {destinations.map((dest) => {
                  const isGpsPoint = dest.name.startsWith('📍');
                  const createdDate = new Date(dest.created_at);
                  
                  return (
                    <div
                      key={dest.id}
                      className="flex items-start gap-3 p-3 bg-background/60 hover:bg-background/80 rounded-lg transition-colors"
                    >
                      <button
                        onClick={() => selectDestination(dest.coordinates, dest.name, false)}
                        className="flex items-start gap-3 flex-1 text-left"
                      >
                        <MapPin className={cn(
                          "w-5 h-5 mt-0.5 flex-shrink-0",
                          isGpsPoint ? "text-blue-500" : "text-amber-500"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">
                            {isGpsPoint ? 'Point GPS' : dest.name}
                          </p>
                          {isGpsPoint && (
                            <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono">
                              {dest.name.replace('📍 ', '')}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {createdDate.toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })} à {createdDate.toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          map.current?.flyTo({
                            center: dest.coordinates,
                            zoom: 16,
                            duration: 1000,
                          });
                        }}
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Centrer sur la carte"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDestination(dest.id);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}