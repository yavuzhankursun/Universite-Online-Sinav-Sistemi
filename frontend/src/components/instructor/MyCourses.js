import React, { useState, useEffect } from 'react';
import { getMyCourses, getCourseStudents } from '../../services/instructorService';

function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await getMyCourses();
      setCourses(data);
    } catch (err) {
      console.error('Dersler yüklenemedi:', err);
    }
  };

  const handleCourseSelect = async (courseId) => {
    setLoading(true);
    try {
      const data = await getCourseStudents(courseId);
      setSelectedCourse(data.course);
      setStudents(data.students);
    } catch (err) {
      console.error('Öğrenciler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', { className: 'my-courses' },
    React.createElement('h1', null, 'Derslerim'),
    React.createElement('div', { className: 'courses-grid' },
      courses.map(course =>
        React.createElement('div', {
          key: course.id,
          className: 'course-card',
          onClick: () => handleCourseSelect(course.id)
        },
          React.createElement('h3', null, course.code),
          React.createElement('p', null, course.name),
          React.createElement('p', { className: 'department' }, course.department?.name || '')
        )
      )
    ),
    selectedCourse && React.createElement('div', { className: 'card', style: { marginTop: '2rem' } },
      React.createElement('h2', null, `${selectedCourse.code} - Öğrenciler`),
      loading ? React.createElement('p', null, 'Yükleniyor...') :
      React.createElement('table', { className: 'data-table' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', null, 'ID'),
            React.createElement('th', null, 'İsim'),
            React.createElement('th', null, 'Email')
          )
        ),
        React.createElement('tbody', null,
          students.length === 0 ?
            React.createElement('tr', null,
              React.createElement('td', { colSpan: 3 }, 'Bu derse kayıtlı öğrenci yok')
            ) :
            students.map(student =>
              React.createElement('tr', { key: student.id },
                React.createElement('td', null, student.id),
                React.createElement('td', null, student.name || student.email),
                React.createElement('td', null, student.email)
              )
            )
        )
      )
    )
  );
}

export default MyCourses;

