import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useWsStore } from "../stores/wsStore";
import { useEffect } from "react";
import { suggestionService } from "../services/suggestionService";

const useSuggestionRefetch = (queryKey: unknown[]) => {
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

export const useSuggestions = (hours = 24) => {
  const queryKey = ["suggestions", hours]; //

  const query = useSuspenseQuery({
    queryKey, //
    queryFn: () =>
      suggestionService.fetchSuggestions(hours).then((res) => res.data),
    staleTime: 60_000,
  });

  useSuggestionRefetch(queryKey); //

  return query;
};
