import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import ProductCustomization from "./ProductCustomization";
import "./Menu.css";
import { useImageLoader } from '../hooks/useImageLoader';

export default function Menu() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [visibleItems, setVisibleItems] = useState(6);
  const [showCustomization, setShowCustomization] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Default image URL from Firebase Storage
  const DEFAULT_IMAGE_URL =
    "https://firebasestorage.googleapis.com/v0/b/slurpin-sage.firebasestorage.app/o/products%2FAll%2Fall.HEIC?alt=media&token=5e2ae9b9-bb7d-4c56-96a1-0a60986c1469";

  // Set categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const categoryList = ["All Smoothies", "smoothies", "milkshakes","bowls"]; // Removed 'bowls'
        setCategories(categoryList);
        setActiveCategory("All Smoothies");
      } catch (error) {
        console.error("Error setting categories:", error);
        setCategories(["All Smoothies"]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch items and reviews from Firebase
  useEffect(() => {
    const fetchItemsAndReviews = async () => {
      if (!activeCategory) return;
      setLoading(true);
      try {
        let itemsData = [];

        // Fetch products
        const categoriesToFetch =
          activeCategory === "All Smoothies" ? ["smoothies", "milkshakes"] : [activeCategory];

        for (const cat of categoriesToFetch) {
          const querySnapshot = await getDocs(collection(db, `products/config/${cat}`));
          const categoryItems = await Promise.all(
            querySnapshot.docs.map(async (doc) => {
              const productData = doc.data();
              // Fetch reviews for this product
              const reviewsRef = collection(db, "product_reviews");
              const q = query(reviewsRef, where("productId", "==", doc.id));
              const reviewSnapshot = await getDocs(q);
              let totalRating = 0;
              let reviewCount = 0;

              reviewSnapshot.forEach((reviewDoc) => {
                const reviewData = reviewDoc.data();
                totalRating += reviewData.rating || 0;
                reviewCount += 1;
              });

              const averageRating = reviewCount > 0 ? (totalRating / reviewCount).toFixed(1) : 0;

              return {
                id: doc.id,
                category: cat,
                name: productData.name || doc.id.replace(/-/g, " ").toUpperCase(), // Use 'name' from seed.js
                ingredients: Array.isArray(productData.ingredients)
                  ? productData.ingredients.join(", ")
                  : "Ingredients not available",
                price: productData.price || 0,
                image: productData.imageUrl || DEFAULT_IMAGE_URL, // Use imageUrl or default
                tags: productData.tags || [],
                averageRating,
                totalReviews: reviewCount,
                stock: productData.stock || 0, // Add stock field
              };
            })
          );
          itemsData = [...itemsData, ...categoryItems];
        }

        setItems(itemsData);
        setVisibleItems(6);
      } catch (error) {
        console.error("Error fetching items or reviews:", {
          message: error.message,
          code: error.code,
          stack: error.stack,
        });
        setItems([
          {
            id: "morning-glory-smoothie",
            category: "smoothies",
            name: "MORNING GLORY SMOOTHIE",
            ingredients:
              "Apple, Pineapple, Spinach, Shredded Coconut, Dates, Cinnamon Powder, Lemon Juice",
            price: 500,
            image: DEFAULT_IMAGE_URL, // Use default in fallback
            tags: ["bestseller"],
            averageRating: 4.0,
            totalReviews: 50,
            stock: 0, // Add stock field
          },
          {
            id: "banana-date-shake",
            category: "milkshakes",
            name: "BANANA DATE SHAKE",
            ingredients: "Banana, Dates, Milk",
            price: 149,
            image: DEFAULT_IMAGE_URL, // Update with actual URL if available
            tags: ["new"],
            averageRating: 4.5,
            totalReviews: 30,
            stock: 0, // Add stock field
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchItemsAndReviews();
  }, [activeCategory]);

  const handleAddToCart = (e, item) => {
    e.stopPropagation();
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

  const loadMoreItems = () => {
    setVisibleItems((prevVisible) => prevVisible + 6);
  };

  const getItemTag = (item) => {
    const nameLower = item.name.toLowerCase();
    if (item.tags.includes("bestseller") || nameLower.includes("green goddess"))
      return "BESTSELLER";
    if (
      item.tags.includes("seasonal") ||
      nameLower.includes("pumpkin") ||
      nameLower.includes("citrus")
    )
      return "SEASONAL";
    if (nameLower.includes("protein")) return "POST-WORKOUT";
    return null;
  };

  const getHealthTags = (item) => {
    const tags = [];
    const ingredientsLower = (item.ingredients || "").toLowerCase();

    if (
      ingredientsLower.includes("spinach") ||
      ingredientsLower.includes("kale") ||
      (!ingredientsLower.includes("milk") || ingredientsLower.includes("almond milk"))
    ) {
      tags.push("vegan");
    }

    if (
      ingredientsLower.includes("spinach") ||
      ingredientsLower.includes("kale") ||
      ingredientsLower.includes("green")
    ) {
      tags.push("detox");
    }

    if (ingredientsLower.includes("protein")) {
      tags.push("high protein");
    }

    if (
      ingredientsLower.includes("immune") ||
      ingredientsLower.includes("ginger") ||
      ingredientsLower.includes("turmeric")
    ) {
      tags.push("immunity");
    }

    if (
      ingredientsLower.includes("anti-inflammatory") ||
      ingredientsLower.includes("turmeric")
    ) {
      tags.push("anti-inflammatory");
    }

    return tags;
  };

  const renderRating = (averageRating, totalReviews) => {
    const rating = parseFloat(averageRating) || 0;
    return (
      <div className="rating-container">
        <div className="stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={
                star <= Math.floor(rating)
                  ? "star filled"
                  : star === Math.ceil(rating) && rating % 1 >= 0.5
                  ? "star half-filled"
                  : "star"
              }
            >
              ★
            </span>
          ))}
        </div>
        <span className="rating-text">
          {rating.toFixed(1)} ({totalReviews || 0})
        </span>
      </div>
    );
  };

  const MenuItem = ({ item, onAddToCart }) => {
    const DEFAULT_IMAGE_URL =
      "https://firebasestorage.googleapis.com/v0/b/slurpin-sage.firebasestorage.app/o/products%2FAll%2Fall.HEIC?alt=media&token=5e2ae9b9-bb7d-4c56-96a1-0a60986c1469";

    const { imageSrc, isLoading } = useImageLoader(item.image, DEFAULT_IMAGE_URL);

    const itemTag = getItemTag(item);
    const healthTags = getHealthTags(item);

    return (
      <div
        className="menu-card"
        key={`${item.category}-${item.id}`}
        onClick={() => navigate(`/products/${item.category}/${item.id}`)}
      >
        {itemTag && <div className="item-tag">{itemTag}</div>}
        {item.stock === 0 && (
          <div className="out-of-stock-container_menu">
            <span className="out-of-stock-text_menu">Out of Stock</span>
          </div>
        )}
        <div className="menu-card-image">
          <img
            src={imageSrc}
            alt={item.name}
            style={{ opacity: isLoading ? 0.5 : 1 }}
          />
        </div>
        <div className="menu-card-content">
          <div className="menu-card-header">
            <h2>{item.name}</h2>
            <div className="price">₹{item.price}</div>
          </div>
          <p className="ingredients">{item.ingredients}</p>

          {healthTags.length > 0 && (
            <div className="health-tags">
              {healthTags.map((tag) => (
                <span
                  key={tag}
                  className={`health-tag ${tag.replace(/\s+/g, "-")}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {renderRating(item.averageRating, item.totalReviews)}

          <div className="button-wrapper">
            <button
              className={`add-to-cart-btn ${item.stock === 0 ? 'out-of-stock-btn_menu' : ''}`}
              onClick={(e) => handleAddToCart(e, item)}
              disabled={item.stock === 0}
            >
              Add to Cart
            </button>
          </div>
        </div>
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
                return (
                  <MenuItem key={`${item.category}-${item.id}`} item={item} onAddToCart={handleAddToCart} />
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
            <p>
              We source local, organic produce whenever possible to ensure maximum
              nutrition and flavor in every sip.
            </p>
          </div>

          <div className="nutrition-card">
            <div className="nutrition-icon nutrient-icon">
              <i className="fas fa-seedling"></i>
            </div>
            <h3>Nutrient Dense</h3>
            <p>
              Our smoothies are packed with vitamins, minerals, and antioxidants to
              support your overall health and wellbeing.
            </p>
          </div>

          <div className="nutrition-card">
            <div className="nutrition-icon sugar-icon">
              <i className="fas fa-apple-alt"></i>
            </div>
            <h3>No Added Sugar</h3>
            <p>
              We rely on the natural sweetness of fruits and vegetables, with no
              refined sugars or artificial sweeteners.
            </p>
          </div>
        </div>
      </div>

      {showCustomization && selectedItem && (
        <ProductCustomization product={selectedItem} onClose={handleCloseCustomization} />
      )}
    </div>
  );
}