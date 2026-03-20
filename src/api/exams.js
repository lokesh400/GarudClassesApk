import apiClient from './client';

export const fetchTargetExams = async () => {
  const res = await apiClient.get('/exams/targeted');
  return res.data;
};
