import React, { useState, useEffect } from 'react';
import { getAllStudents } from '../../services/departmentHeadService';

function AllStudentsView() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await getAllStudents();
      setStudents(data);
    } catch (err) {
      console.error('Öğrenciler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', { className: 'all-students' },
    React.createElement('h1', null, 'Tüm Öğrenciler'),
    loading ? React.createElement('p', null, 'Yükleniyor...') :
    React.createElement('div', { className: 'card' },
      React.createElement('table', { className: 'data-table' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', null, 'ID'),
            React.createElement('th', null, 'Email'),
            React.createElement('th', null, 'Kayıt Tarihi')
          )
        ),
        React.createElement('tbody', null,
          students.length === 0 ?
            React.createElement('tr', null,
              React.createElement('td', { colSpan: 3 }, 'Öğrenci bulunamadı')
            ) :
            students.map(student =>
              React.createElement('tr', { key: student.id },
                React.createElement('td', null, student.id),
                React.createElement('td', null, student.email),
                React.createElement('td', null,
                  student.created_at ? new Date(student.created_at).toLocaleDateString('tr-TR') : '-'
                )
              )
            )
        )
      )
    )
  );
}

export default AllStudentsView;

