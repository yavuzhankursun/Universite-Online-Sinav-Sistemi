import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Navbar from '../shared/Navbar';
import MyCourses from './MyCourses';
import ExamList from './ExamList';
import ExamTaking from './ExamTaking';
import ExamResult from './ExamResult';

function StudentDashboard() {
  const location = useLocation();

  return React.createElement('div', { className: 'dashboard' },
    React.createElement(Navbar),
    React.createElement('div', { className: 'dashboard-container' },
      React.createElement('aside', { className: 'sidebar' },
        React.createElement('nav', { className: 'sidebar-nav' },
          React.createElement(Link, {
            to: '/student/courses',
            className: location.pathname.includes('/courses') ? 'active' : ''
          }, 'Derslerim'),
          React.createElement(Link, {
            to: '/student/exams',
            className: location.pathname.includes('/exams') && !location.pathname.includes('/taking') && !location.pathname.includes('/result') ? 'active' : ''
          }, 'Sınavlarım')
        )
      ),
      React.createElement('main', { className: 'dashboard-content' },
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/courses', element: React.createElement(MyCourses) }),
          React.createElement(Route, { path: '/exams', element: React.createElement(ExamList) }),
          React.createElement(Route, { path: '/exams/:examId/taking', element: React.createElement(ExamTaking) }),
          React.createElement(Route, { path: '/exams/:examId/result', element: React.createElement(ExamResult) }),
          React.createElement(Route, {
            path: '/',
            element: React.createElement('div', null,
              React.createElement('h1', null, 'Öğrenci Paneli'),
              React.createElement('p', null, 'Sol menüden bir seçenek seçin.')
            )
          })
        )
      )
    )
  );
}

export default StudentDashboard;

