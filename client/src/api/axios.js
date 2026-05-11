import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 15000,
  withCredentials: false
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fsams_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("fsams_token");
      localStorage.removeItem("fsams_user");
    }

    return Promise.reject(error);
  }
);

export default api;
