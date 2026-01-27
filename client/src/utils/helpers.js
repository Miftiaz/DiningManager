export const getAuthToken = () => localStorage.getItem('token');

export const setAuthToken = (token) => localStorage.setItem('token', token);

export const removeAuthToken = () => localStorage.removeItem('token');

export const isAuthenticated = () => !!getAuthToken();

export const getStoredManager = () => {
  const manager = localStorage.getItem('manager');
  return manager ? JSON.parse(manager) : null;
};

export const setStoredManager = (manager) => {
  localStorage.setItem('manager', JSON.stringify(manager));
};

export const removeStoredManager = () => localStorage.removeItem('manager');

export const formatDate = (date) => {
  if (!date) return '';
  // Parse the date string and extract YYYY-MM-DD format
  // to avoid timezone conversion issues
  const dateStr = new Date(date).toISOString().split('T')[0];
  const [year, month, day] = dateStr.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
};

export const getDayName = (date) => {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
};

export const calculatePayableAmount = (selectedDays) => {
  return selectedDays.length * 2 * 40; // 2 meals per day, 40 TK per meal
};

export const calculateFeastTokenCost = (remainingDays) => {
  return (remainingDays * 10) + 100;
};
