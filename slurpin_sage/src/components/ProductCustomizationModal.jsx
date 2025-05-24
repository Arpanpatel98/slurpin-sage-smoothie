import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import Modal from './Modal';

const ProductCustomizationModal = ({ isOpen, onClose, product, editingItem }) => {
  const { addToCart, isLoading } = useCart();
  const [selectedBase, setSelectedBase] = useState(editingItem?.base || product.bases[0]);
  const [selectedToppings, setSelectedToppings] = useState(editingItem?.toppings || []);
  const [selectedBoosters, setSelectedBoosters] = useState(editingItem?.boosters || []);
  const [specialInstructions, setSpecialInstructions] = useState(editingItem?.specialInstructions || '');
  const [quantity, setQuantity] = useState(editingItem?.quantity || 1);

  const handleAddToCart = async () => {
    try {
      const item = {
        id: editingItem?.id,
        productId: product.id,
        name: product.name,
        base: selectedBase,
        toppings: selectedToppings,
        boosters: selectedBoosters,
        specialInstructions,
        quantity,
        price: calculateTotalPrice(),
        customized: true,
        image: product.image
      };

      await addToCart(item);
      onClose();
    } catch (error) {
      console.error('Error adding to cart:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleBaseChange = (base) => {
    setSelectedBase(base);
  };

  const handleToppingChange = (topping) => {
    setSelectedToppings(prev => {
      const isSelected = prev.some(t => t.id === topping.id);
      if (isSelected) {
        return prev.filter(t => t.id !== topping.id);
      } else {
        return [...prev, topping];
      }
    });
  };

  const handleBoosterChange = (booster) => {
    setSelectedBoosters(prev => {
      const isSelected = prev.some(b => b.id === booster.id);
      if (isSelected) {
        return prev.filter(b => b.id !== booster.id);
      } else {
        return [...prev, booster];
      }
    });
  };

  const handleSpecialInstructionsChange = (e) => {
    setSpecialInstructions(e.target.value);
  };

  const calculateTotalPrice = () => {
    const basePrice = selectedBase?.price || 0;
    const toppingsPrice = selectedToppings.reduce((sum, topping) => sum + topping.price, 0);
    const boostersPrice = selectedBoosters.reduce((sum, booster) => sum + booster.price, 0);
    return (basePrice + toppingsPrice + boostersPrice) * quantity;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">{editingItem ? 'Edit Item' : 'Customize Your Order'}</h2>
        {/* ... rest of the JSX ... */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleAddToCart}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Adding to Cart...' : editingItem ? 'Update Cart' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ProductCustomizationModal; 