import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage'; 
import UserDashboard from './UserDashboard'; 
import RestaurantDashboard from './RestaurantDashboard';
import DeliveryDashboard from './DeliveryDashboard';

function App() {
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/user-dashboard" element={<UserDashboard onLogout={handleLogout} />} />
        <Route path="/restaurant-dashboard" element={<RestaurantDashboard onLogout={handleLogout} />} />
        <Route path="/delivery-dashboard" element={<DeliveryDashboard onLogout={handleLogout} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;