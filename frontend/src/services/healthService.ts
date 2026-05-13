import api from "../Api/Api";

export const healthService = {
  checkHealth: () => api.get("/health"),
  checkStatus: () => api.get("/status"),
};
