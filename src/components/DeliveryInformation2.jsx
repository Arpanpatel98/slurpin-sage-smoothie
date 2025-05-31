
// const shopLocation = { lat: 22.773596, lng: 73.613884 };
// const maxDeliveryRadius = 10000;

// export function initializeAutocomplete(inputRef, autocompleteRef, onPlaceSelected) {
//   if (window.google && inputRef.current) {
//     autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
//       types: ['address'],
//       componentRestrictions: { country: 'in' },
//       fields: ['address_components', 'formatted_address', 'geometry', 'place_id'],
//     });

//     autocompleteRef.current.addListener('place_changed', () => {
//       const place = autocompleteRef.current.getPlace();
//       onPlaceSelected(place);
//     });
//   }
// }

// export async function validateAddressAndCheckDistance(place, setMessage, setIsOrderEnabled) {
//   const address = place.formatted_address;

//   try {
//     const response = await fetch(`https://addressvalidation.googleapis.com/v1:validateAddress?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         address: { addressLines: [address] },
//         enableUspsCass: false,
//       }),
//     });
//     const data = await response.json();
//     const validationResult = data.result.address;
//     const geocode = data.result.geocode;

//     if (data.result.verdict.validationGranularity !== 'PREMISE') {
//       setMessage('Address is not specific enough. Please provide a complete address.');
//       setIsOrderEnabled(false);
//       return;
//     }

//     const userLocation = {
//       lat: geocode.location.latitude,
//       lng: geocode.location.longitude,
//     };

//     const service = new window.google.maps.DistanceMatrixService();
//     service.getDistanceMatrix(
//       {
//         origins: [shopLocation],
//         destinations: [userLocation],
//         travelMode: 'DRIVING',
//         unitSystem: window.google.maps.UnitSystem.METRIC,
//       },
//       (response, status) => {
//         if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
//           const distance = response.rows[0].elements[0].distance.value;
//           if (distance <= maxDeliveryRadius) {
//             setMessage(`Delivery is available to ${address} (${(distance / 1000).toFixed(2)} km).`);
//             setIsOrderEnabled(true);
//           } else {
//             setMessage(`Sorry, delivery is not available to ${address} (${(distance / 1000).toFixed(2)} km). Only addresses within 10km are eligible.`);
//             setIsOrderEnabled(false);
//           }
//         } else {
//           setMessage('Unable to calculate distance. Please try another address.');
//           setIsOrderEnabled(false);
//         }
//       }
//     );
//   } catch (error) {
//     setMessage('Error validating address. Please try again.');
//     setIsOrderEnabled(false);
//   }
// }
