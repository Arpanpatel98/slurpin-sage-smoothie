import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { auth } from '../firebase';
import { useCart } from '../context/CartContext';
import CartPopup from "./CartPopup";
import ProductCustomization from "./ProductCustomization";
import LoginSignupPage from "./auth/LoginSignupPage";
import "./Menu.css";

export default function Menu() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [visibleItems, setVisibleItems] = useState(6); // For "Load More" functionality
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [addedItem, setAddedItem] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  // Fetch categories from Firebase
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        const firstDoc = querySnapshot.docs[0];
        if (firstDoc) {
          const categoryData = firstDoc.data();
          if (Array.isArray(categoryData.name)) {
            // Add "All Smoothies" as first option
            setCategories(["All Smoothies", ...categoryData.name]);
            setActiveCategory("All Smoothies");
          }
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories(["All Smoothies"]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch items from Firebase based on active category
  useEffect(() => {
    const fetchItems = async () => {
      if (!activeCategory) return;
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "items"));
        let itemsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Add default tags for demo
          tags: doc.data().tags || [],
          rating: doc.data().rating || (4 + Math.random()).toFixed(1),
          reviewCount: doc.data().reviewCount || Math.floor(Math.random() * 100) + 10
        }));
        
        // Filter by category unless "All Smoothies" is selected
        if (activeCategory !== "All Smoothies") {
          itemsData = itemsData.filter(
            (item) =>
              item.type &&
              item.type.toLowerCase() === activeCategory.toLowerCase()
          );
        }
        
        setItems(itemsData);
        setVisibleItems(6); // Reset visible items when category changes
      } catch (error) {
        console.error("Error fetching items:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [activeCategory]);

  const handleAddToCart = (e, item) => {
    e.stopPropagation(); // Prevent navigation when clicking the button
    
    // Check if user is authenticated
    if (!auth.currentUser) {
      // If not authenticated, show login modal
      setShowLoginModal(true);
      return;
    }
    
    // If authenticated, proceed with adding to cart
    setSelectedItem(item);
    setShowCustomization(true);
  };
  
  const handleClosePopup = () => {
    setShowCartPopup(false);
    setAddedItem(null);
  };
  
  const handleCloseCustomization = () => {
    setShowCustomization(false);
    setSelectedItem(null);
  };
  
  const loadMoreItems = () => {
    setVisibleItems(prevVisible => prevVisible + 6);
  };
  
  // Get item tag based on properties or name (for demo purposes)
  const getItemTag = (item) => {
    const nameLower = item.name.toLowerCase();
    if (item.bestseller || nameLower.includes('green goddess')) return 'BESTSELLER';
    if (item.seasonal || nameLower.includes('pumpkin') || nameLower.includes('citrus')) return 'SEASONAL';
    if (nameLower.includes('protein')) return 'POST-WORKOUT';
    return null;
  };
  
  // Get health tags based on ingredients (for demo)
  const getHealthTags = (item) => {
    const tags = [];
    const ingredientsLower = (item.ingredients || '').toLowerCase();
    
    if (ingredientsLower.includes('spinach') || 
        ingredientsLower.includes('kale') || 
        !ingredientsLower.includes('milk') ||
        ingredientsLower.includes('almond milk')) {
      tags.push('vegan');
    }
    
    if (ingredientsLower.includes('spinach') || 
        ingredientsLower.includes('kale') || 
        ingredientsLower.includes('green')) {
      tags.push('detox');
    }
    
    if (ingredientsLower.includes('protein')) {
      tags.push('high protein');
    }
    
    if (ingredientsLower.includes('immune') || 
        ingredientsLower.includes('ginger') || 
        ingredientsLower.includes('turmeric')) {
      tags.push('immunity');
    }
    
    if (ingredientsLower.includes('anti-inflammatory') || 
        ingredientsLower.includes('turmeric')) {
      tags.push('anti-inflammatory');
    }
    
    return tags;
  };

  // Render star rating
  const renderRating = (rating, reviewCount) => {
    rating = parseFloat(rating) || 4.5;
    return (
      <div className="rating-container">
        <div className="stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className={star <= Math.floor(rating) ? 'star filled' : star <= rating ? 'star half-filled' : 'star'}>
              ★
            </span>
          ))}
        </div>
        <span className="rating-text">{rating} ({reviewCount || '42'})</span>
      </div>
    );
  };

  return (
    <div className="menu-container">
      <div className="menu-header">
        <h1 className="menu-title">Our Smoothie Menu</h1>
        <p className="menu-subtitle">
          Discover our range of delicious, nutrient-packed smoothies made with the freshest
          ingredients to boost your health and energy.
        </p>
      </div>

      {loading && <div className="loading">Loading...</div>}

      {!loading && categories.length === 0 && (
        <div className="no-data">No menu categories available.</div>
      )}

      {!loading && categories.length > 0 && (
        <>
          <div className="menu-tabs">
            {categories.map((category, index) => (
              <button
                key={index}
                className={activeCategory === category ? "active-tab" : "tab-button"}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="menu-grid">
            {items.length === 0 ? (
              <div className="no-data">No items available in this category.</div>
            ) : (
              items.slice(0, visibleItems).map((item) => {
                const itemTag = getItemTag(item);
                const healthTags = getHealthTags(item);
                
                return (
                  <div
                    className="menu-card"
                    key={item.id}
                    onClick={() => navigate(`/item/${item.id}`)}
                  >
                    {itemTag && <div className="item-tag">{itemTag}</div>}
                    <div className="menu-card-image">
                      <img
                        src={`/${item.image || "greensmoothie.jpg"}`}
                        alt={item.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/greensmoothie.jpg";
                        }}
                      />
                    </div>
                    <div className="menu-card-content">
                      <div className="menu-card-header">
                        <h2>{item.name}</h2>
                        <div className="price">₹{item.price.toFixed(2)}</div>
                      </div>
                      <p className="ingredients">{item.ingredients}</p>
                      
                      {healthTags.length > 0 && (
                        <div className="health-tags">
                          {healthTags.map(tag => (
                            <span key={tag} className={`health-tag ${tag.replace(/\s+/g, '-')}`}>{tag}</span>
                          ))}
                        </div>
                      )}
                      
                      {renderRating(item.rating, item.reviewCount)}
                      
                      <div className="button-wrapper">
                        <button 
                          className="add-to-cart-btn" 
                          onClick={(e) => handleAddToCart(e, item)}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {items.length > visibleItems && (
            <div className="load-more-container">
              <button className="load-more-button" onClick={loadMoreItems}>
                Load More Smoothies
              </button>
            </div>
          )}
        </>
      )}
      
      <div className="nutrition-section">
        <h2>Nutrition Information</h2>
        <p>We believe in transparency. Here's what makes our smoothies so good for you.</p>
        
        <div className="nutrition-cards">
          <div className="nutrition-card">
            <div className="nutrition-icon fresh-icon">
              <i className="fas fa-leaf"></i>
            </div>
            <h3>Fresh Ingredients</h3>
            <p>We source local, organic produce whenever possible to ensure maximum nutrition and flavor in every sip.</p>
          </div>
          
          <div className="nutrition-card">
            <div className="nutrition-icon nutrient-icon">
              <i className="fas fa-seedling"></i>
            </div>
            <h3>Nutrient Dense</h3>
            <p>Our smoothies are packed with vitamins, minerals, and antioxidants to support your overall health and wellbeing.</p>
          </div>
          
          <div className="nutrition-card">
            <div className="nutrition-icon sugar-icon">
              <i className="fas fa-apple-alt"></i>
            </div>
            <h3>No Added Sugar</h3>
            <p>We rely on the natural sweetness of fruits and vegetables, with no refined sugars or artificial sweeteners.</p>
          </div>
        </div>
      </div>
      
      {showCartPopup && addedItem && (
        <CartPopup item={addedItem} onClose={handleClosePopup} />
      )}
      
      {showCustomization && selectedItem && (
        <ProductCustomization 
          product={selectedItem} 
          onClose={handleCloseCustomization} 
        />
      )}

      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLoginModal(false)}>×</button>
            <LoginSignupPage onSuccess={() => setShowLoginModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
