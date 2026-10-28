import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function CaloriesChart({
  data,
}: {
  data: { label: string; consumed: number; target: number }[];
}) {
  if (!data.length) return null;
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={40} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="consumed" name="مصرف" stroke="#ea580c" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="target" name="هدف" stroke="#0d9488" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
