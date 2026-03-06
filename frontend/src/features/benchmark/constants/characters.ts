export interface Character {
  id: string;
  name: string;
  image: string;
  color: string;
  accent: string;
  greeting: string;
}

export const CHARACTERS: Character[] = [
  {
    id: "harry_potter",
    name: "Harry Potter",
    image: "/characters/harry_potter.svg",
    color: "#8b1a1a",
    accent: "#d4a843",
    greeting: "Hey! I'm Harry. Let's explore some brilliant questions together!",
  },
  {
    id: "doraemon",
    name: "Doraemon",
    image: "/characters/doraemon.svg",
    color: "#2563eb",
    accent: "#60a5fa",
    greeting: "Hello! I'm Doraemon. I've got some really interesting questions for you!",
  },
  {
    id: "peppa_pig",
    name: "Peppa Pig",
    image: "/characters/peppa_pig.svg",
    color: "#e85d75",
    accent: "#f9a8d4",
    greeting: "Hi there! I'm Peppa! Let's have some fun answering questions together!",
  },
  {
    id: "simba",
    name: "Simba",
    image: "/characters/simba.svg",
    color: "#b45309",
    accent: "#fbbf24",
    greeting: "Hey! I'm Simba. Ready for an adventure through some cool questions?",
  },
  {
    id: "dora",
    name: "Dora",
    image: "/characters/dora.svg",
    color: "#7c3aed",
    accent: "#a78bfa",
    greeting: "Hola! I'm Dora. Let's explore these questions together, amigo!",
  },
];
