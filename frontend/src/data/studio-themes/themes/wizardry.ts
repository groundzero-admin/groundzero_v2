import type { StudioTheme } from "../types";

export const wizardryTheme: StudioTheme = {
  id: "wizardry",
  name: "Wizardry",
  description: "Enter the magical academy of mathematics",
  icon: "🧙",
  previewGradient: "linear-gradient(135deg, #2D1B69, #5B21B6, #7C3AED)",
  labels: {
    xpName: "Wizard Points",
    xpIcon: "🪄",
    stepNoun: "Spell",
    projectNoun: "Quest",
    completionTitle: "Quest Complete!",
    galleryTitle: "Wizard Academy",
    gallerySubtitle: "Cast spells of math wisdom and earn your wizard rank!",
  },
  visuals: {
    pageBackground: "linear-gradient(180deg, #1a0a3e 0%, #2D1B69 30%, #1a0a3e 100%)",
    cardBackground: "rgba(45, 27, 105, 0.4)",
    cardBorderColor: "rgba(139, 92, 246, 0.3)",
    accentColor: "#A78BFA",
    accentHoverColor: "#C4B5FD",
    surfaceTint: "rgba(139, 92, 246, 0.06)",
    xpToastColor: "#A78BFA",
  },
  characterOverrides: {
    addAccessories: ["wizard-hat", "wand"],
    removeAccessories: [],
    outfitColor: "#5B21B6",
  },
  presetOverrides: {
    chef: {
      addAccessories: ["wizard-hat", "wand"],
      removeAccessories: ["chef-hat"],
      outfitColor: "#5B21B6",
    },
    detective: {
      addAccessories: ["wizard-hat", "wand"],
      removeAccessories: ["magnifying-glass"],
      outfitColor: "#4C1D95",
    },
    spy: {
      addAccessories: ["wizard-hat", "wand"],
      removeAccessories: ["sunglasses", "antenna"],
      outfitColor: "#3B0764",
    },
    explorer: {
      addAccessories: ["wizard-hat", "wand"],
      removeAccessories: ["scarf"],
      outfitColor: "#6D28D9",
    },
  },
  projectOverrides: [
    {
      projectId: "pattern-detective",
      name: "Spell Decoder",
      tagline: "Decode ancient spell patterns!",
      icon: "📜",
      color: "#8B5CF6",
      stepOverrides: {
        "step-1": {
          storyText:
            "Welcome, young apprentice! I am Wizard Amara, and dark magic has scrambled the ancient spell scrolls! Someone has enchanted the number sequences on our spell book pages. I need your keen magical sense to decode them. Ready to begin your training?",
        },
        "step-2": {
          storyText:
            "Scroll #1: The enchanted sequence reads: 2, 4, 6, 8, ... This spell follows a magical pattern. What rune comes next to complete it?",
        },
        "step-3": {
          storyText:
            "Scroll #2: A shape incantation was found in the library! Circle, Triangle, Circle, Triangle, Circle, ... What shape rune completes this charm?",
        },
        "step-4": {
          storyText:
            "Scroll #3: The Grand Wizard's cipher! We found: 1, 4, 9, 16, ... These are the Square Power numbers used in advanced spells. What comes next?",
        },
        "step-5": {
          storyText:
            "Magnificent spellwork, apprentice! All three scrolls are decoded and the spell book is restored. The Academy honors you with the Decoder's Crystal!",
        },
      },
    },
    {
      projectId: "room-designer",
      name: "Enchanted Chamber",
      tagline: "Design your wizard chamber!",
      icon: "🏰",
      color: "#7C3AED",
      stepOverrides: {
        "step-1": {
          storyText:
            "Welcome to the Wizard Academy! I'm Wizard Finn, and today you'll design your very own Enchanted Chamber! But first, every wizard must learn the ancient arts of perimeter and area — the foundation of all spatial magic. Let's begin!",
        },
        "step-2": {
          storyText:
            "Your enchanted chamber is a rectangle — 4 wand-lengths long and 3 wand-lengths wide. To cast a Protection Barrier around it, we need the perimeter. What is it?",
        },
        "step-3": {
          storyText:
            "Now let's enchant the floor with magic tiles! Each tile is 1×1 wand-length. Tap the grid to place magic tiles and cover the entire chamber floor.",
        },
        "step-4": {
          storyText:
            "Time for an L-shaped reading alcove for spell books! The main chamber is 5×4, and the alcove adds a 2×2 extension. What's the total perimeter of your new L-shaped chamber?",
        },
        "step-5": {
          storyText:
            "Your Enchanted Chamber is complete! Wonderful work, wizard architect. You've mastered the spatial magic of perimeter and area — skills every great wizard needs!",
        },
      },
    },
    {
      projectId: "pizza-shop",
      name: "Potion Lab",
      tagline: "Brew magical potions!",
      icon: "🧪",
      color: "#6D28D9",
      stepOverrides: {
        "step-1": {
          storyText:
            "Welcome to the Academy Potion Lab! I'm Potion Master Alaric, and today YOU are my apprentice. We'll be mixing ingredients, measuring portions, and doing some enchanting fraction magic. Ready to start your potion shift?",
        },
        "step-2": {
          storyText:
            "First recipe! The Levitation Elixir needs 3/8 of a moonstone crystal. Let's divide the crystal into 8 pieces and figure out the right portion!",
        },
        "step-3": {
          storyText:
            "Two apprentices are arguing! Apprentice A needs 1/4 of a dragon scale, and Apprentice B needs 2/4. Who needs more dragon scale?",
        },
        "step-4": {
          storyText:
            "Busy day in the lab! Apprentice A used 2/6 of a fairy dust vial, then needed 1/6 more for another potion. How much fairy dust was used in total?",
        },
        "step-5": {
          storyText:
            "Last potion of the day! We have 5/8 of a phoenix feather essence left. A recipe needs 2/8. How much will remain after brewing?",
        },
        "step-6": {
          storyText:
            "What an incredible day at the Potion Lab! Every potion brewed perfectly. You've earned your Potion Master's Badge! The Academy is proud of you!",
        },
      },
    },
    {
      projectId: "temperature-controller",
      name: "Freezing Charm",
      tagline: "Master temperature magic!",
      icon: "❄️",
      color: "#4C1D95",
      stepOverrides: {
        "step-1": {
          storyText:
            "Brrr! I'm Wizard Finn, and the Ice Tower's enchantments are failing! We must understand magical temperatures — including those BELOW the Frost Line (zero) — to restore them. Numbers below zero are called negative numbers. Let's learn this spell!",
        },
        "step-2": {
          storyText:
            "The tower's crystal thermometer shows 5°M (magical degrees). A blizzard hex hits and drops it by 8 degrees! Use the crystal thermometer to find the new temperature.",
        },
        "step-3": {
          storyText:
            "Two chambers in the tower: Chamber A is at −3°M and Chamber B is at −7°M. Which chamber is WARMER?",
        },
        "step-4": {
          storyText:
            "Time to cast the Warming Charm! The tower is at −4°M. If we channel 6 degrees of heat magic, what will the temperature be? Use the crystal thermometer!",
        },
        "step-5": {
          storyText:
            "The Ice Tower is warm again! You've mastered the Frost Magic of negative numbers. The entire Academy celebrates your triumph! You're a true Temperature Wizard!",
        },
      },
    },
  ],
};
