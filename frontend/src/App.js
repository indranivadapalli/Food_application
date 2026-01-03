import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import UserDashboard from './UserDashboard';
import RestaurantDashboard from './RestaurantDashboard';
import api from './api';
function App() {
  const [orders, setOrders] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || '');
  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.log("Error fetching orders:", err);
    }
  };
  useEffect(() => { 
    if (isLoggedIn) {
      fetchOrders();
      const interval = setInterval(() => {
        fetchOrders();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);
  const addOrder = (newOrder) => {
    setOrders(prev => [...prev, newOrder]);
  };
  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/orders/${String(id)}`, { status: newStatus });
      setOrders(prev => prev.map(o => String(o.id) === String(id) ? { ...o, status: newStatus } : o));
    } catch (err) {
      if (err.response?.status === 404) {
        await api.patch(`/orders/${Number(id)}`, { status: newStatus });
        setOrders(prev => prev.map(o => String(o.id) === String(id) ? { ...o, status: newStatus } : o));
      }
    }
  };
  const cancelOrder = async (id) => {
    try {
      await api.delete(`/orders/${String(id)}`);
      setOrders(prev => prev.filter(o => String(o.id) !== String(id)));
      return { success: true };
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          await api.delete(`/orders/${Number(id)}`);
          setOrders(prev => prev.filter(o => String(o.id) !== String(id)));
          return { success: true };
        } catch (retryErr) {
          return { success: false, msg: "Order not found on server." };
        }
      }
      return { success: false, msg: "Server connection failed." };
    }
  };
  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUserRole('');
  };
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AuthPage setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} />} />
        <Route 
          path="/user-dashboard" 
          element={isLoggedIn && userRole === 'user' ? 
            <UserDashboard 
              orders={orders} 
              addOrder={addOrder} 
              cancelOrder={cancelOrder} 
              setOrders={setOrders} 
              onLogout={handleLogout} 
            /> : 
            <Navigate to="/login" />} 
        />
        <Route 
          path="/restaurant-dashboard" 
          element={isLoggedIn && userRole === 'restaurant' ? 
            <RestaurantDashboard 
              orders={orders} 
              updateStatus={updateStatus} 
              onLogout={handleLogout} 
            /> : 
            <Navigate to="/login" />} 
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}
export default App;