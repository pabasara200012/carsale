import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { VehicleFormData, TaxDutyConfig } from '../types';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { uploadMultipleImages, uploadImagesAsBase64 } from '../services/cloudinary';
import Layout from '../components/Layout';

const AddVehicle: React.FC = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<VehicleFormData>({
    chassisNumber: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    grade: '',
    country: '',
    
    // Financial Information
    purchasePrice: 0,
    cifValue: 0,
    lcValue: 0,
    sellingPrice: 0,
    advancePayment: 0,
    
    // Shipping Information
    shippingCompany: '',
    shippingDate: '',
    arrivalDate: '',
    
    // Purchaser Details
    purchaserName: '',
    purchaserPhone: '',
    purchaserIdNumber: '',
    purchaserAddress: '',
    
    // Legacy support
    price: 0,
    images: []
  });
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-calculate derived values
  const netProfit = formData.sellingPrice - formData.cifValue;
  const restPayment = formData.sellingPrice - formData.advancePayment;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.chassisNumber || !formData.brand || !formData.model) {
        throw new Error('Please fill in all required fields (Chassis Number, Brand, Model)');
      }

      if (formData.images.length === 0) {
        throw new Error('Please upload at least one image');
      }

      if (formData.images.length > 4) {
        throw new Error('Maximum 4 images allowed');
      }

      // Upload images to Cloudinary
      setUploading(true);
      let imageUrls: string[];
      
      try {
        imageUrls = await uploadMultipleImages(formData.images);
        console.log('Images uploaded to Cloudinary successfully');
      } catch (cloudinaryError: any) {
        console.warn('Cloudinary upload failed:', cloudinaryError);
        
        try {
          imageUrls = await uploadImagesAsBase64(formData.images);
          console.log('Images converted to base64 for development');
          setError('Note: Using development mode for images. Some features may be limited.');
        } catch (base64Error) {
          throw new Error(`Upload failed: ${cloudinaryError.message}. Please check your Cloudinary configuration or use smaller images.`);
        }
      }
      
      setUploading(false);

      // Create vehicle document with all fields
      const vehicleData = {
        chassisNumber: formData.chassisNumber,
        brand: formData.brand,
        model: formData.model,
        year: formData.year,
        grade: formData.grade,
        country: formData.country,
        
        // Financial Information
        purchasePrice: formData.purchasePrice,
        cifValue: formData.cifValue,
        lcValue: formData.lcValue,
        sellingPrice: formData.sellingPrice,
        netProfit: netProfit,
        advancePayment: formData.advancePayment,
        restPayment: restPayment,
        
        // Shipping Information
        shippingCompany: formData.shippingCompany,
        shippingDate: formData.shippingDate ? new Date(formData.shippingDate) : null,
        arrivalDate: formData.arrivalDate ? new Date(formData.arrivalDate) : null,
        
        // Purchaser Details
        purchaserName: formData.purchaserName,
        purchaserPhone: formData.purchaserPhone,
        purchaserIdNumber: formData.purchaserIdNumber,
        purchaserAddress: formData.purchaserAddress,
        
        // Legacy support
        price: formData.purchasePrice || formData.price,
        
        images: imageUrls,
        addedBy: currentUser?.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'available'
      };

      await addDoc(collection(db, 'vehicles'), vehicleData);
      
      setSuccess('Vehicle added successfully!');
      
      // Reset form
      setFormData({
        chassisNumber: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        grade: '',
        country: '',
        purchasePrice: 0,
        cifValue: 0,
        lcValue: 0,
        sellingPrice: 0,
        advancePayment: 0,
        shippingCompany: '',
        shippingDate: '',
        arrivalDate: '',
        purchaserName: '',
        purchaserPhone: '',
        purchaserIdNumber: '',
        purchaserAddress: '',
        price: 0,
        images: []
      });
      
    } catch (error: any) {
      setError(error.message || 'Failed to add vehicle');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ['purchasePrice', 'cifValue', 'lcValue', 'sellingPrice', 'advancePayment', 'price', 'year'].includes(name)
        ? parseFloat(value) || 0 
        : value
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length > 4) {
        setError('Maximum 4 images allowed');
        return;
      }
      
      // Validate file sizes and types
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          setError(`File ${file.name} is too large. Maximum size is 10MB.`);
          return;
        }
        if (!file.type.startsWith('image/')) {
          setError(`File ${file.name} is not an image.`);
          return;
        }
      }
      
      setError('');
      setFormData({
        ...formData,
        images: files
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto" style={{ paddingTop: '75px' }}>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Vehicle</h1>
          <p className="text-gray-600">Fill in the complete vehicle details including financial and shipping information</p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <span className="text-green-500 mr-2">✅</span>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Vehicle Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                �
              </span>
              Basic Vehicle Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chassis Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="chassisNumber"
                  required
                  value={formData.chassisNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter unique chassis number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="brand"
                  required
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Toyota, Honda, BMW..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="model"
                  required
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Camry, Civic, X5..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Grade
                </label>
                <input
                  type="text"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="A, B, C, D, or custom grade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select Country</option>
                  <option value="Japan">Japan</option>
                  <option value="Germany">Germany</option>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
                  <option value="South Korea">South Korea</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                💰
              </span>
              Financial Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Price (LKR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">Rs.</span>
                  <input
                    type="number"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CIF Value (LKR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">Rs.</span>
                  <input
                    type="number"
                    name="cifValue"
                    value={formData.cifValue}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Cost, Insurance, and Freight</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LC Value (LKR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">Rs.</span>
                  <input
                    type="number"
                    name="lcValue"
                    value={formData.lcValue}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Letter of Credit Value</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selling Price (LKR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">Rs.</span>
                  <input
                    type="number"
                    name="sellingPrice"
                    value={formData.sellingPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advance Payment (LKR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">Rs.</span>
                  <input
                    type="number"
                    name="advancePayment"
                    value={formData.advancePayment}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Auto-calculated fields */}
              <div className="lg:col-span-1 grid grid-cols-1 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Net Profit (Auto-calculated)
                  </label>
                  <div className="text-lg font-semibold text-green-600">
                    Rs. {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-gray-500">Selling Price - CIF Value</p>
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rest Payment (Auto-calculated)
                  </label>
                  <div className="text-lg font-semibold text-blue-600">
                    Rs. {restPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-gray-500">Selling Price - Advance Payment</p>
                </div>
              </div>
            </div>

          </div>

          {/* Shipping Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                🚢
              </span>
              Shipping Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Company
                </label>
                <input
                  type="text"
                  name="shippingCompany"
                  value={formData.shippingCompany}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter shipping company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Date
                </label>
                <input
                  type="date"
                  name="shippingDate"
                  value={formData.shippingDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arrival Date
                </label>
                <input
                  type="date"
                  name="arrivalDate"
                  value={formData.arrivalDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Purchaser Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                👤
              </span>
              Purchaser Details <span className="text-sm font-normal text-gray-500">(Optional)</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Person Name
                </label>
                <input
                  type="text"
                  name="purchaserName"
                  value={formData.purchaserName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter purchaser's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="purchaserPhone"
                  value={formData.purchaserPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Number
                </label>
                <input
                  type="text"
                  name="purchaserIdNumber"
                  value={formData.purchaserIdNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter ID/NIC number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  name="purchaserAddress"
                  value={formData.purchaserAddress}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Enter complete address"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Images */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                📷
              </span>
              Vehicle Images
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Images (Maximum 4 images) <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="mt-2 text-sm text-gray-600">
                Upload 1-4 high-quality images of the vehicle. Maximum 10MB per image.
              </p>
              
              {formData.images.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-700 mb-2">Selected files:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Array.from(formData.images).map((file, index) => (
                      <div key={index} className="flex items-center text-sm bg-gray-50 px-3 py-2 rounded-lg">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        <span className="flex-1 truncate">{file.name}</span>
                        <span className="text-gray-500 text-xs">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upload Progress */}
          {(loading || uploading) && uploadProgress > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {uploading ? 'Uploading Images...' : 'Processing...'}
                </span>
                <span className="text-sm text-gray-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6">
            <a
              href="/dashboard"
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {uploading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading Images...
                </span>
              ) : loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding Vehicle...
                </span>
              ) : (
                'Add Vehicle'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddVehicle;
