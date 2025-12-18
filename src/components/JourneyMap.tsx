import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Journey, Checkpoint } from '@/types/app';
import { cn } from '@/lib/utils';

interface JourneyMapProps {
  mapboxToken: string;
  journey: Journey | null;
  currentPosition: [number, number] | null;
  isActive: boolean;
  onSetStart?: (coords: [number, number]) => void;
  onSetEnd?: (coords: [number, number]) => void;
  mode: 'setup' | 'active' | 'view';
}

export function JourneyMap({
  mapboxToken,
  journey,
  currentPosition,
  isActive,
  onSetStart,
  onSetEnd,
  mode,
}: JourneyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const checkpointMarkers = useRef<mapboxgl.Marker[]>([]);
  const startMarker = useRef<mapboxgl.Marker | null>(null);
  const endMarker = useRef<mapboxgl.Marker | null>(null);

  const [setupStep, setSetupStep] = useState<'start' | 'end'>('start');

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: currentPosition || [2.3522, 48.8566], // Default to Paris
      zoom: 14,
      pitch: 45,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'top-right'
    );

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Handle map clicks in setup mode
  useEffect(() => {
    if (!map.current || mode !== 'setup') return;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      
      if (setupStep === 'start' && onSetStart) {
        onSetStart(coords);
        setSetupStep('end');
        
        // Add start marker
        if (startMarker.current) startMarker.current.remove();
        const el = document.createElement('div');
        el.className = 'w-6 h-6 rounded-full bg-primary border-2 border-primary-foreground shadow-lg flex items-center justify-center';
        el.innerHTML = '<span class="text-xs font-bold text-primary-foreground">S</span>';
        startMarker.current = new mapboxgl.Marker(el)
          .setLngLat(coords)
          .addTo(map.current!);
      } else if (setupStep === 'end' && onSetEnd) {
        onSetEnd(coords);
        
        // Add end marker
        if (endMarker.current) endMarker.current.remove();
        const el = document.createElement('div');
        el.className = 'w-6 h-6 rounded-full bg-accent border-2 border-accent-foreground shadow-lg flex items-center justify-center';
        el.innerHTML = '<span class="text-xs font-bold text-accent-foreground">E</span>';
        endMarker.current = new mapboxgl.Marker(el)
          .setLngLat(coords)
          .addTo(map.current!);
      }
    };

    map.current.on('click', handleClick);
    return () => {
      map.current?.off('click', handleClick);
    };
  }, [mode, setupStep, onSetStart, onSetEnd]);

  // Update user position marker
  useEffect(() => {
    if (!map.current || !currentPosition) return;

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
  }, [currentPosition, isActive]);

  // Update checkpoint markers
  useEffect(() => {
    if (!map.current || !journey) return;

    // Clear existing markers
    checkpointMarkers.current.forEach(m => m.remove());
    checkpointMarkers.current = [];

    // Add checkpoint markers
    journey.checkpoints.forEach((checkpoint, index) => {
      const el = document.createElement('div');
      el.className = cn(
        'w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-300',
        checkpoint.validated
          ? 'bg-success checkpoint-validated'
          : 'bg-muted border-2 border-border'
      );
      el.innerHTML = checkpoint.validated
        ? '<svg class="w-5 h-5 text-success-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
        : `<span class="text-xs font-bold text-muted-foreground">${index + 1}</span>`;

      const marker = new mapboxgl.Marker(el)
        .setLngLat(checkpoint.coordinates)
        .addTo(map.current!);

      checkpointMarkers.current.push(marker);
    });

    // Draw route line
    if (map.current.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }

    const routeCoords = [
      journey.startPoint,
      ...journey.checkpoints.map(cp => cp.coordinates),
      journey.endPoint,
    ];

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
        'line-width': 4,
        'line-opacity': 0.8,
      },
    });

    // Fit bounds to show entire route
    const bounds = new mapboxgl.LngLatBounds();
    routeCoords.forEach(coord => bounds.extend(coord as [number, number]));
    map.current.fitBounds(bounds, { padding: 80 });
  }, [journey]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-2xl overflow-hidden" />
      
      {mode === 'setup' && (
        <div className="absolute top-4 left-4 right-4">
          <div className="glass-card p-3 text-center">
            <p className="text-sm font-medium">
              {setupStep === 'start' 
                ? '📍 Tap to set your starting point'
                : '🏁 Tap to set your destination'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
