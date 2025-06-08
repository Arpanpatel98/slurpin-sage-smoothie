import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import './AdminProducts.css';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [updatingStock, setUpdatingStock] = useState(false);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    activeInMenu: 0
  });

  // Default image URL
  const DEFAULT_IMAGE_URL = "https://firebasestorage.googleapis.com/v0/b/slurpin-sage.firebasestorage.app/o/products%2FAll%2Fall.HEIC?alt=media&token=5e2ae9b9-bb7d-4c56-96a1-0a60986c1469";

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const categories = ["smoothies", "milkshakes", "bowls"];
      let allProducts = [];

      for (const category of categories) {
        const productsRef = collection(db, `products/config/${category}`);
        const querySnapshot = await getDocs(productsRef);
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          allProducts.push({
            id: doc.id,
            category,
            name: data.name || doc.id.replace(/-/g, " ").toUpperCase(),
            price: Number(data.price) || 0,
            image: data.imageUrl || DEFAULT_IMAGE_URL,
            stock: data.stock || 0,
            ingredients: Array.isArray(data.ingredients) ? data.ingredients.join(", ") : "Ingredients not available",
            isActive: data.isActive !== false, // Default to true if not set
          });
        });
      }

      setProducts(allProducts);
      
      // Calculate stats
      const stats = {
        totalProducts: allProducts.length,
        lowStock: allProducts.filter(p => p.stock > 0 && p.stock <= 10).length,
        outOfStock: allProducts.filter(p => p.stock === 0).length,
        activeInMenu: allProducts.filter(p => p.isActive).length
      };
      setStats(stats);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    navigate(`/admin/products/edit/${product.category}/${product.id}`);
  };

  const handleDelete = async (product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        await deleteDoc(doc(db, `products/config/${product.category}`, product.id));
        setProducts(products.filter(p => p.id !== product.id));
      } catch (err) {
        console.error("Error deleting product:", err);
        alert("Failed to delete product. Please try again.");
      }
    }
  };

  const updateStock = async (product, newStock) => {
    if (newStock < 0) {
      return;
    }

    try {
      setUpdatingStock(true);
      const productRef = doc(db, `products/config/${product.category}`, product.id);
      
      // Update in Firestore
      await updateDoc(productRef, {
        stock: newStock
      });

      // Update local state
      setProducts(products.map(p => 
        p.id === product.id && p.category === product.category 
          ? { ...p, stock: newStock }
          : p
      ));
    } catch (error) {
      console.error("Error updating stock:", error);
    } finally {
      setUpdatingStock(false);
    }
  };

  const toggleProductStatus = async (product) => {
    try {
      const productRef = doc(db, `products/config/${product.category}`, product.id);
      await updateDoc(productRef, {
        isActive: !product.isActive
      });
      
      // Update local state
      setProducts(products.map(p => 
        p.id === product.id && p.category === product.category 
          ? { ...p, isActive: !p.isActive }
          : p
      ));
    } catch (error) {
      console.error("Error toggling product status:", error);
      alert("Failed to update product status");
    }
  };

  const incrementStock = (product) => {
    updateStock(product, product.stock + 1);
  };

  const decrementStock = (product) => {
    if (product.stock > 0) {
      updateStock(product, product.stock - 1);
    }
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: 'Out of Stock', class: 'stock-out' };
    if (stock <= 10) return { text: 'Low Stock', class: 'stock-low' };
    return { text: 'In Stock', class: 'stock-good' };
  };

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        endPage = 4;
      }
      if (currentPage >= totalPages - 1) {
        startPage = totalPages - 3;
      }
      
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Products</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.totalProducts}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <i className="fas fa-blender text-green-500"></i>
            </div>
          </div>
          <p className="text-green-500 text-sm mt-2">
            <i className="fas fa-arrow-up"></i> 12% from last month
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Low Stock Items</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.lowStock}</h3>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <i className="fas fa-exclamation-triangle text-yellow-500"></i>
            </div>
          </div>
          <p className="text-yellow-500 text-sm mt-2">
            <i className="fas fa-arrow-up"></i> 3 more than yesterday
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Out of Stock</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.outOfStock}</h3>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <i className="fas fa-times-circle text-red-500"></i>
            </div>
          </div>
          <p className="text-red-500 text-sm mt-2">
            <i className="fas fa-arrow-down"></i> 2 less than yesterday
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active in Menu</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.activeInMenu}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <i className="fas fa-check-circle text-blue-500"></i>
            </div>
          </div>
          <p className="text-blue-500 text-sm mt-2">
            <i className="fas fa-arrow-up"></i> 4 more than last week
          </p>
        </div>
      </div>

      {/* Product Management Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Product Management</h2>
        <button 
          onClick={() => navigate('/admin/products/add')} 
          className="btn-primary px-4 py-2 rounded-lg text-white flex items-center"
        >
          <i className="fas fa-plus mr-2"></i> Add Product
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-4 mb-6 mt-6">
        <button
          className={`tab px-6 py-3 text-gray-700 ${activeCategory === 'all' ? 'active border-b-2 border-brand-500' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          All Products
        </button>
        <button
          className={`tab px-6 py-3 text-gray-700 ${activeCategory === 'smoothies' ? 'active border-b-2 border-brand-500' : ''}`}
          onClick={() => setActiveCategory('smoothies')}
        >
          Smoothies
        </button>
        <button
          className={`tab px-6 py-3 text-gray-700 ${activeCategory === 'milkshakes' ? 'active border-b-2 border-brand-500' : ''}`}
          onClick={() => setActiveCategory('milkshakes')}
        >
          Milkshakes
        </button>
        <button
          className={`tab px-6 py-3 text-gray-700 ${activeCategory === 'bowls' ? 'active border-b-2 border-brand-500' : ''}`}
          onClick={() => setActiveCategory('bowls')}
        >
          Bowls
        </button>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((product) => {
                const stockStatus = getStockStatus(product.stock);
                return (
                  <tr key={`${product.category}-${product.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-15 w-15">
                          <img
                            className="h-15 w-15 rounded-full object-cover"
                            src={product.image}
                            alt={product.name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.ingredients}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{product.price}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="stock-control">
                        <div className="stock-input-group">
                          <button 
                            className="stock-btn decrement"
                            onClick={() => decrementStock(product)}
                            disabled={updatingStock || product.stock === 0}
                          >
                            <i className="fas fa-minus"></i>
                          </button>
                          <input
                            type="number"
                            value={product.stock}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (!isNaN(value)) {
                                updateStock(product, value);
                              }
                            }}
                            min="0"
                            className="stock-input"
                            disabled={updatingStock}
                          />
                          <button 
                            className="stock-btn increment"
                            onClick={() => incrementStock(product)}
                            disabled={updatingStock}
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                        <div className="stock-status">
                          <span className={`stock-badge ${stockStatus.class}`}>
                            {stockStatus.text}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={product.isActive}
                          onChange={() => toggleProductStatus(product)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredProducts.length)}
                </span>{' '}
                of <span className="font-medium">{filteredProducts.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <i className="fas fa-chevron-left"></i>
                </button>
                
                {getPageNumbers().map((pageNum, index) => (
                  pageNum === '...' ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-gray-50 text-sm font-medium text-gray-700"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-brand-50 border-brand-500 text-brand-600'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <i className="fas fa-chevron-right"></i>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts; 