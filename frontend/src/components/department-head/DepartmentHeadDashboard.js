import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Navbar from '../shared/Navbar';
import AllCoursesView from './AllCoursesView';
import AllStudentsView from './AllStudentsView';
import StatisticsView from './StatisticsView';

function DepartmentHeadDashboard() {
  const location = useLocation();

  return React.createElement('div', { className: 'dashboard' },
    React.createElement(Navbar),
    React.createElement('div', { className: 'dashboard-container' },
      React.createElement('aside', { className: 'sidebar' },
        React.createElement('nav', { className: 'sidebar-nav' },
          React.createElement(Link, {
            to: '/department-head/courses',
            className: location.pathname.includes('/courses') ? 'active' : ''
          }, 'Tüm Dersler'),
          React.createElement(Link, {
            to: '/department-head/students',
            className: location.pathname.includes('/students') ? 'active' : ''
          }, 'Tüm Öğrenciler'),
          React.createElement(Link, {
            to: '/department-head/statistics',
            className: location.pathname.includes('/statistics') ? 'active' : ''
          }, 'İstatistikler')
        )
      ),
      React.createElement('main', { className: 'dashboard-content' },
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/courses', element: React.createElement(AllCoursesView) }),
          React.createElement(Route, { path: '/students', element: React.createElement(AllStudentsView) }),
          React.createElement(Route, { path: '/statistics', element: React.createElement(StatisticsView) }),
          React.createElement(Route, {
            path: '/',
            element: React.createElement('div', null,
              React.createElement('h1', null, 'Bölüm Başkanı Paneli'),
              React.createElement('p', null, 'Sol menüden bir seçenek seçin.')
            )
          })
        )
      )
    )
  );
}

export default DepartmentHeadDashboard;

