export default function TrafficDataLoader() {
  return (
    <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
      <table className="table">
        <thead>
          <tr>
            <th></th>
            <th>Time</th>
            <th>Type</th>
            <th>Source IP</th>
            <th>Destination IP</th>
            <th>ML Confidence</th>
            <th>Protocol</th>
            <th>Severity</th>
          </tr>
        </thead>

        <tbody>
          {[...Array(6)].map((_, index) => (
            <tr key={index}>
              <th>
                <div className="skeleton h-4 w-4 rounded"></div>
              </th>

              <td>
                <div className="skeleton h-4 w-24"></div>
              </td>

              <td>
                <div className="skeleton h-4 w-20"></div>
              </td>

              <td>
                <div className="skeleton h-4 w-32"></div>
              </td>

              <td>
                <div className="skeleton h-4 w-32"></div>
              </td>

              <td>
                <div className="skeleton h-4 w-16"></div>
              </td>

              <td>
                <div className="skeleton h-4 w-14"></div>
              </td>

              <td>
                <div className="skeleton h-4 w-20"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
