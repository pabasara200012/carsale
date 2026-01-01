import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Vehicle } from '../types';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

interface AnalyticsData {
  totalVehicles: number;
  totalInventoryValue: number;
  totalPotentialProfit: number;
  averagePrice: number;
  vehiclesByStatus: {
    available: number;
    sold: number;
    pending: number;
  };
  salesByMonth: {
    month: string;
    sales: number;
    revenue: number;
  }[];
  topPerformingVehicles: {
    make: string;
    model: string;
    count: number;
    revenue: number;
  }[];
  profitMargins: {
    category: string;
    margin: number;
  }[];
}

const Analytics: React.FC = () => {
  const { isAdmin } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const vehiclesRef = collection(db, 'vehicles');
      const vehiclesSnapshot = await getDocs(vehiclesRef);
      const vehicles: Vehicle[] = vehiclesSnapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Vehicle[];

      const analytics = calculateAnalytics(vehicles);
      setAnalyticsData(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

    const calculateAnalytics = (vehicles: Vehicle[]): AnalyticsData => {
      const safeNum = (n: any) => {
        if (n === null || n === undefined) return 0;
        const num = typeof n === 'number' ? n : Number(n);
        return isNaN(num) ? 0 : num;
      };
    const totalVehicles = vehicles.length;
    const totalInventoryValue = vehicles.reduce((sum, vehicle) => {
      const price = safeNum(vehicle.price ?? vehicle.purchasePrice ?? vehicle.cifValue);
      return sum + price;
    }, 0);
    const totalPotentialProfit = vehicles.reduce((sum, vehicle) => {
      const price = safeNum(vehicle.price ?? vehicle.purchasePrice ?? vehicle.cifValue);
      const sellingPrice = safeNum(vehicle.totalAmount ?? vehicle.sellingPrice ?? vehicle.netProfit);
      return sum + (sellingPrice - price);
    }, 0);
    const averagePrice = totalVehicles > 0 ? totalInventoryValue / totalVehicles : 0;

    // Vehicle status breakdown
    const vehiclesByStatusMap = vehicles.reduce((acc: Record<string, number>, vehicle) => {
      const status = (vehicle.status as string) || 'available';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, { available: 0, sold: 0, pending: 0 });

    const vehiclesByStatus = {
      available: vehiclesByStatusMap['available'] || 0,
      sold: vehiclesByStatusMap['sold'] || 0,
      pending: vehiclesByStatusMap['pending'] || 0,
    };

    // Sales by month (mock data for demonstration)
    const salesByMonth = [
      { month: 'Jan', sales: 15, revenue: 450000 },
      { month: 'Feb', sales: 22, revenue: 660000 },
      { month: 'Mar', sales: 18, revenue: 540000 },
      { month: 'Apr', sales: 25, revenue: 750000 },
      { month: 'May', sales: 20, revenue: 600000 },
      { month: 'Jun', sales: 28, revenue: 840000 },
    ];

    // Top performing vehicles by brand/model
    const vehicleGroups = vehicles.reduce((acc, vehicle) => {
      const key = `${vehicle.brand} ${vehicle.model}`;
      if (!acc[key]) {
        acc[key] = { make: vehicle.brand, model: vehicle.model, count: 0, revenue: 0 };
      }
      acc[key].count += 1;
      acc[key].revenue += safeNum(vehicle.totalAmount ?? vehicle.price ?? vehicle.sellingPrice ?? vehicle.netProfit);
      return acc;
    }, {} as Record<string, { make: string; model: string; count: number; revenue: number }>);

    const topPerformingVehicles = Object.values(vehicleGroups)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Profit margins by category
    const profitMargins = [
      { category: 'Luxury Cars', margin: 25 },
      { category: 'SUVs', margin: 18 },
      { category: 'Sedans', margin: 15 },
      { category: 'Sports Cars', margin: 30 },
      { category: 'Trucks', margin: 20 },
    ];

    return {
      totalVehicles,
      totalInventoryValue,
      totalPotentialProfit,
      averagePrice,
      vehiclesByStatus,
      salesByMonth,
      topPerformingVehicles,
      profitMargins,
    };
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl text-red-600">🚫</span>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You need administrator privileges to view analytics.</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Business insights and performance metrics</p>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </Layout>
    );
  }

  if (!analyticsData) {
    return null;
  }

  return (
    <Layout>
      <div className="analytics-dashboard" style={{ paddingTop: '70px' }}>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Business insights and performance metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="analytics-metrics-grid">
          <div className="analytics-metric-card primary">
            <div className="metric-content">
              <div>
                <p className="metric-label">Total Vehicles</p>
                <p className="metric-value">{analyticsData.totalVehicles}</p>
              </div>
              <div className="metric-icon">🚗</div>
            </div>
          </div>

          <div className="analytics-metric-card success">
            <div className="metric-content">
              <div>
                <p className="metric-label">Inventory Value</p>
                <p className="metric-value">${analyticsData.totalInventoryValue.toLocaleString()}</p>
              </div>
              <div className="metric-icon">💰</div>
            </div>
          </div>

          <div className="analytics-metric-card accent">
            <div className="metric-content">
              <div>
                <p className="metric-label">Potential Profit</p>
                <p className="metric-value">${analyticsData.totalPotentialProfit.toLocaleString()}</p>
              </div>
              <div className="metric-icon">📈</div>
            </div>
          </div>

          <div className="analytics-metric-card warning">
            <div className="metric-content">
              <div>
                <p className="metric-label">Average Price</p>
                <p className="metric-value">${analyticsData.averagePrice.toLocaleString()}</p>
              </div>
              <div className="metric-icon">🏷️</div>
            </div>
          </div>
        </div>

        <div className="analytics-charts-grid">
          {/* Vehicle Status Distribution */}
          <div className="analytics-chart-card">
            <h3 className="chart-title">
              <span className="chart-icon">📊</span>
              Vehicle Status Distribution
            </h3>
            <div className="status-distribution">
              {Object.entries(analyticsData.vehiclesByStatus).map(([status, count]) => (
                <div key={status} className="status-item">
                  <div className="status-label">
                    <div className={`status-indicator ${status}`}></div>
                    <span className="status-name">{status}</span>
                  </div>
                  <div className="status-value">
                    <span className="count">{count}</span>
                    <span className="percentage">
                      ({((count / analyticsData.totalVehicles) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing Vehicles */}
          <div className="analytics-chart-card">
            <h3 className="chart-title">
              <span className="chart-icon">🏆</span>
              Top Performing Models
            </h3>
            <div className="performance-list">
              {analyticsData.topPerformingVehicles.map((vehicle, index) => (
                <div key={index} className="performance-item">
                  <div className="vehicle-info">
                    <p className="vehicle-name">{vehicle.make} {vehicle.model}</p>
                    <p className="vehicle-count">{vehicle.count} vehicles</p>
                  </div>
                  <div className="revenue-info">
                    <p className="revenue-amount">${vehicle.revenue.toLocaleString()}</p>
                    <p className="revenue-label">Total Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sales by Month Chart */}
        <div className="analytics-chart-card full-width">
          <h3 className="chart-title">
            <span className="chart-icon">📈</span>
            Sales Performance (Last 6 Months)
          </h3>
          <div className="sales-chart">
            {analyticsData.salesByMonth.map((month, index) => (
              <div key={index} className="chart-bar">
                <div className="bar-container">
                  <div 
                    className="bar-fill"
                    style={{ 
                      height: `${(month.sales / 30) * 120}px`,
                    }}
                  ></div>
                </div>
                <div className="bar-data">
                  <p className="sales-count">{month.sales}</p>
                  <p className="sales-label">Sales</p>
                </div>
                <p className="month-label">{month.month}</p>
                <p className="revenue-label">${(month.revenue / 1000).toFixed(0)}K</p>
              </div>
            ))}
          </div>
        </div>

        {/* Profit Margins */}
        <div className="analytics-chart-card full-width">
          <h3 className="chart-title">
            <span className="chart-icon">💹</span>
            Profit Margins by Category
          </h3>
          <div className="profit-margins">
            {analyticsData.profitMargins.map((item, index) => (
              <div key={index} className="margin-item">
                <div className="category-name">{item.category}</div>
                <div className="margin-bar">
                  <div className="bar-background">
                    <div 
                      className="bar-progress"
                      style={{ width: `${(item.margin / 35) * 100}%` }}
                    >
                      <span className="margin-value">{item.margin}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="analytics-actions">
          <h3 className="actions-title">Quick Actions</h3>
          <div className="actions-grid">
            <a
              href="/add-vehicle"
              className="action-button primary"
            >
              <span className="action-icon">🚗</span>
              Add New Vehicle
            </a>
            <a
              href="/dashboard"
              className="action-button success"
            >
              <span className="action-icon">📋</span>
              View Inventory
            </a>
            <button
              onClick={fetchAnalyticsData}
              className="action-button accent"
            >
              <span className="action-icon">🔄</span>
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
