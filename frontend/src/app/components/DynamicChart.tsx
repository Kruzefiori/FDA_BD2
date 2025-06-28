import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export default function DynamicChart({ data, fieldsToShow }: { data: any[], fieldsToShow: Record<string, boolean> }) {
  if (!data || data.length === 0) return null;

  const selectedFields = Object.entries(fieldsToShow)
    .filter(([_, show]) => show)
    .map(([field]) => field);

  // Tenta usar o primeiro campo string como eixo X e os numéricos como Y
  const sample = data[0];
  const xCandidates = selectedFields.filter((key) => typeof sample[key] === "string");
  const yCandidates = selectedFields.filter((key) => typeof sample[key] === "number");

  const xKey = xCandidates[0] || selectedFields[0];
  const yKeys = yCandidates.slice(0, 3); // até 3 linhas/barras

  if (!xKey || yKeys.length === 0) return (
    <p className="text-gray-600 mt-4">Não há dados numéricos suficientes para gerar um gráfico.</p>
  );

  return (
    <div className="w-full h-[400px] mt-8">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {yKeys.map((key, idx) => (
            <Bar key={key} dataKey={key} fill={["#8884d8", "#82ca9d", "#ffc658"][idx % 3]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
