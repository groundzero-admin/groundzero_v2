import type { StudioTheme } from "../types";

export const spaceTheme: StudioTheme = {
  id: "space",
  name: "Space",
  description: "Explore the galaxy of mathematics",
  icon: "🚀",
  previewGradient: "linear-gradient(135deg, #0F172A, #1E3A5F, #06B6D4)",
  labels: {
    xpName: "Star Dust",
    xpIcon: "✨",
    stepNoun: "Mission",
    projectNoun: "Mission",
    completionTitle: "Mission Accomplished!",
    galleryTitle: "Space Station",
    gallerySubtitle: "Complete missions across the galaxy and collect star dust!",
  },
  visuals: {
    pageBackground: "linear-gradient(180deg, #0F172A 0%, #1E293B 30%, #0F172A 100%)",
    cardBackground: "rgba(15, 23, 42, 0.6)",
    cardBorderColor: "rgba(6, 182, 212, 0.3)",
    accentColor: "#06B6D4",
    accentHoverColor: "#22D3EE",
    surfaceTint: "rgba(6, 182, 212, 0.06)",
    xpToastColor: "#06B6D4",
  },
  characterOverrides: {
    addAccessories: ["space-helmet", "jetpack"],
    removeAccessories: [],
    outfitColor: "#1E40AF",
  },
  presetOverrides: {
    chef: {
      addAccessories: ["space-helmet", "jetpack"],
      removeAccessories: ["chef-hat"],
      outfitColor: "#1E3A5F",
    },
    detective: {
      addAccessories: ["space-helmet", "jetpack"],
      removeAccessories: ["magnifying-glass"],
      outfitColor: "#1E40AF",
    },
    spy: {
      addAccessories: ["space-helmet", "jetpack"],
      removeAccessories: ["sunglasses", "antenna"],
      outfitColor: "#0F172A",
    },
    explorer: {
      addAccessories: ["space-helmet", "jetpack"],
      removeAccessories: ["scarf"],
      outfitColor: "#1E3A5F",
    },
  },
  projectOverrides: [
    {
      projectId: "pattern-detective",
      name: "Signal Decoder",
      tagline: "Decode alien signal patterns!",
      icon: "📡",
      color: "#0891B2",
      stepOverrides: {
        "step-1": {
          storyText:
            "Attention, Cadet! I'm Commander Nova, and we've intercepted alien signal patterns from deep space! Someone — or something — is transmitting mysterious number sequences. I need your sharp analysis to decode these transmissions. Ready for launch?",
        },
        "step-2": {
          storyText:
            "Signal #1: The transmission reads: 2, 4, 6, 8, ... The aliens always follow a pattern. What number comes next in this sequence?",
        },
        "step-3": {
          storyText:
            "Signal #2: A shape pattern was detected on our radar! Circle, Triangle, Circle, Triangle, Circle, ... What shape completes this alien message?",
        },
        "step-4": {
          storyText:
            "Signal #3: This one's encrypted! We intercepted: 1, 4, 9, 16, ... These are power-sequence numbers used in alien tech. What comes next?",
        },
        "step-5": {
          storyText:
            "Outstanding work, Cadet! All three alien signals decoded. Earth is safe thanks to your brilliant pattern analysis. You've earned your Signal Corps Medal!",
        },
      },
    },
    {
      projectId: "room-designer",
      name: "Space Station Builder",
      tagline: "Build your space station!",
      icon: "🛸",
      color: "#0E7490",
      stepOverrides: {
        "step-1": {
          storyText:
            "Welcome aboard, Engineer! I'm Commander Finn, and today we're building a new module for the space station! First, we need to master perimeter and area — essential skills for station construction in zero gravity. Let's begin!",
        },
        "step-2": {
          storyText:
            "Your module is a rectangle — 4 meters long and 3 meters wide. To install the safety seal around the edges, we need the perimeter. What is it?",
        },
        "step-3": {
          storyText:
            "Now let's install floor panels! Each panel covers 1m × 1m. Tap the grid to place panels and cover the entire module floor.",
        },
        "step-4": {
          storyText:
            "Time to add an L-shaped observation deck! The main module is 5m × 4m, and the deck adds 2m × 2m. What's the total perimeter of the new L-shaped station module?",
        },
        "step-5": {
          storyText:
            "The station module is complete! Incredible work, Engineer. You now know how to calculate perimeter and area — skills that real space engineers use every day!",
        },
      },
    },
    {
      projectId: "pizza-shop",
      name: "Fuel Station",
      tagline: "Manage the rocket fuel depot!",
      icon: "⛽",
      color: "#155E75",
      stepOverrides: {
        "step-1": {
          storyText:
            "Welcome to the Galactic Fuel Station! I'm Chief Engineer Marco, and today YOU are my fuel technician. We'll be measuring fuel portions, serving spacecraft, and doing some stellar fraction calculations. Ready for your shift?",
        },
        "step-2": {
          storyText:
            "First spacecraft! The pilot requests 3/8 of a fuel cell. Let's divide the cell into 8 portions and figure out the correct amount!",
        },
        "step-3": {
          storyText:
            "Two pilots are comparing fuel! Pilot A needs 1/4 of a tank, and Pilot B needs 2/4. Who needs more fuel?",
        },
        "step-4": {
          storyText:
            "Busy orbit! Pilot A used 2/6 of a plasma cell, then needed 1/6 more for a detour. How much plasma was used in total?",
        },
        "step-5": {
          storyText:
            "Last refueling of the shift! We have 5/8 of a fuel cell left. A cargo ship needs 2/8. How much fuel will remain?",
        },
        "step-6": {
          storyText:
            "What an incredible shift at the Fuel Station! Every spacecraft served perfectly. You've earned your Chief Technician's Badge! Safe travels, Cadet!",
        },
      },
    },
    {
      projectId: "temperature-controller",
      name: "Cryo Chamber",
      tagline: "Master space temperatures!",
      icon: "🧊",
      color: "#164E63",
      stepOverrides: {
        "step-1": {
          storyText:
            "Alert! I'm Commander Finn, and the station's Cryo Chamber is malfunctioning! We need to understand temperatures — including ones BELOW absolute reference — to fix it. Numbers below zero are called negative numbers. Let's learn!",
        },
        "step-2": {
          storyText:
            "The chamber sensor shows 5°C. A solar flare disrupts systems and temperature drops by 8 degrees! Use the sensor display to find the new temperature.",
        },
        "step-3": {
          storyText:
            "Two cryo pods: Pod A is at −3°C and Pod B is at −7°C. Which pod is WARMER?",
        },
        "step-4": {
          storyText:
            "Time to activate the thermal unit! The chamber is at −4°C. If we power up by 6 degrees, what will the temperature be? Use the sensor!",
        },
        "step-5": {
          storyText:
            "The Cryo Chamber is stabilized! You've mastered thermal physics and saved the station. The crew salutes you — true Space Engineer!",
        },
      },
    },
  ],
};
