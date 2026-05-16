import type { Alert } from "../../../../types/types";

export default function Message({ alert }: { alert: Alert | null }) {
  return (
    <div className="mt-4 border-b border-base-content/12 pb-4">
      <h3 className="text-gray-400 uppercase font-semibold mb-1">Message</h3>
      <p className="text-sm text-base-content/80">{alert?.message}</p>
    </div>
  );
}
