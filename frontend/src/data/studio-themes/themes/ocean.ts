import type { StudioTheme } from "../types";

export const oceanTheme: StudioTheme = {
  id: "ocean",
  name: "Ocean",
  description: "Dive into the ocean depths of mathematics",
  icon: "🐚",
  previewGradient: "linear-gradient(135deg, #0C4A6E, #0E7490, #F97316)",
  labels: {
    xpName: "Sea Pearls",
    xpIcon: "🐚",
    stepNoun: "Dive",
    projectNoun: "Voyage",
    completionTitle: "Voyage Complete!",
    galleryTitle: "Ocean Observatory",
    gallerySubtitle: "Dive deep and collect sea pearls on your voyages!",
  },
  visuals: {
    pageBackground: "linear-gradient(180deg, #082f49 0%, #0C4A6E 30%, #082f49 100%)",
    cardBackground: "rgba(12, 74, 110, 0.4)",
    cardBorderColor: "rgba(249, 115, 22, 0.3)",
    accentColor: "#F97316",
    accentHoverColor: "#FB923C",
    surfaceTint: "rgba(249, 115, 22, 0.06)",
    xpToastColor: "#F97316",
  },
  characterOverrides: {
    addAccessories: ["diving-mask", "trident"],
    removeAccessories: [],
    outfitColor: "#0E7490",
  },
  presetOverrides: {
    chef: {
      addAccessories: ["diving-mask", "trident"],
      removeAccessories: ["chef-hat"],
      outfitColor: "#0891B2",
    },
    detective: {
      addAccessories: ["diving-mask", "trident"],
      removeAccessories: ["magnifying-glass"],
      outfitColor: "#0E7490",
    },
    spy: {
      addAccessories: ["diving-mask", "trident"],
      removeAccessories: ["sunglasses", "antenna"],
      outfitColor: "#0C4A6E",
    },
    explorer: {
      addAccessories: ["diving-mask", "trident"],
      removeAccessories: ["scarf"],
      outfitColor: "#0891B2",
    },
  },
  projectOverrides: [
    {
      projectId: "pattern-detective",
      name: "Current Mapper",
      tagline: "Map mysterious ocean currents!",
      icon: "🌊",
      color: "#0891B2",
      stepOverrides: {
        "step-1": {
          storyText:
            "Ahoy, Navigator! I'm Captain Coral, and mysterious ocean currents have appeared all over the sea! Strange number patterns are showing up in the sonar readings. I need your sharp mind to map these currents. Ready to dive?",
        },
        "step-2": {
          storyText:
            "Current #1: The sonar reads: 2, 4, 6, 8, ... The currents always follow a pattern. What reading comes next?",
        },
        "step-3": {
          storyText:
            "Current #2: A shape pattern on the seafloor! Circle, Triangle, Circle, Triangle, Circle, ... What shape completes this coral formation?",
        },
        "step-4": {
          storyText:
            "Current #3: The legendary Deep Trench signal! We detected: 1, 4, 9, 16, ... These are the Square Wave numbers used in ancient ocean maps. What comes next?",
        },
        "step-5": {
          storyText:
            "Brilliant navigation! All three ocean currents mapped. The seas are charted thanks to your amazing pattern skills. You've earned the Navigator's Compass!",
        },
      },
    },
    {
      projectId: "room-designer",
      name: "Coral Reef Builder",
      tagline: "Build an underwater reef!",
      icon: "🪸",
      color: "#0E7490",
      stepOverrides: {
        "step-1": {
          storyText:
            "Welcome to the deep, Reef Architect! I'm Captain Finn, and today we're building a beautiful coral reef garden! First, we need to master perimeter and area — the foundation of underwater architecture. Let's dive in!",
        },
        "step-2": {
          storyText:
            "Your reef plot is a rectangle — 4 fathoms long and 3 fathoms wide. To set up the protective net around it, we need the perimeter. What is it?",
        },
        "step-3": {
          storyText:
            "Now let's plant coral! Each coral cluster covers 1×1 fathom. Tap the grid to plant coral and fill the entire reef bed.",
        },
        "step-4": {
          storyText:
            "Time for an L-shaped grotto! The main reef is 5×4, and the grotto adds 2×2. What's the total perimeter of your new L-shaped reef?",
        },
        "step-5": {
          storyText:
            "Your coral reef is thriving! Wonderful work, Reef Architect. You've mastered underwater geometry — skills that real marine biologists use every day!",
        },
      },
    },
    {
      projectId: "pizza-shop",
      name: "Pearl Kitchen",
      tagline: "Serve the undersea crew!",
      icon: "🦪",
      color: "#B45309",
      stepOverrides: {
        "step-1": {
          storyText:
            "Welcome to the Pearl Kitchen, deep under the sea! I'm Chef Neptune, and today YOU are my kitchen mate. We'll be portioning sea-treats, serving the underwater crew, and doing some deep fraction math. Ready to start your dive shift?",
        },
        "step-2": {
          storyText:
            "First customer! A mermaid says: \"I'd like 3/8 of a sea-cake, please.\" Let's slice the sea-cake into 8 pieces and figure out her portion!",
        },
        "step-3": {
          storyText:
            "Two dolphins are comparing! Dolphin A wants 1/4 of a kelp roll, and Dolphin B wants 2/4. Who gets more kelp roll?",
        },
        "step-4": {
          storyText:
            "Busy reef! A turtle ate 2/6 of a seaweed wrap, then came back for 1/6 more. How much seaweed was eaten in total?",
        },
        "step-5": {
          storyText:
            "Last order! We have 5/8 of a coral candy left. An octopus needs 2/8. How much will remain?",
        },
        "step-6": {
          storyText:
            "What an incredible shift at Pearl Kitchen! Every sea creature served perfectly. You've earned your Deep Sea Chef's Badge! Swim back anytime!",
        },
      },
    },
    {
      projectId: "temperature-controller",
      name: "Ocean Depths",
      tagline: "Explore deep-sea temperatures!",
      icon: "🌡️",
      color: "#0C4A6E",
      stepOverrides: {
        "step-1": {
          storyText:
            "Dive deep, Explorer! I'm Captain Finn, and the research submarine's thermal sensors are failing! As we go deeper, temperatures drop BELOW zero. We need to understand negative numbers to navigate safely. Let's learn!",
        },
        "step-2": {
          storyText:
            "The depth sensor shows 5°C. We dive into a cold current and temperature drops by 8 degrees! Use the depth thermometer to find the new temperature.",
        },
        "step-3": {
          storyText:
            "Two ocean zones: The Twilight Zone is at −3°C and the Midnight Zone is at −7°C. Which zone is WARMER?",
        },
        "step-4": {
          storyText:
            "Time to surface! The submarine is at −4°C. If we rise into warmer water that adds 6 degrees, what will the temperature be? Use the depth sensor!",
        },
        "step-5": {
          storyText:
            "The submarine is back in warm waters! You've mastered deep-sea temperature science. The whole crew celebrates — you're a true Ocean Explorer!",
        },
      },
    },
  ],
};
