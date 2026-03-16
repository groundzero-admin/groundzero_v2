import { QuestionRenderer, CARD } from "@gz/question-widgets";

interface Props {
  slug: string;
  data: Record<string, unknown>;
}

const EMPTY = (
  <div style={{ ...CARD, textAlign: "center" as const, color: "#a0aec0", padding: 40 }}>
    Fill in the fields to see a live preview
  </div>
);

export default function LivePreview({ slug, data }: Props) {
  const hasData = Object.values(data).some(
    (v) => v !== "" && v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0),
  );

  if (!hasData) return EMPTY;

  return <QuestionRenderer slug={slug} data={data} />;
}
