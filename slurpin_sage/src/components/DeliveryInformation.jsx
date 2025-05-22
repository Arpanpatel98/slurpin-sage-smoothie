import React, { useState } from 'react';

export default function DeliveryInformation({ savedAddresses, selectedAddressId, setSelectedAddressId }) {
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newZip, setNewZip] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const toggleNewAddressForm = () => {
    setShowNewAddressForm(!showNewAddressForm);
    if (showNewAddressForm) {
      setNewStreet('');
      setNewCity('');
      setNewState('');
      setNewZip('');
      setNewEmail('');
      setNewFirstName('');
      setNewLastName('');
      setNewPhone('');
    }
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    const newAddress = {
      street: newStreet,
      city: newCity,
      state: newState,
      zip: newZip,
      email: newEmail,
      firstName: newFirstName,
      lastName: newLastName,
      phone: newPhone,
      id: Date.now(), // Simple unique ID
    };
    const updatedAddresses = [...savedAddresses, newAddress];
    localStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
    toggleNewAddressForm(); // Hide the form after saving
    // Reset all form fields
    setNewStreet('');
    setNewCity('');
    setNewState('');
    setNewZip('');
    setNewEmail('');
    setNewFirstName('');
    setNewLastName('');
    setNewPhone('');
  };

  return (
    <div className="cart-section delivery-address-section">
      <h2 className="cart-section-title">Delivery Information</h2>
      {savedAddresses.length > 0 ? (
        <div>
          <h4>Saved Addresses</h4>
          {savedAddresses.map(address => (
            <div 
              key={address.id} 
              className={`saved-address-block ${selectedAddressId === address.id ? 'selected-address' : ''}`}
            >
              <input
                type="radio"
                name="delivery-address"
                id={`address-${address.id}`}
                value={address.id}
                checked={selectedAddressId === address.id}
                onChange={() => setSelectedAddressId(address.id)}
              />
              <label htmlFor={`address-${address.id}`} className="saved-address-label">
                <p className="address-name">{address.firstName} {address.lastName}</p>
                <p className="address-email">{address.email}</p>
                <p className="address-phone">{address.phone}</p>
                <p className="address-street">{address.street}</p>
                <p className="address-city-state-zip">{address.city}, {address.state} {address.zip}</p>
              </label>
            </div>
          ))}
        </div>
      ) : (
        <p>No saved addresses. Add a new one below.</p>
      )}
      
      <button onClick={toggleNewAddressForm}>Add New Address</button>

      {showNewAddressForm && (
        <div className="new-address-form">
          <h4>Add New Address & Contact Information</h4>
          <form onSubmit={handleSaveAddress}>
            <div className="contact-row">
              <div className="contact-field">
                <label>First Name</label>
                <input 
                  type="text" 
                  placeholder="First Name" 
                  value={newFirstName} 
                  onChange={(e) => setNewFirstName(e.target.value)} 
                  required
                />
              </div>
              <div className="contact-field">
                <label>Last Name</label>
                <input 
                  type="text" 
                  placeholder="Last Name" 
                  value={newLastName} 
                  onChange={(e) => setNewLastName(e.target.value)} 
                  required
                />
              </div>
            </div>
            <div className="contact-row">
              <div className="contact-field">
                <label>Email Address</label>
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={newEmail} 
                  onChange={(e) => setNewEmail(e.target.value)} 
                  required
                />
              </div>
              <div className="contact-field">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="Phone Number" 
                  value={newPhone} 
                  onChange={(e) => setNewPhone(e.target.value)} 
                  required
                />
              </div>
            </div>
            <div className="contact-field">
              <label>Street Address</label>
              <input 
                type="text" 
                placeholder="Street Address" 
                value={newStreet} 
                onChange={(e) => setNewStreet(e.target.value)} 
                required
              />
            </div>
            <div className="contact-row">
              <div className="contact-field">
                <label>City</label>
                <input 
                  type="text" 
                  placeholder="City" 
                  value={newCity} 
                  onChange={(e) => setNewCity(e.target.value)} 
                  required
                />
              </div>
              <div className="contact-field">
                <label>State</label>
                <input 
                  type="text" 
                  placeholder="State" 
                  value={newState} 
                  onChange={(e) => setNewState(e.target.value)} 
                  required
                />
              </div>
              <div className="contact-field">
                <label>Zip Code</label>
                <input 
                  type="text" 
                  placeholder="Zip Code" 
                  value={newZip} 
                  onChange={(e) => setNewZip(e.target.value)} 
                  required
                />
              </div>
            </div>
            <div className="form-buttons">
              <button type="button" onClick={toggleNewAddressForm}>Cancel</button>
              <button type="submit">Save Information</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 