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
  userLat?: number;
  userLng?: number;
}

export const Map: React.FC<MapProps> = ({ 
  hospitals, 
  selectedHospitalId, 
  onSelectHospital,
  userLat = 28.6139, // Default user coordinates (e.g. New Delhi region)
  userLng = 77.2090
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Instantiate map if not already present
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        center: [userLat, userLng],
        zoom: 12,
        zoomControl: true,
      });

      // Use dark themed openstreetmap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapInstanceRef.current);

      markersGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }

    return () => {
      // Clean up on component unmount
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

    // Leaflet marker icons hotfix
    const defaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const activeIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const userIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Add user coordinate marker
    L.marker([userLat, userLng], { icon: userIcon })
      .bindPopup('<strong style="color:#198754">Your Location</strong>')
      .addTo(group);

    // Plot hospital markers
    hospitals.forEach((hosp) => {
      const isSelected = hosp.id === selectedHospitalId;
      const marker = L.marker([hosp.latitude, hosp.longitude], {
        icon: isSelected ? activeIcon : defaultIcon
      });

      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif; padding:2px;">
          <h4 style="margin:0 0 4px 0; font-weight:700; color:#fff;">${hosp.name}</h4>
          <p style="margin:0 0 6px 0; font-size:11px; color:#9ca3af;">Match Score: <strong style="color:#0d6efd">${hosp.recommendationScore}%</strong></p>
          <button id="btn-${hosp.id}" style="background:#0d6efd; color:#fff; border:none; border-radius:4px; padding:4px 8px; font-size:10px; font-weight:600; cursor:pointer; width:100%;">View Clinic Details</button>
        </div>
      `);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-${hosp.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectHospital(hosp.id);
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
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-white/5 shadow-2xl min-h-[350px]">
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0 bg-[#0B0F19]" />
      
      {/* Floating coordinates indicator */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-[#111827]/80 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
        📍 Center: {userLat.toFixed(4)}, {userLng.toFixed(4)}
      </div>
    </div>
  );
};
