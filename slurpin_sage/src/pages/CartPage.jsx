import React from 'react';

import Cart from '../components/cart/Cart';
import MobileNav from '../components/cart/MobileNav';
import BackToTop from '../components/cart/BackToTop';
import '../global.css'

const CartPage = () => {
  return (
    <>
 
      <main style={{ padding: '24px 0' }}>
        <Cart />
      </main>

      {/* <MobileNav /> */}
      <BackToTop />
    </>
  );
};

export default CartPage;