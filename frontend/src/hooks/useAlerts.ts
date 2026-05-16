import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { alertService } from "../services/alertService";
import { useWsStore } from "../stores/wsStore";

const useAlertsRefetch = (queryKey: unknown[]) => {
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

export const useAlerts = (filters?: Record<string, unknown>) => {
  const queryKey = ["alerts", filters];

  const query = useSuspenseQuery({
    queryKey,
    queryFn: async () => {
      const res = await alertService.fetchAlerts(filters);
      return res.data;
    },
    staleTime: 60_000,
  });

  useAlertsRefetch(queryKey);

  return query;
};

export const useAlert = (id: string) => {
  const queryKey = ["alert", id];

  const query = useSuspenseQuery({
    queryKey,
    queryFn: async () => {
      const res = await alertService.fetchAlert(id);
      return res.data;
    },
    staleTime: 60_000,
  });

  useAlertsRefetch(queryKey);

  return query;
};
