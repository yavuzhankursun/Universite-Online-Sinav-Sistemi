import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Navbar from '../shared/Navbar';
import UserManagement from './UserManagement';
import DepartmentManagement from './DepartmentManagement';
import CourseManagement from './CourseManagement';
import AssignmentManagement from './AssignmentManagement';

function AdminDashboard() {
  const location = useLocation();

  return React.createElement('div', { className: 'dashboard' },
    React.createElement(Navbar),
    React.createElement('div', { className: 'dashboard-container' },
      React.createElement('aside', { className: 'sidebar' },
        React.createElement('nav', { className: 'sidebar-nav' },
          React.createElement(Link, {
            to: '/admin/users',
            className: location.pathname.includes('/users') ? 'active' : ''
          }, 'Kullanıcı Yönetimi'),
          React.createElement(Link, {
            to: '/admin/departments',
            className: location.pathname.includes('/departments') ? 'active' : ''
          }, 'Departman Yönetimi'),
          React.createElement(Link, {
            to: '/admin/courses',
            className: location.pathname.includes('/courses') ? 'active' : ''
          }, 'Ders Yönetimi'),
          React.createElement(Link, {
            to: '/admin/assignments',
            className: location.pathname.includes('/assignments') ? 'active' : ''
          }, 'Atama Yönetimi')
        )
      ),
      React.createElement('main', { className: 'dashboard-content' },
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/users', element: React.createElement(UserManagement) }),
          React.createElement(Route, { path: '/departments', element: React.createElement(DepartmentManagement) }),
          React.createElement(Route, { path: '/courses', element: React.createElement(CourseManagement) }),
          React.createElement(Route, { path: '/assignments', element: React.createElement(AssignmentManagement) }),
          React.createElement(Route, {
            path: '/',
            element: React.createElement('div', null,
              React.createElement('h1', null, 'Admin Paneli'),
              React.createElement('p', null, 'Sol menüden bir seçenek seçin.')
            )
          })
        )
      )
    )
  );
}

export default AdminDashboard;

