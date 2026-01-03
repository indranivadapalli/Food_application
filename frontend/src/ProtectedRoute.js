import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Check if the token exists in localStorage
  const token = localStorage.getItem('userToken');

  if (!token) {
    // If no token, send them to the login page
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;