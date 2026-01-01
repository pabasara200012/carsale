import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import AddVehicle from '../pages/AddVehicle';
import EditVehicle from '../pages/EditVehicle';
import VehicleDetails from '../components/VehicleDetails';
import Analytics from '../pages/Analytics';
import Settings from '../pages/Settings';

const AppRouter: React.FC = () => {
  const { currentUser } = useAuth();

  // Protected route wrapper
  const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!currentUser) {
      return <Navigate to="/login" />;
    }
    return <>{children}</>;
  };

  // Admin route wrapper
  const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!currentUser || currentUser.role !== 'admin') {
      return <Navigate to="/dashboard" />;
    }
    return <>{children}</>;
  };

  // Vehicle details wrapper component
  const VehicleDetailsWrapper: React.FC = () => {
    const { id } = useParams();
    return (
      <PrivateRoute>
        <VehicleDetails vehicleId={id || ''} />
      </PrivateRoute>
    );
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/dashboard" />} />

      {/* Protected routes */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/add-vehicle" 
          element={
            <PrivateRoute>
              <AddVehicle />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/edit-vehicle/:id" 
          element={
            <PrivateRoute>
              <EditVehicle />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/vehicle/:id" 
          element={<VehicleDetailsWrapper />} 
        />
        <Route 
          path="/analytics" 
          element={
            <AdminRoute>
              <Analytics />
            </AdminRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          } 
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
  );
};

export default AppRouter;