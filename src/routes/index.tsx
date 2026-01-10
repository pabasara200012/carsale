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
import VehicleArticles from '../pages/VehicleArticles';

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
    // If not logged in, ask user to login first.
    if (!currentUser) {
      return <Navigate to="/login" />;
    }
    // If logged in but not admin, send back to dashboard.
    import ArticlesAdmin from '../pages/ArticlesAdmin';
    if (currentUser.role !== 'admin') {
      return <Navigate to="/dashboard" />;
    }
    return <>{children}</>;
  };

  // Vehicle details wrapper component
  const VehicleDetailsWrapper: React.FC = () => {
    const { id } = useParams();
    // Make vehicle details public (viewable without login)
    return <VehicleDetails vehicleId={id || ''} />;
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/dashboard" />} />

      {/* Protected routes */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<Dashboard />} />
        <Route 
          path="/add-vehicle" 
          element={
            <AdminRoute>
              <AddVehicle />
            </AdminRoute>
          } 
        />
        <Route
          path="/edit-vehicle/:id"
          element={
            <AdminRoute>
              <EditVehicle />
            </AdminRoute>
            <Route
              path="/articles"
              element={
                <AdminRoute>
                  <ArticlesAdmin />
                </AdminRoute>
              }
            />
          }
        />
        <Route path="/vehicle/:id" element={<VehicleDetailsWrapper />} />
        <Route path="/vehicle/:id/articles" element={<VehicleArticles />} />
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