import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

const PILLAR_LABELS: Record<string, string> = {
  communication: "Communication",
  creativity: "Creativity",
  ai_systems: "AI & Systems",
  math_logic: "Math & Logic",
};

const PILLAR_COLORS: Record<string, string> = {
  communication: "#E53E3E",
  creativity: "#3182CE",
  ai_systems: "#38A169",
  math_logic: "#805AD5",
};

interface Props {
  pillarStages: Record<string, number>;
  characterColor?: string;
}

export default function BenchmarkRadar({ pillarStages, characterColor = "#805AD5" }: Props) {
  const data = Object.entries(PILLAR_LABELS).map(([key, label]) => ({
    pillar: label,
    stage: pillarStages?.[key] || 1,
    baseline: 3,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="#E8E0D8" strokeWidth={0.5} />
        <PolarAngleAxis dataKey="pillar" tick={{ fill: "#7A7168", fontSize: 12, fontWeight: 600 }} />
        <PolarRadiusAxis angle={45} domain={[0, 5]} tickCount={6} tick={{ fill: "#D4C9BD", fontSize: 9 }} />
        <Radar name="Grade Level" dataKey="baseline" stroke="#D4C9BD" fill="none" strokeDasharray="4 4" strokeWidth={1} />
        <Radar name="Student" dataKey="stage" stroke={characterColor} fill={characterColor} fillOpacity={0.15} strokeWidth={2} />
        <Legend wrapperStyle={{ fontSize: 11, color: "#A89E94" }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export { PILLAR_LABELS, PILLAR_COLORS };
