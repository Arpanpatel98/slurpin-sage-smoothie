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

function DeliveryForm() {
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

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize Leaflet map
    mapInstanceRef.current = L.map(mapRef.current).setView([SHOP_LOCATION.lat, SHOP_LOCATION.lon], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapInstanceRef.current);

    // Add shop marker
    L.marker([SHOP_LOCATION.lat, SHOP_LOCATION.lon], {
      icon: L.divIcon({ className: 'bg-red-500 w-4 h-4 rounded-full', html: '' }),
    })
      .addTo(mapInstanceRef.current)
      .bindPopup('Shop Location');

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

    // Cleanup map on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

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
    try {
      // Validate complete address
      if (!detailedAddress.trim()) {
        setMessage('Please enter your complete address');
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        setMessage('Please login to save your address');
        return;
      }

      const addressData = {
        userId: user.uid,
        coordinates: {
          lat: selectedAddress.lat,
          lon: selectedAddress.lon
        },
        displayName: selectedAddress.display_name,
        detailedAddress: detailedAddress.trim(),
        floor: floor.trim(),
        landmark: landmark.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Create a new document reference with auto-generated ID
      const deliveryAddressesRef = collection(db, 'delivery_addresses');
      const newAddressRef = doc(deliveryAddressesRef);
      
      // Store address in delivery_addresses collection with random ID
      await setDoc(newAddressRef, addressData);
      
      setMessage('Address saved successfully!');
      // You can add additional logic here, like moving to the next step
    } catch (error) {
      console.error('Error saving address:', error);
      setMessage('Error saving address. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4 text-center">Enter address details</h1>
      <p className="text-gray-600 mb-4">Select your location on the map or use your current location to check if you're within our delivery radius. Then, add detailed address information.</p>
      <div ref={mapRef} className="h-64 mb-4" style={{ height: '16rem' }}></div>
      {!selectedAddress && (
        <div className="space-y-4">
           <button
             type="button"
             onClick={handleGetLocation}
             className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:bg-green-300"
             disabled={isLoading}
           >
             {isLoading ? 'Checking...' : 'Use Current Location'}
           </button>
        </div>
      )}

      {selectedAddress && (
        <div className="mt-6 space-y-4">
           <div className="bg-gray-100 p-3 rounded-md">
              <p className="text-sm text-gray-700">Updated based on your exact map pin:</p>
              <p className="font-medium text-gray-800">{selectedAddress.display_name}</p>
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
          >
            Confirm address
          </button>
        </div>
      )}
      {message && (
        <p className={`mt-4 text-center ${message.includes('Sorry') ? 'text-red-500' : 'text-green-500'}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export default DeliveryForm;