import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Temple } from '@/hooks/useTemples';
import { MapPin, MapPinned, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibGF4c2FuIiwiYSI6ImNtams2NGpvNzA5N2wzZ3B2amZoMDBvcnMifQ.pqw45fuOD5Gi5hSs5TsfCg';

interface TempleMapProps {
  temples: Temple[];
  onTempleClick?: (temple: Temple) => void;
}

const TempleMap = ({ temples, onTempleClick }: TempleMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Check WebGL support first
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setMapError('WebGL is not supported in this browser. Please try opening the app in a new tab or use a different browser.');
      return;
    }

    try {
      // Initialize map
      mapboxgl.accessToken = MAPBOX_TOKEN;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [80.5, 7.8], // Center of Sri Lanka
        zoom: 7,
        pitch: 30,
      });

      // Handle map errors
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError('Failed to load map. Please try again later.');
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      // Add fullscreen control
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      // Wait for map to load before adding markers
      map.current.on('load', () => {
        addMarkers();
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
      setMapError('Failed to initialize map. WebGL may not be available in this preview environment. Try opening in a new tab.');
    }

    return () => {
      // Clean up markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      // Clean up map
      map.current?.remove();
    };
  }, []);

  // Update markers when temples change
  useEffect(() => {
    if (map.current && map.current.loaded()) {
      addMarkers();
    }
  }, [temples]);

  const addMarkers = () => {
    if (!map.current) return;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    temples.forEach((temple) => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'temple-marker';
      el.innerHTML = `
        <div class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary shadow-lg transition-transform hover:scale-110">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
      `;

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        maxWidth: '300px',
      }).setHTML(`
        <div class="p-2">
          <img src="${temple.image}" alt="${temple.name}" class="mb-2 h-24 w-full rounded object-cover" />
          <h3 class="mb-1 font-semibold text-foreground">${temple.name}</h3>
          <p class="mb-1 text-xs text-muted-foreground">${temple.district}, ${temple.province}</p>
          <p class="mb-2 text-xs text-muted-foreground">${temple.deity}</p>
          <div class="flex items-center gap-1 text-xs">
            <span class="text-yellow-500">★</span>
            <span>${temple.rating}</span>
            <span class="text-muted-foreground">(${temple.reviewCount} reviews)</span>
          </div>
        </div>
      `);

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([temple.coordinates.lng, temple.coordinates.lat])
        .setPopup(popup)
        .addTo(map.current!);

      // Add click handler
      el.addEventListener('click', () => {
        onTempleClick?.(temple);
      });

      markersRef.current.push(marker);
    });

    // Fit map to show all markers if we have temples
    if (temples.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      temples.forEach((temple) => {
        bounds.extend([temple.coordinates.lng, temple.coordinates.lat]);
      });
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 10,
      });
    }
  };

  if (mapError) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Map Unavailable
          </CardTitle>
          <CardDescription>{mapError}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {temples.slice(0, 6).map((temple) => (
              <div 
                key={temple.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
                onClick={() => onTempleClick?.(temple)}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary">
                  <MapPinned className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{temple.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{temple.district}, {temple.province}</p>
                </div>
              </div>
            ))}
          </div>
          {temples.length > 6 && (
            <p className="mt-3 text-center text-sm text-muted-foreground">
              +{temples.length - 6} more temples
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-xl border border-border shadow-lg">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-background/20 to-transparent" />
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 rounded-lg bg-card/95 p-3 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
            <MapPin className="h-3 w-3 text-primary-foreground" />
          </div>
          <span className="text-foreground">{temples.length} Temples</span>
        </div>
      </div>
    </div>
  );
};

export default TempleMap;
