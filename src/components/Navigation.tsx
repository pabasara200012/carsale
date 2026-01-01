import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const Navigation: React.FC = () => {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { name: 'Add Vehicle', path: '/add-vehicle', icon: '➕' },
    { name: 'Analytics', path: '/analytics', icon: '📊' },
    { name: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  if (!currentUser) return null;

  return (
    <nav className="modern-nav">
      <div className="nav-container">
        {/* Logo/Brand Section */}
        <div className="nav-brand">
          <Link to="/dashboard" className="brand-link">
            <div className="brand-icon">🚗</div>
            <div className="brand-text">CarSale</div>
          </Link>
        </div>

        {/* Desktop Navigation Menu */}
        <div className="nav-menu">
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActivePath(item.path) ? 'nav-item-active' : ''}`}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-text">{item.name}</span>
            </Link>
          ))}
        </div>

        {/* User Profile Section */}
        <div className="nav-user">
          <div className="user-section">
            <div className="user-avatar">
              {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-details">
              <div className="user-name">
                {currentUser.displayName || 'User'}
              </div>
              <div className="user-role">
                {isAdmin ? 'Administrator' : 'User'}
              </div>
            </div>
          </div>
          
          <div className="nav-actions">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="user-menu-btn"
              title="User menu"
            >
              <span className="menu-dots">⋮</span>
            </button>
            
            {userMenuOpen && (
              <div className="user-dropdown">
                <div className="dropdown-item">
                  <Link to="/settings" className="dropdown-link">
                    <span className="dropdown-icon">⚙️</span>
                    <span>Settings</span>
                  </Link>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item">
                  <button onClick={handleLogout} className="dropdown-link logout-btn">
                    <span className="dropdown-icon">🚪</span>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <div className={`hamburger ${mobileMenuOpen ? 'hamburger-open' : ''}`}>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </div>
        </button>
      </div>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay">
          <div className="mobile-nav-content">
            <div className="mobile-nav-header">
              <div className="mobile-user-info">
                <div className="user-avatar large">
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="user-details">
                  <div className="user-name">
                    {currentUser.displayName || 'User'}
                  </div>
                  <div className="user-role">
                    {isAdmin ? 'Administrator' : 'User'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mobile-nav-menu">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`mobile-nav-item ${isActivePath(item.path) ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  <span className="nav-item-text">{item.name}</span>
                  {isActivePath(item.path) && <span className="active-indicator">●</span>}
                </Link>
              ))}
            </div>
            
            <div className="mobile-nav-footer">
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="mobile-logout-btn"
              >
                <span className="logout-icon">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;