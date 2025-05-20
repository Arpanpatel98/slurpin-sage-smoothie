import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import './ProductCustomization.css';

const ProductCustomization = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const [base, setBase] = useState('Regular Milk');
  const [quantity, setQuantity] = useState(1);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [selectedBoosters, setSelectedBoosters] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Default product if none provided
  const defaultProduct = {
    id: 'green-goddess',
    name: 'Green Goddess',
    image: 'greensmoothie.jpg',
    price: 299,
    rating: 5,
    reviewCount: 124
  };

  const currentProduct = product || defaultProduct;

  // Define toppings with whole number prices
  const toppings = [
    { id: 'granola', name: 'Organic Granola', description: 'Rich in fiber', price: 30 },
    { id: 'chia', name: 'Chia Seeds', description: 'Omega-3 rich', price: 25 },
    { id: 'cacao', name: 'Raw Cacao Nibs', description: 'Antioxidant boost', price: 35 },
    { id: 'coconut', name: 'Coconut Flakes', description: 'Good fats', price: 25 },
    { id: 'honey', name: 'Raw Honey Drizzle', description: 'Natural sweetener', price: 30 }
  ];

  // Define boosters with whole number prices
  const boosters = [
    { id: 'protein', name: 'Plant Protein', description: '20g protein boost', price: 50 },
    { id: 'collagen', name: 'Collagen Peptides', description: 'Skin & joint health', price: 60 },
    { id: 'spirulina', name: 'Spirulina', description: 'Nutrient-dense algae', price: 45 },
    { id: 'maca', name: 'Maca Powder', description: 'Energy & balance', price: 40 }
  ];

  const handleBaseChange = (newBase) => {
    setBase(newBase);
  };

  const handleToppingToggle = (topping) => {
    const currentToppings = [...selectedToppings];
    const index = currentToppings.findIndex(item => item.id === topping.id);
    
    if (index >= 0) {
      currentToppings.splice(index, 1);
      setSelectedToppings(currentToppings);
    } else if (currentToppings.length < 3) {
      currentToppings.push(topping);
      setSelectedToppings(currentToppings);
    }
  };

  const handleBoosterToggle = (booster) => {
    const currentBoosters = [...selectedBoosters];
    const index = currentBoosters.findIndex(item => item.id === booster.id);
    
    if (index >= 0) {
      currentBoosters.splice(index, 1);
      setSelectedBoosters(currentBoosters);
    } else if (currentBoosters.length < 2) {
      currentBoosters.push(booster);
      setSelectedBoosters(currentBoosters);
    }
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncreaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const handleAddToCart = () => {
    // Calculate total price
    let totalPrice = currentProduct.price;
    
    // Add toppings
    selectedToppings.forEach(topping => {
      totalPrice += topping.price;
    });
    
    // Add boosters
    selectedBoosters.forEach(booster => {
      totalPrice += booster.price;
    });
    
    const customizedProduct = {
      ...currentProduct,
      price: totalPrice,
      quantity: quantity,
      base: base,
      toppings: selectedToppings,
      boosters: selectedBoosters,
      specialInstructions: specialInstructions,
      customized: true
    };
    
    addToCart(customizedProduct);
    onClose();
  };

  const isToppingSelected = (id) => {
    return selectedToppings.some(topping => topping.id === id);
  };

  const isBoosterSelected = (id) => {
    return selectedBoosters.some(booster => booster.id === id);
  };

  // Generate star rating
  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, index) => (
      <span key={index} className={index < rating ? "star filled" : "star"}>★</span>
    ));
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    let basePrice = currentProduct.price;
    let boostersPrice = selectedBoosters.reduce((total, booster) => total + booster.price, 0);
    let toppingsPrice = selectedToppings.reduce((total, topping) => total + topping.price, 0);
    
    // Calculate total for single item
    let singleItemTotal = basePrice + boostersPrice + toppingsPrice;
    
    // Multiply by quantity
    return singleItemTotal * quantity;
  };

  return (
    <div className="customization-overlay" onClick={onClose}>
      <div className="customization-container" onClick={(e) => e.stopPropagation()}>
        <div className="customization-header">
          <h2>Customize Your Smoothie</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="product-info">
          <div className="product-image">
            <img 
              src={`/${currentProduct.image}`} 
              alt={currentProduct.name}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/greensmoothie.jpg";
              }}
            />
          </div>
          
          <div className="product-details">
            <h3>{currentProduct.name}</h3>
            <p className="product-base">{base}</p>
            <div className="product-rating">
              {renderStars(currentProduct.rating)}
              <span className="review-count">({currentProduct.reviewCount})</span>
            </div>
          </div>
        </div>
        
        <div className="customization-section">
          <h4>Base</h4>
          <div className="base-options">
            <button 
              className={`base-option ${base === 'Regular Milk' ? 'selected' : ''}`}
              onClick={() => handleBaseChange('Regular Milk')}
            >
              Regular Milk
            </button>
            <button 
              className={`base-option ${base === 'Coconut Milk' ? 'selected' : ''}`}
              onClick={() => handleBaseChange('Coconut Milk')}
            >
              Coconut Milk
            </button>
            <button 
              className={`base-option ${base === 'Almond Milk' ? 'selected' : ''}`}
              onClick={() => handleBaseChange('Almond Milk')}
            >
              Almond Milk
            </button>
            <button 
              className={`base-option ${base === 'Oat Milk' ? 'selected' : ''}`}
              onClick={() => handleBaseChange('Oat Milk')}
            >
              Oat Milk
            </button>
          </div>
        </div>
        
        <div className="customization-section">
          <div className="section-header2">
            <h4>Superfood Toppings</h4>
            <span className="selection-limit">Select up to 3</span>
          </div>
          <div className="toppings-list">
            {toppings.map(topping => (
              <div className="topping-item" key={topping.id}>
                <label className="checkbox-container">
                  <input 
                    type="checkbox" 
                    checked={isToppingSelected(topping.id)} 
                    onChange={() => handleToppingToggle(topping)}
                  />
                  <span className="checkmark"></span>
                  <div className="topping-info">
                    <span className="topping-name">{topping.name}</span>
                    <span className="topping-description">{topping.description}</span>
                  </div>
                  <span className="topping-price">+₹{topping.price}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="customization-section">
          <div className="section-header2">
            <h4>Nutritional Boosters</h4>
            <span className="selection-limit">Select up to 2</span>
          </div>
          <div className="boosters-list">
            {boosters.map(booster => (
              <div className="booster-item" key={booster.id}>
                <label className="checkbox-container">
                  <input 
                    type="checkbox" 
                    checked={isBoosterSelected(booster.id)} 
                    onChange={() => handleBoosterToggle(booster)}
                  />
                  <span className="checkmark"></span>
                  <div className="booster-info">
                    <span className="booster-name">{booster.name}</span>
                    <span className="booster-description">{booster.description}</span>
                  </div>
                  <span className="booster-price">+₹{booster.price}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="customization-section">
          <h4>Special Instructions</h4>
          <textarea 
            className="special-instructions" 
            placeholder="Any allergies or preferences?"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
          ></textarea>
        </div>
        
        <div className="quantity-section">
          <h4>Quantity</h4>
          <div className="product-quantity">
            <div className="product-info-label">
              {currentProduct.name}
            </div>
            <div className="quantity-controls">
              <button 
                className="quantity-btn decrease" 
                onClick={handleDecreaseQuantity}
                disabled={quantity <= 1}
              >
                −
              </button>
              <span className="quantity-value">{quantity}</span>
              <button 
                className="quantity-btn increase" 
                onClick={handleIncreaseQuantity}
              >
                +
              </button>
            </div>
          </div>
        </div>
        
        <div className="order-summary">
          <h4>Order Summary</h4>
          <div className="summary-item">
            <span className="summary-label">{currentProduct.name}</span>
            <span className="summary-price">₹{currentProduct.price}</span>
          </div>
          
          {selectedBoosters.length > 0 && (
            <div className="summary-item">
              <span className="summary-label">Nutritional Boosters</span>
              <span className="summary-price">₹{selectedBoosters.reduce((total, booster) => total + booster.price, 0)}</span>
            </div>
          )}
          
          {selectedToppings.length > 0 && (
            <div className="summary-item">
              <span className="summary-label">Toppings</span>
              <span className="summary-price">₹{selectedToppings.reduce((total, topping) => total + topping.price, 0)}</span>
            </div>
          )}
          
          <div className="summary-total">
            <span className="total-label">Total</span>
            <span className="total-price">₹{calculateTotalPrice()}</span>
          </div>
        </div>
        
        <div className="cart-button-container">
          <button 
            className="add-to-cart-button" 
            onClick={handleAddToCart}
          >
            Add to Cart - ₹{calculateTotalPrice()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCustomization; 