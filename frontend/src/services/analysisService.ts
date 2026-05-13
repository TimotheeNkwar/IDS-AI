import api from "../Api/Api";

export const AnalysisService = {
  fetchAlerts: () => api.get("/alerts"),
  fetchAlert: (id: string) => api.get(`/alerts/${id}/status`),
  fetchTrafficData: () => api.get("/traffic"),
};
