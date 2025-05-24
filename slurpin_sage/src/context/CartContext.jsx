import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, setDoc, doc, deleteDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [promoCode, setPromoCode] = useState({ code: 'WELCOME10', discount: 3 });
  const [showCustomization, setShowCustomization] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Set up real-time listener for cart items
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setCartItems([]);
        return;
      }

      // Set up real-time listener for cart items
      const cartRef = collection(db, `cart_items/${user.uid}/items`);
      const unsubscribeCart = onSnapshot(cartRef, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCartItems(items);
      }, (error) => {
        console.error('Error listening to cart updates:', error);
      });

      return () => unsubscribeCart();
    });

    return () => unsubscribe();
  }, []);

  const addToCart = async (item) => {
    if (!auth.currentUser) return;

    try {
      setIsLoading(true);
      // If the item has an id, it's an edit operation
      if (item.id) {
        const cartItemRef = doc(db, `cart_items/${auth.currentUser.uid}/items`, item.id);
        await setDoc(cartItemRef, { ...item, timestamp: serverTimestamp() }, { merge: true });
        return;
      }

      // For new items, check if similar item exists
      const existingItem = cartItems.find(
        (cartItem) =>
          cartItem.productId === item.productId &&
          cartItem.base?.id === item.base?.id &&
          JSON.stringify(cartItem.toppings) === JSON.stringify(item.toppings) &&
          JSON.stringify(cartItem.boosters) === JSON.stringify(item.boosters) &&
          cartItem.specialInstructions === item.specialInstructions
      );

      if (existingItem) {
        // Update existing item
        const newQuantity = existingItem.quantity + item.quantity;
        const newPrice = (item.price / item.quantity) * newQuantity;
        const updatedItem = {
          ...item,
          quantity: newQuantity,
          price: newPrice,
          customized: true
        };

        const cartItemRef = doc(db, `cart_items/${auth.currentUser.uid}/items`, existingItem.id);
        await setDoc(cartItemRef, { ...updatedItem, timestamp: serverTimestamp() }, { merge: true });
      } else {
        // Add new item
        const cartItemRef = doc(collection(db, `cart_items/${auth.currentUser.uid}/items`));
        const cartItemId = cartItemRef.id;
        const newItem = { ...item, id: cartItemId, customized: true };
        await setDoc(cartItemRef, { ...newItem, timestamp: serverTimestamp() });
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (!auth.currentUser || newQuantity < 1 || newQuantity > 10) return;

    try {
      const item = cartItems.find((i) => i.id === itemId);
      if (!item) return;

      const basePrice = item.price / item.quantity;
      const newPrice = basePrice * newQuantity;

      const itemRef = doc(db, `cart_items/${auth.currentUser.uid}/items`, itemId);
      await setDoc(itemRef, {
        ...item,
        quantity: newQuantity,
        price: newPrice,
        timestamp: serverTimestamp()
      }, { merge: true });

      setCartItems((prevItems) =>
        prevItems.map((i) =>
          i.id === itemId ? { ...i, quantity: newQuantity, price: newPrice } : i
        )
      );
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  const removeFromCart = async (itemId) => {
    if (!auth.currentUser) return;

    try {
      const itemRef = doc(db, `cart_items/${auth.currentUser.uid}/items`, itemId);
      await deleteDoc(itemRef);

      setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error('Error removing cart item:', err);
    }
  };

  const clearCart = async () => {
    if (!auth.currentUser) return;

    try {
      const cartRef = collection(db, `cart_items/${auth.currentUser.uid}/items`);
      const cartSnapshot = await getDocs(cartRef);
      const deletePromises = cartSnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      setCartItems([]);
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  const applyPromoCode = (code) => {
    if (code === 'WELCOME10') {
      setPromoCode({ code, discount: 3 });
    } else {
      setPromoCode(null);
    }
  };

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
    const addIns = cartItems.reduce(
      (sum, item) =>
        sum +
        item.toppings.reduce((t, topping) => t + topping.price, 0) +
        item.boosters.reduce((b, booster) => b + booster.price, 0),
      0
    );
    const discount = promoCode ? promoCode.discount : 0;
    const tax = subtotal * 0.0875;
    const total = subtotal + addIns + tax - discount;

    return { subtotal, addIns, discount, tax, total };
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyPromoCode,
        promoCode,
        calculateTotals,
        showCustomization,
        setShowCustomization,
        isLoading
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;