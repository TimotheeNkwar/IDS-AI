import useAppStore from "../stores/AppStore";

export default function useHourDayText() {
  const { hours } = useAppStore();

  const hoursDayText = hours >= 24 ? `${Math.floor(hours / 24)}d` : `${hours}h`;

  return hoursDayText;
}
