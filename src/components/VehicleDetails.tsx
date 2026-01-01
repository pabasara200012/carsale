import React, { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

interface VehicleDetailsProps {
  vehicleId: string;
}

const VehicleDetails: React.FC<VehicleDetailsProps> = ({ vehicleId }) => {
  const { currentUser, isAdmin } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Vehicle>>({});

  useEffect(() => {
    loadVehicle();
  }, [vehicleId]);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      const vehicleDoc = await getDoc(doc(db, 'vehicles', vehicleId));
      
      if (vehicleDoc.exists()) {
        const vehicleData = { id: vehicleDoc.id, ...vehicleDoc.data() } as Vehicle;
        setVehicle(vehicleData);
        setEditData(vehicleData);
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

  const handleEdit = (section: string) => {
    setEditingSection(section);
    setEditData(vehicle || {});
  };

  const handleSave = async (section: string) => {
    if (!vehicle) return;

    try {
      const updateData: any = {
        updatedAt: new Date()
      };

      // Copy relevant fields based on section
      if (section === 'basic') {
        updateData.brand = editData.brand;
        updateData.model = editData.model;
        updateData.year = editData.year;
        updateData.chassisNumber = editData.chassisNumber;
        updateData.grade = editData.grade;
        updateData.status = editData.status;
      } else if (section === 'financial') {
        updateData.purchasePrice = editData.purchasePrice || 0;
        updateData.cifValue = editData.cifValue || 0;
        updateData.tax = editData.tax || 0;
        updateData.sellingPrice = editData.sellingPrice || 0;
        updateData.advancePayment = editData.advancePayment || 0;
        // Calculate derived values
        updateData.netProfit = (editData.sellingPrice || 0) - ((editData.cifValue || 0) + (editData.tax || 0));
        updateData.restPayment = (editData.sellingPrice || 0) - (editData.advancePayment || 0);
      } else if (section === 'shipping') {
        updateData.shippingCompany = editData.shippingCompany;
        updateData.shippingDate = editData.shippingDate;
        updateData.arrivalDate = editData.arrivalDate;
      } else if (section === 'purchaser') {
        updateData.purchaserName = editData.purchaserName;
        updateData.purchaserPhone = editData.purchaserPhone;
        updateData.purchaserIdNumber = editData.purchaserIdNumber;
        updateData.purchaserAddress = editData.purchaserAddress;
      }

      await updateDoc(doc(db, 'vehicles', vehicleId), updateData);
      
      setVehicle({ ...vehicle, ...updateData });
      setEditingSection(null);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      setError('Failed to update vehicle');
    }
  };

  const handleCancel = () => {
    setEditingSection(null);
    setEditData(vehicle || {});
  };

  const calculateProfit = () => {
    if (!vehicle) return 0;
    return (vehicle.sellingPrice || 0) - ((vehicle.cifValue || 0) + (vehicle.tax || 0));
  };

  const calculateRestPayment = () => {
    if (!vehicle) return 0;
    return (vehicle.sellingPrice || 0) - (vehicle.advancePayment || 0);
  };

  const toSafeDate = (d: any): Date | null => {
    if (!d) return null;
    if (d && typeof d.toDate === 'function') {
      try {
        return d.toDate();
      } catch {
        return null;
      }
    }
    if (d instanceof Date) return d;
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  };

  const toSafeDateString = (d: any): string => {
    const dt = toSafeDate(d);
    return dt ? dt.toLocaleDateString() : 'Not specified';
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

  if (error || !vehicle) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-800">Error</h3>
            <p className="text-red-600">{error || 'Vehicle not found'}</p>
          </div>
        </div>
      </Layout>
    );
  }

  const canEdit = isAdmin || vehicle.addedBy === currentUser?.uid;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sold': return 'bg-green-100 text-green-800 border-green-300';
      case 'available': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'reserved': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {vehicle.brand} {vehicle.model} {vehicle.year}
            </h1>
            <p className="text-gray-600 mt-1">Vehicle Details</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(vehicle.status)}`}>
            {vehicle.status}
          </span>
        </div>

        {/* Vehicle Images */}
        {vehicle.images && vehicle.images.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Vehicle Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicle.images.map((imageUrl: string, index: number) => (
                <div key={index} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={`Vehicle ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Basic Vehicle Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Basic Vehicle Information</h2>
            {canEdit && editingSection !== 'basic' && (
              <button
                onClick={() => handleEdit('basic')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {editingSection === 'basic' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                <input
                  type="text"
                  value={editData.brand || ''}
                  onChange={(e) => setEditData({ ...editData, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <input
                  type="text"
                  value={editData.model || ''}
                  onChange={(e) => setEditData({ ...editData, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <input
                  type="number"
                  value={editData.year || ''}
                  onChange={(e) => setEditData({ ...editData, year: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chassis Number</label>
                <input
                  type="text"
                  value={editData.chassisNumber || ''}
                  onChange={(e) => setEditData({ ...editData, chassisNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                <input
                  type="text"
                  value={editData.grade || ''}
                  onChange={(e) => setEditData({ ...editData, grade: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={editData.status || ''}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="available">Available</option>
                  <option value="sold">Sold</option>
                  <option value="pending">Pending</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button
                  onClick={() => handleSave('basic')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Brand:</span>
                <p className="font-semibold">{vehicle.brand}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Model:</span>
                <p className="font-semibold">{vehicle.model}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Year:</span>
                <p className="font-semibold">{vehicle.year}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Chassis Number:</span>
                <p className="font-semibold">{vehicle.chassisNumber}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Grade:</span>
                <p className="font-semibold">{vehicle.grade || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Status:</span>
                <p className="font-semibold capitalize">{vehicle.status}</p>
              </div>
            </div>
          )}
        </div>

        {/* Financial Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Financial Information</h2>
            {canEdit && editingSection !== 'financial' && (
              <button
                onClick={() => handleEdit('financial')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {editingSection === 'financial' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Price (LKR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">Rs.</span>
                  <input
                    type="number"
                    value={editData.purchasePrice || ''}
                    onChange={(e) => setEditData({ ...editData, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CIF Value (LKR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">Rs.</span>
                  <input
                    type="number"
                    value={editData.cifValue || ''}
                    onChange={(e) => setEditData({ ...editData, cifValue: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax (LKR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">Rs.</span>
                  <input
                    type="number"
                    value={editData.tax || ''}
                    onChange={(e) => setEditData({ ...editData, tax: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price (LKR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">Rs.</span>
                  <input
                    type="number"
                    value={editData.sellingPrice || ''}
                    onChange={(e) => setEditData({ ...editData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Advance Payment (LKR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">Rs.</span>
                  <input
                    type="number"
                    value={editData.advancePayment || ''}
                    onChange={(e) => setEditData({ ...editData, advancePayment: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="md:col-span-2 flex gap-2 mt-4">
                <button
                  onClick={() => handleSave('financial')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Purchase Price:</span>
                <p className="font-semibold">Rs. {(vehicle.purchasePrice || 0).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">CIF Value:</span>
                <p className="font-semibold">Rs. {(vehicle.cifValue || 0).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Tax:</span>
                <p className="font-semibold">Rs. {(vehicle.tax || 0).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Selling Price:</span>
                <p className="font-semibold">Rs. {(vehicle.sellingPrice || 0).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Advance Payment:</span>
                <p className="font-semibold">Rs. {(vehicle.advancePayment || 0).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Rest Payment:</span>
                <p className="font-semibold">Rs. {calculateRestPayment().toLocaleString()}</p>
              </div>
              <div className="md:col-span-2">
                <span className="text-sm text-gray-600">Net Profit:</span>
                <p className={`font-semibold text-lg ${calculateProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Rs. {calculateProfit().toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Shipping Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Shipping Information</h2>
            {canEdit && editingSection !== 'shipping' && (
              <button
                onClick={() => handleEdit('shipping')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {editingSection === 'shipping' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Company</label>
                <input
                  type="text"
                  value={editData.shippingCompany || ''}
                  onChange={(e) => setEditData({ ...editData, shippingCompany: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Date</label>
                <input
                  type="date"
                  value={editData.shippingDate ? (toSafeDate(editData.shippingDate) ? toSafeDate(editData.shippingDate)!.toISOString().split('T')[0] : '') : ''}
                  onChange={(e) => setEditData({ ...editData, shippingDate: new Date(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Arrival Date</label>
                <input
                  type="date"
                  value={editData.arrivalDate ? (toSafeDate(editData.arrivalDate) ? toSafeDate(editData.arrivalDate)!.toISOString().split('T')[0] : '') : ''}
                  onChange={(e) => setEditData({ ...editData, arrivalDate: new Date(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2 flex gap-2 mt-4">
                <button
                  onClick={() => handleSave('shipping')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Shipping Company:</span>
                <p className="font-semibold">{vehicle.shippingCompany || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Shipping Date:</span>
                <p className="font-semibold">{toSafeDateString(vehicle.shippingDate)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Arrival Date:</span>
                <p className="font-semibold">{toSafeDateString(vehicle.arrivalDate)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Purchaser Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Purchaser Details</h2>
            {canEdit && editingSection !== 'purchaser' && (
              <button
                onClick={() => handleEdit('purchaser')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {editingSection === 'purchaser' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Purchaser Name</label>
                <input
                  type="text"
                  value={editData.purchaserName || ''}
                  onChange={(e) => setEditData({ ...editData, purchaserName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                <input
                  type="text"
                  value={editData.purchaserPhone || ''}
                  onChange={(e) => setEditData({ ...editData, purchaserPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ID Number</label>
                <input
                  type="text"
                  value={editData.purchaserIdNumber || ''}
                  onChange={(e) => setEditData({ ...editData, purchaserIdNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  value={editData.purchaserAddress || ''}
                  onChange={(e) => setEditData({ ...editData, purchaserAddress: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2 flex gap-2 mt-4">
                <button
                  onClick={() => handleSave('purchaser')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Purchaser Name:</span>
                <p className="font-semibold">{vehicle.purchaserName || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Contact Number:</span>
                <p className="font-semibold">{vehicle.purchaserPhone || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">ID Number:</span>
                <p className="font-semibold">{vehicle.purchaserIdNumber || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Address:</span>
                <p className="font-semibold">{vehicle.purchaserAddress || 'Not specified'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default VehicleDetails;
