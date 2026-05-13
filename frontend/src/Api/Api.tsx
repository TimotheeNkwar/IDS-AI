import axios from "axios";
import { useAuthStore } from "../stores/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/",
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// api.interceptors.response.use(
//   response => response,
//   async error => {
//     const originalRequest = error.config

//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true

//       try {
//         const refreshToken = useAuthStore.getState().refreshToken
//         const { data } = await axios.post(
//           `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
//           { refresh_token: refreshToken }
//         )

//         useAuthStore.getState().setTokens(data.access_token, data.refresh_token)

//         originalRequest.headers.Authorization = `Bearer ${data.access_token}`
//         return api(originalRequest)

//       } catch {
//         useAuthStore.getState().logout()
//         window.location.href = '/login'
//       }
//     }

//     return Promise.reject(error)
//   }
// )

export default api;
