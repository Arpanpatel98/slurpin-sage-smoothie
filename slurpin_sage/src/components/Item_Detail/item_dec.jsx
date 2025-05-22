import React from 'react';
import { useParams } from 'react-router-dom';
import ProductHero from './ProductHero';
import Ingredients from './Ingredients';
import Nutrition from './Nutrition';
import NutrientComparison from './NutrientComparison';
import RecommendedProducts from './RecommendedProducts';
import CustomerReviews from './CustomerReviews';
// import './styles.css';
import './item_de copy.css';

const ProductPage = () => {
  const { category, productId } = useParams();
  console.log('ProductPage params:', { category, productId }); // Debug log

  if (!category || !productId) {
    console.error('Missing URL parameters in ProductPage:', { category, productId });
    return <div>Error: Invalid product URL</div>;
  }

  return (
    <div className="app">
      <ProductHero category={category} productId={productId} />
      <Ingredients category={category} productId={productId} />
      <Nutrition category={category} productId={productId} />
      <NutrientComparison category={category} productId={productId} />
      <RecommendedProducts category={category} productId={productId} />
      <CustomerReviews category={category} productId={productId} />
    </div>
  );
};

export default ProductPage;