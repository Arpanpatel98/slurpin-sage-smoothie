import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, setDoc, doc, deleteDoc, serverTimestamp, onSnapshot, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [promoCode, setPromoCode] = useState({ code: 'WELCOME10', discount: 3 });
  const [showCustomization, setShowCustomization] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Default image URL from Firebase Storage
  const DEFAULT_IMAGE_URL =
    'https://firebasestorage.googleapis.com/v0/b/slurpin-sage.appspot.com/o/default%2Fdefault.jpg?alt=media';

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setCartItems([]);
        return;
      }

      // Set up real-time listener for cart items
      const cartRef = collection(db, `cart_items/${user.uid}/items`);
      const unsubscribeCart = onSnapshot(cartRef, (snapshot) => {
        const items = snapshot.docs.map((doc) => {
          const data = doc.data();
          // Ensure image field exists
          if (!data.image) {
            console.warn(`Cart item ${doc.id} missing image field, using default`);
          }
          return {
            id: doc.id,
            ...data,
            image: data.image || DEFAULT_IMAGE_URL, // Fallback to default
          };
        });
        setCartItems(items);
      }, (error) => {
        console.error('Error listening to cart updates:', error);
      });

      return () => unsubscribeCart();
    });

    return () => unsubscribe();
  }, []);

  // Function to check and update cart based on current stock
  const checkAndUpdateCartStock = async () => {
    if (!currentUser) return;

    try {
      setIsCheckingStock(true);
      const updatedCartItems = [];
      const newOutOfStockItems = [];
      let hasChanges = false;

      for (const item of cartItems) {
        const productRef = doc(db, `products/config/${item.category}/${item.productId}`);
        const productDoc = await getDoc(productRef);
        
        if (productDoc.exists()) {
          const productData = productDoc.data();
          const currentStock = productData.stock || 0;

          if (currentStock === 0) {
            // If item is out of stock, show error message
            hasChanges = true;
            newOutOfStockItems.push({
              ...item,
              message: `${item.name} is out of stock. Please remove it from your cart to proceed.`
            });
            updatedCartItems.push(item); // Keep item in cart but mark it as out of stock
          } else if (currentStock < item.quantity) {
            // If stock is less than cart quantity, show warning message
            hasChanges = true;
            const updatedItem = {
              ...item,
              quantity: currentStock,
              price: (item.price / item.quantity) * currentStock
            };
            updatedCartItems.push(updatedItem);
            newOutOfStockItems.push({
              ...item,
              message: `Only ${currentStock} ${item.name}(s) available in stock. Please reduce quantity to ${currentStock} to proceed.`
            });
          } else {
            updatedCartItems.push(item);
          }
        }
      }

      // Only update if there are actual changes
      if (hasChanges) {
        // Update remaining items in cart
        for (const item of updatedCartItems) {
          const cartItemRef = doc(db, `cart_items/${currentUser.uid}/items`, item.id);
          await updateDoc(cartItemRef, {
            quantity: item.quantity,
            price: item.price,
            stock: item.stock,
            timestamp: serverTimestamp()
          });
        }
        setCartItems(updatedCartItems);
      }

      setOutOfStockItems(newOutOfStockItems);
    } catch (error) {
      console.error('Error checking stock:', error);
    } finally {
      setIsCheckingStock(false);
    }
  };

  // Check stock only when cart items change or when explicitly called
  useEffect(() => {
    if (currentUser && cartItems.length > 0) {
      // Initial check when cart items change
      checkAndUpdateCartStock();
      
      // Set up a longer interval for periodic checks (15 minutes)
      const interval = setInterval(checkAndUpdateCartStock, 15 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [currentUser, cartItems.length]);

  const addToCart = async (item) => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      // Validate image field
      if (!item.image) {
        console.warn(`Adding item ${item.productId} without image, using default`);
        item.image = DEFAULT_IMAGE_URL;
      }

      // Check current stock from Firestore
      const productRef = doc(db, `products/config/${item.category}/${item.productId}`);
      const productDoc = await getDoc(productRef);
      const productData = productDoc.data();
      const currentStock = productData?.stock || 0;

      // If stock is 0, don't allow adding to cart
      if (currentStock === 0) {
        throw new Error('Item is out of stock');
      }

      // Ensure stock information is included
      const itemWithStock = {
        ...item,
        stock: currentStock,
      };

      // If the item has an id, it's an edit operation
      if (item.id) {
        const cartItemRef = doc(db, `cart_items/${currentUser.uid}/items`, item.id);
        await setDoc(cartItemRef, { ...itemWithStock, timestamp: serverTimestamp() }, { merge: true });
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
        // Check if adding more would exceed stock
        const newQuantity = existingItem.quantity + item.quantity;
        if (newQuantity > currentStock) {
          throw new Error(`Only ${currentStock} items available in stock`);
        }

        // Update existing item
        const newPrice = (item.price / item.quantity) * newQuantity;
        const updatedItem = {
          ...itemWithStock,
          quantity: newQuantity,
          price: newPrice,
          customized: true,
          image: item.image,
        };

        const cartItemRef = doc(db, `cart_items/${currentUser.uid}/items`, existingItem.id);
        await setDoc(cartItemRef, { ...updatedItem, timestamp: serverTimestamp() }, { merge: true });
      } else {
        // Check if requested quantity exceeds stock
        if (item.quantity > currentStock) {
          throw new Error(`Only ${currentStock} items available in stock`);
        }

        // Add new item
        const cartItemRef = doc(collection(db, `cart_items/${currentUser.uid}/items`));
        const cartItemId = cartItemRef.id;
        const newItem = { ...itemWithStock, id: cartItemId, customized: true };
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
    if (!currentUser || newQuantity < 1 || newQuantity > 10) return;

    try {
      const item = cartItems.find((i) => i.id === itemId);
      if (!item) return;

      // Check current stock from Firestore
      const productRef = doc(db, `products/config/${item.category}/${item.productId}`);
      const productDoc = await getDoc(productRef);
      const productData = productDoc.data();
      const currentStock = productData?.stock || 0;

      // If requested quantity exceeds stock, don't allow update
      if (newQuantity > currentStock) {
        throw new Error(`Only ${currentStock} items available in stock`);
      }

      const basePrice = item.price / item.quantity;
      const newPrice = basePrice * newQuantity;

      const itemRef = doc(db, `cart_items/${currentUser.uid}/items`, itemId);
      await setDoc(itemRef, {
        ...item,
        quantity: newQuantity,
        price: newPrice,
        stock: currentStock,
        image: item.image || DEFAULT_IMAGE_URL,
        timestamp: serverTimestamp(),
      }, { merge: true });

      setCartItems((prevItems) =>
        prevItems.map((i) =>
          i.id === itemId ? { ...i, quantity: newQuantity, price: newPrice, stock: currentStock } : i
        )
      );
    } catch (err) {
      console.error('Error updating quantity:', err);
      throw err;
    }
  };

  const removeFromCart = async (itemId) => {
    if (!currentUser) return;

    try {
      const itemRef = doc(db, `cart_items/${currentUser.uid}/items`, itemId);
      await deleteDoc(itemRef);

      setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error('Error removing cart item:', err);
    }
  };

  const clearCart = async () => {
    if (!currentUser) return;

    try {
      const cartRef = collection(db, `cart_items/${currentUser.uid}/items`);
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

  // Add function to check stock status
  const checkStockStatus = async () => {
    if (!currentUser) return { hasOutOfStock: false, outOfStockItems: [] };

    try {
      const outOfStock = [];
      for (const item of cartItems) {
        const productRef = doc(db, `products/config/${item.category}/${item.productId}`);
        const productDoc = await getDoc(productRef);
        const productData = productDoc.data();
        
        if (!productData || productData.stock === 0) {
          outOfStock.push({
            ...item,
            message: `${item.name} is out of stock. Please remove it from your cart to proceed.`
          });
        } else if (productData.stock < item.quantity) {
          outOfStock.push({
            ...item,
            message: `Only ${productData.stock} ${item.name}(s) available in stock. Please reduce quantity to ${productData.stock} to proceed.`
          });
        }
      }
      setOutOfStockItems(outOfStock);
      return { hasOutOfStock: outOfStock.length > 0, outOfStockItems: outOfStock };
    } catch (err) {
      console.error('Error checking stock status:', err);
      return { hasOutOfStock: false, outOfStockItems: [] };
    }
  };

  const value = {
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
    isLoading,
    checkStockStatus,
    outOfStockItems,
    isCheckingStock,
    checkAndUpdateCartStock
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartProvider;