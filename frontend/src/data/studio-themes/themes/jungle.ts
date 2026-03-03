import type { StudioTheme } from "../types";

export const jungleTheme: StudioTheme = {
  id: "jungle",
  name: "Jungle",
  description: "Explore the wild jungle of mathematics",
  icon: "🌴",
  previewGradient: "linear-gradient(135deg, #14532D, #166534, #4ADE80)",
  labels: {
    xpName: "Jungle Coins",
    xpIcon: "🍃",
    stepNoun: "Trail",
    projectNoun: "Expedition",
    completionTitle: "Expedition Complete!",
    galleryTitle: "Jungle Base Camp",
    gallerySubtitle: "Blaze trails through the wild and earn jungle coins!",
  },
  visuals: {
    pageBackground: "linear-gradient(180deg, #052e16 0%, #14532D 30%, #052e16 100%)",
    cardBackground: "rgba(20, 83, 45, 0.4)",
    cardBorderColor: "rgba(74, 222, 128, 0.3)",
    accentColor: "#4ADE80",
    accentHoverColor: "#86EFAC",
    surfaceTint: "rgba(74, 222, 128, 0.06)",
    xpToastColor: "#22C55E",
  },
  characterOverrides: {
    addAccessories: ["leaf-crown", "binoculars"],
    removeAccessories: [],
    outfitColor: "#166534",
  },
  presetOverrides: {
    chef: {
      addAccessories: ["leaf-crown", "binoculars"],
      removeAccessories: ["chef-hat"],
      outfitColor: "#15803D",
    },
    detective: {
      addAccessories: ["leaf-crown", "binoculars"],
      removeAccessories: ["magnifying-glass"],
      outfitColor: "#166534",
    },
    spy: {
      addAccessories: ["leaf-crown", "binoculars"],
      removeAccessories: ["sunglasses", "antenna"],
      outfitColor: "#14532D",
    },
    explorer: {
      addAccessories: ["leaf-crown", "binoculars"],
      removeAccessories: ["scarf"],
      outfitColor: "#15803D",
    },
  },
  projectOverrides: [
    {
      projectId: "pattern-detective",
      name: "Animal Track Spotter",
      tagline: "Spot patterns in animal tracks!",
      icon: "🐾",
      color: "#16A34A",
      stepOverrides: {
        "step-1": {
          storyText:
            "Welcome to the jungle, Ranger! I'm Tracker Maya, and mysterious animal tracks have appeared all over the forest! Someone — or something — is leaving number patterns in the mud. I need your sharp eyes to identify the creatures. Ready for the expedition?",
        },
        "step-2": {
          storyText:
            "Track #1: We found these paw prints in the mud: 2, 4, 6, 8, ... The animal always moves in a pattern. What print comes next?",
        },
        "step-3": {
          storyText:
            "Track #2: A shape pattern in the sand! Circle, Triangle, Circle, Triangle, Circle, ... What shape track completes this trail?",
        },
        "step-4": {
          storyText:
            "Track #3: The rare Golden Parrot's trail! We found: 1, 4, 9, 16, ... These are the sacred Square Numbers of the jungle. What comes next?",
        },
        "step-5": {
          storyText:
            "Brilliant tracking, Ranger! All three animal trails identified. The jungle wildlife survey is complete. You've earned your Master Tracker's Badge!",
        },
      },
    },
    {
      projectId: "room-designer",
      name: "Treehouse Architect",
      tagline: "Build an epic treehouse!",
      icon: "🌳",
      color: "#15803D",
      stepOverrides: {
        "step-1": {
          storyText:
            "Welcome to the canopy, Architect! I'm Ranger Finn, and today we're building the most amazing treehouse in the jungle! First, we need to learn perimeter and area — the building blocks of every great treehouse. Let's begin!",
        },
        "step-2": {
          storyText:
            "Your treehouse platform is a rectangle — 4 bamboo-lengths long and 3 bamboo-lengths wide. To build a railing around it, we need the perimeter. What is it?",
        },
        "step-3": {
          storyText:
            "Now let's lay down the floor boards! Each board covers 1×1 bamboo-length. Tap the grid to place boards and cover the entire platform.",
        },
        "step-4": {
          storyText:
            "Let's add an L-shaped lookout deck! The main platform is 5×4, and the lookout adds 2×2. What's the total perimeter of your new L-shaped treehouse?",
        },
        "step-5": {
          storyText:
            "Your treehouse is complete! Amazing work, Architect. You've mastered the building arts of perimeter and area — skills that real jungle engineers use every day!",
        },
      },
    },
    {
      projectId: "pizza-shop",
      name: "Campfire Kitchen",
      tagline: "Cook jungle feasts!",
      icon: "🔥",
      color: "#B45309",
      stepOverrides: {
        "step-1": {
          storyText:
            "Welcome to the Jungle Campfire Kitchen! I'm Chef Kato, and today YOU are my sous-chef. We'll be portioning ingredients, serving the expedition crew, and doing some wild fraction math. Ready to start cooking?",
        },
        "step-2": {
          storyText:
            "First order! A ranger needs 3/8 of a coconut. Let's split the coconut into 8 pieces and figure out the right portion!",
        },
        "step-3": {
          storyText:
            "Two rangers are hungry! Ranger A wants 1/4 of a mango, and Ranger B wants 2/4. Who gets more mango?",
        },
        "step-4": {
          storyText:
            "Busy camp! Ranger A ate 2/6 of a papaya, then came back for 1/6 more. How much papaya was eaten in total?",
        },
        "step-5": {
          storyText:
            "Last serving! We have 5/8 of a watermelon left. A group of explorers needs 2/8. How much will remain?",
        },
        "step-6": {
          storyText:
            "What an incredible day at Campfire Kitchen! Every explorer fed and happy. You've earned your Jungle Chef's Badge! Come back anytime — the fire's always burning!",
        },
      },
    },
    {
      projectId: "temperature-controller",
      name: "Weather Station",
      tagline: "Master jungle weather!",
      icon: "🌦️",
      color: "#0D9488",
      stepOverrides: {
        "step-1": {
          storyText:
            "Alert, Ranger! I'm Ranger Finn, and the jungle weather station sensors are going haywire! A cold front from the mountains is bringing temperatures BELOW zero. We need to understand negative numbers to predict the weather. Let's learn!",
        },
        "step-2": {
          storyText:
            "The mountain sensor shows 5°C. Suddenly a cold front rolls in and drops it by 8 degrees! Use the weather gauge to find the new temperature.",
        },
        "step-3": {
          storyText:
            "Two zones: Valley Floor is at −3°C and Mountain Peak is at −7°C. Which zone is WARMER?",
        },
        "step-4": {
          storyText:
            "Time to predict the afternoon warmth! The morning temperature is −4°C. If the sun heats things up by 6 degrees, what will the temperature be? Use the weather gauge!",
        },
        "step-5": {
          storyText:
            "The weather station is back online! You've mastered temperature science and saved the jungle expedition from the cold. You're a true Weather Ranger!",
        },
      },
    },
  ],
};
