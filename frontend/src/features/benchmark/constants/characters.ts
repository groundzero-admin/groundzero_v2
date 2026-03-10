export type CharacterPose = "idle" | "speaking" | "listening" | "thinking" | "happy" | "encouraging";

export interface Character {
  id: string;
  name: string;
  image: string;
  poses: Record<CharacterPose, string>;
  color: string;
  accent: string;
  greeting: string;
  background: string;
  reactions: string[];
  milestoneReactions: Record<number, string>;
}

export const PILLAR_ICONS: Record<string, string> = {
  math_logic: "\u{1F9E0}",
  communication: "\u{1F4AC}",
  creativity: "\u{1F3A8}",
  ai_systems: "\u{1F916}",
};

export const CHARACTERS: Character[] = [
  {
    id: "harry_potter",
    name: "Harry Potter",
    image: "/characters/harry_potter.svg",
    poses: {
      idle: "/characters/harry_potter_idle.png",
      speaking: "/characters/harry_potter_speaking.png",
      listening: "/characters/harry_potter_listening.png",
      thinking: "/characters/harry_potter_thinking.png",
      happy: "/characters/harry_potter_happy.png",
      encouraging: "/characters/harry_potter_encouraging.png",
    },
    color: "#8b1a1a",
    accent: "#d4a843",
    greeting: "Hey! I'm Harry. Let's explore some brilliant questions together!",
    background: "linear-gradient(135deg, #1a1a2e 0%, #2d2b55 40%, #3b2f5e 100%)",
    reactions: [
      "Brilliant answer! \u{2728}",
      "Wicked clever, that was!",
      "Professor Dumbledore would be proud!",
      "Now that's some real magic!",
      "You'd make a great Gryffindor!",
      "Expecto great-answer-um! \u{1F31F}",
    ],
    milestoneReactions: {
      5: "5 questions done! You're on a roll, like a Quidditch match! \u{1F9F9}",
      10: "Halfway there! You're flying through these! \u{1F3C6}",
      15: "Only 5 left! Nearly there, champion! \u{26A1}",
    },
  },
  {
    id: "doraemon",
    name: "Doraemon",
    image: "/characters/doraemon.svg",
    poses: {
      idle: "/characters/doraemon_idle.png",
      speaking: "/characters/doraemon_speaking.png",
      listening: "/characters/doraemon_listening.png",
      thinking: "/characters/doraemon_thinking.png",
      happy: "/characters/doraemon_happy.png",
      encouraging: "/characters/doraemon_encouraging.png",
    },
    color: "#2563eb",
    accent: "#60a5fa",
    greeting: "Hello! I'm Doraemon. I've got some really interesting questions for you!",
    background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 40%, #7dd3fc 100%)",
    reactions: [
      "Sugoi! Amazing answer! \u{1F31F}",
      "That was super smart!",
      "I'll save that in my 4D pocket!",
      "You're a genius inventor!",
      "Nobita would be so impressed!",
      "Future-level thinking! \u{1F680}",
    ],
    milestoneReactions: {
      5: "5 done! My gadget detector says you're doing great! \u{1F50D}",
      10: "Halfway! Time for a dorayaki break... just kidding! \u{1F369}",
      15: "Almost there! Only 5 more to go! \u{1F389}",
    },
  },
  {
    id: "peppa_pig",
    name: "Peppa Pig",
    image: "/characters/peppa_pig.svg",
    poses: {
      idle: "/characters/peppa_pig_idle.png",
      speaking: "/characters/peppa_pig_speaking.png",
      listening: "/characters/peppa_pig_listening.png",
      thinking: "/characters/peppa_pig_thinking.png",
      happy: "/characters/peppa_pig_happy.png",
      encouraging: "/characters/peppa_pig_encouraging.png",
    },
    color: "#e85d75",
    accent: "#f9a8d4",
    greeting: "Hi there! I'm Peppa! Let's have some fun answering questions together!",
    background: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 40%, #f9a8d4 100%)",
    reactions: [
      "That was lovely! \u{1F338}",
      "Brilliant! Mummy Pig would love that!",
      "You're so clever! Hee hee!",
      "Muddy puddles of fun!",
      "That's absolutely fantastic!",
      "George says 'dinosaur' which means great! \u{1F995}",
    ],
    milestoneReactions: {
      5: "5 down! This is more fun than jumping in puddles! \u{1F4A6}",
      10: "Halfway done! You're a superstar! \u{2B50}",
      15: "Nearly finished! Just 5 more, easy peasy! \u{1F37D}",
    },
  },
  {
    id: "simba",
    name: "Simba",
    image: "/characters/simba.svg",
    poses: {
      idle: "/characters/simba_idle.png",
      speaking: "/characters/simba_speaking.png",
      listening: "/characters/simba_listening.png",
      thinking: "/characters/simba_thinking.png",
      happy: "/characters/simba_happy.png",
      encouraging: "/characters/simba_encouraging.png",
    },
    color: "#b45309",
    accent: "#fbbf24",
    greeting: "Hey! I'm Simba. Ready for an adventure through some cool questions?",
    background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 40%, #f59e0b 100%)",
    reactions: [
      "Hakuna Matata! Great answer! \u{1F981}",
      "The Pride Lands are proud of you!",
      "Roar-some thinking! \u{1F525}",
      "You've got the heart of a lion!",
      "That answer was king-worthy!",
      "Timon and Pumbaa are cheering! \u{1F389}",
    ],
    milestoneReactions: {
      5: "5 down! You're braver than a lion cub! \u{1F43E}",
      10: "Halfway through the savanna! Keep going! \u{1F305}",
      15: "Almost at Pride Rock! Just 5 more! \u{1F3D4}",
    },
  },
  {
    id: "dora",
    name: "Dora",
    image: "/characters/dora.svg",
    poses: {
      idle: "/characters/dora_idle.png",
      speaking: "/characters/dora_speaking.png",
      listening: "/characters/dora_listening.png",
      thinking: "/characters/dora_thinking.png",
      happy: "/characters/dora_happy.png",
      encouraging: "/characters/dora_encouraging.png",
    },
    color: "#7c3aed",
    accent: "#a78bfa",
    greeting: "Hola! I'm Dora. Let's explore these questions together, amigo!",
    background: "linear-gradient(135deg, #ecfdf5 0%, #a7f3d0 40%, #6ee7b7 100%)",
    reactions: [
      "Muy bien! Excellent! \u{1F31F}",
      "We did it! Great answer!",
      "Backpack says that was amazing!",
      "You're a super explorer!",
      "Swiper can't swipe that brain!",
      "Delicioso answer, amigo! \u{1F308}",
    ],
    milestoneReactions: {
      5: "5 done! Our map says we're making great progress! \u{1F5FA}",
      10: "Halfway there! Say it with me: 'We did it!' \u{1F38A}",
      15: "Almost at the finish! Solo cinco mas! \u{1F3C1}",
    },
  },
];
