import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, setDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../../firebase';
import './EditProduct.css';

const AddProduct = () => {
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: 'smoothies',
        price: '',
        stock: 0,
        description: '',
        imageUrl: '',
        ingredients: [],
        healthBenefits: [],
        nutritionFacts: [],
        detailedBreakdown: [],
        keyInsights: [],
        isActive: true
    });

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setIsAuthenticated(!!user);
        });
        return () => unsubscribe();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleArrayInputChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].map((item, i) => 
                i === index ? value : item
            )
        }));
    };

    const addArrayItem = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: field === 'nutritionFacts' 
                ? [...prev[field], { nutrient: '', value: '', unit: '', percent: '', daily: '' }]
                : field === 'keyInsights'
                ? [...prev[field], { title: '', description: '' }]
                : [...prev[field], '']
        }));
    };

    const removeArrayItem = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const handleNutritionChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            nutritionFacts: prev.nutritionFacts.map((item, i) => 
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const handleInsightChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            keyInsights: prev.keyInsights.map((item, i) => 
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const transformNutritionFactsToBreakdown = (nutritionFacts) => {
        const transformedNutritionFacts = nutritionFacts.map(fact => ({
            name: fact.nutrient,
            value: fact.value,
            unit: fact.unit,
            percent: fact.percent,
            daily: fact.daily
        }));

        const detailedBreakdown = nutritionFacts.map(fact => ({
            nutrient: fact.nutrient,
            amount: `${fact.value} ${fact.unit}`,
            daily: `${fact.daily} ${fact.unit}`,
            percent: `${fact.percent}%`
        }));

        return { nutritionFacts: transformedNutritionFacts, detailedBreakdown };
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError('File size should be less than 5MB');
                return;
            }
            setSelectedFile(file);
            setError(null);
            const fileLabel = document.getElementById('fileLabel');
            if (fileLabel) {
                fileLabel.textContent = file.name;
            }
            const previewUrl = URL.createObjectURL(file);
            setFormData(prev => ({
                ...prev,
                imageUrl: previewUrl
            }));
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file first');
            return null;
        }

        if (!isAuthenticated) {
            setError('You must be logged in to upload images');
            return null;
        }

        setUploading(true);
        setError(null);
        
        try {
            const timestamp = Date.now();
            const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
            const filename = `${formData.category}/${timestamp}_${sanitizedFileName}`;
            
            const storageRef = ref(storage, `products/${filename}`);

            const metadata = {
                contentType: selectedFile.type,
                customMetadata: {
                    uploadedBy: auth.currentUser.uid,
                    category: formData.category,
                    timestamp: timestamp.toString()
                }
            };

            const snapshot = await uploadBytes(storageRef, selectedFile, metadata);
            const downloadUrl = await getDownloadURL(snapshot.ref);
            
            setSelectedFile(null);
            const fileLabel = document.getElementById('fileLabel');
            if (fileLabel) {
                fileLabel.textContent = 'Choose file...';
            }
            return downloadUrl;
        } catch (err) {
            console.error('Upload error:', err);
            setError('Error uploading image: ' + (err.message || 'Unknown error occurred'));
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let finalImageUrl = formData.imageUrl;
            if (selectedFile) {
                const uploadedUrl = await handleFileUpload();
                if (!uploadedUrl) {
                    return; // Stop if image upload fails
                }
                finalImageUrl = uploadedUrl;
            }

            const { nutritionFacts, detailedBreakdown } = transformNutritionFactsToBreakdown(formData.nutritionFacts);
            const productData = {
                ...formData,
                imageUrl: finalImageUrl,
                nutritionFacts,
                detailedBreakdown
            };

            const docId = formData.name.toLowerCase().replace(/\s+/g, '-');
            await setDoc(doc(db, `products/config/${formData.category}`, docId), productData);
            navigate('/admin/products');
        } catch (err) {
            setError('Error adding product: ' + err.message);
        }
    };

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-800">Add New Product</h2>
                <div>
                    <button 
                        onClick={handleSubmit}
                        disabled={uploading}
                        className={`px-6 py-2 rounded-md shadow-sm text-white ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'} focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`}
                    >
                        {uploading ? 'Processing...' : 'Add Product'}
                    </button>
                </div>
            </div>

            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="form-section p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                required
                            >
                                <option value="smoothies">Smoothies</option>
                                <option value="milkshakes">Milkshakes</option>
                                <option value="bowls">Bowls</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price (in cents)</label>
                            <input
                                type="number"
                                id="price"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                            <input
                                type="number"
                                id="stock"
                                name="stock"
                                value={formData.stock}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Product Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows="3"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                            style={{ height: '65px' }}
                            required
                        />
                    </div>
                </div>

                <div className="form-section p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Product Image</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                                <input
                                    type="text"
                                    id="imageUrl"
                                    name="imageUrl"
                                    value={formData.imageUrl}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Enter image URL or upload an image"
                                />
                            </div>
                            <div className="text-center">
                                <span className="text-sm text-gray-500">OR</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
                                <div className="file-upload flex items-center">
                                    <label htmlFor="fileUpload" className="flex-1 cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                                        <span id="fileLabel">Choose file...</span>
                                        <input 
                                            id="fileUpload" 
                                            name="fileUpload" 
                                            type="file" 
                                            accept="image/*" 
                                            className="sr-only" 
                                            onChange={handleFileSelect}
                                        />
                                    </label>
                                    <button 
                                        type="button" 
                                        onClick={handleFileUpload}
                                        disabled={!selectedFile || uploading}
                                        className={`ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                                            !selectedFile || uploading 
                                                ? 'bg-gray-400 cursor-not-allowed' 
                                                : 'bg-emerald-600 hover:bg-emerald-700'
                                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`}
                                    >
                                        {uploading ? 'Uploading...' : 'Upload'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image Preview</label>
                            <div className="h-48 w-full rounded-md border border-gray-300 bg-gray-100 flex items-center justify-center image-preview">
                                {formData.imageUrl ? (
                                    <img src={formData.imageUrl} alt="Product preview" className="max-h-full max-w-full object-contain" />
                                ) : (
                                    <span className="text-gray-400">Image preview will appear here</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-section p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Ingredients</h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            {formData.ingredients.map((ingredient, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={ingredient}
                                        onChange={(e) => handleArrayInputChange(index, 'ingredients', e.target.value)}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeArrayItem('ingredients', index)}
                                        className="p-2 text-red-500 hover:text-red-700"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => addArrayItem('ingredients')}
                            className="btn-add px-4 py-2 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add Ingredient
                        </button>
                    </div>
                </div>

                <div className="form-section p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Health Benefits</h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            {formData.healthBenefits.map((benefit, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={benefit}
                                        onChange={(e) => handleArrayInputChange(index, 'healthBenefits', e.target.value)}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="Enter health benefit"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeArrayItem('healthBenefits', index)}
                                        className="p-2 text-red-500 hover:text-red-700"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => addArrayItem('healthBenefits')}
                            className="btn-add px-4 py-2 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add Health Benefit
                        </button>
                    </div>
                </div>

                <div className="form-section p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Nutrition Facts</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nutrient</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Value (%)</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Reference</th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {formData.nutritionFacts.map((fact, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={fact.nutrient}
                                                onChange={(e) => handleNutritionChange(index, 'nutrient', e.target.value)}
                                                className="w-full px-3 py-1 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                            >
                                                <option value="">Select Nutrient</option>
                                                <option value="Calories">Calories</option>
                                                <option value="Total Fat">Total Fat</option>
                                                <option value="Saturated Fat">Saturated Fat</option>
                                                <option value="Trans Fat">Trans Fat</option>
                                                <option value="Cholesterol">Cholesterol</option>
                                                <option value="Sodium">Sodium</option>
                                                <option value="Total Carbohydrates">Total Carbohydrates</option>
                                                <option value="Dietary Fiber">Dietary Fiber</option>
                                                <option value="Sugars">Sugars</option>
                                                <option value="Protein">Protein</option>
                                                <option value="Vitamin A">Vitamin A</option>
                                                <option value="Vitamin C">Vitamin C</option>
                                                <option value="Calcium">Calcium</option>
                                                <option value="Iron">Iron</option>
                                                <option value="Potassium">Potassium</option>
                                                <option value="Vitamin D">Vitamin D</option>
                                                <option value="Vitamin E">Vitamin E</option>
                                                <option value="Vitamin K">Vitamin K</option>
                                                <option value="Thiamin">Thiamin</option>
                                                <option value="Riboflavin">Riboflavin</option>
                                                <option value="Niacin">Niacin</option>
                                                <option value="Vitamin B6">Vitamin B6</option>
                                                <option value="Folate">Folate</option>
                                                <option value="Vitamin B12">Vitamin B12</option>
                                                <option value="Biotin">Biotin</option>
                                                <option value="Pantothenic Acid">Pantothenic Acid</option>
                                                <option value="Phosphorus">Phosphorus</option>
                                                <option value="Iodine">Iodine</option>
                                                <option value="Magnesium">Magnesium</option>
                                                <option value="Zinc">Zinc</option>
                                                <option value="Selenium">Selenium</option>
                                                <option value="Copper">Copper</option>
                                                <option value="Manganese">Manganese</option>
                                                <option value="Chromium">Chromium</option>
                                                <option value="Molybdenum">Molybdenum</option>
                                                <option value="Chloride">Chloride</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="number"
                                                value={fact.value}
                                                onChange={(e) => handleNutritionChange(index, 'value', e.target.value)}
                                                className="w-full px-3 py-1 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                                step="0.01"
                                                min="0"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={fact.unit}
                                                onChange={(e) => handleNutritionChange(index, 'unit', e.target.value)}
                                                className="w-full px-3 py-1 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                            >
                                                <option value="">Select Unit</option>
                                                <option value="g">g</option>
                                                <option value="mg">mg</option>
                                                <option value="mcg">mcg</option>
                                                <option value="IU">IU</option>
                                                <option value="kcal">kcal</option>
                                                <option value="%">%</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="number"
                                                value={fact.percent}
                                                onChange={(e) => handleNutritionChange(index, 'percent', e.target.value)}
                                                className="w-full px-3 py-1 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                                min="0"
                                                max="100"
                                                step="0.1"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="text"
                                                value={fact.daily}
                                                onChange={(e) => handleNutritionChange(index, 'daily', e.target.value)}
                                                className="w-full px-3 py-1 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                                placeholder="e.g., 2,000 calories"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                type="button"
                                                onClick={() => removeArrayItem('nutritionFacts', index)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button
                            type="button"
                            onClick={() => addArrayItem('nutritionFacts')}
                            className="mt-4 btn-add px-4 py-2 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add Nutrition Fact
                        </button>
                    </div>
                </div>

                <div className="form-section p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Key Insights</h3>
                    <div className="space-y-4">
                        {formData.keyInsights.map((insight, index) => (
                            <div key={index} className="p-4 border border-gray-200 rounded-lg">
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="text-sm font-medium text-gray-900">Insight {index + 1}</h4>
                                    <button
                                        type="button"
                                        onClick={() => removeArrayItem('keyInsights', index)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                                        <input
                                            type="text"
                                            value={insight.title}
                                            onChange={(e) => handleInsightChange(index, 'title', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                                        <textarea
                                            value={insight.description}
                                            onChange={(e) => handleInsightChange(index, 'description', e.target.value)}
                                            rows="2"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => addArrayItem('keyInsights')}
                            className="btn-add px-4 py-2 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add Key Insight
                        </button>
                    </div>
                </div>
            </form>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={() => navigate('/admin/products')}
                    className="px-6 py-2 mr-4 bg-white text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={uploading}
                    className={`px-6 py-2 rounded-md shadow-sm text-white ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'} focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`}
                >
                    {uploading ? 'Processing...' : 'Add Product'}
                </button>
            </div>
        </main>
    );
};

export default AddProduct;