import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Navbar from '../shared/Navbar';
import MyCourses from './MyCourses';
import ExamCreation from './ExamCreation';
import QuestionManagement from './QuestionManagement';
import ExamResults from './ExamResults';

function InstructorDashboard() {
  const location = useLocation();

  return React.createElement('div', { className: 'dashboard' },
    React.createElement(Navbar),
    React.createElement('div', { className: 'dashboard-container' },
      React.createElement('aside', { className: 'sidebar' },
        React.createElement('nav', { className: 'sidebar-nav' },
          React.createElement(Link, {
            to: '/instructor/courses',
            className: location.pathname.includes('/courses') ? 'active' : ''
          }, 'Derslerim'),
          React.createElement(Link, {
            to: '/instructor/exams',
            className: location.pathname.includes('/exams') && !location.pathname.includes('/questions') ? 'active' : ''
          }, 'Sınavlar'),
          React.createElement(Link, {
            to: '/instructor/questions',
            className: location.pathname.includes('/questions') ? 'active' : ''
          }, 'Soru Yönetimi'),
          React.createElement(Link, {
            to: '/instructor/results',
            className: location.pathname.includes('/results') ? 'active' : ''
          }, 'Sonuçlar')
        )
      ),
      React.createElement('main', { className: 'dashboard-content' },
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/courses', element: React.createElement(MyCourses) }),
          React.createElement(Route, { path: '/exams', element: React.createElement(ExamCreation) }),
          React.createElement(Route, { path: '/questions', element: React.createElement(QuestionManagement) }),
          React.createElement(Route, { path: '/results', element: React.createElement(ExamResults) }),
          React.createElement(Route, {
            path: '/',
            element: React.createElement('div', null,
              React.createElement('h1', null, 'Öğretim Üyesi Paneli'),
              React.createElement('p', null, 'Sol menüden bir seçenek seçin.')
            )
          })
        )
      )
    )
  );
}

export default InstructorDashboard;

