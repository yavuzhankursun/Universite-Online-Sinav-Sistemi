import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return React.createElement('div', { className: 'loading' }, 'Yükleniyor...');
  }

  if (!user) {
    return React.createElement(Navigate, { to: '/login', replace: true });
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return React.createElement('div', { className: 'error' }, 'Bu sayfaya erişim yetkiniz yok');
  }

  return children;
}

export default ProtectedRoute;

