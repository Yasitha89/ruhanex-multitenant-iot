import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => response,
  (error) =>
    Promise.reject({
      status: error.response?.status || 0,
      message:
        error.response?.data?.error ||
        error.message ||
        "Request failed",
      data: error.response?.data || null,
    })
);

export default api;
