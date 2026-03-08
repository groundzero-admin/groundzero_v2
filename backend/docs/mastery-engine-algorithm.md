# Mastery Engine Algorithm

## Overview

The mastery engine does two things:

1. **Tracks mastery** — Every time a student answers a question, the engine updates how well they know that skill
2. **Decides what to learn next** — Uses the prerequisite graph to find skills the student is ready for and ranks them by priority

The core number is **P(L)** — the probability that the student has truly learned the skill, from 0.0 (no evidence) to 1.0 (certainly mastered).

---

## Part 1: The Skill Graph

### Nodes (Competencies)

Every skill the student can learn is a node. There are 77 total:

- **Math skills** split by grade level: "Fractions — Grade 4", "Fractions — Grade 5", etc. (27 nodes)
- **Math skills** at coarse level: "Mental arithmetic", "Word problems", etc. (13 nodes)
- **Non-math skills**: Communication, creativity, collaboration, etc. (37 nodes)

### Edges (Prerequisites)

An edge from A to B means "you need A before B." There are 58 edges.

**Within-skill grade chains:**
```
Number Sense Gr4 -> Gr5 -> Gr6 -> Gr7 -> Gr8 -> Gr9
Fractions Gr4 -> Gr5 -> Gr6 -> Gr7
Decimals Gr5 -> Gr6 -> Gr7
Ratios Gr6 -> Gr7 -> Gr8
Algebra Gr5 -> Gr6 -> Gr7 -> Gr8 -> Gr9
Geometry Gr4 -> Gr5 -> Gr6 -> Gr7 -> Gr8 -> Gr9
```

**Cross-skill prerequisites:**
```
Number Sense Gr5 -> Fractions Gr5    (need number sense for fractions)
Fractions Gr5 -> Decimals Gr5        (need fractions for decimals)
Fractions Gr6 -> Ratios Gr6          (need fractions for ratios)
Number Sense Gr6 -> Algebra Gr6      (need number sense for algebra)
Decimals Gr7 -> Ratios Gr7           (need decimals for percentages)
Number Sense Gr4 -> Geometry Gr4     (need number sense for geometry)
Algebra Gr6 -> Geometry Gr7          (need algebra for advanced geometry)
```

Each edge has:
- **min_stage**: The minimum stage the prerequisite needs (default: 2)
- **encompassing_weight**: How much practicing the advanced skill exercises the prerequisite (0.0-1.0). Used by FIRe to decide how far to reset decay clocks.

### How the graph is used

1. **Learning frontier** — Only recommend skills whose prerequisites are at Stage 3+
2. **FIRe decay reset** — Succeeding at an advanced skill resets decay clocks on prerequisites
3. **Diagnostic consistency** — If diagnostic says "Stage 4 at Gr7", force all prerequisites to at least Stage 4
4. **Activity gating** — Don't recommend activities targeting skills the student isn't ready for

---

## Part 2: The 10-Step BKT Pipeline

When evidence comes in (e.g., "student answered an MCQ correctly"), the engine runs these 10 steps:

### Step 1: Decay (Forgetting)

If the student hasn't practiced this skill in a while, their mastery drifts down toward 0.10.

People forget things. A student who mastered fractions 6 months ago and hasn't used them since probably can't perform at the same level. The decay is exponential — fast at first, then slowing down.

Each skill has a **stability** value (half-life in days, default 7). A skill with stability=7 loses half its mastery above 0.10 every 7 days without practice. A skill with stability=60 barely decays over a month.

If less than ~15 minutes have passed since last evidence, no decay is applied. This prevents decay between rapid-fire questions in the same session.

### Step 2: Bayesian Update

The core BKT update. Uses Bayes' theorem to update P(L) based on right or wrong.

The key insight: neither a correct nor wrong answer is conclusive evidence. Students can:
- **Guess correctly** — they don't know it but got lucky (P(guess) = 0.25)
- **Slip up** — they know it but made a mistake (P(slip) = 0.10)

