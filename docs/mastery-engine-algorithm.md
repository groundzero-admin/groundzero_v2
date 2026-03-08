# How Ground Zero Tracks What Students Know

> **Version:** v3.0 | **Date:** March 2026
>
> This document explains the complete algorithm behind skill tracking — how the system decides whether a student "knows" something, how that estimate changes over time, and how practicing one skill can keep related skills fresh.

---

## Table of Contents

1. [The Big Picture](#1-the-big-picture)
2. [What We Track](#2-what-we-track)
3. [How Skills Connect to Each Other](#3-how-skills-connect-to-each-other)
4. [What Happens When a Student Answers a Question](#4-what-happens-when-a-student-answers-a-question)
5. [How Practicing One Skill Keeps Others Fresh (FIRe)](#5-how-practicing-one-skill-keeps-others-fresh-fire)
6. [Worked Examples (Real Numbers)](#6-worked-examples-real-numbers)
7. [Evidence Sources](#7-evidence-sources)
8. [All the Numbers and Constants](#8-all-the-numbers-and-constants)
9. [File Map](#9-file-map)

---

## 1. The Big Picture

Every student has a **mastery score** for each skill, expressed as a probability between 0% and 100%. We call this **P(L)** — "probability of having learned it."

- A student who's never been assessed starts at **10%** (we assume they might know a little).
- A student who keeps getting questions right climbs toward **99%**.
- A student who gets things wrong drops.
- A student who hasn't practiced in a while **gradually forgets** — their score slowly drifts back down toward 10%.

The system never shows these raw numbers to students. Instead, it converts them to **stages** that teachers and parents can understand:

| Stage | Label | What it means | P(L) range |
|-------|-------|---------------|-----------|
| 1 | Novice | No real evidence they can do this | 0% – 20% |
| 2 | Emerging | Starting to get it, but inconsistent | 20% – 40% |
| 3 | Developing | Can do it with some support | 40% – 65% |
| 4 | Proficient | Can do it independently | 65% – 85% |
| 5 | Mastered | Fluent — could teach someone else | 85% – 100% |

---

## 2. What We Track

### The Hierarchy

```
Pillars (4)  →  Capabilities (16)  →  Competencies (77)
   ↑                  ↑                     ↑
 "domains"       "skill areas"        "specific skills"
                                    (this is what we track)
```

**The 4 pillars:**
1. **Communication** — Can the student argue, listen, and persuade? (12 skills)
2. **Creativity** — Can they generate ideas, go deep, and apply creativity? (12 skills)
3. **AI & Systems Thinking** — Can they use AI well, think in systems, and build things? (13 skills)
4. **Math & Logic** — Can they reason, calculate, and solve problems? (40 skills)

### Why Math Has 40 Skills

Math skills vary hugely by grade. A Grade 4 student learning basic fractions and a Grade 8 student doing algebraic fractions are doing very different things. We split each math area into grade-level skills:

| Math Area | Grade-Level Skills | Example |
|-----------|-------------------|---------|
| Number Sense | Grades 4–9 (6 skills) | C4.14.4 = "Grade 4 number sense", C4.14.9 = "Grade 9 number sense" |
| Fractions | Grades 4–7 (4 skills) | C4.15.4 through C4.15.7 |
| Decimals & Percentages | Grades 5–7 (3 skills) | C4.16.5 through C4.16.7 |
| Ratios & Proportion | Grades 6–8 (3 skills) | C4.17.6 through C4.17.8 |
| Algebra | Grades 5–9 (5 skills) | C4.18.5 through C4.18.9 |
| Geometry | Grades 4–9 (6 skills) | C4.19.4 through C4.19.9 |

This granularity is what makes the FIRe algorithm (Section 5) possible.

---

## 3. How Skills Connect to Each Other

Skills don't exist in isolation. The system knows about two kinds of relationships:

### 3.1 Prerequisites — "You need A before B"

Some skills must come before others. You can't do Grade 7 fractions until you've got Grade 6 fractions down. You can't identify logical fallacies until you understand fact vs opinion.

We have **58 prerequisite edges** in the system. Each one says:

> "Skill A must reach at least Stage 2 (Emerging) before the system will assign activities for Skill B"

Each edge also has an **encompassing weight** — a number from 0 to 1 that answers:

> "When a student practices Skill B, how much of Skill A are they also practicing?"

For example:
- **Grade 7 fractions → Grade 6 fractions: weight 0.7** — doing Grade 7 fractions heavily exercises Grade 6 fractions (you're constantly using simpler fraction operations)
- **Fractions → Number Sense: weight 0.3** — fractions exercise number sense somewhat, but not entirely
- **Active listening → Constructing arguments: weight 0.3** — arguing well requires listening, but they're still different skills

### 3.2 Co-development — "Practicing A is partial evidence for B"

Some skills across different pillars are related. If a student is great at building logical argument chains (Communication), that's partial evidence they can also do if/then reasoning (Math/Logic) — because it's the same underlying thinking.

We have **9 co-development edges**. These are **bidirectional** — evidence flows both ways. Examples:

- Argument chains ↔ If/then reasoning (30% transfer)
- Problem framing ↔ User need identification (40% transfer — these are almost the same skill)
- Fallacy identification ↔ Cognitive bias (30% transfer)

---

## 4. What Happens When a Student Answers a Question

When any evidence comes in — an MCQ answer, a transcript assessment, a SPARK conversation rating — the system runs a **12-step pipeline**. Here's each step in plain English:

### Step 1: Account for Forgetting

**Question the system asks:** "How long has it been since this student last practiced this skill?"

If it's been a while, the mastery score drifts down toward 10%. The longer the gap, the more forgetting.

But not all forgetting is equal. A skill the student has practiced many times (high "stability") forgets slowly. A skill they've only seen once forgets quickly.

- **New skill, practiced once:** Half-life of 7 days (loses half its gains in a week)
- **Well-practiced skill:** Half-life up to 60 days (takes 2 months to lose half)

Think of it like muscle memory — the more you practice, the longer it sticks.

### Step 2: Update the Estimate Based on What Just Happened

**Question:** "Given what I previously thought about this student, and what they just did, what should I believe now?"

This is the core [Bayesian update](https://en.wikipedia.org/wiki/Bayesian_knowledge_tracing). The system considers two possibilities:

- **If they got it right:** "They might really know it (and answered correctly), or they might have gotten lucky (guessed)."
- **If they got it wrong:** "They might not know it (and answered wrong), or they might have made a careless mistake (slipped)."

The system weighs both possibilities and arrives at a new estimate. Getting something right pushes the score up. Getting it wrong pushes it down. But the amount depends on where they started — getting an easy question right when you're already at 90% barely moves the needle.

### Step 3: Adjust for How Reliable This Evidence Is

**Question:** "How much should I trust this particular signal?"

Not all evidence is equally reliable:

| Source | Trust Level | Why |
|--------|------------|-----|
| MCQ answer | 100% | Binary right/wrong — very clean signal |
| Project artifact | 90% | Carefully evaluated, but infrequent |
| Session transcript | 70% | Rich signal, but assessed by AI — some noise |
| SPARK conversation | 60% | Self-directed, highly variable |
| Facilitator observation | 50% | Subjective human judgment |

The system also looks at **response time** for MCQs:
- **Fast and correct** = extra confidence boost (they knew it cold)
- **Slow and correct** = dampened boost (they might have struggled or guessed)
- **Fast and wrong** = dampened penalty (probably a careless click)
- **Slow and wrong** = extra penalty (they genuinely didn't know)

### Step 4: Account for Learning That Just Happened

**Question:** "Even if they got it wrong, did they learn something from the experience?"

Every attempt has some probability of causing learning. The system adds a small upward nudge representing "the student might have just figured it out."

This learning boost is amplified when AI is involved:
- Used a **hint** from SPARK → 1.5× normal learning rate
- Had a full **conversation** with SPARK → 2× normal learning rate

### Step 5: Factor in Self-Reported Confidence

**Question:** "Did the student say how confident they felt, and does that match what happened?"

Two interesting cases:
- **"I totally got this!" + Wrong answer** → The penalty is amplified by 1.3×. Overconfidence combined with failure is a strong signal of a genuine misconception (not just a careless mistake).
- **"I'm totally lost" + Right answer** → The boost is dampened by 0.8×. They probably got lucky — this doesn't mean they've mastered it.

### Step 6: Check if the Student is Stuck

**Question:** "Has this student failed 4 or more times in a row on this skill?"

If yes, the system flags them as **stuck**. This:
- Alerts the teacher dashboard
- Can trigger a SPARK intervention ("Hey, I noticed you're struggling with fractions — want to try a different approach?")
- Resets to zero after their next success

### Step 7: Strengthen Memory for Well-Known Skills

**Question:** "Did the student demonstrate strong mastery? If so, make the knowledge stickier."

If a student gets something right AND their mastery score is above 70%, the system increases their **stability** (forgetting half-life) by 1.4×, up to a maximum of 60 days.

This means: the more you demonstrate mastery, the slower you forget. Practice makes permanent.

### Step 8: Spread Credit to Related Skills (Co-development)

**Question:** "Does this evidence tell us something about other skills too?"

If the student just demonstrated strong argument chains (C1.5), the system gives a proportional boost to if/then reasoning (C4.4), because those skills are linked with a 30% co-development weight.

The amount of boost/penalty is proportional:
```
Change in related skill = Change in primary skill × transfer weight
```

So if argument chains went up by +0.12, then if/then reasoning goes up by 0.12 × 0.30 = +0.036.

This is **bidirectional** (works both ways) and **limited to 1 hop** (C1.5 → C4.4 is fine, but it won't cascade further from C4.4 to whatever C4.4 is linked to).

### Step 8b: Keep Prerequisite Skills Fresh (FIRe Trickle-Down)

**This only happens on SUCCESS.**

**Question:** "The student just proved they can do an advanced skill. Doesn't that mean they can still do the simpler prerequisite skills too?"

Yes! If a student correctly answers a Grade 7 algebra question, they are *implicitly demonstrating* that they still know Grade 6 algebra, Grade 5 algebra, and Grade 6 number sense (because those are all prerequisites, and you can't do Grade 7 algebra without them).

So the system:
1. Walks backward through the prerequisite chain (up to 3 levels deep)
2. Gives each ancestor a small P(L) boost
3. **Most importantly: resets the "last practiced" timestamp** for each ancestor

That timestamp reset is the key benefit. Without it, those simpler skills would gradually decay because the student hasn't directly practiced them. With FIRe, the system recognizes that practicing an advanced skill *is* practice of the simpler skills.

The boost gets smaller the further back you go:
- Direct prerequisite (1 hop): full encompassing weight (e.g., 0.6)
- 2 hops back: weight × 0.5 (e.g., 0.3)
- 3 hops back: weight × 0.25 (e.g., 0.15)

### Step 8c: Penalize Dependent Skills on Failure (FIRe Trickle-Up)

**This only happens on FAILURE.**

**Question:** "The student just failed at a fundamental skill. Should we be less confident about the harder skills that depend on it?"

Yes, but gently. If a student can't do Grade 5 fractions, their Grade 6 fractions score should drop a little too — because Grade 6 fractions assumes you can do Grade 5 fractions.

This is much more conservative than the trickle-down:
- Only goes 1 hop forward (direct dependents only)
- The penalty is 30% of the encompassing weight (much smaller)
- Does NOT reset the decay clock (we don't want failure to prevent natural forgetting of the dependent skill)

### Step 9: Determine the Student's Stage

Convert the final P(L) to a human-readable stage (Novice through Mastered) using the threshold table from Section 1.

### Step 10: Determine How Confident WE Are

**Question:** "How much should we trust our own estimate?"

This is NOT the student's confidence — it's the system's confidence in its own P(L) estimate. It depends on:

- **Amount of evidence** — 2 data points → low confidence. 50 data points → high confidence.
- **Consistency** — If the last 10 P(L) values are all around 0.6, high confidence. If they're bouncing between 0.3 and 0.9, low confidence.

A P(L) of 60% with high confidence means "we're quite sure they're Developing." A P(L) of 60% with low confidence means "we don't really know yet — could be anywhere."

---

## 5. How Practicing One Skill Keeps Others Fresh (FIRe)

### The Problem FIRe Solves

Imagine a Grade 8 student who's spending all their time on algebra. They haven't directly answered a "basic fractions" question in 3 weeks. Without FIRe, the system would:

1. Watch their fractions mastery slowly decay (because of the forgetting curve)
2. Eventually schedule a fractions review session
3. The student would ace it easily (they can obviously still do fractions — they're doing algebra!)
4. Wasted time for the student, wasted session for the teacher

**FIRe prevents this.** Every time the student successfully does algebra, the system recognizes that they're also implicitly practicing fractions, number sense, and other prerequisites. Their decay clocks get reset, and they never get sent back for unnecessary review.

### Where This Idea Comes From

This is based on [Math Academy's](https://www.mathacademy.com/) approach to knowledge maintenance. They call it "Fractional Implicit Repetition" — the idea that practicing a hard topic gives you fractional repetition of the easier topics it builds on.

### The Key Number: Encompassing Weight

Each prerequisite edge has an encompassing weight between 0 and 1:

> "When you practice the harder skill, what fraction of the easier skill are you also exercising?"

| Relationship | Weight | In plain English |
|-------------|--------|-----------------|
| Grade 7 fractions → Grade 6 fractions | 0.7 | "70% of Grade 6 fractions is used when doing Grade 7 fractions" |
| Grade 5 fractions → Grade 5 decimals | 0.4 | "40% of fractions comes up when working with decimals" |
| Number sense → Algebra | 0.2 | "Only 20% of number sense directly appears in algebra problems" |

Higher weights mean more implicit practice. Within-skill grade chains (like fractions grade 6 → grade 7) have high weights (0.6–0.7). Cross-skill prerequisites (like number sense → algebra) have lower weights (0.2–0.4).

### What FIRe Does NOT Do Yet

Two things Math Academy does that we haven't built yet (deferred to Phase 2):

1. **Repetition compression** — Actually skipping scheduled reviews for skills that have been implicitly refreshed. Currently, FIRe just keeps the mastery score healthy, but the curriculum predictor doesn't yet factor this in.

2. **Per-student encompassing weights** — Some students retain prerequisites better than others when doing advanced work. Currently, weights are the same for all students.

---

## 6. Worked Examples (Real Numbers)

### Example A: Student Gets Grade 7 Algebra Right → Prerequisites Refresh

**Setup:** A Grade 8 student answers a Grade 7 algebra question correctly.

| Skill | Before | Last Practiced | Status |
|-------|--------|---------------|--------|
| C4.18.7 (Gr7 Algebra) | 40% — Developing | 1 day ago | Active |
| C4.18.6 (Gr6 Algebra) | 55% — Developing | 5 days ago | Starting to decay |
| C4.18.5 (Gr5 Algebra) | 65% — Proficient | 10 days ago | Decaying |
| C4.14.6 (Gr6 Number Sense) | 60% — Developing | 14 days ago | Decaying a lot |

**After the pipeline runs:**

| Skill | After | What happened |
|-------|-------|---------------|
| C4.18.7 | **64%** — Developing | Primary update: Bayesian boost + learning transition |
| C4.18.6 | **69%** — Proficient ⬆ | FIRe: +14% boost, decay clock reset to NOW |
| C4.18.5 | **72%** — Proficient | FIRe: +7% boost, decay clock reset to NOW |
| C4.14.6 | **64%** — Developing | FIRe: +4% boost, decay clock reset to NOW |

**Key insight:** Without FIRe, C4.14.6 (number sense) had gone 14 days without practice and was decaying fast. After FIRe, its clock is reset and it got a small boost. No unnecessary review needed.

### Example B: Student Fails Grade 5 Fractions → Dependents Take a Small Hit

**Setup:** Student gets a Grade 5 fractions question wrong.

| Skill | Before |
|-------|--------|
| C4.15.5 (Gr5 Fractions) | 45% — Developing |
| C4.15.6 (Gr6 Fractions) | 35% — Emerging |
| C4.16.5 (Gr5 Decimals) | 30% — Emerging |

**After:**

| Skill | After | What happened |
|-------|-------|---------------|
| C4.15.5 | **30%** — Emerging ⬇ | Primary: Bayesian penalty for wrong answer |
| C4.15.6 | **32%** — Emerging | Trickle-up: small -3% penalty (can't do Gr6 fractions if Gr5 is shaky) |
| C4.16.5 | **28%** — Emerging | Trickle-up: small -2% penalty (decimals depend on fractions) |

**Key insight:** The penalties are deliberately small. We don't want one bad answer to cascade aggressively. The decay clocks are NOT reset (failure shouldn't prevent natural forgetting).

### Example C: Good Argument Skills → Small Boost to Logic

**Setup:** A student demonstrates strong argument chains in a live session (assessed by LLM from transcript).

```
Evidence: C1.5 (argument chains), outcome: 0.8, source: transcript (70% weight)
Co-dev edge: C1.5 ↔ C4.4 (if/then reasoning), 30% transfer
```

| Skill | Before | After | What happened |
|-------|--------|-------|---------------|
| C1.5 (Arguments) | 50% | 62% | Primary update (dampened by 70% transcript weight) |
| C4.4 (If/Then Logic) | 40% | 44% | Co-dev: +12% primary × 30% transfer = +3.6% |

---

## 7. Evidence Sources

### What Counts as Evidence

Everything that tells us something about what a student knows:

| Source | Example | How reliable | How it works |
|--------|---------|-------------|-------------|
| **MCQ Answer** | Student picks answer B, it's correct | Very (100%) | Binary right/wrong, clean signal, includes response time |
| **Project Artifact** | Demo Day presentation, product card | Very (90%) | Scored by AI + facilitator rubric |
| **Diagnostic (SPARK)** | 10-min conversation assessment | Good (80%) | Seeds initial mastery scores, one-time |
| **Session Transcript** | Facilitator records live session | Good (70%) | AI reads transcript, identifies skills demonstrated |
| **SPARK Conversation** | Student chats with AI companion | Moderate (60%) | AI analyzes curiosity, depth, prompt quality |
| **Facilitator Notes** | Teacher marks engagement 1/2/3 | Moderate (50%) | Subjective but catches what algorithms miss |

### What Gets Created Behind the Scenes

When evidence is processed, the system may create additional "propagated" events for the audit trail:

- **`codev_transfer`** — A co-development propagation event (Step 8)
- **`fire_trickle_down`** — A FIRe implicit review event (Step 8b)
- **`fire_trickle_up`** — A FIRe failure penalty event (Step 8c)

These are marked with `is_propagated = true` and link back to the original event via `source_event_id`. They exist for debugging and transparency — you can trace exactly why any mastery score changed.

---

## 8. All the Numbers and Constants

### Starting Values (Per Student Per Skill)

| Parameter | Default | What it means |
|-----------|---------|---------------|
| P(L) | 0.10 (10%) | "We assume a 10% chance they know it before any evidence" |
| P(Guess) | 0.25 (25%) | "25% chance of getting it right by guessing" (4-option MCQ) |
| P(Slip) | 0.10 (10%) | "10% chance of getting it wrong even if they know it" |
| P(Transit) | 0.15 (15%) | "15% chance each attempt causes learning" |
| Stability | 7.0 days | "Knowledge halves in about 7 days without practice" |

### FIRe Parameters

| Parameter | Value | What it means |
|-----------|-------|---------------|
| Max hops | 3 | "Don't look more than 3 prerequisites back" |
| Hop decay | 0.5 | "Each additional hop halves the weight" |
| Min weight | 0.01 | "Ignore anything below 1% weight" |
| Trickle-up multiplier | 0.3 | "Failure penalty is 30% of the encompassing weight" |
| Trickle-up max hops | 1 | "Only penalize direct dependents, not transitive ones" |

### Speed Modifiers (MCQ Only)

| Situation | Multiplier | Why |
|-----------|-----------|-----|
| Fast + Correct | 1.3× boost | Confident mastery — they knew it instantly |
| Slow + Correct | 0.6× boost | Took a while — might have struggled or guessed |
| Fast + Wrong | 0.7× penalty | Quick misclick — probably careless, not a real gap |
| Slow + Wrong | 1.2× penalty | Thought hard and still got it wrong — genuine gap |

"Fast" = answered in less than 70% of their personal average time.
"Slow" = answered in more than 150% of their personal average time.

### Stability Growth

| Condition | Effect |
|-----------|--------|
| Got it right AND mastery > 70% | Stability × 1.4 (knowledge becomes stickier) |
| Maximum stability | 60 days (can't grow beyond this) |

### Stuck Detection

| Condition | Effect |
|-----------|--------|
| 4 consecutive failures | Student flagged as "stuck" → teacher alert |
| Next success | Stuck flag clears |

---

## 9. File Map

### The Engine (Pure math — no database, no network)

| File | What it does |
|------|-------------|
| `app/engine/types.py` | Defines all the data shapes: student state, evidence input, results, link types |
| `app/engine/interface.py` | The contract that any mastery model must implement (BKT today, could be AI/ML tomorrow) |
| `app/engine/bkt.py` | The actual 12-step algorithm described in this document |
| `app/engine/propagation.py` | Helper functions that walk the skill graph to find ancestors and dependents |

### The Service Layer (Talks to the database)

| File | What it does |
|------|-------------|
| `app/services/evidence_service.py` | Receives evidence → loads student state from DB → runs engine → saves results back |
| `app/services/predictor_service.py` | Recommends what the student should do next based on their current mastery |

### The Data

| File | What it contains |
|------|-----------------|
| `seed/competencies.json` | All 77 skills, organized by pillar and capability |
| `seed/prerequisite_edges.json` | 58 "A before B" relationships with encompassing weights |
| `seed/codevelopment_edges.json` | 9 cross-pillar skill relationships |
| `seed/questions_math.json` | 173 math questions mapped to grade-level skills |
| `seed/questions.json` | 33 Level 1 questions for communication/creativity/AI skills |
| `seed/curriculum_topics.json` | 64 curriculum topics (linked to skills via topic_competency_map) |
| `seed/topic_competency_map.json` | 122 mappings from curriculum topics to specific skills |

### Database Models

| File | What it stores |
|------|---------------|
| `app/models/skill_graph.py` | Prerequisite edges (with encompassing_weight) and co-development edges |
| `app/models/student.py` | Per-student, per-skill mastery state (all the numbers BKT tracks) |
| `app/models/evidence.py` | Every evidence event ever processed (audit trail) |
| `app/models/competency.py` | The skill hierarchy: pillars → capabilities → competencies |
