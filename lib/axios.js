import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://dummyjson.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // CRITICAL FIX: Pass cancellation errors through untouched
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const customError = new Error(
      error.response?.data?.message || 'An unexpected error occurred. Please try again.'
    );
    customError.status = error.response?.status;
    return Promise.reject(customError);
  }
);

export default axiosInstance;