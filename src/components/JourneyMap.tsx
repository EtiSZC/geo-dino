import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Journey } from '@/types/app';
import { cn } from '@/lib/utils';

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
          <div className="glass-card p-4 text-center">
            {setupStep === 'start' && (
              <p className="text-sm font-medium">
                📍 Tap on the map to set your <span className="text-primary font-bold">starting point</span>
              </p>
            )}
            {setupStep === 'end' && (
              <p className="text-sm font-medium">
                🏁 Now tap to set your <span className="text-accent font-bold">destination</span>
              </p>
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