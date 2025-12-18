import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Journey } from '@/types/app';
import { cn } from '@/lib/utils';
import { Search, MapPin } from 'lucide-react';

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
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [localPosition, setLocalPosition] = useState<[number, number] | null>(null);

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
  const selectDestination = useCallback((coords: [number, number]) => {
    if (onSetEnd) onSetEnd(coords);
    setSetupStep('done');
    setSearchQuery('');
    setSearchResults([]);
    
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
  }, [onSetEnd, startCoords, fetchPedestrianRoute]);

  // Initialize map centered on Paris
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [2.3522, 48.8566], // Paris center
      zoom: 13,
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
        if (onSetEnd) onSetEnd(coords);
        setSetupStep('done');
        
        if (endMarker.current) endMarker.current.remove();
        const el = document.createElement('div');
        el.className = 'w-8 h-8 rounded-full bg-accent border-3 border-white shadow-lg flex items-center justify-center cursor-pointer';
        el.innerHTML = '<span class="text-sm font-bold text-white">E</span>';
        endMarker.current = new mapboxgl.Marker(el)
          .setLngLat(coords)
          .addTo(map.current!);

        if (startCoords) {
          fetchPedestrianRoute(startCoords, coords);
        }
      }
    };

    map.current.on('click', handleClick);
    return () => {
      map.current?.off('click', handleClick);
    };
  }, [mode, setupStep, startCoords, onSetStart, onSetEnd, mapLoaded, fetchPedestrianRoute]);

  // Update user position marker
  useEffect(() => {
    if (!map.current || !currentPosition || !mapLoaded) return;

    if (!userMarker.current) {
      const el = document.createElement('div');
      el.className = 'relative';
      el.innerHTML = `
        <div class="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg animate-pulse"></div>
        <div class="absolute inset-0 w-4 h-4 rounded-full bg-blue-500 animate-ping opacity-75"></div>
      `;
      userMarker.current = new mapboxgl.Marker(el)
        .setLngLat(currentPosition)
        .addTo(map.current);
    } else {
      userMarker.current.setLngLat(currentPosition);
    }

    if (isActive) {
      map.current.flyTo({
        center: currentPosition,
        zoom: 17,
        duration: 1000,
      });
    }
  }, [currentPosition, isActive, mapLoaded]);

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

    if (endMarker.current) endMarker.current.remove();
    const endEl = document.createElement('div');
    endEl.className = 'w-8 h-8 rounded-full bg-accent border-3 border-white shadow-lg flex items-center justify-center';
    endEl.innerHTML = '<span class="text-sm font-bold text-white">E</span>';
    endMarker.current = new mapboxgl.Marker(endEl)
      .setLngLat(journey.endPoint)
      .addTo(map.current);

    journey.checkpoints.forEach((checkpoint, index) => {
      const el = document.createElement('div');
      el.className = cn(
        'w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300',
        checkpoint.validated
          ? 'bg-success checkpoint-validated'
          : 'bg-muted border-2 border-border'
      );
      el.innerHTML = checkpoint.validated
        ? '<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>'
        : `<span class="text-sm font-bold text-muted-foreground">${index + 1}</span>`;

      const marker = new mapboxgl.Marker(el)
        .setLngLat(checkpoint.coordinates)
        .addTo(map.current!);

      checkpointMarkers.current.push(marker);
    });

    if (journey.routeCoordinates) {
      addRouteToMap(journey.routeCoordinates);
    }
  }, [journey, mapLoaded, addRouteToMap]);

  return (
    <div className="absolute inset-0">
      <div ref={mapContainer} className="w-full h-full rounded-2xl overflow-hidden" />
      
      {mode === 'setup' && (
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="glass-card p-4 text-center space-y-3">
            {setupStep === 'start' && (
              <>
                <p className="text-sm font-medium">
                  📍 Tap on the map to set your <span className="text-primary font-bold">starting point</span>
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
                  {isGettingLocation ? '📍 Getting location...' : '📍 Use My Current Location'}
                </button>
              </>
            )}
            {setupStep === 'end' && (
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  🏁 Tap on the map or search for your <span className="text-accent font-bold">destination</span>
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for an address..."
                    className="w-full pl-9 pr-4 py-2 bg-background/80 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    maxLength={200}
                  />
                </div>
                {isSearching && (
                  <p className="text-xs text-muted-foreground">Searching...</p>
                )}
                {searchResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => selectDestination(result.center)}
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
    </div>
  );
}