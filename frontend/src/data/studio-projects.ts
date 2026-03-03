export interface StudioStep {
  id: string;
  storyText: string;
  challengeType:
    | "story_intro"
    | "studio_mcq"
    | "fraction_pizza"
    | "pattern_sequence"
    | "room_grid"
    | "thermometer_slider";
  challengeData: Record<string, unknown>;
  options?: { text: string; isCorrect: boolean }[];
  hints: string[];
  xpReward: number;
  explanation: string;
}

export interface StudioProject {
  id: string;
  chapter: number;
  ncertRef: string;
  name: string;
  tagline: string;
  icon: string;
  color: string;
  characterPreset: "chef" | "detective" | "spy" | "explorer";
  estimatedMinutes: number;
  steps: StudioStep[];
  locked: boolean;
}

export const STUDIO_PROJECTS: StudioProject[] = [
  // ═══════════════════════════════════════════
  // PROJECT 1: Pattern Detective (Ch 1)
  // ═══════════════════════════════════════════
  {
    id: "pattern-detective",
    chapter: 1,
    ncertRef: "Ch 1: Patterns in Mathematics",
    name: "Pattern Detective",
    tagline: "Solve pattern crimes!",
    icon: "🔍",
    color: "#E53E3E",
    characterPreset: "detective",
    estimatedMinutes: 10,
    locked: false,
    steps: [
      {
        id: "step-1",
        storyText:
          "I'm Detective Dot, and we've got a pattern crime on our hands! Someone's been leaving mysterious number sequences all over town. I need your sharp eyes to crack these cases. Ready, partner?",
        challengeType: "story_intro",
        challengeData: {},
        hints: [],
        xpReward: 5,
        explanation: "",
      },
      {
        id: "step-2",
        storyText:
          "Case #1: We found this sequence on a wall: 2, 4, 6, 8, ... The criminal always follows a pattern. What number comes next?",
        challengeType: "pattern_sequence",
        challengeData: {
          sequence: [2, 4, 6, 8],
          type: "number",
          rule: "+2",
        },
        options: [
          { text: "10", isCorrect: true },
          { text: "12", isCorrect: false },
          { text: "9", isCorrect: false },
          { text: "16", isCorrect: false },
        ],
        hints: ["Look at the difference between each number.", "Each number goes up by the same amount."],
        xpReward: 10,
        explanation: "Each number increases by 2. So after 8, the next is 8 + 2 = 10!",
      },
      {
        id: "step-3",
        storyText:
          "Case #2: A shape pattern was left at the scene! Circle, Triangle, Circle, Triangle, Circle, ... What comes next?",
        challengeType: "pattern_sequence",
        challengeData: {
          sequence: ["circle", "triangle", "circle", "triangle", "circle"],
          type: "shape",
          rule: "alternating",
        },
        options: [
          { text: "triangle", isCorrect: true },
          { text: "circle", isCorrect: false },
          { text: "square", isCorrect: false },
          { text: "star", isCorrect: false },
        ],
        hints: [
          "Look at the pattern: it alternates between two shapes.",
          "Odd positions have circles, even positions have...",
        ],
        xpReward: 10,
        explanation:
          "The pattern alternates: Circle, Triangle, Circle, Triangle... So the next one is Triangle!",
      },
      {
        id: "step-4",
        storyText:
          "Case #3: This one's tricky! We found: 1, 4, 9, 16, ... These are special numbers. What comes next?",
        challengeType: "studio_mcq",
        challengeData: {
          illustration: "square_numbers",
        },
        options: [
          { text: "25", isCorrect: true },
          { text: "20", isCorrect: false },
          { text: "24", isCorrect: false },
          { text: "32", isCorrect: false },
        ],
        hints: [
          "Try to find what you multiply each number by itself: 1×1, 2×2, 3×3...",
          "These are called square numbers!",
        ],
        xpReward: 15,
        explanation:
          "These are square numbers: 1²=1, 2²=4, 3²=9, 4²=16, 5²=25. The answer is 25!",
      },
      {
        id: "step-5",
        storyText:
          "Brilliant work, Detective! All three pattern crimes are solved. The town is safe again thanks to your amazing pattern-spotting skills. You've earned your detective badge!",
        challengeType: "story_intro",
        challengeData: { celebration: true },
        hints: [],
        xpReward: 10,
        explanation: "",
      },
    ],
  },

  // ═══════════════════════════════════════════
  // PROJECT 2: Treasure Map Maker (Ch 2) — LOCKED
  // ═══════════════════════════════════════════
  {
    id: "treasure-map",
    chapter: 2,
    ncertRef: "Ch 2: Lines and Angles",
    name: "Treasure Map Maker",
    tagline: "Draw paths with angles!",
    icon: "📐",
    color: "#DD6B20",
    characterPreset: "detective",
    estimatedMinutes: 12,
    locked: true,
    steps: [],
  },

  // ═══════════════════════════════════════════
  // PROJECT 3: Secret Code Breaker (Ch 3) — LOCKED
  // ═══════════════════════════════════════════
  {
    id: "code-breaker",
    chapter: 3,
    ncertRef: "Ch 3: Number Play",
    name: "Secret Code Breaker",
    tagline: "Crack codes with numbers!",
    icon: "🔢",
    color: "#D69E2E",
    characterPreset: "spy",
    estimatedMinutes: 12,
    locked: true,
    steps: [],
  },

  // ═══════════════════════════════════════════
  // PROJECT 4: Class Reporter (Ch 4) — LOCKED
  // ═══════════════════════════════════════════
  {
    id: "class-reporter",
    chapter: 4,
    ncertRef: "Ch 4: Data Handling",
    name: "Class Reporter",
    tagline: "Make graphs and report news!",
    icon: "📊",
    color: "#38A169",
    characterPreset: "detective",
    estimatedMinutes: 15,
    locked: true,
    steps: [],
  },

  // ═══════════════════════════════════════════
  // PROJECT 5: Prime Agent (Ch 5) — LOCKED
  // ═══════════════════════════════════════════
  {
    id: "prime-agent",
    chapter: 5,
    ncertRef: "Ch 5: Prime Time",
    name: "Prime Agent",
    tagline: "Find primes, unlock secrets!",
    icon: "🔑",
    color: "#319795",
    characterPreset: "spy",
    estimatedMinutes: 12,
    locked: true,
    steps: [],
  },

  // ═══════════════════════════════════════════
  // PROJECT 6: Room Designer (Ch 6)
  // ═══════════════════════════════════════════
  {
    id: "room-designer",
    chapter: 6,
    ncertRef: "Ch 6: Perimeter and Area",
    name: "Room Designer",
    tagline: "Design your dream room!",
    icon: "📏",
    color: "#3182CE",
    characterPreset: "explorer",
    estimatedMinutes: 12,
    locked: false,
    steps: [
      {
        id: "step-1",
        storyText:
          "Hey there! I'm Finn the Explorer, and today we're going to design the coolest bedroom ever! But first, we need to learn about perimeter and area. These are the secrets to making rooms fit perfectly. Let's go!",
        challengeType: "story_intro",
        challengeData: {},
        hints: [],
        xpReward: 5,
        explanation: "",
      },
      {
        id: "step-2",
        storyText:
          "Your room is a rectangle that's 4 meters long and 3 meters wide. To put a fancy border light around the room, we need to find the perimeter. What is it?",
        challengeType: "studio_mcq",
        challengeData: {
          illustration: "rectangle_room",
          width: 4,
          height: 3,
        },
        options: [
          { text: "14 meters", isCorrect: true },
          { text: "12 meters", isCorrect: false },
          { text: "7 meters", isCorrect: false },
          { text: "16 meters", isCorrect: false },
        ],
        hints: [
          "Perimeter means the total distance around the room.",
          "Add up all four sides: length + width + length + width.",
        ],
        xpReward: 10,
        explanation:
          "Perimeter = 2 × (length + width) = 2 × (4 + 3) = 2 × 7 = 14 meters!",
      },
      {
        id: "step-3",
        storyText:
          "Now let's tile the floor! Each tile is 1m × 1m. Tap the grid squares to figure out how many tiles we need to cover the whole floor.",
        challengeType: "room_grid",
        challengeData: {
          gridWidth: 4,
          gridHeight: 3,
          correctArea: 12,
          label: "Tap all the squares to tile the floor!",
        },
        hints: [
          "Count each square — each one is 1 square meter.",
          "Area = length × width",
        ],
        xpReward: 15,
        explanation:
          "The floor area = 4 × 3 = 12 square meters. That's how many tiles we need!",
      },
      {
        id: "step-4",
        storyText:
          "Ooh, let's add an L-shaped reading nook! The main room is 5m × 4m, and the nook adds a 2m × 2m extension. What's the total perimeter of the new L-shaped room?",
        challengeType: "studio_mcq",
        challengeData: {
          illustration: "l_shape",
        },
        options: [
          { text: "22 meters", isCorrect: true },
          { text: "18 meters", isCorrect: false },
          { text: "24 meters", isCorrect: false },
          { text: "20 meters", isCorrect: false },
        ],
        hints: [
          "Draw the L-shape and trace around the outside edges only.",
          "The inside corner doesn't count for perimeter!",
        ],
        xpReward: 15,
        explanation:
          "Trace the outside: 5 + 4 + 3 + 2 + 2 + 6 = 22 meters. The inside edges aren't part of the perimeter!",
      },
      {
        id: "step-5",
        storyText:
          "Your dream room is designed! Amazing work, architect. You now know how to calculate perimeter and area — skills that real architects use every day!",
        challengeType: "story_intro",
        challengeData: { celebration: true },
        hints: [],
        xpReward: 10,
        explanation: "",
      },
    ],
  },

  // ═══════════════════════════════════════════
  // PROJECT 7: Pizza Shop (Ch 7)
  // ═══════════════════════════════════════════
  {
    id: "pizza-shop",
    chapter: 7,
    ncertRef: "Ch 7: Fractions",
    name: "Pizza Shop",
    tagline: "Run your own pizza shop!",
    icon: "🍕",
    color: "#805AD5",
    characterPreset: "chef",
    estimatedMinutes: 15,
    locked: false,
    steps: [
      {
        id: "step-1",
        storyText:
          "Welcome to Mario's Pizza Shop! I'm Chef Mario, and today YOU are my assistant chef. We'll be slicing pizzas, serving customers, and doing some delicious fraction math. Are you ready to start your shift?",
        challengeType: "story_intro",
        challengeData: {},
        hints: [],
        xpReward: 5,
        explanation: "",
      },
      {
        id: "step-2",
        storyText:
          "First customer! She says: \"I'd like 3/8 of a large pizza, please.\" Let's slice this pizza into 8 pieces and figure out what fraction she ate!",
        challengeType: "fraction_pizza",
        challengeData: {
          totalSlices: 8,
          eatenSlices: 3,
        },
        options: [
          { text: "3/8", isCorrect: true },
          { text: "5/8", isCorrect: false },
          { text: "3/5", isCorrect: false },
          { text: "1/3", isCorrect: false },
        ],
        hints: [
          "Count the eaten slices and the total slices.",
          "A fraction is: eaten slices / total slices.",
        ],
        xpReward: 10,
        explanation:
          "3 slices were eaten out of 8 total. The fraction eaten is 3/8!",
      },
      {
        id: "step-3",
        storyText:
          "Two customers are arguing! Customer A wants 1/4 of a pizza, and Customer B wants 2/4. Who gets more pizza?",
        challengeType: "studio_mcq",
        challengeData: {
          illustration: "fraction_compare",
        },
        options: [
          { text: "Customer B (2/4)", isCorrect: true },
          { text: "Customer A (1/4)", isCorrect: false },
          { text: "They get the same", isCorrect: false },
          { text: "Can't compare them", isCorrect: false },
        ],
        hints: [
          "When the denominator is the same, compare the numerators.",
          "Which is bigger: 1 or 2?",
        ],
        xpReward: 10,
        explanation:
          "When denominators are equal, the bigger numerator means more pizza. 2/4 > 1/4, so Customer B gets more!",
      },
      {
        id: "step-4",
        storyText:
          "Busy day! Customer A ate 2/6 of a pizza, then came back for 1/6 more. How much pizza did she eat in total?",
        challengeType: "studio_mcq",
        challengeData: {
          illustration: "fraction_add",
        },
        options: [
          { text: "3/6", isCorrect: true },
          { text: "3/12", isCorrect: false },
          { text: "2/6", isCorrect: false },
          { text: "1/3", isCorrect: false },
        ],
        hints: [
          "When adding fractions with the same denominator, add the numerators.",
          "2 + 1 = ?  Keep the denominator the same!",
        ],
        xpReward: 10,
        explanation:
          "2/6 + 1/6 = 3/6. When denominators match, just add the numerators!",
      },
      {
        id: "step-5",
        storyText:
          "Last order of the day! We have 5/8 of a pizza left. A customer wants 2/8. How much pizza will remain after serving them?",
        challengeType: "studio_mcq",
        challengeData: {
          illustration: "fraction_subtract",
        },
        options: [
          { text: "3/8", isCorrect: true },
          { text: "7/8", isCorrect: false },
          { text: "3/16", isCorrect: false },
          { text: "2/8", isCorrect: false },
        ],
        hints: [
          "Subtract: 5/8 - 2/8. Keep the denominator!",
          "5 - 2 = ?",
        ],
        xpReward: 10,
        explanation:
          "5/8 − 2/8 = 3/8. Subtract the numerators, keep the denominator!",
      },
      {
        id: "step-6",
        storyText:
          "What an incredible day at the pizza shop! You served every customer perfectly and did amazing fraction math. You've earned your Chef's Hat badge! Come back anytime — there's always pizza to make!",
        challengeType: "story_intro",
        challengeData: { celebration: true },
        hints: [],
        xpReward: 10,
        explanation: "",
      },
    ],
  },

  // ═══════════════════════════════════════════
  // PROJECT 8: Architect Studio (Ch 8) — LOCKED
  // ═══════════════════════════════════════════
  {
    id: "architect-studio",
    chapter: 8,
    ncertRef: "Ch 8: Playing with Constructions",
    name: "Architect Studio",
    tagline: "Build shapes with precision!",
    icon: "🏗️",
    color: "#B83280",
    characterPreset: "explorer",
    estimatedMinutes: 15,
    locked: true,
    steps: [],
  },

  // ═══════════════════════════════════════════
  // PROJECT 9: Rangoli Maker (Ch 9) — LOCKED
  // ═══════════════════════════════════════════
  {
    id: "rangoli-maker",
    chapter: 9,
    ncertRef: "Ch 9: Symmetry",
    name: "Rangoli Maker",
    tagline: "Create beautiful symmetric art!",
    icon: "🎨",
    color: "#E53E3E",
    characterPreset: "chef",
    estimatedMinutes: 12,
    locked: true,
    steps: [],
  },

  // ═══════════════════════════════════════════
  // PROJECT 10: Temperature Controller (Ch 10)
  // ═══════════════════════════════════════════
  {
    id: "temperature-controller",
    chapter: 10,
    ncertRef: "Ch 10: The Other Side of Zero",
    name: "Temperature Controller",
    tagline: "Master the cold and heat!",
    icon: "🌡️",
    color: "#2B6CB0",
    characterPreset: "explorer",
    estimatedMinutes: 12,
    locked: false,
    steps: [
      {
        id: "step-1",
        storyText:
          "Brrr! I'm Explorer Finn, and we're heading to the Arctic Research Station! But the heating system is broken. We need to understand temperatures — including ones BELOW zero — to fix it. Numbers below zero are called negative numbers. Let's learn!",
        challengeType: "story_intro",
        challengeData: {},
        hints: [],
        xpReward: 5,
        explanation: "",
      },
      {
        id: "step-2",
        storyText:
          "The station thermometer shows 5°C. Suddenly a blizzard hits and the temperature drops by 8 degrees! Use the thermometer to find the new temperature.",
        challengeType: "thermometer_slider",
        challengeData: {
          startTemp: 5,
          change: -8,
          targetTemp: -3,
          min: -10,
          max: 10,
          label: "Drag to show what 5°C − 8° equals",
        },
        hints: [
          "Start at 5 and count down 8 steps.",
          "When you go below 0, you enter negative numbers!",
        ],
        xpReward: 15,
        explanation:
          "5 − 8 = −3. When you go below zero, you enter negative territory! −3°C means 3 degrees below freezing.",
      },
      {
        id: "step-3",
        storyText:
          "Two rooms in the station: Room A is at −3°C and Room B is at −7°C. Which room is WARMER?",
        challengeType: "studio_mcq",
        challengeData: {
          illustration: "number_line",
        },
        options: [
          { text: "Room A (−3°C)", isCorrect: true },
          { text: "Room B (−7°C)", isCorrect: false },
          { text: "They're the same", isCorrect: false },
          { text: "Can't compare them", isCorrect: false },
        ],
        hints: [
          "Think of a number line: which is closer to zero?",
          "On a thermometer, higher means warmer.",
        ],
        xpReward: 10,
        explanation:
          "−3°C is warmer than −7°C. On a number line, −3 is to the RIGHT of −7, meaning it's a higher temperature!",
      },
      {
        id: "step-4",
        storyText:
          "Time to fix the heater! The station is at −4°C. If we turn the heater up by 6 degrees, what will the temperature be? Use the thermometer!",
        challengeType: "thermometer_slider",
        challengeData: {
          startTemp: -4,
          change: 6,
          targetTemp: 2,
          min: -10,
          max: 10,
          label: "Drag to show what −4°C + 6° equals",
        },
        hints: [
          "Start at −4 and go UP 6 steps.",
          "You'll cross zero — that's where temperatures go from cold to warm!",
        ],
        xpReward: 15,
        explanation:
          "−4 + 6 = 2. Starting at −4, going up 6: −3, −2, −1, 0, 1, 2. The heater brings us to a cozy 2°C!",
      },
      {
        id: "step-5",
        storyText:
          "The station is warm again! You've mastered negative numbers and saved the Arctic Research Station. The whole team is grateful. You're a true temperature hero!",
        challengeType: "story_intro",
        challengeData: { celebration: true },
        hints: [],
        xpReward: 10,
        explanation: "",
      },
    ],
  },
];

export function getProject(id: string): StudioProject | undefined {
  return STUDIO_PROJECTS.find((p) => p.id === id);
}

export function getUnlockedProjects(): StudioProject[] {
  return STUDIO_PROJECTS.filter((p) => !p.locked);
}
