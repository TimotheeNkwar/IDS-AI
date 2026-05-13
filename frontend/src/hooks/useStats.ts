import { useQuery } from "@tanstack/react-query";
import { statsService } from "../services/statsService";

//   fetchStats: (hours = 24) => api.get(`/stats?hours=${hours}`),
//   fetchAlertStats: (hours = 24) => api.get(`/stats/alerts?hours=${hours}`),
//   fetchTrafficStats: (hours = 24) => api.get(`/stats/traffic?hours=${hours}`),
//   fetchTrafficSummary: (hours = 24) =>
//     api.get(`/stats/traffic/summary?hours=${hours}`),

export const useStats = (hours = 24) =>
  useQuery({
    queryKey: ["stats", hours],
    queryFn: () => statsService.fetchStats(hours).then((res) => res.data),
  });

export const useTrafficSummary = (hours = 24) =>
  useQuery({
    queryKey: ["traffic-summary", hours],
    queryFn: () =>
      statsService.fetchTrafficSummary(hours).then((res) => res.data),
  });

export const useAlertStats = (hours = 24) =>
  useQuery({
    queryKey: ["alert-stats", hours],
    queryFn: () => statsService.fetchAlertStats(hours).then((res) => res.data),
  });

export const useTrafficStats = (hours = 24) =>
  useQuery({
    queryKey: ["traffic-stats", hours],
    queryFn: () =>
      statsService.fetchTrafficStats(hours).then((res) => res.data),
  });
