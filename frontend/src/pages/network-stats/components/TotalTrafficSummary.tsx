export default function TotalTrafficSummary({ summary }: { summary: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 text-center">
      <div className="w-full bg-purple-400 p-6 rounded-2xl overflow-hidden text-black">
        <h2 className=" font-bold mb-2">Total Traffic</h2>
        <div>
          <p className="text-4xl font-bold ">{summary?.total ?? 0}</p>
        </div>
      </div>
      <div className="w-full bg-fuchsia-400 p-6 rounded-2xl overflow-hidden text-black">
        <h2 className=" font-bold mb-2">Normal Traffic</h2>
        <div>
          <p className="text-4xl font-bold ">{summary?.normal ?? 0}</p>
        </div>
      </div>
      <div className="w-full bg-rose-400 p-6 rounded-2xl overflow-hidden text-black">
        <h2 className=" font-bold mb-2">Anomalous Traffic</h2>
        <div>
          <p className="text-4xl font-bold ">
            {summary?.anomalies.reduce(
              (acc: number, item: any) => acc + item.count,
              0,
            ) ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
}
