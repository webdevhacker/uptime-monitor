// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx'; // Import the provider
import PrivateRoute from './components/PrivateRoute.jsx';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx'; // Assuming you have this

const App = () => {
  return (
    <AuthProvider> {/* 1. Wrap entire app in Provider */}
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes Group */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Dashboard />} />
            {/* Add other protected pages here later */}
          </Route>

          {/* Catch all - Redirect to login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;