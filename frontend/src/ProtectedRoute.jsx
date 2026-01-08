import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRole }) => {
  const savedUser = localStorage.getItem('userObj');
  
  if (!savedUser) {
    return <Navigate to="/" replace />;
  }

  try {
    const user = JSON.parse(savedUser);
    if (allowedRole && user.role !== allowedRole) {
      console.error("Role mismatch or missing role");
      return <Navigate to="/" replace />;
    }
    
    return children;
  } catch (error) {
    console.error("Auth error:", error);
    localStorage.clear(); 
    return <Navigate to="/" replace />;
  }
};
export default ProtectedRoute;