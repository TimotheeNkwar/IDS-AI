import api from "../Api/Api";
import type { Suggestion } from "../types/types";

export const suggestionService = {
  fetchSuggestions: (hours: number) =>
    api.get<{ suggestions: Suggestion[] }>(`/suggestions?hours=${hours}`),
};
