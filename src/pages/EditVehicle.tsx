import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { VehicleFormData, TaxDutyConfig, Vehicle } from '../types';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { uploadMultipleImages, uploadImagesAsBase64 } from '../services/cloudinary';

const EditVehicle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  
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
  
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [taxDutyConfig, setTaxDutyConfig] = useState<TaxDutyConfig | null>(null);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [fullAmount, setFullAmount] = useState(0);
  const [status, setStatus] = useState('available');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (id) {
      loadVehicle();
    }
  }, [id]);

  useEffect(() => {
    if (formData.country) {
      loadTaxDutyConfig();
    }
  }, [formData.country]);

  const loadVehicle = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const vehicleDoc = await getDoc(doc(db, 'vehicles', id));
      
      if (vehicleDoc.exists()) {
        const vehicle = vehicleDoc.data() as Vehicle;
        
        // Check if user has permission to edit
        if (!isAdmin && vehicle.addedBy !== currentUser?.uid) {
          setError('You do not have permission to edit this vehicle');
          return;
        }
        
        setFormData({
          chassisNumber: vehicle.chassisNumber,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          grade: vehicle.grade || '',
          country: vehicle.country,
          
          // Financial Information
          purchasePrice: vehicle.purchasePrice || vehicle.price || 0,
          cifValue: vehicle.cifValue || 0,
          lcValue: vehicle.lcValue || 0,
          sellingPrice: vehicle.sellingPrice || vehicle.totalAmount || 0,
          advancePayment: vehicle.advancePayment || 0,
          
          // Shipping Information
          shippingCompany: vehicle.shippingCompany || '',
          shippingDate: vehicle.shippingDate ? new Date(vehicle.shippingDate).toISOString().split('T')[0] : '',
          arrivalDate: vehicle.arrivalDate ? new Date(vehicle.arrivalDate).toISOString().split('T')[0] : '',
          
          // Purchaser Details
          purchaserName: vehicle.purchaserName || '',
          purchaserPhone: vehicle.purchaserPhone || '',
          purchaserIdNumber: vehicle.purchaserIdNumber || '',
          purchaserAddress: vehicle.purchaserAddress || '',
          
          // Legacy support
          price: vehicle.price || 0,
          images: []
        });
        
        setCurrentImages(vehicle.images || []);
        setAdvancePayment(vehicle.advancePayment || 0);
        setFullAmount(vehicle.sellingPrice || vehicle.totalAmount || 0);
        setStatus(vehicle.status || 'available');
      } else {
        setError('Vehicle not found');
      }
    } catch (error) {
      console.error('Error loading vehicle:', error);
      setError('Failed to load vehicle details');
    } finally {
      setLoading(false);
    }
  };

  const loadTaxDutyConfig = async () => {
    try {
      const configRef = collection(db, 'taxDutyConfig');
      const q = query(configRef, where('country', '==', formData.country));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const config = querySnapshot.docs[0].data() as TaxDutyConfig;
        setTaxDutyConfig(config);
      } else {
        setTaxDutyConfig(null);
      }
    } catch (error) {
      console.error('Error loading tax/duty config:', error);
    }
  };

  const calculateTotals = () => {
    const price = formData.price || 0;
    const taxPercentage = taxDutyConfig?.taxPercentage || 15;
    const dutyPercentage = taxDutyConfig?.dutyPercentage || 10;
    
    const tax = (price * taxPercentage) / 100;
    const duty = (price * dutyPercentage) / 100;
    const totalAmount = price + tax + duty;
    
    return { tax, duty, totalAmount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.chassisNumber || !formData.brand || !formData.model) {
        throw new Error('Please fill in all required fields');
      }

      const { tax, duty, totalAmount } = calculateTotals();

      // Handle new images if any
      let imageUrls = currentImages;
      if (formData.images.length > 0) {
        if (formData.images.length > 4) {
          throw new Error('Maximum 4 images allowed');
        }

        setUploading(true);
        try {
          const newImageUrls = await uploadMultipleImages(formData.images);
          imageUrls = [...currentImages, ...newImageUrls].slice(0, 4); // Limit to 4 total
        } catch (cloudinaryError: any) {
          console.warn('Cloudinary upload failed:', cloudinaryError);
          
          // Only fallback to base64 for small images
          try {
            const base64Images = await uploadImagesAsBase64(formData.images);
            imageUrls = [...currentImages, ...base64Images].slice(0, 4);
            setError('Note: Using development mode for new images. Some features may be limited.');
          } catch (base64Error) {
            throw new Error(`Upload failed: ${cloudinaryError.message}. Please check your Cloudinary configuration or use smaller images.`);
          }
        }
        setUploading(false);
      }

      // Update vehicle document
      const updateData: any = {
        chassisNumber: formData.chassisNumber,
        brand: formData.brand,
        model: formData.model,
        year: formData.year,
        grade: formData.grade,
        country: formData.country,
        price: formData.price,
        tax: tax,
        duty: duty,
        totalAmount: fullAmount || totalAmount,
        advancePayment: advancePayment,
        fullAmount: fullAmount || totalAmount,
        images: imageUrls,
        updatedAt: new Date()
      };

      // Only admin can update status
      if (isAdmin) {
        updateData.status = status;
      }

      await updateDoc(doc(db, 'vehicles', id), updateData);
      
      setSuccess('Vehicle updated successfully!');
      
      // Redirect after successful update
      setTimeout(() => {
        navigate(`/vehicle/${id}`);
      }, 2000);
      
    } catch (error: any) {
      setError(error.message || 'Failed to update vehicle');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' || name === 'year' ? parseInt(value) || 0 : value
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const totalImages = currentImages.length + files.length;
      
      if (totalImages > 4) {
        setError('Maximum 4 images allowed in total');
        return;
      }
      
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

  const removeCurrentImage = (index: number) => {
    const newImages = currentImages.filter((_, i) => i !== index);
    setCurrentImages(newImages);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !formData.chassisNumber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { tax, duty, totalAmount } = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Edit Vehicle</h1>
            <p className="text-gray-600">Update vehicle details below</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chassis Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Chassis Number *
                </label>
                <input
                  type="text"
                  name="chassisNumber"
                  required
                  value={formData.chassisNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Brand *
                </label>
                <input
                  type="text"
                  name="brand"
                  required
                  value={formData.brand}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Model *
                </label>
                <input
                  type="text"
                  name="model"
                  required
                  value={formData.model}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Year
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Grade */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Vehicle Grade
                </label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Grade</option>
                  <option value="A">Grade A</option>
                  <option value="B">Grade B</option>
                  <option value="C">Grade C</option>
                  <option value="D">Grade D</option>
                </select>
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Country *
                </label>
                <select
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Price (USD) *
                </label>
                <input
                  type="number"
                  name="price"
                  required
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Status (Admin only) */}
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </div>
              )}
            </div>

            {/* Financial Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Advance Payment (USD)
                </label>
                <input
                  type="number"
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Amount (USD)
                </label>
                <input
                  type="number"
                  value={fullAmount}
                  onChange={(e) => setFullAmount(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  placeholder={`Auto-calculated: $${totalAmount.toLocaleString()}`}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Leave empty to use auto-calculated amount including tax and duty
                </p>
              </div>
            </div>

            {/* Tax and Duty Information */}
            {taxDutyConfig && (
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Tax & Duty Calculation</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Base Price:</span>
                    <p className="font-medium">${formData.price.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Tax ({taxDutyConfig.taxPercentage}%):</span>
                    <p className="font-medium">${tax.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Duty ({taxDutyConfig.dutyPercentage}%):</span>
                    <p className="font-medium">${duty.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Total:</span>
                    <p className="font-medium">${totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Current Images */}
            {currentImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Images
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {currentImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Vehicle ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeCurrentImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Add New Images (Max {4 - currentImages.length} more)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                disabled={currentImages.length >= 4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              />
              <p className="text-sm text-gray-500 mt-1">
                Upload additional high-quality images of the vehicle (total max: 4)
              </p>

              {formData.images.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Selected: {formData.images.length} new image(s)</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.from(formData.images).map((file, index) => (
                      <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {file.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(`/vehicle/${id}`)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading Images...' : saving ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditVehicle;
