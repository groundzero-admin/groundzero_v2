import type { StudioStep } from "@/data/studio-projects";
import type { Expression } from "@/components/characters/types";
import type { PizzaVariant } from "@/components/fun/FractionPizza/FractionPizza";
import { useStudioTheme } from "@/context/StudioThemeContext";
import { StoryIntro } from "../challenges/StoryIntro";
import { StudioMCQ } from "../challenges/StudioMCQ";
import { PatternSequence } from "../challenges/PatternSequence";
import { RoomGrid } from "../challenges/RoomGrid";
import { ThermometerSlider } from "../challenges/ThermometerSlider";
import { FractionPizza } from "@/components/fun/FractionPizza/FractionPizza";

const PIZZA_VARIANTS: Record<string, PizzaVariant> = {
  wizardry: {
    title: "Moonstone Crystal!",
    objectName: "crystal",
    colors: ["#8B5CF6", "#7C3AED", "#6D28D9", "#A78BFA", "#C4B5FD", "#DDD6FE", "#EDE9FE", "#F5F3FF"],
    crustColor: "#4C1D95",
    dotColor: "#E879F9",
    plateColor: "#EDE9FE",
  },
  space: {
    title: "Fuel Cell!",
    objectName: "fuel cell",
    colors: ["#0891B2", "#06B6D4", "#0E7490", "#22D3EE", "#67E8F9", "#A5F3FC", "#CFFAFE", "#ECFEFF"],
    crustColor: "#475569",
    dotColor: "#38BDF8",
    plateColor: "#E2E8F0",
  },
  jungle: {
    title: "Jungle Fruit!",
    objectName: "coconut",
    colors: ["#16A34A", "#22C55E", "#15803D", "#4ADE80", "#86EFAC", "#BBF7D0", "#DCFCE7", "#F0FDF4"],
    crustColor: "#78350F",
    dotColor: "#A16207",
    plateColor: "#FEF3C7",
  },
  ocean: {
    title: "Sea Cake!",
    objectName: "sea cake",
    colors: ["#F97316", "#FB923C", "#EA580C", "#FDBA74", "#FED7AA", "#FFEDD5", "#FFF7ED", "#FFFBEB"],
    crustColor: "#0E7490",
    dotColor: "#FDE68A",
    plateColor: "#CCFBF1",
  },
};

interface StepRendererProps {
  step: StudioStep;
  onCorrect: () => void;
  onWrong: () => void;
  onComplete: () => void;
  onTalkingChange?: (talking: boolean) => void;
  onExpressionChange?: (expr: Expression) => void;
}

export function StepRenderer({
  step,
  onCorrect,
  onWrong,
  onComplete,
  onTalkingChange,
  onExpressionChange,
}: StepRendererProps) {
  const { themeId, activeTheme } = useStudioTheme();
  const accentColor = activeTheme?.visuals.accentColor;

  switch (step.challengeType) {
    case "story_intro":
      return (
        <StoryIntro
          text={step.storyText}
          celebration={!!step.challengeData.celebration}
          accentColor={accentColor}
          onComplete={onComplete}
          onTalkingChange={onTalkingChange}
          onExpressionChange={onExpressionChange}
        />
      );

    case "studio_mcq":
      return (
        <StudioMCQ
          options={step.options ?? []}
          explanationText={step.explanation}
          onCorrect={onCorrect}
          onWrong={onWrong}
        />
      );

    case "fraction_pizza":
      return (
        <FractionPizza
          variant={themeId ? PIZZA_VARIANTS[themeId] : undefined}
        />
      );

    case "pattern_sequence": {
      const data = step.challengeData as {
        sequence: (string | number)[];
        type: "number" | "shape";
      };
      return (
        <PatternSequence
          sequence={data.sequence}
          type={data.type}
          options={step.options ?? []}
          explanationText={step.explanation}
          onCorrect={onCorrect}
          onWrong={onWrong}
        />
      );
    }

    case "room_grid": {
      const data = step.challengeData as {
        gridWidth: number;
        gridHeight: number;
        correctArea: number;
        label: string;
      };
      return (
        <RoomGrid
          gridWidth={data.gridWidth}
          gridHeight={data.gridHeight}
          correctArea={data.correctArea}
          label={data.label}
          explanationText={step.explanation}
          onCorrect={onCorrect}
          onWrong={onWrong}
        />
      );
    }

    case "thermometer_slider": {
      const data = step.challengeData as {
        startTemp: number;
        targetTemp: number;
        min: number;
        max: number;
        label: string;
      };
      return (
        <ThermometerSlider
          startTemp={data.startTemp}
          targetTemp={data.targetTemp}
          min={data.min}
          max={data.max}
          label={data.label}
          explanationText={step.explanation}
          onCorrect={onCorrect}
          onWrong={onWrong}
        />
      );
    }

    default:
      return <div>Unknown challenge type</div>;
  }
}
