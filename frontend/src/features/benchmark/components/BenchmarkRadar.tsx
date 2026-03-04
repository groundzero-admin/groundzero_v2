import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

const METRIC_LABELS: Record<string, string> = {
  critical_thinking: "Critical Thinking",
  mathematical_thinking: "Math & Logic",
  leadership: "Leadership",
  creativity: "Creativity",
  curiosity: "Curiosity",
  communication: "Communication",
  emotional_intelligence: "Emotional IQ",
  knowledge_depth: "Knowledge",
};

interface Props {
  scores: Record<string, number>;
  characterColor?: string;
}

export default function BenchmarkRadar({ scores, characterColor = "#805AD5" }: Props) {
  const data = Object.entries(METRIC_LABELS).map(([key, label]) => ({
    metric: label,
    score: scores?.[key] || 0,
    average: 50,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="#E8E0D8" strokeWidth={0.5} />
        <PolarAngleAxis dataKey="metric" tick={{ fill: "#7A7168", fontSize: 11, fontWeight: 500 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#D4C9BD", fontSize: 9 }} />
        <Radar name="Average" dataKey="average" stroke="#D4C9BD" fill="none" strokeDasharray="4 4" strokeWidth={1} />
        <Radar name="Student" dataKey="score" stroke={characterColor} fill={characterColor} fillOpacity={0.15} strokeWidth={2} />
        <Legend wrapperStyle={{ fontSize: 11, color: "#A89E94" }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
