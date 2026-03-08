# MindSpark Architecture

## 1. Competency Graph (77 Nodes, 58 Edges)

### 4 Pillars

| Pillar | Code | Capabilities | Competencies |
|--------|------|-------------|--------------|
| Computational Thinking | P1 | 3 (Foundations, Programming, Problem Solving) | 13 nodes |
| Digital Literacy | P2 | 3 (Safety, Communication, Tools) | 10 nodes |
| Creative & Innovation | P3 | 3 (Design, Media, Innovation) | 17 nodes |
| Math Thinking | P4 | 3 (Number, Operations, Reasoning) | 37 nodes (27 grade-level) |

### P1: Computational Thinking (13 competencies)

```
C1.1 Sequencing ──→ C1.3 Decomposition ──→ C1.5 Algorithms ──→ C1.7 Conditionals ──→ C1.9 Variables ──→ C1.10 Functions
C1.2 Patterns   ──→ C1.4 Abstraction  ──→ C1.6 Debugging  ──→ C1.8 Loops       ─┘
C1.11 Events
C1.12 Data Representation
C1.13 Simulation & Modeling
```

### P2: Digital Literacy (10 competencies)

```
C2.1 Digital Safety ──→ C2.2 Info Literacy ──→ C2.3 Communication ──→ C2.4 Collaboration
C2.5 Device Ops ──→ C2.6 AI Awareness
C2.7 Digital Citizenship
C2.8 File Management
C2.9 Internet Navigation
C2.10 Accessibility Awareness
```

### P3: Creative & Innovation (17 competencies)

```
C3.1 Design Thinking ──→ C3.2 Ideation ──→ C3.3 Prototyping ──→ C3.4 Digital Creation
C3.5 Storytelling
C3.6 Visual Design       C3.11 Animation Basics
C3.7 Audio & Music       C3.12 Game Design
C3.8 Video Production    C3.13 3D Modeling
C3.9 Graphic Design      C3.14 UX Thinking
C3.10 Digital Art        C3.15-C3.17 (Advanced creative)
```

### P4: Math Thinking — Grade-Level Split (27 nodes)

Each math skill is split by grade level (4-9). Students start at their grade and auto-promote when mastered.

```
Number Sense:  C4.14.4 → C4.14.5 → C4.14.6 → C4.14.7 → C4.14.8 → C4.14.9
Fractions:     C4.15.4 → C4.15.5 → C4.15.6 → C4.15.7
Decimals:      C4.16.5 → C4.16.6 → C4.16.7
Ratios:        C4.17.6 → C4.17.7 → C4.17.8
Algebra:       C4.18.5 → C4.18.6 → C4.18.7 → C4.18.8 → C4.18.9
Geometry:      C4.19.4 → C4.19.5 → C4.19.6 → C4.19.7 → C4.19.8 → C4.19.9
```

### Cross-Skill Prerequisite Edges

These connect different math skills where knowledge transfers:

```
C4.14.5 (NumSense Gr5) ──→ C4.15.5 (Fractions Gr5)    weight: 0.4
C4.15.5 (Fractions Gr5) ──→ C4.16.5 (Decimals Gr5)     weight: 0.3
C4.15.6 (Fractions Gr6) ──→ C4.17.6 (Ratios Gr6)       weight: 0.3
C4.14.6 (NumSense Gr6) ──→ C4.18.6 (Algebra Gr6)       weight: 0.2
C4.16.7 (Decimals Gr7) ──→ C4.17.7 (Ratios Gr7)        weight: 0.3
C4.18.7 (Algebra Gr7)  ──→ C4.18.8 (Algebra Gr8)       weight: 0.7
```

### Within-Skill Edge Weights (FIRe)

