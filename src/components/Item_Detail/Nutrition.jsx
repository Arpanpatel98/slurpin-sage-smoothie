import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import './nutrition copy.css';

function Nutrition({ category, productId }) {
  const [nutritionFacts, setNutritionFacts] = useState([]);
  const [keyInsights, setKeyInsights] = useState([]);
  const [detailedBreakdown, setDetailedBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProductData() {
      try {
        const docRef = doc(db, `products/config/${category}/${productId}`);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          throw new Error('Product not found');
        }
        const data = docSnap.data();
        console.log('Received nutrition data:', data);

        // Ensure nutritionFacts is an array
        if (data.nutritionFacts && !Array.isArray(data.nutritionFacts)) {
          if (typeof data.nutritionFacts === 'object') {
            setNutritionFacts(Object.values(data.nutritionFacts));
          } else {
            setNutritionFacts([]);
          }
        } else {
          setNutritionFacts(data.nutritionFacts || []);
        }

        setKeyInsights(data.keyInsights || []);
        setDetailedBreakdown(data.detailedBreakdown || []);
        setLoading(false);
      } catch (err) {
        console.error('Error loading product data:', err);
        setError('Failed to load nutritional data. Please try again later.');
        setNutritionFacts([
          { name: 'Calories', value: 200, unit: 'kcal', percent: 10 },
          { name: 'Protein', value: 5, unit: 'g', percent: 10 },
          { name: 'Carbohydrates', value: 30, unit: 'g', percent: 11 },
          { name: 'Fat', value: 3, unit: 'g', percent: 4 }
        ]);
        setKeyInsights([
          { title: 'Low in Fat', description: 'Only 3g of fat per serving.' },
          { title: 'Rich in Vitamins', description: 'High in Vitamin C and A from fruits and vegetables.' }
        ]);
        setDetailedBreakdown([
          { nutrient: 'Calories', amount: '200 kcal', daily: '2000 kcal', percent: '10%' },
          { nutrient: 'Protein', amount: '5 g', daily: '50 g', percent: '10%' },
          { nutrient: 'Carbohydrates', amount: '30 g', daily: '275 g', percent: '11%' },
          { nutrient: 'Fat', amount: '3 g', daily: '78 g', percent: '4%' }
        ]);
        setLoading(false);
      }
    }

    if (category && productId) {
      loadProductData();
    } else {
      console.error('Invalid product parameters:', { category, productId });
      setError('Invalid product parameters');
      setNutritionFacts([
        { name: 'Calories', value: 200, unit: 'kcal', percent: 10 },
        { name: 'Protein', value: 5, unit: 'g', percent: 10 },
        { name: 'Carbohydrates', value: 30, unit: 'g', percent: 11 },
        { name: 'Fat', value: 3, unit: 'g', percent: 4 }
      ]);
      setKeyInsights([
        { title: 'Low in Fat', description: 'Only 3g of fat per serving.' },
        { title: 'Rich in Vitamins', description: 'High in Vitamin C and A from fruits and vegetables.' }
      ]);
      setDetailedBreakdown([
        { nutrient: 'Calories', amount: '200 kcal', daily: '2000 kcal', percent: '10%' },
        { nutrient: 'Protein', amount: '5 g', daily: '50 g', percent: '10%' },
        { nutrient: 'Carbohydrates', amount: '30 g', daily: '275 g', percent: '11%' },
        { nutrient: 'Fat', amount: '3 g', daily: '78 g', percent: '4%' }
      ]);
      setLoading(false);
    }
  }, [category, productId]);

  if (loading) {
    return (
      <section className="nutrition_Item_des">
        <div className="container_Item_des">
          <p>Loading...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="nutrition_Item_des">
        <div className="container_Item_des">
          <p className="error_Item_des">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="nutrition_Item_des">
      <div className="container_Item_des">
        <h2 className="section-title_Item_des">Nutritional Information</h2>
        <p className="section-subtitle_Item_des">Detailed breakdown of your Morning Glory smoothie, including how it contributes to daily nutrient needs.</p>
        <div className="nutrition-card_Item_des">
          <div className="nutrition-facts_Item_des">
            <h3 className="card-title_Item_des">Nutrition Facts</h3>
            <div className="facts-list_Item_des">
              {nutritionFacts.map((fact, i) => (
                <div key={i} className="fact-item_Item_des">
                  <div className="fact-header_Item_des">
                    <span>{fact.name}</span>
                    <div className="fact-value_Item_des">
                      <span className="value_Item_des">{fact.value}</span>
                      <span className="unit_Item_des">{fact.unit}</span>
                    </div>
                  </div>
                  <div className="progress-bar_Item_des">
                    <div className="progress_Item_des" style={{ width: `${fact.percent}%` }}></div>
                  </div>
                  <div className="progress-labels_Item_des">
                    <span>0%</span>
                    <span>{fact.percent}% of daily needs</span>
                    <span>100%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="nutrition-insights_Item_des">
            <h3 className="card-title_Item_des">Key Insights</h3>
            <div className="insights-list_Item_des">
              {keyInsights.map((insight, i) => (
                <div key={i} className="insight-item_Item_des">
                  <div className="insight-icon_Item_des">
                    <svg className="check-icon_Item_des" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="insight-title_Item_des">{insight.title}</h4>
                    <p className="insight-description_Item_des">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="nutrition-table_Item_des">
          <h3 className="card-title_Item_des">Detailed Nutritional Breakdown</h3>
          <div className="table-scroll_Item_des">
            <table className="breakdown-table_Item_des">
              <thead>
                <tr>
                  <th>Nutrient</th>
                  <th>Amount per Serving</th>
                  <th>Daily Requirement (Approx.)</th>
                  <th>% of Daily Requirement</th>
                </tr>
              </thead>
              <tbody>
                {detailedBreakdown.map((row, i) => (
                  <tr key={i}>
                    <td>{row.nutrient}</td>
                    <td>{row.amount}</td>
                    <td>{row.daily}</td>
                    <td>{row.percent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Nutrition;