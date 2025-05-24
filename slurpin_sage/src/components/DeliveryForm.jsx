import React, { useState, useEffect, useRef } from 'react';

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
  const [addressOptions, setAddressOptions] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
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
      setAddressOptions([]);
      setSelectedAddress(null);

      // Reverse geocode the clicked location
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        if (data.display_name) {
          setAddress(data.display_name);
          const distance = getDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lon, lat, lng);
          cacheAddress(data.display_name, { lat, lon: lng, display_name: data.display_name });
          setSelectedAddress({ lat, lon: lng, display_name: data.display_name });
          if (distance <= 3) {
            setMessage(`Selected location is within 3 km (Lat: ${lat.toFixed(6)}, Lon: ${lng.toFixed(6)}, Distance: ${distance.toFixed(2)} km). You can place your order!`);
          } else {
            setMessage(`Sorry, selected location is outside the 3 km delivery radius (Lat: ${lat.toFixed(6)}, Lon: ${lng.toFixed(6)}, Distance: ${distance.toFixed(2)} km).`);
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
                cacheAddress(data.display_name, { lat, lon: lng, display_name: data.display_name });
                setSelectedAddress({ lat, lon: lng, display_name: data.display_name });
                const distance = getDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lon, lat, lng);
                if (distance <= 3) {
                  setMessage(`Selected location is within 3 km (Lat: ${lat.toFixed(6)}, Lon: ${lng.toFixed(6)}, Distance: ${distance.toFixed(2)} km). You can place your order!`);
                } else {
                  setMessage(`Sorry, selected location is outside the 3 km delivery radius (Lat: ${lat.toFixed(6)}, Lon: ${lng.toFixed(6)}, Distance: ${distance.toFixed(2)} km).`);
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

  // Load cached addresses from localStorage
  const getCachedAddress = (query) => {
    const cached = localStorage.getItem(`geocode_${query}`);
    return cached ? JSON.parse(cached) : null;
  };

  // Cache geocoding result
  const cacheAddress = (query, result) => {
    localStorage.setItem(`geocode_${query}`, JSON.stringify(result));
  };

  // Handle address submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setAddressOptions([]);
    setSelectedAddress(null);

    // Append city/state/country for Indian addresses
    const query = `${address}, Anand, Gujarat, India`;
    const cached = getCachedAddress(query);

    if (cached) {
      setAddressOptions([cached]);
      setIsLoading(false);
      return;
    }

    try {
      // Geocode the address using Nominatim API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (data.length === 0) {
        setMessage('Address not found. Please try a more specific address (e.g., include street or area).');
        setIsLoading(false);
        return;
      }

      setAddressOptions(data);
      if (data.length === 1) {
        cacheAddress(query, data[0]);
        handleAddressSelection(data[0]);
      } else {
        setMessage('Multiple addresses found. Please select one.');
      }
      setIsLoading(false);
    } catch (error) {
      setMessage('Error fetching location. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle address selection from multiple options
  const handleAddressSelection = (addr) => {
    setSelectedAddress(addr);
    const distance = getDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lon, parseFloat(addr.lat), parseFloat(addr.lon));
    if (distance <= 3) {
      setMessage(`Address is within 3 km (Lat: ${parseFloat(addr.lat).toFixed(6)}, Lon: ${parseFloat(addr.lon).toFixed(6)}, Distance: ${distance.toFixed(2)} km). You can place your order!`);
    } else {
      setMessage(`Sorry, delivery is only available within 3 km of the shop (Lat: ${parseFloat(addr.lat).toFixed(6)}, Lon: ${parseFloat(addr.lon).toFixed(6)}, Distance: ${distance.toFixed(2)} km).`);
    }
    // Update map view and marker
    mapInstanceRef.current.setView([parseFloat(addr.lat), parseFloat(addr.lon)], 13);
    if (markerRef.current) {
      markerRef.current.setLatLng([parseFloat(addr.lat), parseFloat(addr.lon)]).setPopupContent(addr.display_name);
    } else {
      markerRef.current = L.marker([parseFloat(addr.lat), parseFloat(addr.lon)], { draggable: true })
        .addTo(mapInstanceRef.current)
        .bindPopup(addr.display_name);
      markerRef.current.on('dragend', async (e) => {
        const { lat, lng } = e.target.getLatLng();
        setIsLoading(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();
          setAddress(data.display_name || 'Unknown location');
          cacheAddress(data.display_name, { lat, lon: lng, display_name: data.display_name });
          setSelectedAddress({ lat, lon: lng, display_name: data.display_name });
          const distance = getDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lon, lat, lng);
          if (distance <= 3) {
            setMessage(`Selected location is within 3 km (Lat: ${lat.toFixed(6)}, Lon: ${lng.toFixed(6)}, Distance: ${distance.toFixed(2)} km). You can place your order!`);
          } else {
            setMessage(`Sorry, selected location is outside the 3 km delivery radius (Lat: ${lat.toFixed(6)}, Lon: ${lng.toFixed(6)}, Distance: ${distance.toFixed(2)} km).`);
          }
        } catch (error) {
          setMessage('Error fetching location. Please try again.');
        }
        setIsLoading(false);
      });
    }
  };

  // Handle getting current location with retry
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      setMessage('');
      setAddressOptions([]);
      setSelectedAddress(null);

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
                  cacheAddress(data.display_name, { lat, lon: lng, display_name: data.display_name });
                  setSelectedAddress({ lat, lon: lng, display_name: data.display_name });
                  const distance = getDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lon, lat, lng);
                  if (distance <= 3) {
                    setMessage(`Selected location is within 3 km (Lat: ${lat.toFixed(6)}, Lon: ${lng.toFixed(6)}, Distance: ${distance.toFixed(2)} km). You can place your order!`);
                  } else {
                    setMessage(`Sorry, selected location is outside the 3 km delivery radius (Lat: ${lat.toFixed(6)}, Lon: ${lng.toFixed(6)}, Distance: ${distance.toFixed(2)} km).`);
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
              cacheAddress(data.display_name, { lat: latitude, lon: longitude, display_name: data.display_name });
              setSelectedAddress({ lat: latitude, lon: longitude, display_name: data.display_name });
              const distance = getDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lon, latitude, longitude);
              if (distance <= 3) {
                setMessage(`Your current location is within 3 km (Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}, Distance: ${distance.toFixed(2)} km). You can place your order!`);
              } else {
                setMessage(`Sorry, your current location is outside the 3 km delivery radius (Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}, Distance: ${distance.toFixed(2)} km).`);
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
              setMessage('Unable to get accurate location. Please adjust the marker on the map or enter your address manually.');
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

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4 text-center">Drink Delivery</h1>
      <p className="text-gray-600 mb-4">Enter your delivery address (e.g., street or area in Anand) or select a location on the map to check if you're within 3 km of our shop.</p>
      <div ref={mapRef} className="h-64 mb-4" style={{ height: '16rem' }}></div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter delivery address (e.g., Vallabh Vidyanagar)"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
          disabled={isLoading}
        >
          {isLoading ? 'Checking...' : 'Check Address'}
        </button>
        <button
          type="button"
          onClick={handleGetLocation}
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:bg-green-300"
          disabled={isLoading}
        >
          {isLoading ? 'Checking...' : 'Use Current Location'}
        </button>
      </form>
      {addressOptions.length > 1 && (
        <div className="mt-4">
          <p className="text-gray-600">Select an address:</p>
          <ul className="list-disc pl-5">
            {addressOptions.map((addr, index) => (
              <li key={index} className="cursor-pointer text-blue-500 hover:underline" onClick={() => handleAddressSelection(addr)}>
                {addr.display_name}
              </li>
            ))}
          </ul>
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