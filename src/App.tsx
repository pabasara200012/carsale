import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <AuthProvider>
        <Router basename="/carsale">
          <AppRoutes />
        </Router>
      </AuthProvider>
    </div>
  );
};

export default App;
