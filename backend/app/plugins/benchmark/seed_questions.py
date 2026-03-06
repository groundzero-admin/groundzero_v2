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
        "text": "Your friend says 3/8 is bigger than 1/2 because 3 is bigger than 1. How would you convince them they're wrong?",
        "curriculum_anchor": "Fraction comparison (Gr 3-4)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "Uses 'of the whole' language, draws picture, converts to common denominator, or uses pizza/pie analogy",
            "Addresses why the friend is wrong, not just that they are"
        ],
        "watchout_signals": [
            "'You're just wrong' or restates the correct answer without an explanation the friend could follow"
        ],
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
        "text": "A square and a rectangle both have 4 right angles. But we say they're different shapes. Why?",
        "curriculum_anchor": "Geometry definitions: properties of quadrilaterals (Gr 3-4)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "'A square has all sides equal; a rectangle only needs opposite sides to match'",
            "Shows definitional precision — knowing which property is the distinguishing one"
        ],
        "watchout_signals": [
            "'They look different' or 'a square is more even' — correct intuition but no precise property identified"
        ],
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
        "text": "Look at this: 2, 4, 8, 16, ___. What comes next? Now — can you make a different sequence that also starts with 2, 4? What's the rule for yours?",
        "curriculum_anchor": "Number patterns, doubling (Gr 4)",
        "pillars": ["math_logic", "creativity"],
        "strong_signals": [
            "Gets 32, then successfully generates an alternative sequence starting 2, 4 with a different rule",
            "Shows that rules, not memorisation, govern sequences"
        ],
        "watchout_signals": [
            "Gets 32 but can't construct an alternative — treats the sequence as a fixed fact, not an instance of a rule"
        ],
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
        "text": "Is it possible for a shape to have exactly 3 sides but NOT be a triangle? Why or why not?",
        "curriculum_anchor": "Geometry definitions (Gr 3-5)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "Explores the definition of 'triangle' precisely — either confirms no (because triangle IS defined as 3 sides) or asks whether curved sides count",
            "Shows definitional reasoning"
        ],
        "watchout_signals": [
            "'No' stated with confidence but no reasoning, or 'yes' with a vague non-answer"
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
        "text": "Explain how you'd add 2/3 + 4/7 to a student two years younger. Not just the steps — explain why the method works.",
        "curriculum_anchor": "Fraction addition, unlike denominators (Gr 5-6)",
        "pillars": ["math_logic", "communication", "ai_systems"],
        "strong_signals": [
            "Explains the 'same size pieces' logic behind LCM",
            "Uses an analogy (slices of pizza of different sizes)",
            "The explanation is genuinely simpler than a textbook"
        ],
        "watchout_signals": [
            "Lists the procedure correctly but can't explain why you need common denominators — procedural knowledge without conceptual depth"
        ],
    },
    {
        "grade_band": "6-7",
        "question_number": 2,
        "text": "A store is offering 20% off. Your friend says that's the same as multiplying the original price by 0.8. Are they right? How do you know?",
        "curriculum_anchor": "Percentages and decimals (Gr 6)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "'Yes, because 100% - 20% = 80%, and 80% = 0.8'",
            "Connects percentage to decimal conceptually",
            "Can generalise: 'a 30% discount would be x0.7'"
        ],
        "watchout_signals": [
            "'I think so' without reasoning, or confirms by plugging in one number only — can't explain the general principle"
        ],
    },
    {
        "grade_band": "6-7",
        "question_number": 3,
        "text": "World War 1 didn't start because of one thing. What do you think were the two most important causes — and why those, not the others?",
        "curriculum_anchor": "History: WWI causes (Gr 6-7)",
        "pillars": ["communication", "math_logic"],
        "strong_signals": [
            "Prioritises with reasons (not just lists facts)",
            "Distinguishes long-term causes from triggering event",
            "Acknowledges other valid causes while defending their priority choice"
        ],
        "watchout_signals": [
            "Recites all causes without ranking or connecting them",
            "Treats the assassination of Franz Ferdinand as 'the' cause without explaining the preconditions"
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
        "text": "What does it mean for two things to be 'directly proportional'? Give one real-life example — then give a case where things look proportional but aren't.",
        "curriculum_anchor": "Ratios and proportionality (Gr 6-7)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "Correct definition (as one doubles, other doubles)",
            "Real example (speed x time = distance)",
            "Counter-example shows genuine nonlinear relationship (studying more hours != proportionally better grades)"
        ],
        "watchout_signals": [
            "Gives only an example without being able to define the concept",
            "Can't find a non-proportional counter-example"
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
        "text": "You have a bag with 3 red, 4 blue, and 5 green marbles. You pick one — it's red, and you keep it. What's the probability your next pick is green?",
        "curriculum_anchor": "Conditional probability basics (Gr 6-7)",
        "pillars": ["math_logic"],
        "strong_signals": [
            "5/11 — correctly adjusts denominator for the marble removed",
            "Can explain why the denominator changed",
            "Spontaneously notes this is different from independent probability"
        ],
        "watchout_signals": [
            "5/12 — ignores the removal",
            "Treats each draw as independent without noticing the sample space changed"
        ],
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
        "text": "If a = 3 and b = 5, write three different equations that are true. Now deliberately write one that is false — and explain why it's false.",
        "curriculum_anchor": "Introduction to algebra (Gr 6)",
        "pillars": ["math_logic", "creativity"],
        "strong_signals": [
            "Three genuinely varied equations (not just a+b, a*b, b-a)",
            "Deliberately constructs a false equation and explains the violation",
            "Shows understanding of equality as a condition, not just a calculation"
        ],
        "watchout_signals": [
            "Can write true equations but struggles to deliberately construct a false one",
            "Treats equations as things to solve rather than conditions to evaluate"
        ],
    },
    {
        "grade_band": "6-7",
        "question_number": 12,
        "text": "Redesign the periodic table for someone who has never studied chemistry and finds it confusing. What would you keep, change, or add?",
        "curriculum_anchor": "Chemistry: periodic table (Gr 7)",
        "pillars": ["creativity", "ai_systems"],
        "strong_signals": [
            "Identifies what specifically is confusing about the current design",
            "Proposes a reorganisation around a user's actual mental model",
            "Shows systems redesign thinking"
        ],
        "watchout_signals": [
            "'Make it colourful' — addresses aesthetic without engaging with the underlying informational challenge"
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
        "text": "Why is the area of a circle πr²? Don't just state the formula — explain why it has to be that shape of formula.",
        "curriculum_anchor": "Circle area (Gr 6-7)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "Any reference to cutting into wedges and rearranging (visual proof), or to the relationship between circumference (2πr) and area",
            "Shows conceptual understanding vs rote formula application"
        ],
        "watchout_signals": [
            "'That's just the formula' or restates the formula — reveals it's memorised as a fact, not understood as geometric logic"
        ],
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
        "text": "Explain the difference between mean, median, and mode to someone who thinks they're all the same — and tell me when you'd use each one.",
        "curriculum_anchor": "Statistics: central tendency (Gr 7-8)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "Explains use cases: mean for symmetric data, median when there are outliers (income distribution), mode for categorical data",
            "Gives concrete example of when mean is misleading"
        ],
        "watchout_signals": [
            "Correctly defines all three but can't explain when each is appropriate — procedural knowledge without applied judgment"
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
        "text": "A square has a diagonal of 10cm. Without a calculator — can you figure out the exact side length? Walk me through your thinking.",
        "curriculum_anchor": "Pythagoras theorem (Gr 8)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "a² + a² = 100 -> 2a² = 100 -> a = √50 = 5√2",
            "Sets up the equation clearly, works algebraically, is comfortable leaving the answer as a surd"
        ],
        "watchout_signals": [
            "Tries to estimate ('about 7') or says 'I need a calculator'",
            "Reveals that procedural application requires computational support and isn't yet algebra-fluent"
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
        "text": "Why does multiplying two negative numbers give a positive result? Most people just memorise the rule. Can you explain why it has to be that way?",
        "curriculum_anchor": "Directed numbers, algebra (Gr 7-8)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "Pattern argument: 3x-2=-6, 2x-2=-4, 1x-2=-2, 0x-2=0, so -1x-2 must follow the pattern = +2",
            "Or direction-reversal argument",
            "Any coherent logical argument, not just 'that's the rule'"
        ],
        "watchout_signals": [
            "'That's just the rule' or 'I remember it from class' — reveals mathematical rules are accepted without proof"
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
        "text": "Is 0.999... (repeating forever) actually equal to 1? What do you think — and what kind of argument would genuinely convince you either way?",
        "curriculum_anchor": "Number theory: limits, infinity (Gr 8-9)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "Engages with the question seriously",
            "If yes: 1/3 = 0.333... so 3x(1/3) = 0.999... = 1; or 1 - 0.999... = 0",
            "If no: articulates why ('it never quite reaches 1') — this misconception reveals interesting mathematical intuition",
            "What matters is they engage with the argument, not just state an opinion"
        ],
        "watchout_signals": [
            "'Obviously yes' or 'obviously no' with no engagement with proof or argument — tests comfort with mathematical reasoning under uncertainty"
        ],
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
        "text": "Without using the word 'average', explain what the mean of a dataset tells you. Then tell me what important information it hides.",
        "curriculum_anchor": "Statistics: mean and distribution (Gr 8)",
        "pillars": ["math_logic", "communication"],
        "strong_signals": [
            "'A single number that represents where the middle of the data is'",
            "Hides: spread, distribution shape, outliers, bimodality",
            "Gives concrete example of when mean is misleading (Bill Gates walks into a bar; the average income in the room shoots up, but no one is richer)"
        ],
        "watchout_signals": [
            "Can define mean by procedure only (add and divide) and can't articulate what conceptual information it hides"
        ],
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
