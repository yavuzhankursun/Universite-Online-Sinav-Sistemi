import React, { useState, useEffect } from 'react';
import { createCourse, getCourses, getDepartments, deleteCourse } from '../../services/adminService';
import { getUsers } from '../../services/adminService';

function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    department_id: '',
    instructor_id: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [coursesData, deptsData, instructorsData] = await Promise.all([
        getCourses(),
        getDepartments(),
        getUsers('instructor')
      ]);
      setCourses(coursesData || []);
      setDepartments(deptsData || []);
      setInstructors(instructorsData || []);
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
      setError(err.response?.data?.error || err.message || 'Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await createCourse(
        formData.code,
        formData.name,
        parseInt(formData.department_id),
        parseInt(formData.instructor_id)
      );
      setSuccess(response.message || 'Ders başarıyla oluşturuldu');
      if (response.warning) {
        setError(response.warning);
      }
      setFormData({ code: '', name: '', department_id: '', instructor_id: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Ders oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Bu dersi silmek istediğinize emin misiniz?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await deleteCourse(courseId);
      setSuccess(response.message || 'Ders başarıyla silindi');
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Ders silinemedi');
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', { className: 'course-management' },
    React.createElement('h1', null, 'Ders Yönetimi'),
    React.createElement('div', { className: 'card' },
      React.createElement('h2', null, 'Yeni Ders Ekle'),
      error && React.createElement('div', { className: 'error-message' }, error),
      success && React.createElement('div', { className: 'success-message' }, success),
      loading && React.createElement('p', null, 'Yükleniyor...'),
      React.createElement('form', { onSubmit: handleSubmit },
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Ders Kodu'),
          React.createElement('input', {
            type: 'text',
            value: formData.code,
            onChange: (e) => setFormData({ ...formData, code: e.target.value }),
            required: true
          })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Ders Adı'),
          React.createElement('input', {
            type: 'text',
            value: formData.name,
            onChange: (e) => setFormData({ ...formData, name: e.target.value }),
            required: true
          })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Departman'),
          React.createElement('select', {
            value: formData.department_id,
            onChange: (e) => setFormData({ ...formData, department_id: e.target.value }),
            required: true
          },
            React.createElement('option', { value: '' }, 'Departman Seçin'),
            departments.map(dept =>
              React.createElement('option', { key: dept.id, value: dept.id }, dept.name)
            )
          )
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Öğretim Üyesi'),
          React.createElement('select', {
            value: formData.instructor_id,
            onChange: (e) => setFormData({ ...formData, instructor_id: e.target.value }),
            required: true
          },
            React.createElement('option', { value: '' }, 'Öğretim Üyesi Seçin'),
            instructors.map(inst =>
              React.createElement('option', { key: inst.id, value: inst.id }, inst.name || inst.email)
            )
          )
        ),
        React.createElement('button', {
          type: 'submit',
          className: 'btn btn-primary',
          disabled: loading
        }, loading ? 'Ekleniyor...' : 'Ders Ekle')
      )
    ),
    React.createElement('div', { className: 'card' },
      React.createElement('h2', null, 'Ders Listesi'),
      React.createElement('table', { className: 'data-table' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', null, 'Kod'),
            React.createElement('th', null, 'Ad'),
            React.createElement('th', null, 'Departman'),
            React.createElement('th', null, 'Öğretim Üyesi'),
            React.createElement('th', null, 'İşlemler')
          )
        ),
        React.createElement('tbody', null,
          courses.map(course =>
            React.createElement('tr', { key: course.id },
              React.createElement('td', null, course.code),
              React.createElement('td', null, course.name),
              React.createElement('td', null, course.department?.name || '-'),
              React.createElement('td', null, course.instructor?.name || course.instructor?.email || '-'),
              React.createElement('td', null,
                React.createElement('button', {
                  className: 'btn btn-danger btn-small',
                  onClick: () => handleDelete(course.id),
                  disabled: loading
                }, 'Sil')
              )
            )
          )
        )
      )
    )
  );
}

export default CourseManagement;

