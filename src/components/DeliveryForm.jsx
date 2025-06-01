import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db, auth } from '../firebase';

// Shop's coordinates (near Anand, Gujarat, India)
const SHOP_LOCATION = { lat: 22.6029671, lon: 72.819893 };

// Haversine formula to calculate distance between two points (in kilometers)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function DeliveryForm({ onAddressAdded, existingAddress, onCancel }) {
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [detailedAddress, setDetailedAddress] = useState('');
  const [floor, setFloor] = useState('');
  const [landmark, setLandmark] = useState('');

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Initialize form with existing address data if editing
  useEffect(() => {
    if (existingAddress) {
      setAddress(existingAddress.detailedAddress || '');
      setDetailedAddress(existingAddress.detailedAddress || '');
      setFloor(existingAddress.floor || '');
      setLandmark(existingAddress.landmark || '');
      setSelectedAddress({
        lat: existingAddress.lat,
        lon: existingAddress.lon,
        display_name: existingAddress.detailedAddress
      });
    }
  }, [existingAddress]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up existing map instance if it exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }

    // Initialize Leaflet map
    const initialLat = existingAddress?.lat || SHOP_LOCATION.lat;
    const initialLon = existingAddress?.lon || SHOP_LOCATION.lon;
    const initialZoom = existingAddress ? 15 : 13;

    try {
      mapInstanceRef.current = L.map(mapRef.current).setView([initialLat, initialLon], initialZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapInstanceRef.current);

    // Add shop marker
    L.marker([SHOP_LOCATION.lat, SHOP_LOCATION.lon], {
      icon: L.divIcon({ className: 'bg-red-500 w-4 h-4 rounded-full', html: '' }),
    })
      .addTo(mapInstanceRef.current)
      .bindPopup('Shop Location');

      // If editing existing address and coordinates are valid, add marker at that location
      if (existingAddress && typeof existingAddress.lat === 'number' && typeof existingAddress.lon === 'number') {
        markerRef.current = L.marker([existingAddress.lat, existingAddress.lon], { draggable: true })
          .addTo(mapInstanceRef.current)
          .bindPopup(existingAddress.detailedAddress);
      }

    // Handle map click to set marker
    mapInstanceRef.current.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      setIsLoading(true);
      setMessage('');
      setSelectedAddress(null);
      setDetailedAddress('');
      setFloor('');
      setLandmark('');

      // Reverse geocode the clicked location
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        if (data.display_name) {
          setAddress(data.display_name);
          const distance = getDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lon, lat, lng);
          setSelectedAddress({ lat, lon: lng, display_name: data.display_name });
          if (distance <= 3) {
            setMessage(`Selected location is within 3 km (Distance: ${distance.toFixed(2)} km). You can place your order!`);
          } else {
            setMessage(`Sorry, selected location is outside the 3 km delivery radius (Distance: ${distance.toFixed(2)} km).`);
          }
          // Update marker
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]).setPopupContent(data.display_name);
          } else {
            markerRef.current = L.marker([lat, lng], { draggable: true })
              .addTo(mapInstanceRef.current)
              .bindPopup(data.display_name);
            // Handle marker drag
            markerRef.current.on('dragend', async (e) => {
              const { lat, lng } = e.target.getLatLng();
              setIsLoading(true);
              try {
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
                );
                const data = await response.json();
                setAddress(data.display_name || 'Unknown location');
                setSelectedAddress({ lat, lon: lng, display_name: data.display_name });
                setDetailedAddress(data.display_name || '');
                const distance = getDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lon, lat, lng);
                if (distance <= 3) {
                  setMessage(`Selected location is within 3 km (Distance: ${distance.toFixed(2)} km). You can place your order!`);
                } else {
                  setMessage(`Sorry, selected location is outside the 3 km delivery radius (Distance: ${distance.toFixed(2)} km).`);
                }
              } catch (error) {
                setMessage('Error fetching location. Please try again.');
              }
              setIsLoading(false);
            });
          }
        } else {
          setMessage('Unable to find address for this location.');
        }
      } catch (error) {
        setMessage('Error fetching location. Please try again.');
      }
      setIsLoading(false);
    });
    } catch (error) {
      console.error('Error initializing map:', error);
      setMessage('Error initializing map. Please refresh the page.');
    }

    // Cleanup map on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [existingAddress]);

  // Handle getting current location with retry
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      setMessage('');
      setSelectedAddress(null);
      setDetailedAddress('');
      setFloor('');
      setLandmark('');

      const tryGeolocation = (attempts = 5, delay = 1000) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            mapInstanceRef.current.setView([latitude, longitude], 15);
            if (markerRef.current) {
              markerRef.current.setLatLng([latitude, longitude]);
            } else {
              markerRef.current = L.marker([latitude, longitude], { draggable: true })
                .addTo(mapInstanceRef.current)
                .bindPopup('Your location');
              markerRef.current.on('dragend', async (e) => {
                const { lat, lng } = e.target.getLatLng();
                setIsLoading(true);
                try {
                  const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
                  );
                  const data = await response.json();
                  setAddress(data.display_name || 'Unknown location');
                  setSelectedAddress({ lat, lon: lng, display_name: data.display_name });
                  setDetailedAddress(data.display_name || '');
                  const distance = getDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lon, lat, lng);
                  if (distance <= 3) {
                    setMessage(`Selected location is within 3 km (Distance: ${distance.toFixed(2)} km). You can place your order!`);
                  } else {
                    setMessage(`Sorry, selected location is outside the 3 km delivery radius (Distance: ${distance.toFixed(2)} km).`);
                  }
                } catch (error) {
                  setMessage('Error fetching location. Please try again.');
                }
                setIsLoading(false);
              });
            }
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              );
              const data = await response.json();
              setAddress(data.display_name || 'Unknown location');
              setSelectedAddress({ lat: latitude, lon: longitude, display_name: data.display_name });
              setDetailedAddress(data.display_name || '');
              const distance = getDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lon, latitude, longitude);
              if (distance <= 3) {
                setMessage(`Your current location is within 3 km (Distance: ${distance.toFixed(2)} km). You can place your order!`);
              } else {
                setMessage(`Sorry, your current location is outside the 3 km delivery radius (Distance: ${distance.toFixed(2)} km).`);
              }
            } catch (error) {
              setMessage('Error fetching location. Please try again.');
            }
            setIsLoading(false);
          },
          (error) => {
            if (attempts > 1) {
              setTimeout(() => tryGeolocation(attempts - 1, delay * 2), delay);
            } else {
              setMessage('Unable to get accurate location. Please adjust the marker on the map or use manual address entry.');
              mapInstanceRef.current.setView([SHOP_LOCATION.lat, SHOP_LOCATION.lon], 13);
              setIsLoading(false);
            }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      };

      tryGeolocation();
    } else {
      setMessage('Geolocation is not supported by your browser. Please select a location on the map.');
      mapInstanceRef.current.setView([SHOP_LOCATION.lat, SHOP_LOCATION.lon], 13);
    }
  };

  const handleConfirmAddress = async () => {
    if (!selectedAddress || !detailedAddress) {
      setMessage('Please select a location and provide a detailed address.');
      return;
    }

    const distance = getDistance(
      SHOP_LOCATION.lat,
      SHOP_LOCATION.lon,
      selectedAddress.lat,
      selectedAddress.lon
    );

    if (distance > 3) {
      setMessage('Sorry, the selected location is outside our delivery radius.');
      return;
    }

    try {
      setIsLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setMessage('Please sign in to save your address.');
        return;
      }

      const addressData = {
        userId: user.uid,
        lat: selectedAddress.lat,
        lon: selectedAddress.lon,
        detailedAddress,
        floor,
        landmark,
        displayName: detailedAddress.split(',')[0], // Use first part of address as display name
        createdAt: existingAddress ? existingAddress.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (existingAddress) {
        // Update existing address
        await setDoc(doc(db, 'delivery_addresses', existingAddress.id), addressData);
      } else {
        // Add new address
        const newAddressRef = doc(collection(db, 'delivery_addresses'));
        await setDoc(newAddressRef, addressData);
      }

      setMessage('Address saved successfully!');
      onAddressAdded();
    } catch (error) {
      console.error('Error saving address:', error);
      setMessage('Error saving address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4 text-center">
        {existingAddress ? 'Edit Delivery Address' : 'Add New Address'}
      </h1>
      <p className="text-gray-600 mb-4">
        {existingAddress 
          ? 'Update your delivery address details below.'
          : 'Select your location on the map or use your current location to check if you\'re within our delivery radius. Then, add detailed address information.'}
      </p>
      
      <div ref={mapRef} className="h-64 mb-4 rounded-lg overflow-hidden" style={{ height: '16rem' }}></div>
      
      {!selectedAddress && !existingAddress && (
        <div className="space-y-4">
           <button
             type="button"
             onClick={handleGetLocation}
             className="w-full bg-[#137B3B] text-white p-2 rounded hover:bg-[#0f5c2c] disabled:bg-[#c8e6d3]"
             disabled={isLoading}
           >
             {isLoading ? 'Checking...' : 'Use Current Location'}
           </button>
        </div>
      )}

      {(selectedAddress || existingAddress) && (
        <div className="mt-6 space-y-4">
           <div className="bg-gray-100 p-3 rounded-md">
              <p className="text-sm text-gray-700">Updated based on your exact map pin:</p>
            <p className="font-medium text-gray-800">{selectedAddress?.display_name || existingAddress?.detailedAddress}</p>
           </div>
          
          <div>
            <input
              type="text"
              value={detailedAddress}
              onChange={(e) => setDetailedAddress(e.target.value)}
              placeholder="Complete Address *"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
              required
            />
          </div>
          
          <div>
            <input
              type="text"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="Floor (Optional)"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
            />
          </div>
          
          <div>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="Landmark (Optional)"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
            />
          </div>
          
          <button
            onClick={handleConfirmAddress}
            className="w-full bg-sage-500 text-white p-3 rounded-lg font-semibold hover:bg-sage-600 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : existingAddress ? 'Update Address' : 'Confirm Address'}
          </button>
        </div>
      )}

      {message && (
        <p className={`mt-4 text-center ${message.includes('Sorry') || message.includes('Error') ? 'text-red-500' : 'text-[#137B3B]'}`}>
          {message}
        </p>
      )}

      {onCancel && (
        <button
          onClick={onCancel}
          className="w-full mt-4 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

export default DeliveryForm;