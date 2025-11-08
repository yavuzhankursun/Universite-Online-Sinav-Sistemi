import api from './api';

export const createUser = async (name, email, password, role) => {
  const response = await api.post('/admin/users', { name, email, password, role });
  return response.data;
};

export const getUsers = async (role = null) => {
  const params = role ? { role } : {};
  const response = await api.get('/admin/users', { params });
  return response.data.users;
};

export const createDepartment = async (name, code) => {
  const response = await api.post('/admin/departments', { name, code });
  return response.data;
};

export const getDepartments = async () => {
  const response = await api.get('/admin/departments');
  return response.data.departments;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

export const deleteCourse = async (courseId) => {
  const response = await api.delete(`/admin/courses/${courseId}`);
  return response.data;
};

export const deleteDepartment = async (departmentId) => {
  const response = await api.delete(`/admin/departments/${departmentId}`);
  return response.data;
};

export const deleteAssignment = async (assignmentId) => {
  const response = await api.delete(`/admin/assignments/${assignmentId}`);
  return response.data;
};

export const createCourse = async (code, name, department_id, instructor_id) => {
  const response = await api.post('/admin/courses', {
    code,
    name,
    department_id,
    instructor_id
  });
  return response.data;
};

export const getCourses = async () => {
  const response = await api.get('/admin/courses');
  return response.data.courses;
};

export const createAssignment = async (type, student_id, course_id, instructor_id) => {
  const data = type === 'student_course'
    ? { type, student_id, course_id }
    : { type, instructor_id, course_id };
  const response = await api.post('/admin/assignments', data);
  return response.data;
};

