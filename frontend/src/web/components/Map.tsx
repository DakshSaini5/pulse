import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface HospitalPin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  rating: number;
  recommendationScore: number;
}

interface MapProps {
  hospitals: HospitalPin[];
  selectedHospitalId?: string;
  onSelectHospital: (id: string) => void;
  onViewDetails?: (id: string) => void;
  userLat?: number;
  userLng?: number;
}

// BUG-15 FIX: map tile URLs per style key saved in localStorage
const TILE_LAYERS: Record<string, { url: string; attribution: string }> = {
  'clinical-light': {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
  },
  'charcoal-dark': {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors © CARTO',
  },
  'streets-satellite': {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri',
  },
};

export const Map: React.FC<MapProps> = ({ 
  hospitals, 
  selectedHospitalId, 
  onSelectHospital,
  onViewDetails,
  userLat = 28.6139,
  userLng = 77.2090
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // BUG-15 FIX: read user's saved map style preference
    const savedStyle = localStorage.getItem('pulse_pref_map_style') || 'clinical-light';
    const tileConfig = TILE_LAYERS[savedStyle] || TILE_LAYERS['clinical-light'];

    // Instantiate map if not already present
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        center: [userLat, userLng],
        zoom: 12,
        zoomControl: true,
      });

      tileLayerRef.current = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
      }).addTo(mapInstanceRef.current);

      markersGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map markers when values change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    // Clear existing markers
    group.clearLayers();

    // Use inline SVG DivIcons so markers always render in Capacitor Android WebView
    // (External CDN PNG URLs fail inside the Android WebView due to CSP / network restrictions)
    const makePinIcon = (color: string, size = 28) => L.divIcon({
      className: '',
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size],
      html: `<svg width="${size}" height="${size * 1.4}" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 0C7.268 0 1 6.268 1 14c0 10.5 14 28 14 28S29 24.5 29 14C29 6.268 22.732 0 15 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
        <circle cx="15" cy="14" r="5.5" fill="white" opacity="0.9"/>
      </svg>`,
    });

    const defaultIcon = makePinIcon('#1A3BAA', 28);    // Pulse Blue hospital pin
    const activeIcon = makePinIcon('#142E86', 36);     // Darker Pulse Blue selected pin (no red)
    const userIcon = makePinIcon('#16a34a', 28);       // Green user location pin

    // Add user coordinate marker
    L.marker([userLat, userLng], { icon: userIcon })
      .bindPopup('<strong style="font-family:Inter,sans-serif; color:#16a34a; font-size:14px;">Your location</strong>')
      .addTo(group);

    // Plot hospital markers
    hospitals.forEach((hosp) => {
      const isSelected = hosp.id === selectedHospitalId;
      const marker = L.marker([hosp.latitude, hosp.longitude], {
        icon: isSelected ? activeIcon : defaultIcon
      });

      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif; padding:4px; min-width:180px;">
          <h4 style="margin:0 0 4px 0; font-size:15px; font-weight:700; color:#111827;">${hosp.name}</h4>
          ${hosp.rating > 0 ? `<p style="margin:0 0 6px 0; font-size:14px; color:#4B5563;">⭐ Google rating ${hosp.rating.toFixed(1)}</p>` : ''}
          <button id="btn-${hosp.id}" style="background:#1A3BAA; color:#fff; border:none; border-radius:8px; padding:8px 12px; font-size:14px; font-weight:600; cursor:pointer; width:100%; margin-top:6px;">View hospital details</button>
        </div>
      `);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-${hosp.id}`);
        if (btn) {
          btn.onclick = () => {
            if (onViewDetails) {
              onViewDetails(hosp.id);
            } else {
              onSelectHospital(hosp.id);
            }
          };
        }
      });

      marker.addTo(group);

      if (isSelected) {
        map.setView([hosp.latitude, hosp.longitude], 13);
        marker.openPopup();
      }
    });

  }, [hospitals, selectedHospitalId, userLat, userLng]);

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-200 shadow-2xl min-h-[350px]">
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0 bg-slate-50" />
      
      {/* Coordinates indicator without blur */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-sm text-slate-300 font-medium">
        Location: {userLat.toFixed(3)}, {userLng.toFixed(3)}
      </div>
    </div>
  );
};
