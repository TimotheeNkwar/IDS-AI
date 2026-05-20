import { useState } from "react";
import SuggestionHeader from "./components/SuggestionHeader";
import SuggestionStats from "./components/SuggestionStats";
import SuggestionCard from "./components/SuggestionCard";
import { useSuggestions } from "../../hooks/useSuggestion";

export default function SuggestionsPage() {
  const [priority, setPriority] = useState("");
  const [type, setType] = useState("");

  const { data } = useSuggestions(720);

  const filtered = (data?.suggestions ?? []).filter((s) => {
    if (priority && s.priority !== priority) return false;
    if (type && s.type !== type) return false;
    return true;
  });

  return (
    <div>
      <SuggestionHeader
        priority={priority}
        type={type}
        onPriorityChange={setPriority}
        onTypeChange={setType}
      />
      <SuggestionStats suggestions={filtered} />
      {filtered.map((s) => (
        <SuggestionCard key={s.id} suggestion={s} />
      ))}
    </div>
  );
}
