import React, { useState, useEffect } from "react";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "./PopularItems.css";
import ProductCustomization from "./ProductCustomization";
import LoginSignupPage from "./auth/LoginSignupPage";
import './auth/loginsignup.css';

const PopularItems = () => {
  const [popularItems, setPopularItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCustomization, setShowCustomization] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  // Default image URL from Firebase Storage
  const DEFAULT_IMAGE_URL =
    "https://firebasestorage.googleapis.com/v0/b/slurpin-sage.firebasestorage.app/o/products%2FAll%2Fall.HEIC?alt=media&token=5e2ae9b9-bb7d-4c56-96a1-0a60986c1469";

  useEffect(() => {
    const fetchPopularItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const categories = ["smoothies", "milkshakes", "bowls"];
        let items = [];
        const tagMap = {
          "morning-glory-smoothie": "BESTSELLER",
          "banana-date-shake": "NEW",
        };

        for (const category of categories) {
          const itemsRef = collection(db, `products/config/${category}`);
          const q = query(itemsRef, limit(2));
          const querySnapshot = await getDocs(q);
          if (querySnapshot.empty) {
            console.warn(`No documents found in products/config/${category}`);
          }
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Skip inactive products
            if (data.isActive === false) {
              return;
            }
            items.push({
              id: doc.id,
              category,
              name: data.name || doc.id.replace(/-/g, " ").toUpperCase(),
              ingredients: Array.isArray(data.ingredients)
                ? data.ingredients.join(", ")
                : "Ingredients not available",
              price: data.price || 0,
              image: data.imageUrl || DEFAULT_IMAGE_URL,
              tag: tagMap[doc.id] || null,
              stock: data.stock || 0,
              isActive: data.isActive !== false,
              baseOptionEnable: data.baseOptionEnable || true,
            });
          });
        }
        if (items.length === 0) {
          throw new Error("No items found in any category");
        }

        items = items.sort((a, b) => b.price - a.price).slice(0, 4);
        setPopularItems(items);
      } catch (error) {
        console.error("Error fetching popular items:", error.message);
        setError("Failed to load popular items. Using fallback data.");
        setPopularItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularItems();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show-item");
          }
        });
      },
      { threshold: 0.1 }
    );

    setTimeout(() => {
      const itemCards = document.querySelectorAll(".popular-item-card");
      itemCards.forEach((card) => observer.observe(card));
    }, 100);

    return () => observer.disconnect();
  }, []);

  const handleAddToCart = (e, item) => {
    e.stopPropagation();
    e.preventDefault();

    if (!auth.currentUser) {
      setShowLoginModal(true);
      return;
    }

    if (item.stock === 0) {
      return;
    }

    setSelectedItem(item);
    setShowCustomization(true);
  };

  const handleCloseCustomization = () => {
    setShowCustomization(false);
    setSelectedItem(null);
  };

  const handleViewMenu = () => {
    navigate("/menu");
  };

  const handleCardClick = (category, id) => {
    if (!category || !id) {
      console.error("Invalid navigation parameters:", { category, id });
      return;
    }
    navigate(`/products/${category}/${id}`);
  };

  if (loading) {
    return <div className="popular-loading">Loading popular items...</div>;
  }

  if (error) {
    console.warn("Displaying fallback data due to error:", error);
  }

  return (
    <section className="popular-items-section">
      <div className="popular-items-header">
        <h2 className="animated-title">Our Popular Smoothies</h2>
        <p className="animated-subtitle">
          Discover our most loved blends that keep our customers coming back for more.
        </p>
      </div>

      <div className="popular-items-grid">
        {popularItems.map((item, index) => (
          <div
            className="popular-item-card fade-in"
            key={`${item.category}-${item.id}`}
            onClick={() => handleCardClick(item.category, item.id)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {item.tag && <span className={`item-tag ${item.tag.toLowerCase()}`}>{item.tag}</span>}
            {item.stock === 0 && (
              <div className="out-of-stock-container_popular">
                <span className="out-of-stock-text_popular">Out of Stock</span>
              </div>
            )}
            <div className="item-image">
              <img
                src={item.image}
                alt={item.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_IMAGE_URL;
                  console.warn(`Failed to load image for ${item.name}: ${item.image}`);
                }}
              />
            </div>
            <h3>{item.name}</h3>
            <p className="item-ingredients">{item.ingredients}</p>
            <div className="item-footer">
              <span className="item-price">₹{item.price}</span>
              <button
                className={`add-to-cart-btn_popularItem ${item.stock === 0 ? 'out-of-stock-btn_popular' : ''}`}
                onClick={(e) => handleAddToCart(e, item)}
                disabled={item.stock === 0}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="view-all-container">
        <button className="view-all-btn hover-effect" onClick={handleViewMenu}>
          View Full Menu
        </button>
      </div>

      {showCustomization && selectedItem && (
        <ProductCustomization product={selectedItem} onClose={handleCloseCustomization} />
      )}

      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close_loginSignup" onClick={() => setShowLoginModal(false)}>×</button>
            <LoginSignupPage onSuccess={() => setShowLoginModal(false)} />
          </div>
        </div>
      )}
    </section>
  );
};

export default PopularItems;