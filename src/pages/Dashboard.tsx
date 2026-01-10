import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { Vehicle } from '../types';
import { useVehicles } from '../hooks/useVehicles';
import Layout from '../components/Layout';

const Dashboard: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { vehicles, loading, deleteVehicle, updateVehicle } = useVehicles();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [statusSaving, setStatusSaving] = useState<Record<string, string>>({});
  const [recentArticles, setRecentArticles] = useState<Array<any>>([]);

  useEffect(() => {
    filterVehicles();
    fetchRecentArticles();
  }, [searchTerm, vehicles, filterStatus]);

  const fetchRecentArticles = async () => {
    try {
      const q = query(collection(db, 'vehicleArticles'), orderBy('createdAt', 'desc'), limit(10));
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setRecentArticles(items);
    } catch (err) {
      console.error('Failed to load recent articles', err);
    }
  };

  const filterVehicles = () => {
    let filtered = vehicles;

    if (searchTerm) {
      filtered = filtered.filter(vehicle =>
        vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.chassisNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === filterStatus);
    }

    setFilteredVehicles(filtered);
  };

  const handleQuickStatusChange = async (vehicleId: string, newStatus: 'available' | 'sold' | 'reserved') => {
    setStatusSaving(prev => ({ ...prev, [vehicleId]: 'saving' }));
    try {
      await updateVehicle(vehicleId, { status: newStatus as 'available' | 'sold' | 'reserved' });
      setStatusSaving(prev => ({ ...prev, [vehicleId]: 'saved' }));
      setTimeout(() => setStatusSaving(prev => ({ ...prev, [vehicleId]: '' })), 2000);
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      setStatusSaving(prev => ({ ...prev, [vehicleId]: 'error' }));
      setTimeout(() => setStatusSaving(prev => ({ ...prev, [vehicleId]: '' })), 3000);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await deleteVehicle(vehicleId);
      } catch (error) {
        console.error('Error deleting vehicle:', error);
      }
    }
  };

  const calculateProfit = (vehicle: Vehicle) => {
    const price = vehicle.price ?? vehicle.purchasePrice ?? vehicle.cifValue ?? 0;
    const tax = vehicle.tax ?? 0;
    const duty = vehicle.duty ?? 0;
    const totalCost = price + tax + duty;
    const selling = vehicle.sellingPrice ?? vehicle.totalAmount ?? vehicle.netProfit ?? 0;
    return selling - totalCost;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'sold':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-8" style={{ paddingTop: '70px' }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Daya Auto</h1>
        <p className="text-gray-600">Welcome back, {currentUser?.displayName || 'User'}! Here's your vehicle overview.</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <Link
          to="/add-vehicle"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <span className="mr-2">➕</span>
          <p className="text-sm font-medium text-gray-600">Add New Vehicle</p>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
              <p className="text-3xl font-bold text-gray-900">{filteredVehicles.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🚗</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-3xl font-bold text-green-600">
                {filteredVehicles.filter(v => v.status === 'available').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sold</p>
              <p className="text-3xl font-bold text-blue-600">
                {filteredVehicles.filter(v => v.status === 'sold').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className="text-3xl font-bold text-purple-600">
                Rs. {filteredVehicles.reduce((total, v) => total + calculateProfit(v), 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {/* Recent Articles (horizontal scroll) */}
      {recentArticles.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Latest Articles</h3>
          <div className="flex gap-4 overflow-x-auto py-2">
            {recentArticles.map((a) => (
              <Link key={a.id} to={`/vehicle/${a.vehicleId}/articles`} className="min-w-[260px] flex-shrink-0 p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md">
                <div className="text-sm text-gray-600">{a.author || 'Admin'}</div>
                <div className="font-semibold truncate">{a.title}</div>
                <div className="text-sm text-gray-500 mt-2 line-clamp-2">{a.body?.slice(0, 120)}</div>
                <div className="text-xs text-gray-400 mt-3">Vehicle: {a.vehicleId}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by brand, model, chassis number, or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'available', 'sold', 'reserved'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-3 rounded-lg font-medium capitalize transition-all duration-200 ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚗</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search criteria or filters.'
              : 'Get started by adding your first vehicle to the inventory.'
            }
          </p>
          <Link
            to="/add-vehicle"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <span className="mr-2">➕</span>
            Add First Vehicle
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
            >
              {/* Vehicle Image */}
              <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                {vehicle.images && vehicle.images[0] ? (
                  <img
                    src={vehicle.images[0]}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <span className="text-4xl text-gray-400">🚗</span>
                  </div>
                )}
              </div>

              {/* Vehicle Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {vehicle.year} • {vehicle.country}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(vehicle.status)}`}>
                    {vehicle.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Chassis:</span>
                    <span className="font-medium text-gray-900">{vehicle.chassisNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-medium text-gray-900">Rs. {vehicle.price.toLocaleString()}</span>
                  </div>
                  {isAdmin && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Profit:</span>
                      <span className={`font-medium ${calculateProfit(vehicle) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Rs. {calculateProfit(vehicle).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 items-center">
                  <Link
                    to={`/vehicle/${vehicle.id}`}
                    className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 text-center text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors duration-200"
                  >
                    View
                  </Link>
                  {(isAdmin || vehicle.addedBy === currentUser?.uid) && (
                    <Link
                      to={`/edit-vehicle/${vehicle.id}`}
                      className="px-4 py-2 bg-green-50 text-green-700 text-center text-sm font-medium rounded-lg hover:bg-green-100 transition-colors duration-200"
                    >
                      Edit
                    </Link>
                  )}

                  {(isAdmin || vehicle.addedBy === currentUser?.uid) && (
                    <div className="flex items-center space-x-2">
                      <select
                        value={vehicle.status}
                        onChange={(e) => handleQuickStatusChange(vehicle.id, e.target.value as 'available' | 'sold' | 'reserved')}
                        disabled={statusSaving[vehicle.id] === 'saving'}
                        className="px-2 py-1 border rounded text-sm bg-white"
                      >
                        <option value="available">available</option>
                        <option value="sold">sold</option>
                        <option value="reserved">reserved</option>
                      </select>
                      {statusSaving[vehicle.id] === 'saving' && (
                        <span className="text-sm text-gray-600">Saving...</span>
                      )}
                      {statusSaving[vehicle.id] === 'saved' && (
                        <span className="text-sm text-green-600">Saved</span>
                      )}
                      {statusSaving[vehicle.id] === 'error' && (
                        <span className="text-sm text-red-600">Error</span>
                      )}
                    </div>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteVehicle(vehicle.id)}
                      className="px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors duration-200"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;