**Correct answer:** The engine reasons: "If they knew it, they'd get it right 90% of the time. If they didn't, they'd guess right 25% of the time. Given they got it right, it's more likely they know it." P(L) goes up.

**Wrong answer:** Same logic in reverse. P(L) goes down.

### Step 3: Source Weighting + Response Time

Not all evidence is equally reliable. The Bayesian update from Step 2 is scaled by a source weight:

| Source | Weight | Why |
|--------|--------|-----|
| MCQ | 1.0 | Clear right/wrong answer |
| Artifact | 0.9 | Student's own work product |
| Diagnostic | 0.8 | Structured assessment |
| LLM transcript | 0.7 | AI-analyzed conversation |
| LLM spark | 0.6 | AI creative prompt analysis |
| Facilitator | 0.5 | Teacher observation (subjective) |

**Response time (MCQ only):** How fast the student answered, compared to their personal rolling average:

| Speed | Outcome | Modifier | Meaning |
|-------|---------|----------|---------|
| Fast (< 70% of average) | Correct | 1.3x boost | Confident mastery |
| Slow (> 150% of average) | Correct | 0.6x dampen | Struggled, maybe guessing |
| Fast (< 50% of average) | Wrong | 0.7x dampen | Careless slip |
| Slow (> 150% of average) | Wrong | 1.2x amplify | Genuine gap |

The average response time adapts per student (80% old + 20% new).

### Step 4: Learning Transition

Beyond revealing existing knowledge, there's a chance the student learned something *during* the interaction. This is P(T) — probability of transitioning from "not learned" to "learned."

**Only applies when:**
- Student got it **correct**, OR
- **AI helped** (hint or conversation)

Getting an MCQ wrong with no help doesn't teach you anything. But getting it wrong and then having an AI conversation about it does.

| Condition | P(T) |
|-----------|------|
| Base (correct answer, no AI) | 0.15 |
| With AI hint | 0.15 x 1.5 = 0.225 (capped at 0.40) |
| With AI conversation | 0.15 x 2.0 = 0.30 (capped at 0.50) |

Formula: `P(L) = P(L) + (1 - P(L)) * P(T)` — the less you know, the more room to learn.

### Step 5: Confidence Modifier

The student's self-reported confidence can modify the update:

| Report | Outcome | Effect | Why |
|--------|---------|--------|-----|
| "Got it!" | Wrong | 1.3x amplify negative | Overconfidence reveals deeper misconception |
| "I'm lost" | Correct | 0.8x dampen positive | Probably guessed |
| Everything else | — | No change | — |

### Step 6: Stuck Detection

Track consecutive wrong answers. After **4 in a row**, flag the student as "stuck."

A stuck student needs intervention — a different explanation, prerequisite review, or teacher help. The flag is surfaced to facilitators. Resets to 0 on any correct answer.

### Step 7: Stability Update

When a student demonstrates strong mastery (P(L) > 0.70 on a correct answer), increase the skill's stability by 1.4x, capped at 60 days.

Well-practiced skills are more durable in memory. A student who consistently gets fractions right will see their mastery decay slower over time, meaning they need less review.

### Step 8: FIRe (Fractional Implicit Repetition)

When a student **succeeds** at an advanced skill, reset the decay clock on its prerequisite skills.

**What it does:** Sets `last_evidence_at = now` on prerequisites. That's it. P(L) is NOT changed.

**Why:** If a student correctly answers a Grade 7 fractions question, they're implicitly using Grade 6, 5, and 4 fractions. Those skills don't need separate review — the advanced practice proves they're still intact.

**How it works:**
1. Only triggers on **success** (outcome >= 0.5) with **direct evidence** (not propagated)
2. BFS backward through the prerequisite graph (up to 3 hops)
3. Each hop decays the weight by 0.5x. If weight drops below 0.01, stop.
4. Every reached prerequisite gets `last_evidence_at = now`

