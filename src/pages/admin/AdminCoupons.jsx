import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import './AdminCoupons.css';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount: '',
    type: 'percentage', // percentage or fixed
    minPurchase: '',
    maxDiscount: '',
    minItems: '',
    validFrom: '',
    validUntil: '',
    isActive: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const couponsCollection = collection(db, 'coupons');
      const couponsSnapshot = await getDocs(couponsCollection);
      const couponsList = couponsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCoupons(couponsList);
      setLoading(false);
    } catch (err) {
      setError('Error fetching coupons: ' + err.message);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewCoupon(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const couponsCollection = collection(db, 'coupons');
      await addDoc(couponsCollection, {
        ...newCoupon,
        createdAt: new Date().toISOString()
      });
      setNewCoupon({
        code: '',
        discount: '',
        type: 'percentage',
        minPurchase: '',
        maxDiscount: '',
        minItems: '',
        validFrom: '',
        validUntil: '',
        isActive: true
      });
      fetchCoupons();
    } catch (err) {
      setError('Error adding coupon: ' + err.message);
    }
  };

  const handleDelete = async (couponId) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await deleteDoc(doc(db, 'coupons', couponId));
        fetchCoupons();
      } catch (err) {
        setError('Error deleting coupon: ' + err.message);
      }
    }
  };

  const handleToggleActive = async (couponId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'coupons', couponId), {
        isActive: !currentStatus
      });
      fetchCoupons();
    } catch (err) {
      setError('Error updating coupon: ' + err.message);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-coupons">
      <h1>Manage Discount Coupons</h1>
      
      <div className="add-coupon-section">
        <h2>Add New Coupon</h2>
        <form onSubmit={handleSubmit} className="coupon-form">
          <div className="form-group">
            <label>Coupon Code:</label>
            <input
              type="text"
              name="code"
              value={newCoupon.code}
              onChange={handleInputChange}
              required
              placeholder="Enter coupon code"
            />
          </div>

          <div className="form-group">
            <label>Discount Type:</label>
            <select name="type" value={newCoupon.type} onChange={handleInputChange}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>

          <div className="form-group">
            <label>Discount Value:</label>
            <input
              type="number"
              name="discount"
              value={newCoupon.discount}
              onChange={handleInputChange}
              required
              placeholder={newCoupon.type === 'percentage' ? 'Enter percentage' : 'Enter amount'}
            />
          </div>

          <div className="form-group">
            <label>Minimum Purchase Amount:</label>
            <input
              type="number"
              name="minPurchase"
              value={newCoupon.minPurchase}
              onChange={handleInputChange}
              placeholder="Enter minimum purchase amount"
            />
          </div>

          <div className="form-group">
            <label>Minimum Items Required:</label>
            <input
              type="number"
              name="minItems"
              value={newCoupon.minItems}
              onChange={handleInputChange}
              placeholder="Enter minimum number of items"
              min="1"
            />
          </div>

          <div className="form-group">
            <label>Maximum Discount:</label>
            <input
              type="number"
              name="maxDiscount"
              value={newCoupon.maxDiscount}
              onChange={handleInputChange}
              placeholder="Enter maximum discount amount"
            />
          </div>

          <div className="form-group">
            <label>Valid From:</label>
            <input
              type="datetime-local"
              name="validFrom"
              value={newCoupon.validFrom}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Valid Until:</label>
            <input
              type="datetime-local"
              name="validUntil"
              value={newCoupon.validUntil}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={newCoupon.isActive}
                onChange={handleInputChange}
              />
              Active
            </label>
          </div>

          <button type="submit" className="submit-btn">Add Coupon</button>
        </form>
      </div>

      <div className="coupons-list">
        <h2>Existing Coupons</h2>
        <div className="coupons-table">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Discount</th>
                <th>Min Purchase</th>
                <th>Min Items</th>
                <th>Max Discount</th>
                <th>Valid From</th>
                <th>Valid Until</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(coupon => (
                <tr key={coupon.id}>
                  <td>{coupon.code}</td>
                  <td>{coupon.type}</td>
                  <td>{coupon.discount}{coupon.type === 'percentage' ? '%' : '₹'}</td>
                  <td>{coupon.minPurchase ? `₹${coupon.minPurchase}` : '-'}</td>
                  <td>{coupon.minItems ? `${coupon.minItems} items` : '-'}</td>
                  <td>{coupon.maxDiscount ? `₹${coupon.maxDiscount}` : '-'}</td>
                  <td>{new Date(coupon.validFrom).toLocaleString()}</td>
                  <td>{new Date(coupon.validUntil).toLocaleString()}</td>
                  <td>
                    <span className={`status ${coupon.isActive ? 'active' : 'inactive'}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="toggle-btn"
                      onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
                    >
                      {coupon.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(coupon.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCoupons; 