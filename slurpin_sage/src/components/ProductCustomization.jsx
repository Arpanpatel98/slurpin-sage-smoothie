import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { collection, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import './ProductCustomization.css';

const ProductCustomization = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const isEditMode = product && product.customized;

  // Initialize state with preselected customizations for edit mode
  const [base, setBase] = useState(isEditMode ? product.base : '');
  const [quantity, setQuantity] = useState(isEditMode ? product.quantity : 1);
  const [selectedToppings, setSelectedToppings] = useState(isEditMode ? product.toppings : []);
  const [selectedBoosters, setSelectedBoosters] = useState(isEditMode ? product.boosters : []);
  const [specialInstructions, setSpecialInstructions] = useState(
    isEditMode ? product.specialInstructions || '' : ''
  );
  const [bases, setBases] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [boosters, setBoosters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default image URL from Firebase Storage
  const DEFAULT_IMAGE_URL =
    'https://firebasestorage.googleapis.com/v0/b/slurpin-sage.firebasestorage.app/o/products%2FAll%2Fall.HEIC?alt=media&token=5e2ae9b9-bb7d-4c56-96a1-0a60986c1469';

  // Default product
  const defaultProduct = {
    id: 'morning-glory-smoothie',
    category: 'smoothies',
    name: 'MORNING GLORY SMOOTHIE',
    image: DEFAULT_IMAGE_URL, // Use Firebase Storage default
    price: 500, // Matches seed.js
    rating: 4,
    reviewCount: 50,
  };

  const currentProduct = {
    ...defaultProduct,
    ...product,
    image: product?.image || DEFAULT_IMAGE_URL, // Ensure image is always a Firebase URL
  };

  useEffect(() => {
    const fetchCustomizations = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch bases
        const basesRef = collection(db, 'customization_options/config/bases');
        const basesSnapshot = await getDocs(basesRef);
        const basesData = basesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setBases(basesData);

        // Fetch toppings
        const toppingsRef = collection(db, 'customization_options/config/toppings');
        const toppingsSnapshot = await getDocs(toppingsRef);
        const toppingsData = toppingsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setToppings(toppingsData);

        // Fetch boosters
        const boostersRef = collection(db, 'customization_options/config/boosters');
        const boostersSnapshot = await getDocs(boostersRef);
        const boostersData = boostersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setBoosters(boostersData);

        // Set default base only if not in edit mode
        if (!isEditMode && basesData.length > 0) {
          setBase(basesData[0].name);
        }
      } catch (err) {
        console.error('Error fetching customizations:', err);
        setError('Failed to load customization options. Using defaults.');
        // Fallback data
        setBases([
          { id: 'regular-milk', name: 'Regular Milk', price: 0 },
          { id: 'coconut-milk', name: 'Coconut Milk', price: 0 },
          { id: 'almond-milk', name: 'Almond Milk', price: 0 },
          { id: 'oat-milk', name: 'Oat Milk', price: 0 },
        ]);
        setToppings([
          { id: 'granola', name: 'Organic Granola', description: 'Rich in fiber', price: 30 },
          { id: 'chia', name: 'Chia Seeds', description: 'Omega-3 rich', price: 25 },
          { id: 'cacao', name: 'Raw Cacao Nibs', description: 'Antioxidant boost', price: 35 },
          { id: 'coconut', name: 'Coconut Flakes', description: 'Good fats', price: 25 },
          { id: 'honey', name: 'Raw Honey Drizzle', description: 'Natural sweetener', price: 30 },
        ]);
        setBoosters([
          { id: 'protein', name: 'Plant Protein', description: '20g protein boost', price: 50 },
          { id: 'collagen', name: 'Collagen Peptides', description: 'Skin & joint health', price: 60 },
          { id: 'spirulina', name: 'Spirulina', description: 'Nutrient-dense algae', price: 45 },
          { id: 'maca', name: 'Maca Powder', description: 'Energy & balance', price: 40 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomizations();
  }, [isEditMode]);

  const handleBaseChange = (newBase) => {
    setBase(newBase);
  };

  const handleToppingToggle = (topping) => {
    const currentToppings = [...selectedToppings];
    const index = currentToppings.findIndex((item) => item.id === topping.id);

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
    const index = currentBoosters.findIndex((item) => item.id === booster.id);

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

  const handleAddToCart = async () => {
    if (!auth.currentUser) {
      setError('Please sign in to add items to your cart.');
      return;
    }

    if (!base) {
      setError('Please select a base for your smoothie.');
      return;
    }

    // Calculate total price
    let totalPrice = currentProduct.price;
    selectedToppings.forEach((topping) => (totalPrice += topping.price));
    selectedBoosters.forEach((booster) => (totalPrice += booster.price));
    totalPrice *= quantity;

    const customizedProduct = {
      productId: currentProduct.id,
      category: currentProduct.category || 'smoothies',
      name: currentProduct.name,
      price: totalPrice,
      quantity,
      base,
      toppings: selectedToppings,
      boosters: selectedBoosters,
      specialInstructions,
      customized: true,
      image: currentProduct.image, // Include image for cart
      timestamp: serverTimestamp(),
    };

    try {
      // Store in Firestore
      const cartItemRef = isEditMode
        ? doc(db, `cart_items/${auth.currentUser.uid}/items`, currentProduct.id)
        : doc(collection(db, `cart_items/${auth.currentUser.uid}/items`));
      await setDoc(cartItemRef, customizedProduct, { merge: isEditMode });

      // Add to cart context
      addToCart({ ...customizedProduct, id: cartItemRef.id });
      onClose();
    } catch (err) {
      console.error('Error saving to cart:', err);
      setError('Failed to add to cart. Please try again.');
    }
  };

  const isToppingSelected = (id) => {
    return selectedToppings.some((topping) => topping.id === id);
  };

  const isBoosterSelected = (id) => {
    return selectedBoosters.some((booster) => booster.id === id);
  };

  const renderStars = (rating) => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <span key={index} className={index < rating ? 'star filled' : 'star'}>
          ★
        </span>
      ));
  };

  const calculateTotalPrice = () => {
    let basePrice = currentProduct.price;
    let boostersPrice = selectedBoosters.reduce((total, booster) => total + booster.price, 0);
    let toppingsPrice = selectedToppings.reduce((total, topping) => total + topping.price, 0);
    return (basePrice + boostersPrice + toppingsPrice) * quantity;
  };

  if (loading) {
    return <div className="customization-loading">Loading customization options...</div>;
  }

  return (
    <div className="customization-overlay" onClick={onClose}>
      <div className="customization-container" onClick={(e) => e.stopPropagation()}>
        {error && <div className="customization-error">{error}</div>}
        <div className="customization-header">
          <h2>Customize Your {currentProduct.name}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="product-info">
          <div className="product-image">
            <img
              src={currentProduct.image}
              alt={currentProduct.name}
              onError={(e) => {
                e.target.onerror = null; // Prevent infinite loop
                e.target.src = DEFAULT_IMAGE_URL; // Set default image
                console.warn(`Failed to load image for ${currentProduct.name}: ${currentProduct.image}`);
              }}
            />
          </div>

          <div className="product-details">
            <h3>{currentProduct.name}</h3>
            <p className="product-base">{base || 'Select a base'}</p>
            <div className="product-rating">
              {renderStars(currentProduct.rating)}
              <span className="review-count">({currentProduct.reviewCount})</span>
            </div>
          </div>
        </div>

        <div className="customization-section">
          <h4>Base</h4>
          <div className="base-options">
            {bases.map((baseOption) => (
              <button
                key={baseOption.id}
                className={`base-option ${base === baseOption.name ? 'selected' : ''}`}
                onClick={() => handleBaseChange(baseOption.name)}
              >
                {baseOption.name}
              </button>
            ))}
          </div>
        </div>

        <div className="customization-section">
          <div className="section-header2">
            <h4>Superfood Toppings</h4>
            <span className="selection-limit">Select up to 3</span>
          </div>
          <div className="toppings-list">
            {toppings.map((topping) => (
              <div className="topping-item" key={topping.id}>
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={isToppingSelected(topping.id)}
                    onChange={() => handleToppingToggle(topping)}
                    disabled={!isToppingSelected(topping.id) && selectedToppings.length >= 3}
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
            {boosters.map((booster) => (
              <div className="booster-item" key={booster.id}>
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={isBoosterSelected(booster.id)}
                    onChange={() => handleBoosterToggle(booster)}
                    disabled={!isBoosterSelected(booster.id) && selectedBoosters.length >= 2}
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
            <div className="product-info-label">{currentProduct.name}</div>
            <div className="quantity-controls">
              <button
                className="quantity-btn decrease"
                onClick={handleDecreaseQuantity}
                disabled={quantity <= 1}
              >
                −
              </button>
              <span className="quantity-value">{quantity}</span>
              <button className="quantity-btn increase" onClick={handleIncreaseQuantity}>
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
              <span className="summary-price">
                ₹{selectedBoosters.reduce((total, booster) => total + booster.price, 0)}
              </span>
            </div>
          )}

          {selectedToppings.length > 0 && (
            <div className="summary-item">
              <span className="summary-label">Toppings</span>
              <span className="summary-price">
                ₹{selectedToppings.reduce((total, topping) => total + topping.price, 0)}
              </span>
            </div>
          )}

          <div className="summary-total">
            <span className="total-label">Total</span>
            <span className="total-price">₹{calculateTotalPrice()}</span>
          </div>
        </div>

        <div className="cart-button-container">
          <button className="add-to-cart-button" onClick={handleAddToCart}>
            {isEditMode ? 'Update Cart' : 'Add to Cart'} - ₹{calculateTotalPrice()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCustomization;