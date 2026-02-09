import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getDashboard: () => API.get('/auth/dashboard'),
  startDiningMonth: (data) => API.post('/auth/dining-month/start', data)
};

export const borderAPI = {
  searchStudent: (studentId) => API.get('/border/search', { params: { studentId } }),
  getAllStudents: () => API.get('/border/all-students'),
  getCalendar: () => API.get('/border/calendar'),
  adjustStudentDays: (data) => API.post('/border/adjust', data),
  returnToken: (data) => API.post('/border/return-token', data),
  payFeastDue: (data) => API.post('/border/pay-feast', data),
  clearPaymentDue: (data) => API.post('/border/clear-payment-due', data),
  payDailyFeastQuota: (data) => API.post('/border/pay-daily-feast-quota', data)
};

// export const feastTokenAPI = {
//   getList: (search) => API.get('/feast-token/list', { params: { search } }),
//   getDetails: (tokenId) => API.get(`/feast-token/${tokenId}`),
//   create: (data) => API.post('/feast-token/create', data),
//   updatePayment: (tokenId, data) => API.post(`/feast-token/${tokenId}/payment`, data)
// };

export const diningMonthAPI = {
  getCalendar: () => API.get('/dining-month/calendar'),
  addBreakDates: (data) => API.post('/dining-month/break/add-dates', data),
  removeBreakDates: (data) => API.post('/dining-month/break/remove-dates', data)
};

export default API;
