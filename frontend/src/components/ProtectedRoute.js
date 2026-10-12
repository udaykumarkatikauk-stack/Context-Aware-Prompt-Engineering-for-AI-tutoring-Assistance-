// src/components/ProtectedRoute.js

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('authToken');

  return token ? <Outlet /> : <Navigate to="/get-started" replace />;
};

export default ProtectedRoute;
