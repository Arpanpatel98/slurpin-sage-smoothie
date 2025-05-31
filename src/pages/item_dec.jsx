import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProductHero from '../components/Item_Detail/ProductHero';
import Ingredients from '../components/Item_Detail/Ingredients';
import Nutrition from '../components/Item_Detail/Nutrition';
import NutrientComparison from '../components/Item_Detail/NutrientComparison';
import RecommendedProducts from '../components/Item_Detail/RecommendedProducts';
import CustomerReviews from '../components/Item_Detail/CustomerReviews';
// import './styles.css';
import '../components/Item_Detail/item_de copy.css';


const ProductPage = () => {
  const { category, productId } = useParams();
  console.log('ProductPage params:', { category, productId }); // Debug log

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [category, productId]); // Re-run when category or productId changes

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