import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import './ingredients copy.css';

function Ingredients({ category, productId }) {
  const [ingredients, setIngredients] = useState([]);
  const [healthBenefits, setHealthBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIngredients = async () => {
      setLoading(true);
      setError(null);
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
        setIngredients(data.ingredients || [
          '🍎 Apple',
          '🍍 Pineapple',
          '🥬 Spinach',
          '🥥 Shredded Coconut',
          '🌴 Dates',
          '🧂 Cinnamon Powder',
          '🍋 Lemon Juice'
        ]);
        setHealthBenefits(data.healthBenefits || [
          'Rich in dietary fiber for improved digestion and gut health',
          'High vitamin C content supports immune function and collagen production',
          'Natural energy boost from complex carbohydrates and natural sugars',
          'Contains iron to support healthy blood oxygen levels',
          'Cinnamon helps regulate blood sugar levels and has anti-inflammatory properties'
        ]);
      } catch (err) {
        console.error('Ingredients fetch error:', {
          message: err.message,
          code: err.code,
          stack: err.stack,
          category,
          productId
        });
        setError('Failed to load ingredients. Please try again later.');
        setIngredients([
          '🍎 Apple',
          '🍍 Pineapple',
          '🥬 Spinach',
          '🥥 Shredded Coconut',
          '🌴 Dates',
          '🧂 Cinnamon Powder',
          '🍋 Lemon Juice'
        ]);
        setHealthBenefits([
          'Rich in dietary fiber for improved digestion and gut health',
          'High vitamin C content supports immune function and collagen production',
          'Natural energy boost from complex carbohydrates and natural sugars',
          'Contains iron to support healthy blood oxygen levels',
          'Cinnamon helps regulate blood sugar levels and has anti-inflammatory properties'
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchIngredients();
  }, [category, productId]);

  if (loading) {
    return (
      <div className="container_Item_des">
        <p>Loading ingredients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container_Item_des">
        <p className="error_Item_des">{error}</p>
        <button className="retry-button_Item_des" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className="ingredients_Item_des">
      <div className="container_Item_des">
        <h2 className="section-title_Item_des">Fresh Ingredients</h2>
        <div className="ingredient-list_Item_des">
          {ingredients.map((ingredient, i) => (
            <div key={i} className="ingredient-tag_Item_des">{ingredient}</div>
          ))}
        </div>
        <div className="benefits-card_Item_des">
          <div className="benefits-content_Item_des">
            <div className="benefits-icon_Item_des">
              <svg className="heart-icon_Item_des" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
              </svg>
              <h3 className="benefits-title_Item_des">Health Benefits</h3>
            </div>
            <ul className="benefits-list_Item_des">
              {healthBenefits.map((benefit, i) => (
                <li key={i} className="benefit-item_Item_des">
                  <svg className="check-icon_Item_des" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Ingredients;