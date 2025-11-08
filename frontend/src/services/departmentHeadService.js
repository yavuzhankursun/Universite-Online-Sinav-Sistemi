import api from './api';

export const getAllCourses = async () => {
  const response = await api.get('/department-head/courses');
  return response.data.courses;
};

export const getAllStudents = async () => {
  const response = await api.get('/department-head/students');
  return response.data.students;
};

export const getStatistics = async () => {
  const response = await api.get('/department-head/statistics');
  return response.data;
};

export const getCourseStatistics = async (courseId) => {
  const response = await api.get(`/department-head/courses/${courseId}/statistics`);
  return response.data;
};

