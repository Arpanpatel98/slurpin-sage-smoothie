import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
// import ProductCustomization from './ProductCustomization';
// import LoginSignupPage from './auth/LoginSignupPage';
import './product-hero copy.css';

const ProductHero = ({ category, productId }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCustomization, setShowCustomization] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, `products/config/${category}/${productId}`);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          throw new Error('Product not found');
        }
        const data = docSnap.data();
        const imageMap = {
          'morning-glory-smoothie': 'greensmoothie.jpg',
          'chocolate-delight': 'chocolate.jpg',
          'acai-bowl': 'acai.jpg',
          'tropical-paradise': 'tropical.jpg'
        };
        setProduct({
          id: docSnap.id,
          category,
          name: data.productName
            ? data.productName.replace(/-/g, ' ').toUpperCase()
            : docSnap.id.replace(/-/g, ' ').toUpperCase(),
          ingredients: Array.isArray(data.ingredients)
            ? data.ingredients.join(', ')
            : 'Ingredients not available',
          price: data.price || 0,
          image: imageMap[docSnap.id] || 'greensmoothie.jpg',
          rating: 5,
          reviewCount: 124
        });
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product details.');
        setProduct({
          id: 'morning-glory-smoothie',
          category: 'smoothies',
          name: 'MORNING GLORY SMOOTHIE',
          ingredients: 'Apple, Pineapple, Spinach, Shredded Coconut, Dates, Cinnamon Powder, Lemon Juice',
          price: 299,
          image: 'greensmoothie.jpg',
          rating: 5,
          reviewCount: 124
        });
      } finally {
        setLoading(false);
      }
    };

    if (category && productId) {
      fetchProduct();
    } else {
      setError('Invalid product parameters');
      setProduct({
        id: 'morning-glory-smoothie',
        category: 'smoothies',
        name: 'MORNING GLORY SMOOTHIE',
        ingredients: 'Apple, Pineapple, Spinach, Shredded Coconut, Dates, Cinnamon Powder, Lemon Juice',
        price: 299,
        image: 'greensmoothie.jpg',
        rating: 5,
        reviewCount: 124
      });
      setLoading(false);
    }
  }, [category, productId]);

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

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, index) => (
      <span key={index} className={index < rating ? "star filled" : "star"}>★</span>
    ));
  };

  if (loading) {
    return <div className="product-hero-loading_Item_des">Loading product...</div>;
  }

  if (error || !product) {
    return <div className="product-hero-error_Item_des">{error || 'Product not found'}</div>;
  }

  return (
    <section className="product-hero_Item_des">
      <div className="hero-content_Item_des">
        <div className="hero-image_Item_des">
          <div className="image-card_Item_des">
            {product.isBestseller && (
              <div className="bestseller-tag_Item_des">Bestseller</div>
            )}
            <div className="smoothie-placeholder_Item_des">
              <img
                src={`/${product.image}`}
                alt={product.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/greensmoothie.jpg";
                }}
              />
            </div>
          </div>
        </div>
        <div className="hero-details_Item_des">
          <h1 className="hero-title_Item_des">{product.name}</h1>
          <div className="rating_Item_des">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`star-icon_Item_des ${i < product.rating ? 'filled' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
            ))}
            <span className="rating-text_Item_des">({product.reviewCount} reviews)</span>
          </div>
          <p className="hero-description_Item_des">{product.ingredients}</p>
          <div className="tags_Item_des">
            <span className="tag_Item_des">Vegan</span>
            <span className="tag_Item_des">Gluten-Free</span>
            <span className="tag_Item_des">No Added Sugar</span>
          </div>
          <div className="price-section_Item_des">
            <span className="price_Item_des">₹{product.price}</span>
            {product.originalPrice && (
              <>
                <span className="original-price_Item_des">₹{product.originalPrice}</span>
                <span className="discount_Item_des">Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%</span>
              </>
            )}
          </div>
          <div className="actions_Item_des">
            <div className="quantity_Item_des">
              <button className="quantity-btn_Item_des">-</button>
              <input type="number" className="quantity-input_Item_des" value="1" readOnly />
              <button className="quantity-btn_Item_des">+</button>
            </div>
            <button className="add-to-cart_Item_des" onClick={handleAddToCart}>
              <svg className="cart-icon_Item_des" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      {showCustomization && (
        <ProductCustomization
          product={product}
          onClose={handleCloseCustomization}
        />
      )}

      {showLoginModal && (
        <div className="modal-overlay_Item_des" onClick={() => setShowLoginModal(false)}>
          <div className="modal-content_Item_des" onClick={e => e.stopPropagation()}>
            <button className="modal-close_Item_des" onClick={() => setShowLoginModal(false)}>×</button>
            <LoginSignupPage onSuccess={() => setShowLoginModal(false)} />
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductHero;