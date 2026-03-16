import type { QuestionProps } from "./shared";
import { CARD } from "./shared";
import FillBlanks from "./FillBlanks";
import McqSingle from "./McqSingle";
import ShortAnswer from "./ShortAnswer";
import DragDropPlacement from "./DragDropPlacement";
import DragDropClassifier from "./DragDropClassifier";
import LabelElements from "./LabelElements";
import ImageResponse from "./ImageResponse";
import AudioResponse from "./AudioResponse";
import SliderInput from "./SliderInput";
import MultiStep from "./MultiStep";
import DebateOpinion from "./DebateOpinion";
import AiConversation from "./AiConversation";
import DrawScribble from "./DrawScribble";
import ReflectionRating from "./ReflectionRating";

interface Props extends QuestionProps {
  slug: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SLUG_MAP: Record<string, React.ComponentType<any>> = {
  fill_blanks: FillBlanks,
  mcq_single: McqSingle,
  mcq_timed: McqSingle,
  short_answer: ShortAnswer,
  drag_drop_placement: DragDropPlacement,
  drag_drop_classifier: DragDropClassifier,
  label_elements: LabelElements,
  image_response: ImageResponse,
  audio_response: AudioResponse,
  slider_input: SliderInput,
  multi_step: MultiStep,
  debate_opinion: DebateOpinion,
  ai_conversation: AiConversation,
  draw_scribble: DrawScribble,
  reflection_rating: ReflectionRating,
};

export default function QuestionRenderer({ slug, data, onAnswer }: Props) {
  const Component = SLUG_MAP[slug];

  if (!Component) {
    return (
      <div style={{ ...CARD, textAlign: "center" as const, color: "#a0aec0" }}>
        Preview not available for this template type
      </div>
    );
  }

  if (slug === "mcq_timed") {
    return <McqSingle data={data} onAnswer={onAnswer} timed />;
  }

  return <Component data={data} onAnswer={onAnswer} />;
}
