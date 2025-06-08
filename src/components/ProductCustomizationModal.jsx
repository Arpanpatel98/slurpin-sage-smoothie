import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { collection, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import './ProductCustomization.css';

const ProductCustomizationModal = () => {
  const { addToCart, setShowCustomization, cartItems, showCustomization } = useCart();
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const isEditMode = showCustomization?.mode === 'edit';
  const product = showCustomization?.product;

  // State initialization with proper default values
  const [base, setBase] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [selectedBoosters, setSelectedBoosters] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [bases, setBases] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [boosters, setBoosters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default image URL from Firebase Storage
  const DEFAULT_IMAGE_URL =
    'https://firebasestorage.googleapis.com/v0/b/slurpin-sage.appspot.com/o/default%2Fdefault.jpg?alt=media';

  // Default product for add mode
  const defaultProduct = {
    id: 'morning-glory-smoothie',
    productId: 'morning-glory-smoothie',
    category: 'smoothies',
    name: 'Morning Glory Smoothie',
    image: DEFAULT_IMAGE_URL, // Use Firebase Storage default
    price: 500, // Matches seed.js (INR)
    rating: 4,
    reviewCount: 50,
  };

  const currentProduct = {
    ...defaultProduct,
    ...product,
    image: product?.image || DEFAULT_IMAGE_URL,
    price: Number(product?.price || defaultProduct.price),
  };

  // Initialize state with product data when in edit mode
  useEffect(() => {
    if (isEditMode && product) {
      setBase(product.base || '');
      setQuantity(product.quantity || 1);
      setSelectedToppings(product.toppings || []);
      setSelectedBoosters(product.boosters || []);
      setSpecialInstructions(product.specialInstructions || '');
    }
  }, [isEditMode, product]);

  // Calculate basePrice
  const basePrice = useMemo(() => {
    if (isEditMode) {
      const prevToppingsPrice = (product.toppings || []).reduce((sum, t) => sum + (t.price || 0), 0);
      const prevBoostersPrice = (product.boosters || []).reduce((sum, b) => sum + (b.price || 0), 0);
      return (Number(product.price) / product.quantity) - prevToppingsPrice - prevBoostersPrice;
    }
    return Number(currentProduct.price);
  }, [isEditMode, product, currentProduct.price]);

  // Fetch customizations
  useEffect(() => {
    const fetchCustomizations = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch bases
        const basesRef = collection(db, 'customization_options/config/bases');
        const basesSnapshot = await getDocs(basesRef);
        const basesData = basesSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          price: doc.data().price || 0,
        }));
        setBases(basesData);

        // Fetch toppings
        const toppingsRef = collection(db, 'customization_options/config/toppings');
        const toppingsSnapshot = await getDocs(toppingsRef);
        const toppingsData = toppingsSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          description: doc.data().description || '',
          price: doc.data().price || 0,
        }));
        setToppings(toppingsData);

        // Fetch boosters
        const boostersRef = collection(db, 'customization_options/config/boosters');
        const boostersSnapshot = await getDocs(boostersRef);
        const boostersData = boostersSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          description: doc.data().description || '',
          price: doc.data().price || 0,
        }));
        setBoosters(boostersData);

        // Preselect customizations in edit mode
        if (isEditMode && product) {
          const validBase = product.base && basesData.some((b) => b.name === product.base)
            ? product.base
            : basesData[0]?.name || '';
          setBase(validBase);

          const preselectedToppings = (product.toppings || [])
            .map((pt) => {
              const match = toppingsData.find((t) => t.id === pt.id);
              return match || (pt.id && pt.name ? { id: pt.id, name: pt.name, description: pt.description || '', price: pt.price || 0 } : null);
            })
            .filter(Boolean)
            .slice(0, 3);
          setSelectedToppings(preselectedToppings);

          const preselectedBoosters = (product.boosters || [])
            .map((pb) => {
              const match = boostersData.find((b) => b.id === pb.id);
              return match || (pb.id && pb.name ? { id: pb.id, name: pb.name, description: pb.description || '', price: pb.price || 0 } : null);
            })
            .filter(Boolean)
            .slice(0, 2);
          setSelectedBoosters(preselectedBoosters);
        } else if (basesData.length > 0) {
          setBase(basesData[0].name);
        }
      } catch (err) {
        console.error('Error fetching customizations:', err);
        setError('Failed to load customization options. Using defaults.');
        const fallbackBases = [
          { id: 'regular-milk', name: 'Regular Milk', price: 0 },
          { id: 'coconut-milk', name: 'Coconut Milk', price: 0 },
          { id: 'almond-milk', name: 'Almond Milk', price: 0 },
          { id: 'oat-milk', name: 'Oat Milk', price: 0 },
        ];
        const fallbackToppings = [
          { id: 'granola', name: 'Organic Granola', description: 'Rich in fiber', price: 30 },
          { id: 'chia', name: 'Chia Seeds', description: 'Omega-3 rich', price: 25 },
          { id: 'cacao', name: 'Raw Cacao Nibs', description: 'Antioxidant boost', price: 35 },
          { id: 'coconut', name: 'Coconut Flakes', description: 'Good fats', price: 25 },
          { id: 'honey', name: 'Raw Honey Drizzle', description: 'Natural sweetener', price: 30 },
        ];
        const fallbackBoosters = [
          { id: 'protein', name: 'Plant Protein', description: '20g protein boost', price: 50 },
          { id: 'collagen', name: 'Collagen Peptides', description: 'Skin & joint health', price: 60 },
          { id: 'spirulina', name: 'Spirulina', description: 'Nutrient-dense algae', price: 45 },
          { id: 'maca', name: 'Maca Powder', description: 'Energy & balance', price: 40 },
        ];
        setBases(fallbackBases);
        setToppings(fallbackToppings);
        setBoosters(fallbackBoosters);

        if (isEditMode) {
          const preselectedToppings = (product.toppings || [])
            .map((pt) => {
              const match = fallbackToppings.find((t) => t.id === pt.id);
              return match || (pt.id && pt.name ? { id: pt.id, name: pt.name, description: pt.description || '', price: pt.price || 0 } : null);
            })
            .filter(Boolean)
            .slice(0, 3);
          setSelectedToppings(preselectedToppings);

          const preselectedBoosters = (product.boosters || [])
            .map((pb) => {
              const match = fallbackBoosters.find((b) => b.id === pb.id);
              return match || (pb.id && pb.name ? { id: pb.id, name: pb.name, description: pb.description || '', price: pb.price || 0 } : null);
            })
            .filter(Boolean)
            .slice(0, 2);
          setSelectedBoosters(preselectedBoosters);

          const validBase = product.base && fallbackBases.some((b) => b.name === product.base)
            ? product.base
            : fallbackBases[0]?.name || '';
          setBase(validBase);
        } else {
          setBase(fallbackBases[0]?.name || '');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCustomizations();

    // Focus management
    if (modalRef.current) {
      modalRef.current.focus();
    }
  }, [isEditMode, product]);

  // Handle clicks outside modal
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowCustomization(null);
    }
  };

  const handleBaseChange = (newBase) => {
    setBase(newBase);
  };

  const handleToppingToggle = (topping) => {
    setSelectedToppings((prev) => {
      const isSelected = prev.some((t) => t.id === topping.id);
      if (isSelected) {
        return prev.filter((t) => t.id !== topping.id);
      }
      if (prev.length < 3) {
        return [...prev, topping];
      }
      return prev;
    });
  };

  const handleBoosterToggle = (booster) => {
    setSelectedBoosters((prev) => {
      const isSelected = prev.some((b) => b.id === booster.id);
      if (isSelected) {
        return prev.filter((b) => b.id !== booster.id);
      }
      if (prev.length < 2) {
        return [...prev, booster];
      }
      return prev;
    });
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncreaseQuantity = () => {
    if (quantity < 10) setQuantity(quantity + 1);
  };

  const handleSave = async () => {
    setError(null);

    if (!auth.currentUser) {
      setError('Please sign in to add items to your cart.');
      return;
    }

    if (!base) {
      setError('Please select a base for your smoothie.');
      return;
    }

    if (!currentProduct.id || !currentProduct.name) {
      setError('Invalid product data.');
      return;
    }

    const toppingsPrice = selectedToppings.reduce((sum, t) => sum + (t.price || 0), 0);
    const boostersPrice = selectedBoosters.reduce((sum, b) => sum + (b.price || 0), 0);
    const totalPrice = (basePrice + toppingsPrice + boostersPrice) * quantity;

    const customizedProduct = {
      productId: currentProduct.productId || currentProduct.id,
      category: currentProduct.category || 'smoothies',
      name: currentProduct.name,
      image: currentProduct.image, // Use Firebase Storage URL
      price: totalPrice,
      quantity,
      base,
      toppings: selectedToppings,
      boosters: selectedBoosters,
      specialInstructions: specialInstructions || '',
      customized: true,
      timestamp: serverTimestamp(),
    };

    try {
      if (isEditMode) {
        // Edit mode: Update existing item
        if (!product.id) throw new Error('Missing cart item ID');
        
        // Create a reference to the existing document
        const cartItemRef = doc(db, `cart_items/${auth.currentUser.uid}/items`, product.id);
        
        // Update the document with the new data
        await setDoc(cartItemRef, {
          ...customizedProduct,
          id: product.id, // Preserve the original ID
          timestamp: serverTimestamp(),
        }, { merge: true });

        // Update the cart context
        addToCart({ ...customizedProduct, id: product.id });
      } else {
        // Add mode: Check for existing item
        const existingItem = cartItems.find(
          (item) =>
            item.productId === customizedProduct.productId &&
            item.base === customizedProduct.base &&
            JSON.stringify(item.toppings) === JSON.stringify(customizedProduct.toppings) &&
            JSON.stringify(item.boosters) === JSON.stringify(customizedProduct.boosters) &&
            item.specialInstructions === customizedProduct.specialInstructions
        );

        if (existingItem) {
          // Update existing item
          const newQuantity = existingItem.quantity + quantity;
          const newPrice = (basePrice + toppingsPrice + boostersPrice) * newQuantity;
          const updatedProduct = {
            ...customizedProduct,
            quantity: newQuantity,
            price: newPrice,
          };
          const cartItemRef = doc(db, `cart_items/${auth.currentUser.uid}/items`, existingItem.id);
          await setDoc(cartItemRef, {
            ...updatedProduct,
            id: existingItem.id,
            timestamp: serverTimestamp(),
          }, { merge: true });
          addToCart({ ...updatedProduct, id: existingItem.id });
        } else {
          // Add new item
          const cartItemRef = doc(collection(db, `cart_items/${auth.currentUser.uid}/items`));
          const cartItemId = cartItemRef.id;
          await setDoc(cartItemRef, {
            ...customizedProduct,
            id: cartItemId,
            timestamp: serverTimestamp(),
          });
          addToCart({ ...customizedProduct, id: cartItemId });
        }
      }

      setShowCustomization(null);
      navigate('/cart');
    } catch (err) {
      console.error('Error saving to cart:', err);
      setError(`Failed to save: ${err.message || 'Unknown error'}`);
    }
  };

  const isToppingSelected = (id) => selectedToppings.some((t) => t.id === id);
  const isBoosterSelected = (id) => selectedBoosters.some((b) => b.id === id);

  const renderStars = (rating) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <span
          key={i}
          className={`star_productcustomizationmodal ${i < rating ? 'filled_productcustomizationmodal' : ''}`}
          aria-label={i < rating ? 'Filled star' : 'Empty star'}
        >
          ★
        </span>
      ));
  };

  const calculateTotalPrice = () => {
    const toppingsPrice = selectedToppings.reduce((sum, t) => sum + (t.price || 0), 0);
    const boostersPrice = selectedBoosters.reduce((sum, b) => sum + (b.price || 0), 0);
    return (basePrice + toppingsPrice + boostersPrice) * quantity;
  };

  if (loading) {
    return <div className="loading_productcustomizationmodal">Loading...</div>;
  }

  if (!currentProduct.id || !currentProduct.name) {
    return <div className="error_productcustomizationmodal">Invalid product data. Please try again.</div>;
  }

  return (
    <div
      className="overlay_productcustomizationmodal fade_in_global"
      onClick={handleOverlayClick}
      role="dialog"
      aria-labelledby="customization-title"
      aria-modal="true"
    >
      <div
        className="container_productcustomizationmodal"
        ref={modalRef}
        tabIndex="-1"
      >
        {error && <div className="error_productcustomizationmodal">{error}</div>}
        <div className="header_productcustomizationmodal">
          <h2 id="customization-title" className="title_productcustomizationmodal">
            {isEditMode ? `Edit ${currentProduct.name}` : `Customize ${currentProduct.name}`}
          </h2>
          <button
            className="close_button_productcustomizationmodal"
            onClick={() => setShowCustomization(null)}
            aria-label="Close customization modal"
          >
            ×
          </button>
        </div>

        <div className="product_info_productcustomizationmodal">
          <div className="product_image_productcustomizationmodal">
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
          <div className="product_details_productcustomizationmodal">
            <h3 className="product_name_productcustomizationmodal">{currentProduct.name}</h3>
            <p className="product_base_productcustomizationmodal">{base || 'Select a base'}</p>
            <div className="product_rating_productcustomizationmodal">
              {renderStars(currentProduct.rating)}
              <span className="review_count_productcustomizationmodal">({currentProduct.reviewCount})</span>
            </div>
          </div>
        </div>

        <div className="section_productcustomizationmodal">
          <h4 className="section_title_productcustomizationmodal">Base</h4>
          <div className="base_options_productcustomizationmodal">
            {bases.map((baseOption) => (
              <button
                key={baseOption.id}
                className={`base_option_productcustomizationmodal ${base === baseOption.name ? 'selected_productcustomizationmodal' : ''}`}
                onClick={() => handleBaseChange(baseOption.name)}
                aria-pressed={base === baseOption.name}
              >
                {baseOption.name}
              </button>
            ))}
          </div>
        </div>

        <div className="section_productcustomizationmodal">
          <div className="section_header_productcustomizationmodal">
            <h4 className="section_title_productcustomizationmodal">Superfood Toppings</h4>
            <span className="selection_limit_productcustomizationmodal">Select up to 3</span>
          </div>
          <div className="toppings_list_productcustomizationmodal">
            {toppings.map((topping) => (
              <div className="topping_item_productcustomizationmodal" key={topping.id}>
                <label className="checkbox_container_productcustomizationmodal">
                  <input
                    type="checkbox"
                    checked={isToppingSelected(topping.id)}
                    onChange={() => handleToppingToggle(topping)}
                    disabled={!isToppingSelected(topping.id) && selectedToppings.length >= 3}
                    aria-label={`Toggle ${topping.name}`}
                  />
                  <span className="checkmark_productcustomizationmodal"></span>
                  <div className="topping_info_productcustomizationmodal">
                    <span className="topping_name_productcustomizationmodal">{topping.name}</span>
                    <span className="topping_description_productcustomizationmodal">{topping.description}</span>
                  </div>
                  <span className="topping_price_productcustomizationmodal">+₹{topping.price.toFixed(2)}</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="section_productcustomizationmodal">
          <div className="section_header_productcustomizationmodal">
            <h4 className="section_title_productcustomizationmodal">Nutritional Boosters</h4>
            <span className="selection_limit_productcustomizationmodal">Select up to 2</span>
          </div>
          <div className="boosters_list_productcustomizationmodal">
            {boosters.map((booster) => (
              <div className="booster_item_productcustomizationmodal" key={booster.id}>
                <label className="checkbox_container_productcustomizationmodal">
                  <input
                    type="checkbox"
                    checked={isBoosterSelected(booster.id)}
                    onChange={() => handleBoosterToggle(booster)}
                    disabled={!isBoosterSelected(booster.id) && selectedBoosters.length >= 2}
                    aria-label={`Toggle ${booster.name}`}
                  />
                  <span className="checkmark_productcustomizationmodal"></span>
                  <div className="booster_info_productcustomizationmodal">
                    <span className="booster_name_productcustomizationmodal">{booster.name}</span>
                    <span className="booster_description_productcustomizationmodal">{booster.description}</span>
                  </div>
                  <span className="booster_price_productcustomizationmodal">+₹{booster.price.toFixed(2)}</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="section_productcustomizationmodal">
          <h4 className="section_title_productcustomizationmodal">Special Instructions</h4>
          <textarea
            className="special_instructions_productcustomizationmodal"
            placeholder="Any allergies or preferences?"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            aria-label="Special instructions"
          />
        </div>

        <div className="quantity_section_productcustomizationmodal">
          <h4 className="section_title_productcustomizationmodal">Quantity</h4>
          <div className="product_quantity_productcustomizationmodal">
            <div className="product_info_label_productcustomizationmodal">{currentProduct.name}</div>
            <div className="quantity_controls_productcustomizationmodal">
              <button
                className="quantity_button_productcustomizationmodal decrease_productcustomizationmodal"
                onClick={handleDecreaseQuantity}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="quantity_value_productcustomizationmodal">{quantity}</span>
              <button
                className="quantity_button_productcustomizationmodal increase_productcustomizationmodal"
                onClick={handleIncreaseQuantity}
                disabled={quantity >= 10}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="order_summary_productcustomizationmodal">
          <h4 className="section_title_productcustomizationmodal">Order Summary</h4>
          <div className="summary_item_productcustomizationmodal">
            <span className="summary_label_productcustomizationmodal">{currentProduct.name}</span>
            <span className="summary_price_productcustomizationmodal">₹{Number(currentProduct.price).toFixed(2)}</span>
          </div>
          {selectedToppings.length > 0 && (
            <div className="summary_item_productcustomizationmodal">
              <span className="summary_label_productcustomizationmodal">Toppings</span>
              <span className="summary_price_productcustomizationmodal">
                ₹{selectedToppings.reduce((sum, t) => sum + (t.price || 0), 0).toFixed(2)}
              </span>
            </div>
          )}
          {selectedBoosters.length > 0 && (
            <div className="summary_item_productcustomizationmodal">
              <span className="summary_label_productcustomizationmodal">Nutritional Boosters</span>
              <span className="summary_price_productcustomizationmodal">
                ₹{selectedBoosters.reduce((sum, b) => sum + (b.price || 0), 0).toFixed(2)}
              </span>
            </div>
          )}
          <div className="summary_total_productcustomizationmodal">
            <span className="total_label_productcustomizationmodal">Total</span>
            <span className="total_price_productcustomizationmodal">₹{calculateTotalPrice().toFixed(2)}</span>
          </div>
        </div>

        <div className="cart_button_container_productcustomizationmodal">
          <button
            className="add_to_cart_button_productcustomizationmodal"
            onClick={handleSave}
            aria-label={isEditMode ? 'Update cart' : 'Add to cart'}
          >
            {isEditMode ? `Update Cart - ₹${calculateTotalPrice().toFixed(2)}` : `Add to Cart - ₹${calculateTotalPrice().toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCustomizationModal;