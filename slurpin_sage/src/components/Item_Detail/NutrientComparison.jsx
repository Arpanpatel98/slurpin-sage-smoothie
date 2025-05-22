import React from 'react';
import './nutrient-comparison copy.css';

function NutrientComparison() {
  const nutrients = [
    { name: 'Fiber', percent: 31.8 },
    { name: 'Vitamin C', percent: 59.0 },
    { name: 'Carbs', percent: 21.8 },
    { name: 'Iron', percent: 18.0 },
    { name: 'Calories', percent: 14.3 },
    { name: 'Fat', percent: 10.0 },
    { name: 'Protein', percent: 6.9 }
  ];

  return (
    <section className="nutrient-comparison_Item_des">
      <div className="container_Item_des">
        <h2 className="section-title_Item_des">Nutrient Comparison</h2>
        <div className="comparison-card_Item_des">
          <h3 className="card-title_Item_des">Percentage of Daily Requirements</h3>
          <div className="comparison-list_Item_des">
            {nutrients.map((nutrient, i) => (
              <div key={i} className="comparison-item_Item_des">
                <div className="comparison-header_Item_des">
                  <span>{nutrient.name}</span>
                  <span>{nutrient.percent}%</span>
                </div>
                <div className="chart-bar_Item_des">
                  <div className="bar_Item_des" style={{ width: `${nutrient.percent}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default NutrientComparison;