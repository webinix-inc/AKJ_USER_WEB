// src/Components/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../Context/UserContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useUser();

  // If the user is not authenticated, redirect to the login page
  if (!isAuthenticated) {
    return <Navigate to="/register" />;
  }

  // If authenticated, render the child components
  return children;
};

export default PrivateRoute;
