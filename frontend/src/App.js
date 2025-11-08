import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/auth/Login';
import AdminDashboard from './components/admin/AdminDashboard';
import InstructorDashboard from './components/instructor/InstructorDashboard';
import StudentDashboard from './components/student/StudentDashboard';
import DepartmentHeadDashboard from './components/department-head/DepartmentHeadDashboard';
import ProtectedRoute from './components/shared/ProtectedRoute';

function App() {
  return React.createElement(AuthProvider, null,
    React.createElement('div', { className: 'app' },
      React.createElement(Routes, null,
        React.createElement(Route, { path: '/login', element: React.createElement(Login) }),
        React.createElement(Route, {
          path: '/admin/*',
          element: React.createElement(ProtectedRoute, { allowedRoles: ['admin'] },
            React.createElement(AdminDashboard)
          )
        }),
        React.createElement(Route, {
          path: '/instructor/*',
          element: React.createElement(ProtectedRoute, { allowedRoles: ['instructor'] },
            React.createElement(InstructorDashboard)
          )
        }),
        React.createElement(Route, {
          path: '/student/*',
          element: React.createElement(ProtectedRoute, { allowedRoles: ['student'] },
            React.createElement(StudentDashboard)
          )
        }),
        React.createElement(Route, {
          path: '/department-head/*',
          element: React.createElement(ProtectedRoute, { allowedRoles: ['department_head'] },
            React.createElement(DepartmentHeadDashboard)
          )
        }),
        React.createElement(Route, {
          path: '/',
          element: React.createElement(Navigate, { to: '/login', replace: true })
        })
      )
    )
  );
}

export default App;

