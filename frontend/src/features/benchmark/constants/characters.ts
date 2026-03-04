export interface Character {
  id: string;
  name: string;
  initial: string;
  color: string;
  accent: string;
  tagline: string;
  description: string;
}

export const CHARACTERS: Character[] = [
  {
    id: "harry_potter",
    name: "Harry Potter",
    initial: "HP",
    color: "#8b1a1a",
    accent: "#d4a843",
    tagline: "Courage & Problem Solving",
    description:
      "Explores themes of bravery, logical reasoning, and creative problem-solving through magical scenarios.",
  },
  {
    id: "doraemon",
    name: "Doraemon",
    initial: "DR",
    color: "#2563eb",
    accent: "#60a5fa",
    tagline: "Innovation & Technology",
    description:
      "Focuses on inventive thinking, futuristic concepts, and scientific curiosity.",
  },
  {
    id: "peppa_pig",
    name: "Peppa Pig",
    initial: "PP",
    color: "#e85d75",
    accent: "#f9a8d4",
    tagline: "Social Skills & Empathy",
    description:
      "Encourages social-emotional learning, sharing, and understanding different perspectives.",
  },
  {
    id: "simba",
    name: "Simba",
    initial: "SB",
    color: "#b45309",
    accent: "#fbbf24",
    tagline: "Leadership & Nature",
    description:
      "Explores leadership qualities, ecological awareness, and resilience through nature themes.",
  },
  {
    id: "dora",
    name: "Dora",
    initial: "DA",
    color: "#7c3aed",
    accent: "#a78bfa",
    tagline: "Exploration & Languages",
    description:
      "Promotes spatial reasoning, multilingual awareness, and analytical puzzle-solving.",
  },
];
