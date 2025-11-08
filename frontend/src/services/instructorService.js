import api from './api';

export const getMyCourses = async () => {
  const response = await api.get('/instructor/courses');
  return response.data.courses;
};

export const getCourseStudents = async (courseId) => {
  const response = await api.get(`/instructor/courses/${courseId}/students`);
  return response.data;
};

export const createExam = async (examData) => {
  const response = await api.post('/instructor/exams', examData);
  return response.data;
};

export const getMyExams = async () => {
  const response = await api.get('/instructor/exams');
  return response.data.exams;
};

export const addQuestion = async (examId, questionData) => {
  const response = await api.post(`/instructor/exams/${examId}/questions`, questionData);
  return response.data;
};

export const updateExamWeight = async (examId, weightPercentage) => {
  const response = await api.put(`/instructor/exams/${examId}`, { weight_percentage: weightPercentage });
  return response.data;
};

export const updateExamTime = async (examId, examTimeData) => {
  const response = await api.put(`/instructor/exams/${examId}`, examTimeData);
  return response.data;
};

export const getExamResults = async (examId) => {
  const response = await api.get(`/instructor/exams/${examId}/results`);
  return response.data;
};

export const getExamQuestions = async (examId) => {
  const response = await api.get(`/instructor/exams/${examId}/questions`);
  return response.data;
};

export const updateQuestion = async (questionId, questionData) => {
  const response = await api.put(`/instructor/questions/${questionId}`, questionData);
  return response.data;
};

export const deleteQuestion = async (questionId) => {
  const response = await api.delete(`/instructor/questions/${questionId}`);
  return response.data;
};

