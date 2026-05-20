import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { alertService } from "../services/alertService";
import { useWsStore } from "../stores/wsStore";
import type { AlertFilters } from "../types/types";

const useAlertsRefetch = (queryKey: unknown[]) => {
  const alertCount = useWsStore((s) => s.alertCount);
  const queryClient = useQueryClient();
  const stableKey = JSON.stringify(queryKey); // ← stabiliser la référence

  useEffect(() => {
    if (alertCount === 0) return;

    const timer = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: JSON.parse(stableKey) });
    }, 1000);

    return () => clearTimeout(timer);
  }, [alertCount, queryClient, stableKey]); // ← stableKey au lieu de queryKey
};

export const useAlerts = (filters?: AlertFilters) => {
  const queryKey = ["alerts", filters];

  const query = useSuspenseQuery({
    queryKey,
    queryFn: async () => {
      const res = await alertService.fetchAlerts(filters);

      return res.data;
    },
    refetchOnWindowFocus: false,
    gcTime: 0, // ← vide le cache immédiatement
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
