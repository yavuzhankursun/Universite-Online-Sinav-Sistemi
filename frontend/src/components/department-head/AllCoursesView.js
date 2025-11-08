import React, { useState, useEffect } from 'react';
import { getAllCourses } from '../../services/departmentHeadService';

function AllCoursesView() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await getAllCourses();
      setCourses(data);
    } catch (err) {
      console.error('Dersler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', { className: 'all-courses' },
    React.createElement('h1', null, 'Tüm Dersler'),
    loading ? React.createElement('p', null, 'Yükleniyor...') :
    React.createElement('div', { className: 'courses-grid' },
      courses.length === 0 ?
        React.createElement('p', null, 'Ders bulunamadı') :
        courses.map(course =>
          React.createElement('div', { key: course.id, className: 'course-card' },
            React.createElement('h3', null, course.code),
            React.createElement('p', null, course.name),
            React.createElement('p', { className: 'department' }, course.department?.name || ''),
            React.createElement('p', { className: 'instructor' }, `Öğretim Üyesi: ${course.instructor?.email || '-'}`)
          )
        )
    )
  );
}

export default AllCoursesView;

