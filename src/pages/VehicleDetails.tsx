import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Vehicle } from '../types';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const VehicleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    loadVehicle();
  }, [id]);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      const vehicleDoc = await getDoc(doc(db, 'vehicles', id!));
      
      if (vehicleDoc.exists()) {
        const vehicleData = { id: vehicleDoc.id, ...vehicleDoc.data() } as Vehicle;
        setVehicle(vehicleData);
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

  const handleEdit = () => {
    navigate(`/edit-vehicle/${id}`);
  };

  const calculateProfit = () => {
    if (!vehicle) return 0;
    return (vehicle.sellingPrice || 0) - ((vehicle.cifValue || 0) + (vehicle.tax || 0));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sold': return 'bg-green-100 text-green-800 border-green-300';
      case 'available': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'reserved': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Vehicle Information</h2>
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
              <span className="text-sm text-gray-600">Country:</span>
              <p className="font-semibold">{vehicle.country}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Grade:</span>
              <p className="font-semibold">{vehicle.grade || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Financial Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Purchase Price:</span>
              <p className="font-semibold">Rs. {vehicle.purchasePrice.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">CIF Value:</span>
              <p className="font-semibold">Rs. {vehicle.cifValue.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Tax:</span>
              <p className="font-semibold">Rs. {((vehicle as any).tax || 0).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Selling Price:</span>
              <p className="font-semibold">Rs. {vehicle.sellingPrice.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Advance Payment:</span>
              <p className="font-semibold">Rs. {vehicle.advancePayment.toLocaleString()}</p>
            </div>
            {isAdmin && (
              <div>
                <span className="text-sm text-gray-600">Net Profit:</span>
                <p className={`font-semibold text-lg ${calculateProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Rs. {calculateProfit().toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleEdit}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Edit Vehicle
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default VehicleDetailsPage;