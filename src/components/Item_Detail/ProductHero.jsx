import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import ProductCustomization from '../ProductCustomization';
// import LoginSignupPage from './auth/LoginSignupPage'; // Uncomment when needed
import './product-hero copy.css';

const ProductHero = ({ category, productId }) => {
  const [product, setProduct] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showCustomization, setShowCustomization] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [stock, setStock] = useState(0);

  // Default image URL from Firebase Storage
  const DEFAULT_IMAGE_URL =
    'https://firebasestorage.googleapis.com/v0/b/slurpin-sage.firebasestorage.app/o/products%2FAll%2Fall.HEIC?alt=media&token=5e2ae9b9-bb7d-4c56-96a1-0a60986c1469';

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!category || !productId) {
          throw new Error(`Invalid parameters: category=${category}, productId=${productId}`);
        }
        const docRef = doc(db, `products/config/${category}/${productId}`);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          throw new Error(`Product not found at products/config/${category}/${productId}`);
        }
        const data = docSnap.data();
        return {
          id: docSnap.id,
          category,
          productName: data.productName || data.name || docSnap.id.replace(/-/g, ' ').toUpperCase(), // Try productName first, then name, then fallback to ID
          description: data.description || 'A refreshing blend of tropical flavors and nutrients.',
          price: data.price || 0,
          image: data.imageUrl || DEFAULT_IMAGE_URL, // Use imageUrl or default
          tags: data.tags || [],
          stock: data.stock || 0, // Add stock field
        };
      } catch (err) {
        console.error('Product fetch error:', {
          message: err.message,
          code: err.code,
          stack: err.stack,
          category,
          productId,
        });
        throw err;
      }
    };

    const fetchReviews = async () => {
      try {
        const reviewsRef = collection(db, 'product_reviews');
        const q = query(reviewsRef, where('productId', '==', productId));
        const querySnapshot = await getDocs(q);
        const allReviews = [];
        let totalRating = 0;

        querySnapshot.forEach((doc) => {
          const reviewData = doc.data();
          allReviews.push({ id: doc.id, ...reviewData });
          totalRating += reviewData.rating || 0;
        });

        return {
          averageRating: allReviews.length > 0 ? (totalRating / allReviews.length).toFixed(1) : 0,
          totalReviews: allReviews.length,
        };
      } catch (err) {
        console.error('Reviews fetch error:', {
          message: err.message,
          code: err.code,
          stack: err.stack,
          productId,
        });
        return { averageRating: 0, totalReviews: 0 };
      }
    };

    const fetchProductAndReviews = async () => {
      setLoading(true);
      setError(null);
      try {
        const productData = await fetchProduct();
        const reviewData = await fetchReviews();

        setProduct(productData);
        setStock(productData.stock); // Set stock state
        setAverageRating(reviewData.averageRating);
        setTotalReviews(reviewData.totalReviews);
      } catch (err) {
        setError(`Failed to load product details: ${err.message}`);
        setProduct({
          id: productId,
          category,
          productName: productId.replace(/-/g, ' ').toUpperCase(),
          description: 'A refreshing blend of tropical flavors and nutrients.',
          price: 500,
          image: DEFAULT_IMAGE_URL,
          tags: ['bestseller'],
          stock: 0,
        });
        setStock(0);
        setAverageRating(0);
        setTotalReviews(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndReviews();
  }, [category, productId]);

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < Math.min(10, stock)) {
      setQuantity(quantity + 1);
    }
  };

  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value, 10);
    if (newQuantity >= 1 && newQuantity <= Math.min(10, stock)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (!auth.currentUser) {
      setShowLoginModal(true);
      return;
    }
    setShowCustomization(true);
  };

  const handleCloseCustomization = () => {
    setShowCustomization(false);
  };

  if (loading) {
    return <div className="container_Item_des"><p>Loading...</p></div>;
  }

  if (error || !product) {
    return (
      <div className="container_Item_des">
        <p className="error_Item_des">{error || 'Product not found'}</p>
        <button className="retry-button_Item_des" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className="product-hero_Item_des">
      <div className="hero-pattern_Item_des"></div>
      <div className="container_Item_des">
        <div className="hero-content_Item_des">
          <div className="hero-image_Item_des">
            <div className="image-card_Item_des">
              {product.tags.includes('bestseller') && (
                <div className="bestseller-tag_Item_des">Bestseller</div>
              )}
              <div className="smoothie-placeholder_Item_des">
                <img
                  src={product.image}
                  alt={product.productName}
                  onError={(e) => {
                    e.target.onerror = null; // Prevent infinite loop
                    e.target.src = DEFAULT_IMAGE_URL; // Set default image
                    console.warn(`Failed to load image for ${product.productName}: ${product.image}`);
                  }}
                />
              </div>
            </div>
          </div>
          <div className="hero-details_Item_des">
            <h1 className="hero-title_Item_des">
              {product.productName.replace(/-/g, ' ').toUpperCase()}
            </h1>
            <div className="rating_Item_des">
              <svg className="star-icon_Product_Hero" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3 .921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784 .57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81 .588-1.81h3.461a1 1 0 00 .951-.69l1.07-3.292z" />
              </svg>
              <span className="rating-text_Item_des">
                {averageRating} ({totalReviews} reviews)
              </span>
            </div>
            <p className="hero-description_Item_des">{product.description}</p>
            <div className="price-section_Item_des">
              <span className="price_Item_des">₹{product.price}</span>
              {stock === 0 && (
                <div className="out-of-stock-container_Item_des">
                  <span className="out-of-stock-text_Item_des">Out of Stock</span>
                </div>
              )}
            </div>
            <div className="actions_Item_des">
              <div className="quantity_Item_des">
                <button 
                  className="quantity-btn_Item_des" 
                  onClick={handleDecrement}
                  disabled={stock === 0}
                >
                  -
                </button>
                <input
                  type="number"
                  className="quantity-input_Item_des"
                  value={quantity}
                  onChange={handleQuantityChange}
                  min="1"
                  max={Math.min(10, stock)}
                  disabled={stock === 0}
                />
                <button 
                  className="quantity-btn_Item_des" 
                  onClick={handleIncrement}
                  disabled={stock === 0}
                >
                  +
                </button>
              </div>
              <button 
                className={`add-to-cart_Item_des ${stock === 0 ? 'out-of-stock-btn' : ''}`}
                onClick={handleAddToCart}
                disabled={stock === 0}
              >
                <svg className="cart-icon_Item_des" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a .997 .997 0 00 .01 .042l1.358 5.43-.893 .892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00 .894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCustomization && (
        <ProductCustomization
          product={{
            ...product,
            name: product.productName,
            productId: product.id,
            category: product.category
          }}
          onClose={handleCloseCustomization}
        />
      )}

      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLoginModal(false)}>
              ×
            </button>
            {/* <LoginSignupPage
              onSuccess={() => {
                setShowLoginModal(false);
                setShowCustomization(true);
              }}
            /> */}
            <p>Please uncomment LoginSignupPage import when available.</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductHero;