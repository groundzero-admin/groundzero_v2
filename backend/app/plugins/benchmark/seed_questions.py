"""Seed script for benchmark diagnostic questions.

Run: python -m app.plugins.benchmark.seed_questions
Populates/updates bm_questions table with the 60 onboarding diagnostic questions
(20 per grade band) from the Ground Zero Signal Design & Skill Taxonomy v2.
"""

import asyncio
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_maker
from app.plugins.benchmark.models import BenchmarkQuestion

logger = logging.getLogger(__name__)


def get_grade_band(grade: int) -> str:
    if grade <= 5:
        return "4-5"
    elif grade <= 7:
        return "6-7"
    return "8-9"


QUESTIONS = [
    # ──────────────────────────────────────────────
    # Grade 4-5 (Ages 9-11)
    # ──────────────────────────────────────────────
    {
        "grade_band": "4-5",
        "question_number": 1,
        "text": "If you had to explain what multiplication really means — not how to calculate it, but what it is — to a 5-year-old, what would you say?",
        "curriculum_anchor": "Multiplication as repeated addition / grouping (Gr 3-4)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "Uses analogy ('5 groups of 3 apples')",
            "Distinguishes meaning from procedure",
            "Chooses age-appropriate language"
        ],
        "watchout_signals": [
            "Recites times tables",
            "Says 'it's like adding but faster' without explaining grouping concept"
        ],
    },
    {
        "grade_band": "4-5",
        "question_number": 2,
        "text": "Your friend says a pizza cut into 8 slices gives you more pizza than one cut into 4 slices — because 8 is bigger than 4. What would you say to them?",
        "curriculum_anchor": "Fraction comparison, part-whole reasoning (Gr 3-4)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "Explains it's the same pizza just cut differently — the slices are smaller",
            "Uses 'part of the whole' reasoning spontaneously",
            "May draw on real experience: 'cutting a roti into more pieces doesn't give you more roti'"
        ],
        "watchout_signals": [
            "Agrees with the friend — 8 is more so you get more",
            "Says the friend is wrong but can't explain why in a way the friend would understand"
        ],
        "visual_data": {
            "type": "fraction_compare",
            "left_slices": 4,
            "right_slices": 8,
            "left_label": "4 slices",
            "right_label": "8 slices",
        },
    },
    {
        "grade_band": "4-5",
        "question_number": 3,
        "text": "If you flip a coin 10 times and get tails every single time, what do you think is more likely on flip 11 — heads or tails? Why?",
        "curriculum_anchor": "Basic probability, independence (Gr 4)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "'Still 50/50 — the coin doesn't remember what happened'",
            "Articulates independence intuitively even without the term"
        ],
        "watchout_signals": [
            "'Heads, because it's overdue' (gambler's fallacy)"
        ],
        "visual_data": {
            "type": "sequence",
            "items": ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
            "label": "?",
        },
    },
    {
        "grade_band": "4-5",
        "question_number": 4,
        "text": "Give me 5 completely different ways to use a cardboard box that have nothing to do with storing things.",
        "curriculum_anchor": "Pure divergent thinking",
        "pillars": ["creativity"],
        "strong_signals": [
            "Ideas span very different categories (physical, imaginative, social)",
            "At least one idea is surprising",
            "Student doesn't stop at 5 when on a roll"
        ],
        "watchout_signals": [
            "All variations of the same idea (big box, small box, painted box)",
            "Stops at exactly 5 and goes quiet"
        ],
    },
    {
        "grade_band": "4-5",
        "question_number": 5,
        "text": "What's one rule at your school you think is unfair? How would you change it — and what could go wrong with your new rule?",
        "curriculum_anchor": "Social studies: rules and communities (Gr 3-5)",
        "pillars": ["communication", "ai_systems"],
        "strong_signals": [
            "Proposes alternative AND considers at least one unintended consequence of their own new rule",
            "Shows trade-off awareness"
        ],
        "watchout_signals": [
            "Only complains without a concrete alternative",
            "Proposes alternative with no awareness of potential downsides"
        ],
    },
    {
        "grade_band": "4-5",
        "question_number": 6,
        "text": "When you type something into Google, what do you think is actually happening? Walk me through it step by step.",
        "curriculum_anchor": "Basic computer literacy",
        "pillars": ["ai_systems", "math_logic"],
        "strong_signals": [
            "Mentions matching, sorting, ranking, or websites",
            "Shows input-process-output thinking even if technically imprecise"
        ],
        "watchout_signals": [
            "'It just finds it' — no model of what's happening inside the process"
        ],
    },
    {
        "grade_band": "4-5",
        "question_number": 7,
        "text": "You're building an alarm clock for a kid who hates waking up. Instead of a beeping sound, what else could it do to wake them up more gently?",
        "curriculum_anchor": "Product thinking, user empathy",
        "pillars": ["creativity", "ai_systems"],
        "strong_signals": [
            "Ideas span different senses (light, smell, vibration, temperature)",
            "Considers why the kid hates waking up and designs for that motivation"
        ],
        "watchout_signals": [
            "Single idea; slight variation on a beeping alarm (softer beep, music)",
            "No consideration of user psychology"
        ],
    },
    {
        "grade_band": "4-5",
        "question_number": 8,
        "text": "Every square is also a rectangle — but not every rectangle is a square. Does that sound right to you, or does it sound weird? Can you explain why?",
        "curriculum_anchor": "Geometry: classification of quadrilaterals (Gr 3-4)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "Explains that a square meets all rectangle rules (4 right angles, opposite sides equal) plus an extra rule (all sides equal)",
            "Uses a 'special case' or 'family' metaphor — 'it's like how all dogs are animals but not all animals are dogs'",
            "Shows classification reasoning"
        ],
        "watchout_signals": [
            "'They're different shapes' — treats names as exclusive categories without seeing the inclusion relationship",
            "'A square is more even' — correct intuition but no precise reasoning"
        ],
        "visual_data": {
            "type": "venn",
            "left_label": "Rectangles",
            "right_label": "",
            "overlap_label": "Squares",
        },
    },
    {
        "grade_band": "4-5",
        "question_number": 9,
        "text": "How would you explain what a 'fair' game means to someone who has never played a board game?",
        "curriculum_anchor": "Basic probability, social reasoning",
        "pillars": ["communication", "math_logic"],
        "strong_signals": [
            "'Everyone has an equal chance'",
            "'The rules are the same for all players'",
            "Distinguishes luck vs. skill as two types of fairness"
        ],
        "watchout_signals": [
            "'Everyone takes turns' — confuses procedural fairness with equal opportunity"
        ],
    },
    {
        "grade_band": "4-5",
        "question_number": 10,
        "text": "Think about your morning routine from waking up to arriving at school. If you could only skip ONE step, which step would cause the least problems? Which would cause the most?",
        "curriculum_anchor": "Sequencing and order (Gr 3-4)",
        "pillars": ["ai_systems", "math_logic"],
        "strong_signals": [
            "Identifies a dependency — e.g. 'I can't skip brushing teeth last because it needs to come after eating'",
            "Shows critical path reasoning in everyday context"
        ],
        "watchout_signals": [
            "Answers based on preference ('I don't like eating breakfast') without reasoning about systemic impact"
        ],
    },
    {
        "grade_band": "4-5",
        "question_number": 11,
        "text": "Tell me something true about ALL birds. Now tell me something true about MOST birds but not all. Now tell me something that's only true about SOME birds.",
        "curriculum_anchor": "Life sciences: animal classification (Gr 4-5)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "Successfully distinguishes all/most/some with correct examples (feathers = all; flies = most; swims = some)",
            "Shows understanding of nested categories and exceptions"
        ],
        "watchout_signals": [
            "Can't distinguish all vs most (e.g. puts 'flies' in the 'all' category)"
        ],
    },
    {
        "grade_band": "4-5",
        "question_number": 12,
        "text": "A robot is programmed: turn left if you see red, turn right if you see blue, stop if you see green. What happens if the robot sees yellow?",
        "curriculum_anchor": "Rule-based systems, edge cases",
        "pillars": ["ai_systems", "math_logic"],
        "strong_signals": [
            "'It doesn't know what to do — it might freeze, crash, or do something random'",
            "Shows edge case awareness",
            "Proposes how you'd fix the program"
        ],
        "watchout_signals": [
            "'It stops' (assumes a default that wasn't specified) — reveals assumption that systems have sensible defaults without instruction"
        ],
        "visual_data": {
            "type": "robot_rules",
            "rules": [
                {"condition": "Red", "action": "Turn left", "emoji": "\ud83d\udfe5", "color": "#E53E3E"},
                {"condition": "Blue", "action": "Turn right", "emoji": "\ud83d\udfe6", "color": "#3182CE"},
                {"condition": "Green", "action": "Stop", "emoji": "\ud83d\udfe9", "color": "#38A169"},
            ],
            "unknown": {"condition": "Yellow", "emoji": "\ud83d\udfe8"},
        },
    },
    {
        "grade_band": "4-5",
        "question_number": 13,
        "text": "Your best friend is upset about something but doesn't want to talk. You want to help. What are three completely different things you could try?",
        "curriculum_anchor": "Social-emotional learning, active listening",
        "pillars": ["communication", "creativity"],
        "strong_signals": [
            "Three genuinely different approaches spanning respecting silence, indirect support, and low-pressure presence",
            "Shows empathy and range"
        ],
        "watchout_signals": [
            "Three variations of 'keep asking them to talk' — single-strategy thinking applied repeatedly"
        ],
    },
    {
        "grade_band": "4-5",
        "question_number": 14,
        "text": "If you tell a secret to 2 friends, and each of them tells 2 more friends, and each of those tells 2 more — after just 10 rounds of telling, do you think more people or fewer than your whole school would know? Why?",
        "curriculum_anchor": "Exponential growth, doubling patterns (Gr 4)",
        "pillars": ["math_logic", "creativity"],
        "strong_signals": [
            "Recognizes the number grows very fast — 'it doubles each time so it gets huge quickly'",
            "Attempts to reason about the size even roughly ('after 10 rounds it's like a thousand? More?')",
            "Connects to real-world experience ('that's why gossip spreads so fast')"
        ],
        "watchout_signals": [
            "'About 20 people' — adds instead of multiplying, treats it as linear growth",
            "Can't engage with why the number grows fast — treats it as a fixed count"
        ],
        "visual_data": {
            "type": "exponential_tree",
            "branch_factor": 2,
            "levels": 5,
            "label": "Each tells {n} friends",
        },
    },
    {
        "grade_band": "4-5",
        "question_number": 15,
        "text": "If you could add ONE thing to your school to make it better — not just more fun, but actually better for students — what would it be and how would it work?",
        "curriculum_anchor": "Product thinking, systems reasoning",
        "pillars": ["ai_systems", "creativity"],
        "strong_signals": [
            "Identifies a specific real problem, proposes a mechanism (not just a wish), and considers who it would benefit",
            "Spots unintended effects"
        ],
        "watchout_signals": [
            "Generic ('more recess,' 'better food') without any mechanism for how it would work or why it solves a problem"
        ],
    },
    {
        "grade_band": "4-5",
        "question_number": 16,
        "text": "Every triangle has 3 straight sides. But what if I drew 3 curved lines that meet at 3 points — would you still call it a triangle? What makes something a 'real' triangle?",
        "curriculum_anchor": "Geometry: definitions and properties (Gr 3-5)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "Engages with the definition — 'a triangle needs straight sides, not just 3 sides'",
            "Reasons about what counts as a 'side' — shows definitional thinking",
            "May propose a name for the curved version ('a curvy triangle? a blob with 3 corners?')"
        ],
        "watchout_signals": [
            "'Yes it's still a triangle because it has 3 sides' — doesn't question what counts as a 'side'",
            "'No' but can't articulate what rule it breaks"
        ],
    },
    {
        "grade_band": "4-5",
        "question_number": 17,
        "text": "What's something you've always wondered about that no one has been able to explain to you yet?",
        "curriculum_anchor": "Pure curiosity probe",
        "pillars": ["creativity"],
        "strong_signals": [
            "Specific and personal question — one they've clearly thought about before",
            "Shows they've already tried to find an answer"
        ],
        "watchout_signals": [
            "'Nothing' or very generic/borrowed question ('what's the meaning of life')",
            "Suggests curiosity hasn't been cultivated or they're not comfortable revealing it yet"
        ],
    },
    {
        "grade_band": "4-5",
        "question_number": 18,
        "text": "Imagine you discover a new island with animals nobody has seen before. Invent one animal — what does it look like, what does it eat, and why did it end up that way?",
        "curriculum_anchor": "Life sciences: habitat and adaptation (Gr 4-5)",
        "pillars": ["creativity", "ai_systems"],
        "strong_signals": [
            "Internal consistency — environment, body shape, and diet form a coherent system",
            "Adaptation logic is present even if not labelled as such"
        ],
        "watchout_signals": [
            "Random assembly of features with no internal logic ('it has wings and eats rocks and glows') — creativity without systems thinking"
        ],
    },
    {
        "grade_band": "4-5",
        "question_number": 19,
        "text": "If you had a robot helper at home, what's the one thing you'd most want it to do? Now give it instructions so it doesn't make any mistakes.",
        "curriculum_anchor": "Instruction-giving, sequencing",
        "pillars": ["ai_systems", "communication"],
        "strong_signals": [
            "Instructions are step-by-step and specific",
            "Student anticipates at least one ambiguity ('but first check if there's enough water' / 'only do this when I'm home')",
            "Shows instruction precision awareness"
        ],
        "watchout_signals": [
            "Vague high-level description ('just do it nicely') with no awareness that robots need precise instructions"
        ],
    },
    {
        "grade_band": "4-5",
        "question_number": 20,
        "text": "Think of something you learned this year that surprised you — something that turned out to be different from what you expected. What was your original idea, and what changed it?",
        "curriculum_anchor": "Metacognition — any curriculum topic",
        "pillars": ["creativity", "communication"],
        "strong_signals": [
            "Genuine example with a specific before/after",
            "Can articulate what changed their thinking (new information, experience, argument from someone)",
            "Shows self-awareness of learning"
        ],
        "watchout_signals": [
            "'I can't think of anything' or a very vague answer — suggests low metacognitive awareness"
        ],
    },

    # ──────────────────────────────────────────────
    # Grade 6-7 (Ages 11-13)
    # ──────────────────────────────────────────────
    {
        "grade_band": "6-7",
        "question_number": 1,
        "text": "Your friend says you can't add halves and thirds together — because they're different kinds of pieces. How would you convince them that you actually can?",
        "curriculum_anchor": "Fraction addition, unlike denominators (Gr 5-6)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "Explains you need to cut both into the same size pieces first — 'make them sixths'",
            "Uses a concrete analogy: pizza slices, chocolate bars, measuring cups",
            "The explanation is genuinely clear enough for a younger student to follow"
        ],
        "watchout_signals": [
            "Lists the LCM procedure without explaining why it works — 'just find the common denominator'",
            "Can't explain the reasoning at all, only the steps"
        ],
    },
    {
        "grade_band": "6-7",
        "question_number": 2,
        "text": "One shop says 'Buy 2, get 1 free.' Another shop says '30% off everything.' You want to buy 3 of the same thing. Without calculating exactly — which deal feels better to you, and can you explain your thinking?",
        "curriculum_anchor": "Percentages, proportional reasoning (Gr 6)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "Recognizes 'buy 2 get 1 free' on 3 items is like 33% off, which beats 30%",
            "Thinks about what happens with different quantities — 'but if I only want 1 item, the 30% off is better'",
            "Shows proportional reasoning and deal comparison without needing a calculator"
        ],
        "watchout_signals": [
            "Picks one without any reasoning — 'the free one sounds better'",
            "Can't compare the deals even roughly — no proportional intuition"
        ],
        "visual_data": {
            "type": "sequence",
            "items": ["\ud83d\udce6", "\ud83d\udce6", "\ud83c\udf81 FREE"],
            "label": "vs 30% off",
        },
    },
    {
        "grade_band": "6-7",
        "question_number": 3,
        "text": "Think about a time when a small argument between two people ended up pulling in a whole group — in class, in your family, or in a story you know. Why do small disagreements sometimes blow up into big conflicts? What makes them spread?",
        "curriculum_anchor": "Social reasoning, cause and effect, conflict analysis",
        "pillars": ["communication", "math_logic"],
        "strong_signals": [
            "Identifies escalation mechanisms: loyalty and sides forming, miscommunication, pride",
            "Distinguishes the trigger from the underlying tensions — 'it was about the seat, but really about...'",
            "Shows multi-factor causal reasoning, not just 'they were angry'"
        ],
        "watchout_signals": [
            "Describes an event without analyzing why it escalated — narrates but doesn't reason",
            "Single-cause explanation: 'because people get angry' without exploring the structure"
        ],
    },
    {
        "grade_band": "6-7",
        "question_number": 4,
        "text": "Social media apps are designed to keep you scrolling. What do you think they might actually be doing to make that happen — beyond just 'making it fun'?",
        "curriculum_anchor": "Media literacy, technology use",
        "pillars": ["ai_systems", "math_logic"],
        "strong_signals": [
            "Identifies at least two mechanisms: variable reward (likes), infinite scroll (removes stopping cue), personalisation, notifications",
            "Shows feedback loop thinking"
        ],
        "watchout_signals": [
            "'They make it colourful / fun / easy to use' — describes surface experience without underlying system design intent"
        ],
    },
    {
        "grade_band": "6-7",
        "question_number": 5,
        "text": "Take an everyday problem at your school or home and design a solution using only what's already there — no new budget, no new tools.",
        "curriculum_anchor": "Constraint-based design",
        "pillars": ["creativity", "ai_systems"],
        "strong_signals": [
            "Names a specific, real problem",
            "Solution is genuinely feasible within the constraint",
            "Considers unintended effects or limitations of their own idea"
        ],
        "watchout_signals": [
            "Problem is vague ('school is boring') or solution ignores the constraint ('just buy new equipment')"
        ],
    },
    {
        "grade_band": "6-7",
        "question_number": 6,
        "text": "If 3 friends can finish a large pizza in 10 minutes, could 6 friends finish it in 5 minutes? What about 100 friends — could they finish it in a few seconds? At what point does adding more people stop helping, and why?",
        "curriculum_anchor": "Ratios, inverse proportionality, limits of scaling (Gr 6-7)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "Recognizes that doubling people roughly halves the time — proportional reasoning",
            "Identifies a limit: 'at some point there are more people than slices' or 'they'd be fighting over the last piece'",
            "Shows that proportional reasoning has real-world boundaries — not everything scales"
        ],
        "watchout_signals": [
            "Accepts the scaling without limit — '100 friends means almost instant'",
            "Can't reason about why the pattern breaks down"
        ],
    },
    {
        "grade_band": "6-7",
        "question_number": 7,
        "text": "Someone tells you: 'Kids who play more video games get worse grades.' How would you figure out if that's actually true — or if something else is going on?",
        "curriculum_anchor": "Statistics: correlation vs causation (Gr 6-7)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "Questions what data was used",
            "Proposes confounding variables (sleep, time management, family income)",
            "Distinguishes 'related' from 'causes'"
        ],
        "watchout_signals": [
            "Takes the claim at face value or rejects it based on personal experience only — no methodological questioning"
        ],
    },
    {
        "grade_band": "6-7",
        "question_number": 8,
        "text": "You have a bag of 10 candies — 7 are mango flavor and 3 are lemon. You pick one without looking and it's lemon. You eat it and pick again. Are you now more likely or less likely to get mango than before? Why?",
        "curriculum_anchor": "Conditional probability basics (Gr 6-7)",
        "pillars": ["math_logic"],
        "strong_signals": [
            "More likely — 'there are now 7 mango out of 9 left, before it was 7 out of 10'",
            "Explains that removing a lemon changes the mix in favor of mango",
            "Spontaneously notes this is different from coin flips where each time is independent"
        ],
        "watchout_signals": [
            "'Same chance' — ignores that the total changed",
            "'Less likely because I already got a bad one' — emotional reasoning replacing probabilistic"
        ],
        "visual_data": {
            "type": "probability_bag",
            "items": [
                {"label": "Mango", "count": 7, "color": "#F6AD55"},
                {"label": "Lemon", "count": 3, "color": "#68D391"},
            ],
        },
    },
    {
        "grade_band": "6-7",
        "question_number": 9,
        "text": "What do you think happens to an ecosystem if you remove all its predators? Think through the chain of effects step by step.",
        "curriculum_anchor": "Biology: food chains, ecosystems (Gr 6-7)",
        "pillars": ["ai_systems", "math_logic"],
        "strong_signals": [
            "Traces the cascade: prey explodes -> overgrazes -> vegetation depletes -> prey population eventually crashes",
            "Shows multi-step consequence thinking and identifies a feedback loop"
        ],
        "watchout_signals": [
            "'Prey animals would be happy' — stops at the first-order effect without tracing downstream consequences"
        ],
    },
    {
        "grade_band": "6-7",
        "question_number": 10,
        "text": "How would you explain the difference between a 'hypothesis' and a 'guess' to someone who thinks they're the same thing?",
        "curriculum_anchor": "Scientific method (Gr 6)",
        "pillars": ["communication", "math_logic"],
        "strong_signals": [
            "'A hypothesis is based on what you already know — it's a specific, testable prediction, not random'",
            "Distinguishes informed from arbitrary and testable from untestable"
        ],
        "watchout_signals": [
            "'It's like a guess but more serious' — correct intuition but no specification of what makes it different in practice"
        ],
    },
    {
        "grade_band": "6-7",
        "question_number": 11,
        "text": "I'm thinking of a mystery number. If I double it and add 3, I get 11. What's my number? Now — make up your own mystery number puzzle for me to solve.",
        "curriculum_anchor": "Introduction to algebra, equations (Gr 6)",
        "pillars": ["math_logic", "creativity"],
        "strong_signals": [
            "Solves correctly (4) by working backwards: 11 minus 3 is 8, 8 divided by 2 is 4",
            "Creates their own puzzle that's solvable and uses at least two operations",
            "Shows understanding of equations as puzzles — not just procedures to memorize"
        ],
        "watchout_signals": [
            "Guesses randomly without a strategy for working backwards",
            "Can solve but can't construct their own — understands procedure but not structure",
            "Creates a trivially easy puzzle ('my number plus 1 is 3')"
        ],
        "visual_data": {
            "type": "equation_puzzle",
            "parts": [
                {"text": "2 \u00d7"},
                {"text": "?", "mystery": True},
                {"text": "+ 3"},
                {"text": "="},
                {"text": "11"},
            ],
        },
    },
    {
        "grade_band": "6-7",
        "question_number": 12,
        "text": "Pick any system you use every day — like your school timetable, the way a library organises books, or how apps are arranged on your phone. What's one thing about its design that frustrates you? How would you redesign it?",
        "curriculum_anchor": "Systems design, information architecture",
        "pillars": ["creativity", "ai_systems"],
        "strong_signals": [
            "Identifies a specific frustration, not just 'it's annoying'",
            "Proposes a redesign that addresses the root cause, not just the symptom",
            "Considers who else uses the system and how the change affects them"
        ],
        "watchout_signals": [
            "'Make it more colourful' or 'make it an app' — addresses aesthetics without engaging with the underlying structure",
            "Can't articulate what specifically is wrong — vague complaint without diagnosis"
        ],
    },
    {
        "grade_band": "6-7",
        "question_number": 13,
        "text": "An AI is trained to predict which students are likely to fail exams. What information should it use? What should it definitely not use — and why does that matter?",
        "curriculum_anchor": "Data ethics, social fairness",
        "pillars": ["ai_systems", "communication"],
        "strong_signals": [
            "Distinguishes academic signals (past grades, attendance) from protected or biasing characteristics (family income, neighbourhood, race)",
            "Articulates why biased inputs create unfair outputs — even if they're 'predictive'"
        ],
        "watchout_signals": [
            "'Just use their grades' — correct but incomplete",
            "Misses the fairness dimension entirely"
        ],
    },
    {
        "grade_band": "6-7",
        "question_number": 14,
        "text": "Pick any historical figure you've studied. What's the one thing they'd be most confused by if they saw the world today — and what would you tell them?",
        "curriculum_anchor": "History curriculum (any)",
        "pillars": ["communication", "creativity"],
        "strong_signals": [
            "Specific, insightful choice that reveals genuine understanding of both the historical figure's worldview and the present",
            "The explanation to the figure is calibrated to their context, not our vocabulary"
        ],
        "watchout_signals": [
            "'They'd be amazed by phones / the internet' — surface-level observation requiring no understanding of the historical figure's specific perspective"
        ],
    },
    {
        "grade_band": "6-7",
        "question_number": 15,
        "text": "If you doubled the radius of a pizza — made it twice as wide — would you get exactly double the amount of pizza, more than double, or less than double? What's your gut feeling, and can you convince me?",
        "curriculum_anchor": "Area scaling, circle area intuition (Gr 6-7)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "More than double — 'because it grows in all directions, not just one'",
            "Intuition about area growing faster than length, even without knowing the formula",
            "May reason: 'if I double the side of a square, I get 4 times the area, so it must be like that for circles too'"
        ],
        "watchout_signals": [
            "'Exactly double — double the size means double the pizza' — linear thinking about area",
            "Correct answer but no reasoning — 'I think more but I don't know why'"
        ],
        "visual_data": {
            "type": "scaling",
            "label1": "Radius r",
            "label2": "Radius 2r",
        },
    },
    {
        "grade_band": "6-7",
        "question_number": 16,
        "text": "Think about how a rumour spreads through a school. How is that similar to — and different from — how a virus spreads?",
        "curriculum_anchor": "Biology: contagion + social dynamics",
        "pillars": ["ai_systems", "creativity"],
        "strong_signals": [
            "Identifies structural similarities (exponential spread, contact-based, isolation slows it)",
            "AND meaningful differences (rumour mutates/changes content; some people choose not to share; facts can 'cure' a rumour)",
            "Shows structural analogy reasoning"
        ],
        "watchout_signals": [
            "'They both spread fast' — notices similarity without any depth of structural comparison"
        ],
        "visual_data": {
            "type": "exponential_tree",
            "branch_factor": 3,
            "levels": 4,
            "label": "Each tells {n} people",
        },
    },
    {
        "grade_band": "6-7",
        "question_number": 17,
        "text": "You're designing a fair grading system for a class. What rules would you set — and what could someone do to game your system?",
        "curriculum_anchor": "Systems design, fairness",
        "pillars": ["ai_systems", "math_logic"],
        "strong_signals": [
            "Considers multiple inputs, consistency across students, an appeals process",
            "Identifies at least one way a student could exploit their own rules — shows adversarial systems thinking"
        ],
        "watchout_signals": [
            "Simple point system with no awareness of edge cases, exceptions, or gaming potential"
        ],
    },
    {
        "grade_band": "6-7",
        "question_number": 18,
        "text": "What's a question you have about the world that you think might not have an answer yet?",
        "curriculum_anchor": "Frontier curiosity probe",
        "pillars": ["creativity"],
        "strong_signals": [
            "Specific, personal, genuinely open question",
            "Shows awareness that knowledge has current limits — that some questions are unanswered, not just unknown to them"
        ],
        "watchout_signals": [
            "'What's the meaning of life' — borrowed existential question without personal ownership",
            "'I don't know' — suggests curiosity hasn't been encouraged"
        ],
    },
    {
        "grade_band": "6-7",
        "question_number": 19,
        "text": "You're building a personal AI assistant for yourself. What are the THREE most important things it should know about you? What should it never do?",
        "curriculum_anchor": "Product thinking + self-awareness",
        "pillars": ["ai_systems", "creativity"],
        "strong_signals": [
            "Specific and personal 'know' items (not generic: 'my schedule,' 'when I'm tired,' 'my actual interests not just my age')",
            "Constraints are principled, not just rules ('never pretend to be a person')",
            "Shows product thinking + self-knowledge"
        ],
        "watchout_signals": [
            "Generic items ('my name, my age, my school')",
            "No meaningful constraints proposed — limited product intuition"
        ],
    },
    {
        "grade_band": "6-7",
        "question_number": 20,
        "text": "Think of a concept from any subject that you understand much better now than you did a year ago. What changed your understanding?",
        "curriculum_anchor": "Metacognition — any subject",
        "pillars": ["creativity", "communication"],
        "strong_signals": [
            "Names a specific concept",
            "Can articulate the specific moment, experience, or explanation that changed it",
            "Distinguishes 'I now know more facts' from 'I now understand the underlying idea'"
        ],
        "watchout_signals": [
            "Vague or can't identify a specific change — suggests low metacognitive awareness or low engagement with learning as a process"
        ],
    },

    # ──────────────────────────────────────────────
    # Grade 8-9 (Ages 13-15, IGCSE / IB Prep)
    # ──────────────────────────────────────────────
    {
        "grade_band": "8-9",
        "question_number": 1,
        "text": "A school tells parents that their 'average student score' is 85%. But when you talk to students, half of them scored below 60%. How is that possible — and what would be a more honest way to describe the scores?",
        "curriculum_anchor": "Statistics: mean vs median, misleading averages (Gr 7-8)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "A few very high scorers pull the mean up — 'if 5 students scored 100% and 5 scored 50%, the average is 75% but half are below'",
            "Suggests median or range as a better summary",
            "Shows understanding that a single number can misrepresent a distribution"
        ],
        "watchout_signals": [
            "'That's impossible' or 'the school must be lying' — can't see how a mean can be correct but misleading",
            "Defines mean correctly but can't explain how it hides information"
        ],
    },
    {
        "grade_band": "8-9",
        "question_number": 2,
        "text": "Compound interest means savings grow faster over time. Can you explain why mechanically that happens — not just that it does?",
        "curriculum_anchor": "Percentage / exponential growth (Gr 8)",
        "pillars": ["math_logic", "ai_systems"],
        "strong_signals": [
            "'The interest you earn in year 1 gets added to the total, so in year 2 you earn interest on a bigger number — the interest earns interest'",
            "Shows the recursive / feedback loop mechanism, not just the outcome"
        ],
        "watchout_signals": [
            "'You get more money each year' — describes the outcome without explaining the mechanism",
            "No distinction from simple interest made"
        ],
    },
    {
        "grade_band": "8-9",
        "question_number": 3,
        "text": "People can agree that climate change is real but still strongly disagree on what to do about it. Why do you think that happens?",
        "curriculum_anchor": "Geography: climate change; PSHE debate (Gr 8-9)",
        "pillars": ["communication", "ai_systems"],
        "strong_signals": [
            "Identifies values trade-offs (economy vs. environment), different timescales, who bears the cost, political interests",
            "Separates factual from normative disagreement — 'they agree on what's true but disagree on what matters most'"
        ],
        "watchout_signals": [
            "'Some people are greedy / don't care' — moralistic explanation that avoids engaging with the genuine complexity of values trade-offs"
        ],
    },
    {
        "grade_band": "8-9",
        "question_number": 4,
        "text": "When you cut a square piece of paper diagonally, the cut is longer than the side of the square. Is it always longer? Is it a little bit longer or a lot longer? And does the relationship change depending on how big the square is?",
        "curriculum_anchor": "Pythagoras theorem, geometric intuition (Gr 8)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "'Always longer — the diagonal goes corner to corner, which is farther than straight across'",
            "Recognizes the ratio is constant regardless of size — 'whether the square is tiny or huge, it's always the same proportion more'",
            "May reference Pythagoras or estimate 'about 1.4 times the side'"
        ],
        "watchout_signals": [
            "'It depends on the size of the square' — doesn't see the constant ratio",
            "'A little longer' without reasoning — pure guess, no geometric thinking"
        ],
    },
    {
        "grade_band": "8-9",
        "question_number": 5,
        "text": "Photosynthesis takes CO₂ and sunlight to make glucose and oxygen. But why does the plant bother? Walk through the whole system from the plant's perspective.",
        "curriculum_anchor": "Biology: photosynthesis (Gr 7-8)",
        "pillars": ["ai_systems", "math_logic"],
        "strong_signals": [
            "'The plant needs glucose for energy and growth — oxygen is a byproduct, not the goal'",
            "Frames the process from the organism's purpose, not just as a reaction equation",
            "Shows teleological systems reasoning"
        ],
        "watchout_signals": [
            "Recites the equation without any purpose-reasoning — 'it takes in CO₂ and gives out O₂'",
            "Treats it as chemistry, not biology"
        ],
    },
    {
        "grade_band": "8-9",
        "question_number": 6,
        "text": "Someone claims: 'All prime numbers are odd.' Is that true? If not, find the counterexample and explain why it exists.",
        "curriculum_anchor": "Number theory: primes (Gr 7-8)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "'2 is prime and even. Every other even number is divisible by 2 so can't be prime. 2 is the only even prime — it's special'",
            "Shows both the counterexample AND the structural reason why no other exception exists"
        ],
        "watchout_signals": [
            "Finds 2 but can't explain why no other even primes exist — treats it as a memorised exception rather than a logical consequence"
        ],
        "visual_data": {
            "type": "sequence",
            "items": ["2", "3", "5", "7", "11", "13"],
            "label": "Primes",
        },
    },
    {
        "grade_band": "8-9",
        "question_number": 7,
        "text": "Take a concept from maths or science you actually find confusing. Design a physical game or activity that would help a younger student understand that specific thing.",
        "curriculum_anchor": "Any Gr 8-9 curriculum topic",
        "pillars": ["creativity", "ai_systems"],
        "strong_signals": [
            "Names the specific point of confusion (not just the topic)",
            "The game mechanics map to the concept's actual logic",
            "Would genuinely teach the thing, not just make it fun"
        ],
        "watchout_signals": [
            "Generic game (quiz, flashcards) that doesn't target the specific conceptual difficulty",
            "Can't identify what exactly they find confusing — low metacognitive awareness"
        ],
    },
    {
        "grade_band": "8-9",
        "question_number": 8,
        "text": "Poverty tends to persist across generations. Walk through two or three specific mechanisms you think explain why that is.",
        "curriculum_anchor": "Geography/Social studies: development, inequality (Gr 8-9)",
        "pillars": ["ai_systems", "math_logic"],
        "strong_signals": [
            "Identifies self-reinforcing loops (nutrition -> cognitive development -> earnings -> nutrition)",
            "Uses feedback loop language even without the term",
            "Identifies at least two independent mechanisms"
        ],
        "watchout_signals": [
            "'It's hard to escape' — correct conclusion but no mechanism",
            "Single mechanism repeated in different words"
        ],
    },
    {
        "grade_band": "8-9",
        "question_number": 9,
        "text": "Imagine 'negative' means 'reverse the direction.' If you're walking forward and someone says 'reverse,' you walk backward. If they say 'reverse' again, you're walking forward. Does this help explain why negative times negative equals positive? Can you come up with a better example from your own life?",
        "curriculum_anchor": "Directed numbers, signed arithmetic (Gr 7-8)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "Engages with the metaphor — 'yes, reversing a reversal brings you back'",
            "Creates their own analogy: rewinding a rewind, undoing an undo, flipping a flipped image",
            "Shows they understand the logical structure, not just the rule"
        ],
        "watchout_signals": [
            "'That's just the rule' or 'that's what they taught us' — accepted without understanding",
            "Can follow the metaphor but can't create their own — passive understanding"
        ],
    },
    {
        "grade_band": "8-9",
        "question_number": 10,
        "text": "You're told an AI scored higher than all humans on an empathy test. Your friend says: 'Wow, AI is more empathetic than us!' What would you say back?",
        "curriculum_anchor": "AI literacy, critical thinking",
        "pillars": ["ai_systems", "communication"],
        "strong_signals": [
            "Questions what the test actually measures",
            "Distinguishes test performance from actual empathy",
            "Raises whether AI can feel vs. simulate empathetic responses",
            "Shows epistemological sophistication — 'the test is measuring something, but is that something empathy?'"
        ],
        "watchout_signals": [
            "'That's amazing' (accepts uncritically) or 'AI can't have feelings' (correct conclusion, no argument) — both fail to engage with the measurement problem"
        ],
    },
    {
        "grade_band": "8-9",
        "question_number": 11,
        "text": "Explain what a 'placebo' is and why scientists actually need them — to someone who thinks giving fake medicine to sick people is obviously wrong.",
        "curriculum_anchor": "Scientific method: controlled experiments, medicine (Gr 8-9)",
        "pillars": ["communication", "math_logic"],
        "strong_signals": [
            "Explains the psychological effect on symptoms (belief changes biology)",
            "Explains why you need a control group to isolate the drug's effect",
            "Addresses the ethical concern directly"
        ],
        "watchout_signals": [
            "'It tricks people' — correct at one level but misses the experimental design logic that makes it scientifically necessary"
        ],
    },
    {
        "grade_band": "8-9",
        "question_number": 12,
        "text": "What's a connection between two subjects you study that no teacher has ever explicitly pointed out to you?",
        "curriculum_anchor": "Cross-disciplinary reasoning",
        "pillars": ["creativity", "math_logic"],
        "strong_signals": [
            "Specific and genuinely novel — not 'maths is used in physics'",
            "A student who connects evolutionary game theory to economics, or narrative arc structure to chemical reaction pathways, is demonstrating rare pattern recognition across domains"
        ],
        "watchout_signals": [
            "Obvious connection ('science uses maths,' 'history and English both have writing') — surface-level cross-subject awareness without genuine structural insight"
        ],
    },
    {
        "grade_band": "8-9",
        "question_number": 13,
        "text": "Your body keeps its temperature at ~37°C even when it's 5°C or 40°C outside. What mechanisms do you think are involved? How is this similar to how a thermostat works?",
        "curriculum_anchor": "Biology: homeostasis (Gr 8-9)",
        "pillars": ["ai_systems", "math_logic"],
        "strong_signals": [
            "Names mechanisms (sweating, shivering, vasoconstriction, hypothalamus)",
            "Draws thermostat analogy as sensor -> comparator -> effector feedback loop",
            "Shows that both are negative feedback systems maintaining equilibrium"
        ],
        "watchout_signals": [
            "'Your body adjusts' or 'you feel hot or cold' — describes the experience without the regulatory mechanism"
        ],
    },
    {
        "grade_band": "8-9",
        "question_number": 14,
        "text": "If you keep adding 9s after the decimal — 0.9, 0.99, 0.999, 0.9999 and so on forever — does this number ever actually become 1? Or is there always a tiny gap? What would you say to someone who disagrees with you?",
        "curriculum_anchor": "Limits, infinity, number theory (Gr 8-9)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "Engages seriously: either argues 'the gap gets infinitely small so it IS 1' or 'there's always a gap'",
            "If yes: can reason with 1/3 = 0.333..., so 3 times 1/3 = 0.999... = 1",
            "If no: articulates a coherent intuition about infinite processes — still valuable",
            "Quality of argument matters more than the answer"
        ],
        "watchout_signals": [
            "'Obviously yes' or 'obviously no' with no reasoning — doesn't engage with why it's a genuinely puzzling question",
            "No attempt to argue or convince — just states an opinion"
        ],
        "visual_data": {
            "type": "sequence",
            "items": ["0.9", "0.99", "0.999", "0.9999", "\u2026"],
            "label": "1?",
        },
    },
    {
        "grade_band": "8-9",
        "question_number": 15,
        "text": "Pick a law or rule — anywhere in the world — that you think is unjust. Make the strongest case for changing it. Then make the strongest case for keeping it.",
        "curriculum_anchor": "Social studies / Civics (Gr 8-9)",
        "pillars": ["communication", "creativity"],
        "strong_signals": [
            "Argues both sides with genuine effort",
            "The 'keeping it' argument is not a strawman — student engages seriously with the other view",
            "Shows intellectual honesty and the ability to hold two positions simultaneously"
        ],
        "watchout_signals": [
            "One-sided: either can only argue their own view, or constructs a weak opposing argument designed to be easily defeated"
        ],
    },
    {
        "grade_band": "8-9",
        "question_number": 16,
        "text": "Explain 'inflation' through an analogy or story that would make a 10-year-old genuinely understand it — not just memorise a definition.",
        "curriculum_anchor": "Economics: inflation (Gr 8-9)",
        "pillars": ["communication", "creativity"],
        "strong_signals": [
            "Creates an analogy that captures the mechanism (more money chasing same goods) — not just the outcome (things cost more)",
            "The analogy is creative and age-appropriate",
            "Distinguishes inflation from 'things being expensive'"
        ],
        "watchout_signals": [
            "Uses economic jargon ('purchasing power decreases') without simplification",
            "Gives an analogy that captures the outcome but not the mechanism"
        ],
    },
    {
        "grade_band": "8-9",
        "question_number": 17,
        "text": "Large language models like ChatGPT are trained on massive amounts of text. What are two things this makes them genuinely good at — and two things it makes them fundamentally bad at?",
        "curriculum_anchor": "AI/Computer science literacy",
        "pillars": ["ai_systems", "math_logic"],
        "strong_signals": [
            "Good at: pattern-matching, fluency, summarising, stylistic variation",
            "Bad at: factual accuracy for specific recent events, reasoning from first principles, knowing what they don't know",
            "The bad-at list is more diagnostic — vague answers here reveal limited AI understanding"
        ],
        "watchout_signals": [
            "'They know everything' (overestimates) or 'they just copy text' (underestimates) — both reveal a non-model of how LLMs actually work"
        ],
    },
    {
        "grade_band": "8-9",
        "question_number": 18,
        "text": "A city uses AI to predict which neighbourhoods need more police presence. Walk through all the ways this could go wrong — even if the AI's predictions are accurate.",
        "curriculum_anchor": "Social studies, data ethics, AI literacy",
        "pillars": ["ai_systems", "communication"],
        "strong_signals": [
            "Historical data reflects historical bias (self-fulfilling loop)",
            "Surveillance chilling effect, community trust breakdown",
            "Definition of 'crime' is socially constructed",
            "Feedback loop from increased policing -> more arrests -> more data confirming the prediction"
        ],
        "watchout_signals": [
            "'The AI might make mistakes' — accurate but misses the deeper structural problem that accurate predictions can still produce unjust outcomes"
        ],
    },
    {
        "grade_band": "8-9",
        "question_number": 19,
        "text": "If a billionaire moved to a small village of 100 families, the village's 'average income' would skyrocket — even though nobody else got richer. What does this tell you about how averages can be misleading? When would you trust an average, and when wouldn't you?",
        "curriculum_anchor": "Statistics: mean, outliers, distribution (Gr 8)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "Explains the billionaire's income pulls the mean away from everyone else's reality",
            "Proposes median or removing outliers as alternatives",
            "Gives criteria for when mean is useful ('when the data is spread evenly') vs misleading ('when there are extremes')",
            "Shows applied statistical judgment, not just definitions"
        ],
        "watchout_signals": [
            "'Averages are always misleading' — overcorrects without nuance",
            "Can explain the problem but can't propose when averages would work — black-and-white thinking"
        ],
        "visual_data": {
            "type": "sequence",
            "items": ["\u20b930K", "\u20b930K", "\u20b930K", "\u2026", "\u20b910Cr"],
            "label": "Avg?",
        },
    },
    {
        "grade_band": "8-9",
        "question_number": 20,
        "text": "What's a belief you held confidently a year or two ago that you've since completely changed? What changed it — and how do you now think about trusting your own beliefs?",
        "curriculum_anchor": "Metacognition, epistemology",
        "pillars": ["creativity", "communication"],
        "strong_signals": [
            "Genuine, personal example",
            "Can articulate the mechanism of change (new evidence, different perspective, lived experience)",
            "Shows epistemic humility — 'if I was wrong about that, how do I know what else I might be wrong about?'"
        ],
        "watchout_signals": [
            "'I used to like X food and now I don't' — trivial, avoids genuine epistemic reflection",
            "'I haven't really changed my mind on anything important' — low self-awareness or reluctance to be vulnerable"
        ],
    },
]


async def seed_questions(db: AsyncSession) -> int:
    """Insert or update all diagnostic questions. Returns count of upserted rows."""
    count = 0
    for q in QUESTIONS:
        result = await db.execute(
            select(BenchmarkQuestion).where(
                BenchmarkQuestion.grade_band == q["grade_band"],
                BenchmarkQuestion.question_number == q["question_number"],
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            existing.text = q["text"]
            existing.curriculum_anchor = q.get("curriculum_anchor")
            existing.pillars = q["pillars"]
            existing.strong_signals = q["strong_signals"]
            existing.watchout_signals = q["watchout_signals"]
            existing.visual_data = q.get("visual_data")
            existing.is_active = True
        else:
            db.add(BenchmarkQuestion(
                grade_band=q["grade_band"],
                question_number=q["question_number"],
                text=q["text"],
                curriculum_anchor=q.get("curriculum_anchor"),
                pillars=q["pillars"],
                strong_signals=q["strong_signals"],
                watchout_signals=q["watchout_signals"],
                visual_data=q.get("visual_data"),
            ))
        count += 1

    await db.commit()
    return count


async def _main():
    import app.models  # noqa: F401 - ensure all models are registered
    from app.database import async_session_maker
    async with async_session_maker() as db:
        n = await seed_questions(db)
        print(f"Seeded {n} questions")


if __name__ == "__main__":
    asyncio.run(_main())
