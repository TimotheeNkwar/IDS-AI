import api from "../Api/Api";
import useAppStore from "../stores/hourStore";


export const statsService = {
  fetchStats: (hours = 24) => api.get(`/stats?hours=${hours}`),
  fetchAlertStats: (hours = 24) => api.get(`/stats/alerts?hours=${hours}`),
  fetchTrafficStats: (hours = 24) => api.get(`/stats/traffic?hours=${hours}`),
  fetchTrafficSummary: (hours = 24) =>
    api.get(`/stats/traffic/summary?hours=${hours}`),
};