**Example:**
```
Student answers Fractions Gr7 correctly

BFS backward:
  Hop 1: Fractions Gr6 (weight 0.7)  -> clock reset
  Hop 2: Fractions Gr5 (weight 0.35) -> clock reset
  Hop 3: Fractions Gr4 (weight 0.17) -> clock reset
```

None of their P(L) values change. They just won't decay because the system knows they were implicitly practiced.

### Step 9: Stage Derivation

Convert P(L) to a human-readable stage (1-5):

| Stage | Name | P(L) Range |
|-------|------|------------|
| 1 | Novice | 0.00 - 0.19 |
| 2 | Emerging | 0.20 - 0.39 |
| 3 | Developing | 0.40 - 0.64 |
| 4 | Proficient | 0.65 - 0.84 |
| 5 | Mastered | 0.85 - 1.00 |

### Step 10: System Confidence

How much the system trusts its own P(L) estimate. NOT the student's confidence.

P(L) = 0.50 with 1 evidence event = "we have no idea." P(L) = 0.50 with 20 events = "we're pretty sure."

Two factors:
- **Evidence count (70%):** More evidence = higher confidence. Logistic curve saturating around 10+ events.
- **Variance (30%):** If P(L) has been stable across the last 10 updates, confidence is higher. If bouncing around, lower.

Stored per-competency. Not yet used in decision-making.

---

## Part 3: Learning Frontier (What to Learn Next)

The frontier answers: **"What should this student work on next?"**

### How it works

1. Look at all the student's skills
2. Remove mastered ones (Stage 5)
3. Remove ones where prerequisites aren't ready (any prereq below Stage 3)
4. Rank the remaining by priority

### Priority scoring

| Factor | Boost | When |
|--------|-------|------|
| **Stuck** | +3.0 | 4+ consecutive failures — needs intervention now |
| **In learning zone** | +2.0 | P(L) between 20-70% with evidence — actively learning |
| **Struggling** | +1.5 | P(L) below 20% but has evidence — tried and failing |
| **Decaying past half-life** | +1.5 | Hasn't practiced longer than stability days |
| **Close to mastery** | +1.0 | P(L) between 70-85% — small push to finish |
| **Needs review** | +0.5 | Past 50% of half-life — starting to fade |
| **Not started** | +0.5 | P(L) below 20%, no evidence — available but untouched |
| **Graph depth** | +0.2 per prereq | More prerequisites met = deeper in graph = more impactful |

### Example walkthrough

**Fresh Grade 6 student — Frontier says:**
```
[0.5] Number Sense Gr4    — not started (root, no prereqs)
[0.5] Fractions Gr4       — not started (root, no prereqs)
[0.5] Algebra Gr5         — not started (root, no prereqs)
```

Everything else is locked behind prerequisites.

**After mastering Number Sense Gr4 (3 correct answers):**
```
[0.7] Number Sense Gr5    — UNLOCKED (prereq Number Sense Gr4 met)
[0.7] Geometry Gr4        — UNLOCKED (prereq Number Sense Gr4 met)
[0.5] Fractions Gr4       — not started
[0.5] Algebra Gr5         — not started
```

**After also mastering Fractions Gr4 + Number Sense Gr5:**
```
[0.9] Fractions Gr5       — UNLOCKED (both prereqs met: Fractions Gr4 + Number Sense Gr5)
[0.7] Number Sense Gr6    — UNLOCKED (prereq Number Sense Gr5 met)
[0.7] Geometry Gr4        — available
[0.5] Algebra Gr5         — available
```

Fractions Gr5 has highest priority (0.9) because it has 2 prerequisites met — the graph depth bonus means the system prefers skills where more foundation is built.

**Key: Skills with unmet prerequisites are never shown.** If a student somehow attempts Ratios Gr7 but hasn't done Decimals Gr7 yet, the frontier won't recommend Ratios Gr7. It will tell them to do Decimals Gr7 first.

### Activity gating

The `next-activity` endpoint also uses the prerequisite graph. When scoring activities:

