import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { Vehicle, VehicleFormData } from '../types';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { uploadMultipleImages, uploadImagesAsBase64 } from '../services/cloudinary';
import Layout from '../components/Layout';

const EditVehicle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<VehicleFormData>({
    chassisNumber: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    grade: '',
    country: '',
    purchasePrice: 0,
    cifValue: 0,
    tax: 0,
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
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        if (!id) {
          throw new Error('Vehicle ID is required');
        }

        const vehicleDoc = await getDoc(doc(db, 'vehicles', id));
        
        if (!vehicleDoc.exists()) {
          throw new Error('Vehicle not found');
        }

        const vehicleData = vehicleDoc.data() as Vehicle;
        setFormData({
          chassisNumber: vehicleData.chassisNumber || '',
          brand: vehicleData.brand || '',
          model: vehicleData.model || '',
          year: vehicleData.year || new Date().getFullYear(),
          grade: vehicleData.grade || '',
          country: vehicleData.country || '',
          purchasePrice: vehicleData.purchasePrice || 0,
          cifValue: vehicleData.cifValue || 0,
          tax: vehicleData.tax || 0,
          sellingPrice: vehicleData.sellingPrice || 0,
          advancePayment: vehicleData.advancePayment || 0,
          shippingCompany: vehicleData.shippingCompany || '',
          shippingDate: vehicleData.shippingDate ? (vehicleData.shippingDate && typeof (vehicleData.shippingDate as any).toDate === 'function' ? (vehicleData.shippingDate as any).toDate().toISOString().split('T')[0] : new Date(vehicleData.shippingDate).toISOString().split('T')[0]) : '',
          arrivalDate: vehicleData.arrivalDate ? (vehicleData.arrivalDate && typeof (vehicleData.arrivalDate as any).toDate === 'function' ? (vehicleData.arrivalDate as any).toDate().toISOString().split('T')[0] : new Date(vehicleData.arrivalDate).toISOString().split('T')[0]) : '',
          purchaserName: vehicleData.purchaserName || '',
          purchaserPhone: vehicleData.purchaserPhone || '',
          purchaserIdNumber: vehicleData.purchaserIdNumber || '',
          purchaserAddress: vehicleData.purchaserAddress || '',
          price: vehicleData.price || 0,
          images: []
        });
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch vehicle');
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!id) {
        throw new Error('Vehicle ID is required');
      }

      const netProfit = formData.sellingPrice - (formData.cifValue + (formData.tax || 0));
      const restPayment = formData.sellingPrice - formData.advancePayment;

      // Upload new images if any
      let imageUrls: string[] = [];
      if (formData.images.length > 0) {
        setUploading(true);
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
      }

      const vehicleDocRef = doc(db, 'vehicles', id);
      const vehicleData = {
        chassisNumber: formData.chassisNumber,
        brand: formData.brand,
        model: formData.model,
        year: formData.year,
        grade: formData.grade,
        country: formData.country,
        purchasePrice: formData.purchasePrice,
        cifValue: formData.cifValue,
        tax: formData.tax,
        sellingPrice: formData.sellingPrice,
        netProfit,
        advancePayment: formData.advancePayment,
        restPayment,
        shippingCompany: formData.shippingCompany,
        shippingDate: formData.shippingDate ? new Date(formData.shippingDate) : null,
        arrivalDate: formData.arrivalDate ? new Date(formData.arrivalDate) : null,
        purchaserName: formData.purchaserName,
        purchaserPhone: formData.purchaserPhone,
        purchaserIdNumber: formData.purchaserIdNumber,
        purchaserAddress: formData.purchaserAddress,
        price: formData.purchasePrice || formData.price,
        updatedAt: new Date()
      };

      // If there are new images, add them to the update
      if (imageUrls.length > 0) {
        Object.assign(vehicleData, { images: imageUrls });
      }

      await updateDoc(vehicleDocRef, vehicleData);
      setSuccess('Vehicle updated successfully!');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ['purchasePrice', 'cifValue', 'tax', 'sellingPrice', 'advancePayment', 'price', 'year'].includes(name)
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

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto" style={{ paddingTop: '75px' }}>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Vehicle</h1>
          <p className="text-gray-600">Update vehicle details and information</p>
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
                🚗
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax (LKR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">Rs.</span>
                  <input
                    type="number"
                    value={(formData as any).tax || ''}
                    onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
                  Tax (LKR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">Rs.</span>
                  <input
                    type="number"
                    name="tax"
                    value={(formData as any).tax}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Tax amount in LKR</p>
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
                Update Images (Maximum 4 images)
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
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
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
                  Updating Vehicle...
                </span>
              ) : (
                'Update Vehicle'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditVehicle;