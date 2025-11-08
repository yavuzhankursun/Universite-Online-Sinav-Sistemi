import React, { useState, useEffect } from 'react';
import { createAssignment, getCourses, getUsers } from '../../services/adminService';

function AssignmentManagement() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assignmentType, setAssignmentType] = useState('student_course');
  const [formData, setFormData] = useState({
    student_id: '',
    instructor_id: '',
    course_id: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coursesData, studentsData, instructorsData] = await Promise.all([
        getCourses(),
        getUsers('student'),
        getUsers('instructor')
      ]);
      setCourses(coursesData);
      setStudents(studentsData);
      setInstructors(instructorsData);
    } catch (err) {
      setError(err.response?.data?.error || 'Veriler yüklenemedi');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await createAssignment(
        assignmentType,
        assignmentType === 'student_course' ? parseInt(formData.student_id) : null,
        parseInt(formData.course_id),
        assignmentType === 'instructor_course' ? parseInt(formData.instructor_id) : null
      );
      setSuccess(response.message || 'Atama başarıyla yapıldı');
      if (response.warning) {
        setError(response.warning);
      }
      setFormData({ student_id: '', instructor_id: '', course_id: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Atama yapılamadı');
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', { className: 'assignment-management' },
    React.createElement('h1', null, 'Atama Yönetimi'),
    React.createElement('div', { className: 'card' },
      React.createElement('h2', null, 'Yeni Atama Yap'),
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', null, 'Atama Tipi'),
        React.createElement('select', {
          value: assignmentType,
          onChange: (e) => setAssignmentType(e.target.value)
        },
          React.createElement('option', { value: 'student_course' }, 'Öğrenci-Ders'),
          React.createElement('option', { value: 'instructor_course' }, 'Öğretim Üyesi-Ders')
        )
      ),
      error && React.createElement('div', { className: 'error-message' }, error),
      success && React.createElement('div', { className: 'success-message' }, success),
      React.createElement('form', { onSubmit: handleSubmit },
        assignmentType === 'student_course' &&
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Öğrenci'),
          React.createElement('select', {
            value: formData.student_id,
            onChange: (e) => setFormData({ ...formData, student_id: e.target.value }),
            required: true
          },
            React.createElement('option', { value: '' }, 'Öğrenci Seçin'),
            students.map(student =>
              React.createElement('option', { key: student.id, value: student.id }, student.email)
            )
          )
        ),
        assignmentType === 'instructor_course' &&
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Öğretim Üyesi'),
          React.createElement('select', {
            value: formData.instructor_id,
            onChange: (e) => setFormData({ ...formData, instructor_id: e.target.value }),
            required: true
          },
            React.createElement('option', { value: '' }, 'Öğretim Üyesi Seçin'),
            instructors.map(instructor =>
              React.createElement('option', { key: instructor.id, value: instructor.id }, instructor.email)
            )
          )
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Ders'),
          React.createElement('select', {
            value: formData.course_id,
            onChange: (e) => setFormData({ ...formData, course_id: e.target.value }),
            required: true
          },
            React.createElement('option', { value: '' }, 'Ders Seçin'),
            courses.map(course =>
              React.createElement('option', { key: course.id, value: course.id },
                `${course.code} - ${course.name}`
              )
            )
          )
        ),
        React.createElement('button', {
          type: 'submit',
          className: 'btn btn-primary',
          disabled: loading
        }, loading ? 'Atanıyor...' : 'Ata')
      )
    )
  );
}

export default AssignmentManagement;