1. Check activity-level prerequisites (explicit on the activity record)
2. Check graph-level prerequisites for the activity's target competencies
3. If any prerequisite competency is below Stage 3, the activity is filtered out

This ensures students are never recommended activities they aren't ready for.

---

## Part 4: Question Selection (ZPD Targeting)

When the system knows which skill to practice, it picks questions at the right difficulty level.

The Zone of Proximal Development (ZPD) is the sweet spot — not too easy, not too hard.

| Student's P(L) | Target difficulty | Why |
|----------------|-------------------|-----|
| > 0.85 (Mastered) | 0.6 - 1.0 | Challenge questions to maintain |
| 0.65 - 0.85 (Proficient) | 0.5 - 0.8 | Push toward mastery |
| 0.40 - 0.65 (Developing) | 0.3 - 0.6 | ZPD sweet spot |
| 0.20 - 0.40 (Emerging) | 0.2 - 0.5 | Build confidence |
| < 0.20 (Novice) | 0.1 - 0.4 | Easy questions to start |

If not enough questions exist in the target range, the system picks the closest available.

---

## Data Flow

```
                    +------------------+
                    |  Skill Graph     |
                    |  (77 nodes,      |
                    |   58 prereq      |
                    |   edges)         |
                    +--------+---------+
                             |
                             v
+------------+     +------------------+     +------------------+
|  Evidence  | --> |  10-Step BKT     | --> |  Updated State   |
|  (answer,  |     |  Pipeline        |     |  (P(L), stage,   |
|   source,  |     |  (pure Python)   |     |   stuck, etc.)   |
|   time)    |     +------------------+     +--------+---------+
+------------+              |                        |
                            v                        v
                   +------------------+     +------------------+
                   |  FIRe            |     |  Learning        |
                   |  (reset prereq   |     |  Frontier        |
                   |   decay clocks)  |     |  (what to learn  |
                   +------------------+     |   next)          |
                                            +--------+---------+
                                                     |
                                                     v
                                            +------------------+
                                            |  ZPD Question    |
                                            |  Selection       |
                                            |  (right          |
                                            |   difficulty)    |
                                            +------------------+
```

---

## Key Design Decisions

1. **The prerequisite graph drives the learning path.** Students can't skip ahead. Each mastered skill unlocks the next level. This prevents the situation where a student is doing Grade 7 fractions without knowing Grade 5.

2. **FIRe only resets decay clocks, never modifies P(L).** Only direct evidence changes mastery estimates. Implicit repetition prevents unnecessary decay but doesn't inflate scores.

3. **Wrong answers without AI help don't trigger learning transition.** Getting an MCQ wrong and moving on doesn't teach you anything. The learning transition (Step 4) only fires on success or with AI assistance.

4. **Source weights are fixed per source type.** MCQ = 1.0, artifact = 0.9, diagnostic = 0.8, LLM transcript = 0.7, LLM spark = 0.6, facilitator = 0.5. Can be overridden per-event.

5. **Decay is exponential toward a prior of 0.10.** Skills never fully decay to 0. There's always a baseline assumption of residual knowledge.

6. **The engine is pure Python with no database dependencies.** Takes dataclasses in, returns dataclasses out. Testable, portable, swappable. Could replace BKT with DKT or a transformer model without changing the API.

7. **Frontier prioritizes active learning over untouched skills.** A skill the student is currently working on (P(L) 20-70%) gets priority 2.0. A skill they haven't started gets 0.5. Stuck skills get +3.0 for immediate intervention.

---

## API Endpoints

| Endpoint | What it does |
|----------|-------------|
| `POST /evidence` | Submit evidence, run BKT pipeline, return updated state |
| `GET /students/{id}/skill-frontier` | What should this student learn next (graph-aware) |
| `GET /students/{id}/next-activity` | Recommend activities (with prereq gating) |
| `GET /students/{id}/next-questions` | Pick questions at the right difficulty |
| `GET /students/{id}/recommended-topics` | Rank curriculum topics by student weakness |
| `GET /students/{id}/state` | Current mastery state for all competencies |
