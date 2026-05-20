import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { statsService } from "../services/statsService";
import { useWsStore } from "../stores/wsStore";

const useStatsRefetch = (queryKey: unknown[]) => {
  const alertCount = useWsStore((s) => s.alertCount);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (alertCount === 0) return;

    const timer = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey });
    }, 1000);

    return () => clearTimeout(timer);
  }, [alertCount, queryClient, queryKey]);
};

export const useStats = (hours = 24) => {
  const queryKey = ["stats", hours];

  const query = useSuspenseQuery({
    queryKey,
    queryFn: () => statsService.fetchStats(hours).then((res) => res.data),
    staleTime: 60_000,
  });

  useStatsRefetch(queryKey);

  return query;
};

export const useTrafficSummary = (hours = 24) => {
  const queryKey = ["traffic-summary", hours];

  const query = useSuspenseQuery({
    queryKey,
    queryFn: () =>
      statsService.fetchTrafficSummary(hours).then((res) => res.data),
    staleTime: 60_000,
  });

  useStatsRefetch(queryKey);

  return query;
};

export const useAlertStats = (hours = 24) => {
  const queryKey = ["alert-stats", hours];

  const query = useSuspenseQuery({
    queryKey,
    queryFn: () => statsService.fetchAlertStats(hours).then((res) => res.data),
    staleTime: 60_000,
  });

  useStatsRefetch(queryKey);

  return query;
};

export const useTrafficStats = (hours = 24) => {
  const queryKey = ["traffic-stats", hours];

  const query = useSuspenseQuery({
    queryKey,
    queryFn: () =>
      statsService.fetchTrafficStats(hours).then((res) => res.data),
    staleTime: 60_000,
  });

  useStatsRefetch(queryKey);

  return query;
};
