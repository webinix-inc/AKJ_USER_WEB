// src/Components/AuthRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../Context/UserContext';

const AuthRoute = ({ children }) => {
  const { isAuthenticated } = useUser();

  // If the user is authenticated, redirect to the home page
  if (isAuthenticated) {
    return <Navigate to="/home" />;
  }

  // If not authenticated, render the child components
  return children;
};

export default AuthRoute;