| Edge Type | Encompassing Weight | Meaning |
|-----------|-------------------|---------|
| Same skill, adjacent grade (e.g., C4.15.6 → C4.15.7) | 0.6 - 0.8 | Doing Gr7 fractions heavily exercises Gr6 fractions |
| Same skill, 2 grades apart | Weight × hop_decay (0.5) | Gr7 partially exercises Gr5 |
| Cross-skill prereq | 0.2 - 0.4 | Doing ratios partially exercises fractions |

---

## 2. BKT Evidence Pipeline (10 Steps)

### Evidence Sources

| Source | Weight | Outcome Range | When Generated |
|--------|--------|--------------|----------------|
| MCQ | 1.0 | 0.0 (wrong) or 1.0 (correct) | Student answers timed MCQ |
| Open-ended | 0.8 | 0.0 - 1.0 (AI rubric scored) | Student submits free-form answer |
| Peer Review | 0.6 | 0.0 - 1.0 | Peer evaluates student's work |
| Facilitator | 0.5 | 0.3 / 0.5 / 0.8 (engagement 1/2/3) | Teacher observes student |
| Self-report | 0.3 | 0.0 - 1.0 | Student self-assesses |

### Scoring Modifiers

| Modifier | Effect | Condition |
|----------|--------|-----------|
| Speed bonus | outcome += 0.05 | Answer in < 50% of allotted time |
| Streak bonus | weight × 1.1 | 3+ consecutive correct answers |
| Co-development | Propagate to linked competencies | Activity maps to multiple competencies |

### 10-Step Pipeline

```
Evidence Event arrives
        │
        ▼
┌─────────────────────────────────┐
│ Step 1: TIME DECAY              │
│ p_decayed = p × 0.5^(days/30)  │
│ Half-life: 30 days              │
│ Only if last_evidence > 1 day   │
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ Step 2: BAYESIAN UPDATE         │
│ If positive:                    │
│   p_new = p × P(correct|know)   │
│         / P(correct)            │
│ If negative:                    │
│   p_new = p × P(wrong|know)     │
│         / P(wrong)              │
│ P(slip) = 0.1, P(guess) = 0.25 │
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ Step 3: SOURCE + SPEED ADJUST   │
│ delta = p_new - p_decayed       │
│ delta *= source_weight          │
│ If fast answer: delta += 0.05   │
│ If streak >= 3: delta *= 1.1    │
│ p_adjusted = p_decayed + delta  │
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ Step 4: P(TRANSIT) LEARNING     │
│ p_learned = p_adj + (1-p_adj)   │
│             × P(transit)        │
│ P(transit) = 0.1 (base)         │
│ Adjusted by evidence count      │
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ Step 5: CONFIDENCE UPDATE       │
│ confidence += 1/sqrt(n_events)  │
│ Clamped to [0, 1]              │
│ Higher = more certain of stage  │
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ Step 6: STUCK DETECTION         │
│ If 5+ events AND p_learned      │
│ hasn't moved > 0.05 in last 5:  │
│ → Flag as stuck                 │
│ → Suggest remedial activity     │
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ Step 7: STABILITY CHECK         │
│ If last 3 events all same       │
│ direction: mark as stable       │
│ If oscillating: mark unstable   │
│ Affects confidence weight       │
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ Step 8: FIRe PROPAGATION        │
│ For each prerequisite ancestor: │
│   transferred = delta × weight  │
│              × hop_decay^depth  │
│   ancestor.p += transferred     │
│   ancestor.last_evidence = now  │
│ Max hops: 3, hop_decay: 0.5    │
│                                 │
│ Negative propagation:           │
│   Failure → small penalty to    │
│   postrequisites (downstream)   │
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ Step 9: STAGE ASSIGNMENT        │
│ Map p_learned to 8 stages:      │
│                                 │
│  p < 0.15  → Stage 1 (Novice)  │
│  p < 0.30  → Stage 2 (Beginner)│
│  p < 0.50  → Stage 3 (Develop) │
│  p < 0.70  → Stage 4 (Profic.) │
│  p < 0.85  → Stage 5 (Adept)   │
│  p < 0.92  → Stage 6 (Advanced)│
│  p < 0.97  → Stage 7 (Expert)  │
│  p >= 0.97 → Stage 8 (Mastered)│
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ Step 10: CONFIDENCE ESTIMATE    │
│ Final output per competency:    │
│  - p_learned (0.0 - 1.0)       │
│  - stage (1-8)                  │
│  - confidence (0.0 - 1.0)      │
│  - is_stuck (bool)              │
│  - is_stable (bool)             │
│  - evidence_count               │
│  - last_evidence_at             │
└─────────────────────────────────┘
```

