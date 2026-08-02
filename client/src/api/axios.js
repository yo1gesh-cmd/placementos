import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});


let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => refreshSubscribers.push(cb);
const onRefreshed = () => {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh')) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await api.post('/auth/refresh');
          isRefreshing = false;
          onRefreshed();
          return api(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          refreshSubscribers = [];
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      return new Promise((resolve) => {
        subscribeTokenRefresh(() => {
          resolve(api(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);