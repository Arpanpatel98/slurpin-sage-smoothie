import React from 'react';
import './ingredients copy.css';

function Ingredients() {
  const ingredients = [
    '🍎 Apple',
    '🍍 Pineapple',
    '🥬 Spinach',
    '🥥 Shredded Coconut',
    '🌴 Dates',
    '🧂 Cinnamon Powder',
    '🍋 Lemon Juice'
  ];
  const healthBenefits = [
    'Rich in dietary fiber for improved digestion and gut health',
    'High vitamin C content supports immune function and collagen production',
    'Natural energy boost from complex carbohydrates and natural sugars',
    'Contains iron to support healthy blood oxygen levels',
    'Cinnamon helps regulate blood sugar levels and has anti-inflammatory properties'
  ];

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