---

## 3. Auto-Promotion

When a student masters a grade-level competency (stage >= 5), the predictor automatically promotes them:

```
Student masters C4.14.6 (NumSense Grade 6)
        │
        ▼
Predictor BFS through prerequisite edges
        │
        ▼
Finds C4.14.7 (NumSense Grade 7) — same skill family (C4.14.x)
        │
        ▼
Adds C4.14.7 to question candidate pool
        │
        ▼
Student starts receiving Grade 7 Number Sense questions
```

Rules:
- Only promotes within same skill family (C4.14.x stays in Number Sense)
- Only if current grade node is mastered (stage >= 5)
- Promoted competency must not already be mastered
- Maximum 1 grade level ahead per promotion cycle

---

## 4. Session & Activity Flow

```
Teacher creates session for cohort
        │
        ▼
Auto-assigns activities from curriculum
(warmup → key_topic → diy → ai_lab → artifact)
        │
        ▼
Teacher launches activity (sets status = active)
  - launched_at = server UTC timestamp
  - session.current_activity_id = activity_id
        │
        ▼
Students see live activity
  - Timer: endTime = launched_at + duration
  - Questions served by predictor
  - Evidence created on each answer
        │
        ▼
Activity ends (manual or auto-expire)
  - Timed activities auto-complete when duration expires
  - Backend checks on GET /session-activities
  - Teacher can launch next activity
        │
        ▼
Session ends
  - All remaining activities marked completed
  - Cohort.current_session_number += 1 (max 14)
```

### Statefulness Principles

Everything survives page refresh:

| Feature | How It Works |
|---------|-------------|
| Timer | `timeLeft = (launched_at + duration) - Date.now()` — derived from server timestamp |
| Score | `serverScore + localDelta` — server count from evidence API + local increment for instant feedback |
| Activity status | Stored in DB as pending/active/completed |
| Timezone | Backend stores naive UTC; frontend appends "Z" suffix for correct JS parsing |

---

## 5. Evidence Collection Points

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Timed MCQ   │     │  Open-ended  │     │   AI Lab     │
│  Activity    │     │  Activity    │     │  Activity    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       ▼                    ▼                    ▼
  MCQ evidence         Open evidence        MCQ + Open
  source="mcq"        source="open"         evidence
  outcome=0/1         outcome=0.0-1.0
       │                    │                    │
       └────────────┬───────┘────────────────────┘
                    ▼
            ┌───────────────┐     ┌──────────────┐
            │ BKT Engine    │◄────│ Facilitator  │
            │ (10 steps)    │     │ Observation  │
            └───────┬───────┘     │ source="fac" │
                    │             │ outcome=     │
                    ▼             │  0.3/0.5/0.8 │
            Updated student      └──────────────┘
            competency state
            (p_learned, stage,
             confidence)
```

### Question Selection (Predictor)

```
Activity has competency_ids [C4.14.6, C4.15.6, C4.16.6]
        │
        ▼
Load student states for those competencies
        │
        ▼
Auto-promote: if C4.14.6 mastered → add C4.14.7
        │
        ▼
Find questions mapped to all candidate competencies
        │
        ▼
Exclude already-answered questions (this session)
        │
        ▼
Score candidates by:
  - Competency with lowest mastery (focus on weakness)
  - Difficulty near student's current level
  - Variety of competency coverage
        │
        ▼
Return best question + metadata
```
