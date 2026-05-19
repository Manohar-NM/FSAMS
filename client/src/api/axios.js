import axios from "axios";

const fallbackApiUrl = import.meta.env.PROD
  ? "https://fsams.onrender.com/api"
  : "/api";
const configuredApiUrl = import.meta.env.VITE_API_URL;
const rawApiUrl =
  import.meta.env.PROD && configuredApiUrl === "/api"
    ? fallbackApiUrl
    : configuredApiUrl || fallbackApiUrl;
const normalizedApiUrl = rawApiUrl
  .replace(/^VITE_API_URL=/, "")
  .replace(/\/$/, "");
const baseURL = normalizedApiUrl.endsWith("/api")
  ? normalizedApiUrl
  : `${normalizedApiUrl}/api`;

const api = axios.create({
  baseURL,
  timeout: 60000,
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
