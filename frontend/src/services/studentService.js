import api from './api';

export const getMyCourses = async () => {
  const response = await api.get('/student/courses');
  return response.data.courses;
};

export const getActiveExams = async () => {
  const response = await api.get('/student/exams');
  return response.data.exams;
};

export const getExamDetails = async (examId) => {
  const response = await api.get(`/student/exams/${examId}`);
  return response.data;
};

export const startExam = async (examId) => {
  const response = await api.post(`/student/exams/${examId}/start`);
  return response.data;
};

export const submitExam = async (examId, answers) => {
  const response = await api.post(`/student/exams/${examId}/submit`, { answers });
  return response.data;
};

export const getExamResult = async (examId) => {
  const response = await api.get(`/student/exams/${examId}/result`);
  return response.data;
};

