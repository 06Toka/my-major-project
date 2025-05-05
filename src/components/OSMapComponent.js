import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaMapMarkerAlt } from 'react-icons/fa';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const OSMapComponent = ({ 
  center, 
  zoom, 
  onLocationSelect, 
  isSelectable = false, 
  markers = [] 
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [markerLayers, setMarkerLayers] = useState([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const leafletMap = L.map(mapRef.current).setView(
      center || [-29.316667, 27.483333], // Default to Lesotho
      zoom || 12
    );

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(leafletMap);

    setMap(leafletMap);

    // Add center marker if center is provided
    if (center) {
      const newMarker = L.marker([center.lat, center.lng]).addTo(leafletMap);
      setMarker(newMarker);
    }

    // Cleanup on unmount
    return () => {
      leafletMap.remove();
    };
  }, []);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markerLayers.forEach(layer => {
      map.removeLayer(layer);
    });

    // Add new markers
    const newMarkerLayers = markers.map(item => {
      const marker = L.marker([item.location.lat, item.location.lng])
        .addTo(map)
        .bindPopup(`
          <div>
            <h3>${item.name || item.productName}</h3>
            <p>${item.description || ''}</p>
            <p>Location: ${item.location.lat.toFixed(4)}, ${item.location.lng.toFixed(4)}</p>
          </div>
        `);
      return marker;
    });

    setMarkerLayers(newMarkerLayers);

    // Update map view when center changes
    if (center) {
      map.setView([center.lat, center.lng], zoom || 14);
      
      // Update or create center marker
      if (marker) {
        marker.setLatLng([center.lat, center.lng]);
      } else {
        const newMarker = L.marker([center.lat, center.lng]).addTo(map);
        setMarker(newMarker);
      }
    } else {
      // Remove center marker if no center
      if (marker) {
        marker.remove();
        setMarker(null);
      }
    }
  }, [center, zoom, markers]);

  useEffect(() => {
    if (!map || !isSelectable) return;

    const handleMapClick = async (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      
      // Update marker position
      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        const newMarker = L.marker([lat, lng]).addTo(map);
        setMarker(newMarker);
      }

      // Try to get address using Nominatim
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        
        const address = data.display_name || "Selected Location";
        
        if (onLocationSelect) {
          onLocationSelect({
            address,
            lat,
            lng
          });
        }
      } catch (error) {
        console.error("Geocoding error:", error);
        if (onLocationSelect) {
          onLocationSelect({
            address: "Selected Location",
            lat,
            lng
          });
        }
      }
    };

    if (isSelectable) {
      map.on('click', handleMapClick);
    }

    return () => {
      if (map) {
        map.off('click', handleMapClick);
      }
    };
  }, [map, marker, isSelectable, onLocationSelect]);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], 14);
          
          if (marker) {
            marker.setLatLng([latitude, longitude]);
          } else {
            const newMarker = L.marker([latitude, longitude]).addTo(map);
            setMarker(newMarker);
          }
          
          if (isSelectable && onLocationSelect) {
            onLocationSelect({
              address: "My Current Location",
              lat: latitude,
              lng: longitude
            });
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          borderRadius: '8px',
          zIndex: 0
        }} 
      />
      {isSelectable && (
        <button 
          onClick={handleLocateMe}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            background: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}
          title="Use my current location"
        >
          <FaMapMarkerAlt color="#4CAF50" />
        </button>
      )}
    </div>
  );
};

export default OSMapComponent;