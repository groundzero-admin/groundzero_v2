# Ground Zero — Technical Design Document

> **Version:** v2.0 | **Date:** March 2026 | **Status:** Backend MVP Complete, Frontend MVP Complete
>
> Based on Signal Design v2, System Design v1, Level 1 & Level 2 Curriculum, ML/KT Research
>
> **ER Diagram:** [Excalidraw](https://excalidraw.com/#json=G2Ko9oBkfE33ESC2AYvH4,26YsNxdchCnUjrnTX57A7w) | **API Reference:** `backend/API_REFERENCE.md` (34 endpoints)

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Universal Competency Model](#2-universal-competency-model)
3. [Skill Graph](#3-skill-graph)
4. [Mastery Engine](#4-mastery-engine)
5. [Evidence Pipeline](#5-evidence-pipeline)
6. [SPARK Diagnostic](#6-spark-diagnostic)
7. [Curriculum Predictor](#7-curriculum-predictor)
8. [Consumer Surfaces](#8-consumer-surfaces)
9. [Infrastructure & Data (AWS)](#9-infrastructure--data-aws)
10. [Implementation Phases](#10-implementation-phases)
11. [Current Implementation](#11-current-implementation)

---

## 1. Product Overview

### Vision

Ground Zero is an AI-powered learning platform for grades 4-9 that tracks student growth across four fundamental pillars — Communication, Creativity, AI/Systems Thinking, and Math/Logic — using a combination of structured assessments, live session transcripts, AI companion interactions, and project artifacts.

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────┐
│                  COMPETENCY MODEL                    │
│  4 Pillars → 16 Capabilities → 59 Competencies      │
│  + prerequisite edges + co-development edges         │
│  (stored as data, not code — versionable)            │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────┐
│                  MASTERY ENGINE                       │
│  Interface: EvidenceEvent[] → StudentState            │
│  Implementation: BKT (swappable later)               │
│  + forgetting curves + stuck detection               │
│  + co-development propagation                        │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │  SPARK   │ │ Curriculum│ │Dashboards│
    │Diagnostic│ │ Predictor │ │& Reports │
    │(seeds    │ │(recommends│ │(consumes │
    │ graph)   │ │ next      │ │ state)   │
    │          │ │ activity) │ │          │
    └──────────┘ └──────────┘ └──────────┘
```

### Key Design Principles

1. **Curriculum-agnostic engine.** The mastery engine knows nothing about specific curricula. It processes evidence events and maintains competency states. Any curriculum module (Level 1, Level 2, Math, future modules) registers its activities with competency mappings.

2. **Model swappability.** The mastery engine exposes a stable interface. BKT sits behind it today. DKT, transformers, or ensembles replace it tomorrow without changing anything above (curriculum predictor, dashboards) or below (evidence pipeline).

3. **LLM-as-assessor for qualitative pillars.** Communication and Creativity cannot be measured by MCQ alone. Session transcripts and SPARK chat logs are assessed by an LLM, which produces structured evidence events that feed the same mastery engine as MCQ responses.

4. **Evidence, not grades.** Every student interaction produces evidence events. There are no grades, no scores shown to students. The system tracks probability of mastery, which is a living, breathing estimate that updates with every new signal.

5. **Graph as data, not code.** The competency model, prerequisite edges, and co-development weights are stored as data (JSON/database), not hardcoded. This means they are versionable, A/B testable, and expandable without code changes.

---

## 2. Universal Competency Model

### Hierarchy

Three levels: **Pillars (4) → Capabilities (16) → Competencies (56)**

- **Pillars** — The domains. Used for parent reports, high-level visualization, and the 4-web skill map.
- **Capabilities** — Major skill areas within each pillar. What the SPARK diagnostic assesses. Lettered A through P.
- **Competencies** — Specific, assessable skills. What BKT tracks per student. What the curriculum predictor uses to select activities.

### Summary

| Pillar | Color | Capabilities | Competencies | MCQ-Primary | LLM-Primary |
|--------|-------|-------------|-------------|-------------|-------------|
| Communication + Argumentation | Red (#c0392b) | 4 (A-D) | 12 | 2 | 10 |
| Creativity + Curiosity | Blue (#2980b9) | 4 (E-H) | 12 | 3 | 9 |
| AI + Systems + Builder Mindset | Green (#27ae60) | 4 (I-L) | 13 | 5 | 8 |
| Math + Logic + Reasoning | Purple (#8e44ad) | 4 (M-P) | 19 | 15 | 4 |
| **Total** | | **16** | **56** | **25** | **31** |

---

### Pillar 1: Communication + Argumentation (Red)

#### Capability A: Listening & Comprehension

| ID | Competency | Description | Assessment |
|----|-----------|------------|------------|
| C1.1 | Active listening & paraphrasing | Can repeat back someone's idea in own words accurately | LLM — Transcript: paraphrase quality after peer speaks |
| C1.2 | Identifying claims vs. supporting detail | Knows what the main point is vs. the evidence | MCQ + Transcript: separates core argument from examples |

#### Capability B: Constructing Arguments

| ID | Competency | Description | Assessment |
|----|-----------|------------|------------|
| C1.3 | Claim with reason | Gives "because" when stating a position — not just the position | LLM — Transcript + Short answer: presence and quality of reasoning |
| C1.4 | Fact vs. opinion vs. misleading | Correctly categorizes statements | MCQ (binary, clean BKT signal) |
| C1.5 | Logical argument chains | Builds premise → premise → conclusion without contradiction | LLM — Transcript: multi-step reasoning in speech |
| C1.6 | Fallacy identification | Spots common fallacies in others' arguments | MCQ + LLM — Transcript: names/describes the flaw |

#### Capability C: Adaptive Communication

| ID | Competency | Description | Assessment |
|----|-----------|------------|------------|
| C1.7 | Audience adaptation | Genuinely changes explanation for different listeners | LLM — Transcript/Short answer: compares versions for register shift |
| C1.8 | Ethical persuasion | Uses logic + emotion + clarity without manipulation | LLM — Assessment on persuasion tasks |
| C1.9 | Constructive feedback | Gives specific, actionable feedback; receives without defensiveness | LLM — Transcript: quality of feedback exchanges |

#### Capability D: Dialogue & Debate

| ID | Competency | Description | Assessment |
|----|-----------|------------|------------|
| C1.10 | Argue the opposing side | Can coherently defend a position they disagree with | LLM — Transcript + SPARK: quality of counter-argument |
| C1.11 | Justified position change | Changes mind AND says why (not social conformity) | LLM — Transcript: before/after tracking + reasoning connector |
| C1.12 | Conflict navigation | De-escalates, finds common ground, proposes resolution | LLM — Transcript: assessment of conflict scenarios |

**Summary:** 12 competencies. ~2 MCQ-assessable (clean BKT). ~10 LLM-assessed from transcripts/SPARK.

---

### Pillar 2: Creativity + Curiosity (Blue)

#### Capability E: Idea Generation

| ID | Competency | Description | Assessment |
|----|-----------|------------|------------|
| C2.1 | Fluency — quantity of ideas | Generates 5+ ideas when prompted, moves past the obvious | MCQ/timed activity: count + speed |
| C2.2 | Flexible categorization | Can regroup the same items in completely different ways | MCQ + Transcript: number of distinct category frames |
| C2.3 | Hypothetical reasoning | Asks "what if" unprompted; reasons about counterfactuals | LLM — SPARK: hypothetical framing in free conversation |

#### Capability F: Creative Depth

| ID | Competency | Description | Assessment |
|----|-----------|------------|------------|
| C2.4 | Idea elaboration over time | Takes a rough idea and develops it across sessions | LLM — Artifact comparison: v1 vs. vN semantic distance |
| C2.5 | Idea evaluation & critique | Can judge which ideas are stronger and articulate why | LLM — SPARK: evaluation language when brainstorming with AI |
| C2.6 | Cross-domain connection | Links ideas from unrelated fields ("this is like...") | LLM — Transcript + SPARK: analogical reasoning detection |

#### Capability G: Curiosity Drive

| ID | Competency | Description | Assessment |
|----|-----------|------------|------------|
| C2.7 | Unprompted question-asking | Asks questions nobody assigned them to ask | LLM — Transcript: question detection. SPARK: self-initiated topics. |
| C2.8 | Sustained deep exploration | Returns to the same topic across sessions; goes 10+ turns deep | SPARK: cross-session topic recurrence + depth |
| C2.9 | Understanding-seeking over answer-getting | Uses resources to understand WHY, not just get THE answer | SPARK: query type classification (explain vs. tell me) |

#### Capability H: Creative Application

| ID | Competency | Description | Assessment |
|----|-----------|------------|------------|
| C2.10 | Real-world problem framing | Identifies a genuine problem worth solving, not a toy scenario | LLM — Artifact + problem statement quality assessment |
| C2.11 | Design under constraints | Creates solutions within stated limitations | LLM — Short answer + Artifact: constraint adherence |
| C2.12 | Human vs. AI creative judgment | Knows when AI output is generic vs. when human judgment adds value | MCQ + SPARK: can distinguish and articulate the difference |

**Summary:** 12 competencies. ~3 MCQ-assessable. ~9 LLM-assessed (mostly from SPARK).

---

### Pillar 3: AI + Systems Thinking + Builder Mindset (Green)

#### Capability I: AI Understanding

| ID | Competency | Description | Assessment |
|----|-----------|------------|------------|
| C3.1 | AI as tool, not truth | Knows AI can be wrong, isn't magic, is a tool | MCQ + SPARK: does the student question AI output? |
| C3.2 | Instruction clarity to systems | Gives precise, unambiguous instructions | MCQ: prompt quality scoring. SPARK: natural prompt behavior. |
| C3.3 | Structured prompting (CLEAR) | Applies framework: Context, Limits, Examples, Audience, Refine | MCQ/Short answer: rubric scoring on prompt submissions |
| C3.4 | Hallucination detection | Tags AI responses as reliable/unsure/dangerous accurately | MCQ (clean binary signal — tagged correctly or not) |

#### Capability J: AI Fluency

| ID | Competency | Description | Assessment |
|----|-----------|------------|------------|
| C3.5 | Prompt iteration | Refines prompt when output is unsatisfactory instead of giving up | SPARK: multi-turn revision detection on same request |
| C3.6 | Agent workflow design | Plans step-by-step AI workflows with verification + fallback | LLM — Short answer: evaluates plan completeness |
| C3.7 | AI as collaborator | Uses AI for brainstorming then applies own judgment to filter/select | SPARK: brainstorm-then-evaluate pattern detection |

#### Capability K: Systems Thinking

| ID | Competency | Description | Assessment |
|----|-----------|------------|------------|
| C3.8 | Input → Process → Output modeling | Can decompose any system into I→P→O | MCQ + Short answer: system decomposition tasks |
| C3.9 | Feedback loop identification | Spots where outputs feed back as inputs; understands amplification/dampening | MCQ + LLM — Transcript: identifies loops in discussion |
| C3.10 | Fairness & bias recognition | Identifies when a system/AI produces biased outcomes and explains why | MCQ + LLM — Transcript: bias reasoning assessment |

#### Capability L: Builder Mindset

| ID | Competency | Description | Assessment |
|----|-----------|------------|------------|
| C3.11 | User need identification | Conducts research, identifies pain points, prioritizes by impact | LLM — Artifact: problem statement against real needs |
| C3.12 | Trade-off reasoning in design | Makes decisions with explicit "we chose X because, the downside is..." | LLM — Transcript + Artifact: trade-off language detection |
| C3.13 | End-to-end product delivery | Takes idea from concept → prototype → pitch → delivery | Artifact: Demo Day rubric (joint AI + facilitator scoring) |

**Summary:** 13 competencies. ~5 MCQ-assessable. ~8 LLM-assessed.

---

### Pillar 4: Math + Logic + Reasoning (Purple)

This pillar has two capability groups: **Reasoning** (from the blended curriculum) and **Math Foundations** (from the standalone Math module). They share the pillar but can be activated independently.

#### Capability M: Logical Reasoning

| ID | Competency | Description | Assessment |
|----|-----------|------------|------------|
| C4.1 | Pattern recognition | Identifies rules in visual/numeric sequences | MCQ (clean BKT) |
| C4.2 | Logic gates (AND/OR/NOT) | Applies boolean logic correctly | MCQ (clean BKT) |
| C4.3 | Decision tree construction | Builds valid if/else trees | MCQ + Short answer |
| C4.4 | If/then chain reasoning | Follows multi-step implications without contradiction | MCQ (clean BKT) |
| C4.5 | Cognitive bias identification | Recognizes biases in own and others' thinking | MCQ + LLM — Transcript |

#### Capability N: Probabilistic & Statistical Reasoning

| ID | Competency | Description | Assessment |
|----|-----------|------------|------------|
| C4.6 | Set theory & Venn reasoning | Classifies correctly, handles overlaps | MCQ (clean BKT) |
| C4.7 | Basic probability | Calculates simple probabilities correctly | MCQ (clean BKT) |
| C4.8 | Conditional probability | Handles Monty Hall-type problems; avoids gambler's fallacy | MCQ (clean BKT) |
| C4.9 | Correlation vs. causation | Distinguishes "X correlates with Y" from "X causes Y" | MCQ + LLM — Transcript: causal reasoning quality |
| C4.10 | Data interpretation & prediction | Reads graphs, identifies trends, makes justified predictions | MCQ (clean BKT) |

#### Capability O: Abstract & Strategic Reasoning

| ID | Competency | Description | Assessment |
|----|-----------|------------|------------|
| C4.11 | Variables & functional relationships | Understands input→output rules, can generalize | MCQ (clean BKT) |
| C4.12 | Game theory basics | Identifies dominant strategies, understands Nash equilibrium intuitively | MCQ + LLM — Short answer |
| C4.13 | Cost-benefit analysis | Weighs trade-offs quantitatively | MCQ + LLM — Artifact |

#### Capability P: Math Foundations (expandable — this is what the Math module plugs into)

| ID | Competency | Description | Assessment |
|----|-----------|------------|------------|
| C4.14 | Number sense & estimation | Quick mental math, reasonable estimates | MCQ (clean BKT, fast response time signal) |
| C4.15 | Fraction operations | Equivalence, addition, subtraction, multiplication of fractions | MCQ (clean BKT) |
| C4.16 | Decimal & percentage reasoning | Converts between forms, applies to real problems | MCQ (clean BKT) |
| C4.17 | Ratio & proportional reasoning | Understands direct/inverse proportion, applies to real contexts | MCQ (clean BKT) |
| C4.18 | Algebraic thinking | Variables, expressions, simple equations | MCQ (clean BKT) |
| C4.19 | Geometric reasoning | Properties of shapes, spatial reasoning, area/perimeter | MCQ (clean BKT) |

**Summary:** 19 competencies. ~15 MCQ-assessable (the BKT sweet spot). ~4 need LLM assessment.

---

## 3. Skill Graph

The skill graph defines how competencies relate to each other. It contains two types of edges.

### 3.1 Prerequisite Edges (Within-Pillar)

These are "must have threshold mastery before progressing" relationships. A student cannot be assigned activities targeting a competency until its prerequisites reach Stage 2+.

```
PILLAR 1 — Communication
C1.1 (listen) ──→ C1.3 (claim + reason)
C1.3 ──→ C1.5 (argument chains)
C1.4 (fact/opinion) ──→ C1.6 (fallacies)
C1.5 ──→ C1.10 (argue opposite side)
C1.5 + C1.6 ──→ C1.11 (justified position change)
C1.7 (audience adapt) ──→ C1.8 (ethical persuasion)

PILLAR 2 — Creativity
C2.1 (fluency) ──→ C2.2 (flexible categorization)
C2.2 ──→ C2.3 (hypothetical reasoning)
C2.7 (unprompted questions) ──→ C2.8 (sustained exploration)
C2.5 (idea evaluation) ──→ C2.11 (design under constraints)
C2.4 (elaboration) + C2.10 (problem framing) ──→ C2.11

PILLAR 3 — AI/Systems/Builder
C3.1 (AI as tool) ──→ C3.2 (instruction clarity)
C3.2 ──→ C3.3 (CLEAR framework)
C3.3 ──→ C3.5 (prompt iteration)
C3.5 ──→ C3.6 (agent workflows)
C3.4 (hallucination detection) ──→ C3.7 (AI as collaborator)
C3.8 (I→P→O) ──→ C3.9 (feedback loops)
C3.9 + C3.10 (bias) ──→ C3.12 (trade-off reasoning)
C3.11 (user needs) + C3.12 ──→ C3.13 (product delivery)

PILLAR 4 — Math/Logic
C4.1 (patterns) ──→ C4.4 (if/then chains)
C4.2 (logic gates) ──→ C4.3 (decision trees)
C4.6 (sets) ──→ C4.7 (basic probability)
C4.7 ──→ C4.8 (conditional probability)
C4.7 + C4.11 (variables) ──→ C4.9 (correlation vs causation)
C4.11 ──→ C4.12 (game theory)
C4.14 (number sense) ──→ C4.15 (fractions) ──→ C4.16 (decimals)
C4.16 ──→ C4.17 (ratios)
C4.17 ──→ C4.18 (algebra)
```

### 3.2 Co-Development Edges (Cross-Pillar)

When a student demonstrates one competency, it's partial evidence for the linked competency. Transfer weights start as hand-set priors; after 6+ months of data, they become learnable.

| Source Competency | Target Competency | Transfer Weight | Rationale |
|------------------|------------------|----------------|-----------|
| C1.5 (argument chains) | C4.4 (if/then reasoning) | 0.30 | Same logical structure. Strong argument = strong logic. |
| C1.4 (fact/opinion) | C3.10 (fairness/bias) | 0.25 | Both require evaluating truth claims. |
| C1.10 (argue opposite side) | C3.10 (fairness/bias) | 0.20 | Perspective-taking is the shared skill. |
| C2.3 (hypothetical reasoning) | C4.8 (conditional probability) | 0.25 | "What if" thinking underlies both. |
| C2.10 (problem framing) | C3.11 (user need identification) | 0.40 | Nearly the same competency, different lens. |
| C2.12 (human vs AI creativity) | C3.7 (AI as collaborator) | 0.30 | Understanding AI's creative limits = using it better. |
| C4.13 (cost-benefit) | C3.12 (trade-off reasoning) | 0.35 | Quantitative vs. qualitative trade-off analysis. |
| C1.6 (fallacy identification) | C4.5 (cognitive bias) | 0.30 | Logical fallacies and cognitive biases overlap heavily. |
| C2.9 (understanding-seeking) | C4.9 (correlation vs causation) | 0.20 | Both require asking "why" not "what." |

All co-development edges are **bidirectional** — evidence transfers in both directions at the specified weight.

### 3.3 Stage Thresholds

P(L) maps to stages 1-5 for reporting and prerequisite checks:

| Stage | Label | P(L) Range | Meaning |
|-------|-------|-----------|---------|
| 1 | Novice | 0.00 – 0.20 | No evidence of competency |
| 2 | Emerging | 0.20 – 0.40 | Beginning to show understanding |
| 3 | Developing | 0.40 – 0.65 | Can do it with support |
| 4 | Proficient | 0.65 – 0.85 | Can do it independently |
| 5 | Mastered | 0.85 – 1.00 | Fluent, can teach others |

### 3.4 Graph Properties

- **Stored as data** (JSON or database rows), not code
- **Versionable** — graph v1.0 can coexist with v1.1 for A/B testing
- **Expandable** — adding competencies or edges requires no code changes
- **No circular prerequisite paths** — enforced at write time
- **Co-development propagation limited to 1 hop** — prevents cascade loops

---

## 4. Mastery Engine

### 4.1 Interface Contract (The API That Never Changes)

Any model that implements this interface is a valid mastery model. BKT implements it today. DKT, transformer, or ensemble implements it tomorrow.

```
MasteryEngine {
  // Student lifecycle
  initStudent(studentId, diagnosticProfile) → StudentState

  // Core: process evidence, return updated state
  processEvidence(studentId, evidence: EvidenceEvent) → StudentState

  // Read state
  getStudentState(studentId) → StudentState
  getCompetencyState(studentId, competencyId) → CompetencyState
  getCapabilityState(studentId, capabilityId) → CapabilityState

  // Predictions
  predictPerformance(studentId, competencyId) → { probability, confidence }

  // Temporal
  applyDecay(studentId) → StudentState  // forgetting curve

  // Graph
  getPrerequisites(competencyId) → CompetencyId[]
  getReadyCompetencies(studentId) → CompetencyId[]  // prereqs met, not yet mastered
}
```

The curriculum predictor, SPARK, dashboards — they all call this interface. They never know what's inside.

### 4.2 BKT Implementation (What Sits Behind the Interface Today)

#### Per-Student x Per-Competency State

```
BKTNodeState {
  pLearned:          number    // P(L) — current mastery [0, 1]
  pGuess:            number    // P(G) — personal guess rate
  pSlip:             number    // P(S) — personal slip rate
  pTransit:          number    // P(T) — personal learning rate

  totalEvidence:     number    // count of all evidence events
  positiveEvidence:  number    // count of positive outcomes
  consecutiveFails:  number
  isStuck:           boolean

  lastEvidenceAt:    Date
  stability:         number    // forgetting half-life (days)

  // Derived
  stage:             1 | 2 | 3 | 4 | 5
  trend:             "improving" | "stable" | "declining"
  confidence:        number    // how reliable is this P(L) estimate
}
```

#### The BKT Update Algorithm (10 Steps)

On receiving an `EvidenceEvent`:

**Step 1: DECAY — Apply forgetting since last evidence**

```
daysSince = (now - lastEvidenceAt) / days
pL = pL0 + (pL - pL0) × e^(-daysSince / stability)
```

Knowledge decays exponentially toward the prior. High stability (from repeated successful practice) means slower decay.

**Step 2: OBSERVE — Bayesian posterior update**

```
If outcome ≥ 0.5 (positive evidence):
  pCorrectGivenL = (1 - pSlip)
  pCorrectGivenNotL = pGuess
  pL_posterior = (pL × pCorrectGivenL) /
                 (pL × pCorrectGivenL + (1-pL) × pCorrectGivenNotL)

If outcome < 0.5 (negative evidence):
  pWrongGivenL = pSlip
  pWrongGivenNotL = (1 - pGuess)
  pL_posterior = (pL × pWrongGivenL) /
                 (pL × pWrongGivenL + (1-pL) × pWrongGivenNotL)
```

Standard Bayesian Knowledge Tracing update. Positive evidence increases P(L), negative decreases it, modulated by guess and slip rates.

**Step 3: WEIGHT — Apply source reliability and response time**

```
pL_weighted = pL + (pL_posterior - pL) × event.weight × speedModifier

Where speedModifier (for MCQ only):
  fast + correct = 1.3   (confident mastery)
  slow + correct = 0.6   (effortful, maybe guessing)
  fast + wrong   = 0.7   (careless slip)
  slow + wrong   = 1.2   (genuine gap)
```

Different evidence sources have different reliability weights: MCQ = 1.0, Transcript = 0.7, SPARK = 0.6, Facilitator = 0.5, Artifact = 0.9.

**Step 4: LEARN — Apply learning transition P(T)**

```
pT_adjusted = pTransit
If meta.aiInteraction == "hint":         pT_adjusted × 1.5
If meta.aiInteraction == "conversation": pT_adjusted × 2.0

pL_new = pL_weighted + (1 - pL_weighted) × pT_adjusted
```

Even after a wrong answer, some learning may occur. AI-assisted learning (hints, SPARK conversation) accelerates the transition.

**Step 5: CONFIDENCE MODIFIER**

```
If confident + wrong: amplify negative update × 1.3
If unconfident + right: dampen positive update × 0.8
Update personal confidenceBias over time
```

Confidence self-reports modify the BKT update. Overconfident wrong answers are more informative (genuine misconception, not carelessness).

**Step 6: STUCK DETECTION**

```
If outcome < 0.5: consecutiveFails++
Else: consecutiveFails = 0
isStuck = consecutiveFails ≥ 4
```

Four consecutive failures triggers a stuck alert. This notifies the teacher dashboard and can trigger SPARK intervention.

**Step 7: STABILITY UPDATE**

```
If positive evidence AND pL > 0.7:
  stability = min(60, stability × 1.4)  // knowledge more durable
```

Successfully demonstrating mastery increases the forgetting half-life. Knowledge that's been practiced to fluency decays more slowly.

**Step 8: CO-DEVELOPMENT PROPAGATION**

```
For each co-development edge from this competency:
  Generate a derived EvidenceEvent for the linked competency
  With weight = original_weight × transfer_weight
  Process it through the same pipeline (max 1 hop — prevents circular propagation)
```

When a student demonstrates argument chains (C1.5), it's partial evidence for if/then reasoning (C4.4) at 0.3× weight.

**Step 9: DERIVE STAGE**

```
stage = f(pL)  // threshold function (see Stage Thresholds table)
trend = compare pL to pL from 5 evidence events ago
```

**Step 10: DERIVE CONFIDENCE**

```
confidence = f(totalEvidence, recency, variance)
// More evidence + recent + low variance = high confidence
// Few observations + old + high variance = low confidence
```

This tells the system (and dashboards) how much to trust this estimate. A P(L) = 0.6 with 2 evidence events is very different from P(L) = 0.6 with 50 evidence events.

### 4.3 LLM Assessment → Evidence Event Conversion

When a session transcript or SPARK chat is assessed by the LLM:

```
LLM receives: transcript + rubric prompt
LLM returns: {
  assessments: [
    {
      competencyId: "C1.5",
      rating: 0.7,           // 0-1 scale
      evidence: "Student said: 'I think the ad is misleading
                because it uses emotional language to hide the
                fact that the product doesn't actually work' —
                this shows multi-step reasoning with evidence.",
      confidence: "high"
    },
    {
      competencyId: "C2.7",
      rating: 0.85,
      evidence: "Student asked 3 unprompted questions during
                discussion, including 'but what if the AI was
                trained on biased data — would it even know?'",
      confidence: "medium"
    }
  ]
}
```

Each assessment becomes a standard `EvidenceEvent`:

```
{
  studentId: "...",
  competencyId: "C1.5",
  source: "llm_transcript",
  outcome: 0.7,
  weight: 0.7,     // transcript source weight
  meta: { evidenceText: "Student said: ..." }
}
```

The engine doesn't know or care that this came from an LLM. It's just an evidence event with a score and a weight.

### 4.4 Model Swappability

The mastery engine interface is the stability guarantee. To swap BKT for DKT:

1. **Implement the same interface** — `processEvidence`, `getStudentState`, `predictPerformance`, etc.
2. **Accept the same `EvidenceEvent` format** — the evidence pipeline doesn't change.
3. **Return the same `StudentState` format** — the curriculum predictor and dashboards don't change.
4. **Run both in parallel** — process the same evidence through both models, compare predictions.
5. **A/B test with real students** — when the new model predicts better, switch.
6. **The swap is a config change** — not a code change.

DKT advantages over BKT: captures temporal patterns, handles multi-skill interactions, learns representations automatically. BKT advantages: interpretable parameters, works with small data, doesn't need GPU.

---

## 5. Evidence Pipeline

### 5.1 EvidenceEvent Schema (Universal Signal Format)

Every signal source produces events in this format. This is what flows through the processing queue.

```
EvidenceEvent {
  id:            string         // unique event ID
  studentId:     string
  competencyId:  string         // target competency
  timestamp:     Date

  // Source
  source:        "mcq" | "llm_transcript" | "llm_spark" |
                 "facilitator" | "artifact" | "diagnostic"
  moduleId:      string         // "level_1" | "math_v1" | "spark" | ...
  sessionId:     string | null

  // The observation
  outcome:       number         // 0-1 (binary for MCQ, continuous for LLM)
  weight:        number         // source reliability (0.5-1.0)

  // Metadata (model can use or ignore)
  meta: {
    responseTimeMs?:  number
    confidence?:      "got_it" | "kinda" | "lost"
    attempts?:        number
    aiInteraction?:   "none" | "hint" | "conversation"
    evidenceText?:    string    // the actual quote/response (for audit)
  }
}
```

### 5.2 Seven Signal Sources

| # | Source | Raw Format | What It Produces | Pillar |
|---|--------|-----------|-----------------|--------|
| 1 | **MCQ Response** | `{ questionId, correct, responseTimeMs, attempts }` | Binary outcome + response time → direct BKT update | Math, AI/Sys |
| 2 | **Confidence Self-Report** | `{ questionId, level: got_it\|kinda\|lost }` | Modifier on BKT update weight (0.6x to 1.35x) | All (modifier) |
| 3 | **SPARK Diagnostic** | Conversation transcript + AI analysis per capability | Seeds P(L₀), P(G), P(S) per student per competency | All 4 pillars |
| 4 | **Session Transcript** | Speaker-diarised text log of full live session | Batch LLM assessment → multiple evidence events per session | Comm, Create |
| 5 | **SPARK Chat Log** | Full student-AI conversation (turns + timestamps) | LLM assessment: curiosity, depth, prompt quality, pushback | Create, AI/Sys |
| 6 | **Facilitator Notes** | `{ studentId, engagement: 1\|2\|3, notableMoment?, interventionFlag }` | Engagement → P(T) modifier. Intervention → parent alert. | All (modifier) |
| 7 | **Project Artifacts** | Product cards, pitch decks, system maps, Demo Day project | Rubric evaluation (joint AI + facilitator) → high-weight evidence | AI/Sys, Create, Comm |

### 5.3 Source Reliability Weights

| Source | Weight | Rationale |
|--------|--------|-----------|
| MCQ | 1.0 | Binary correct/incorrect. Most precise signal. |
| Confidence | Modifier | Not a separate update — modifies MCQ update (0.6x to 1.35x). |
| Diagnostic | Init only | Seeds parameters. Doesn't produce ongoing updates. |
| Transcript | 0.7 | NLP/LLM-derived. Rich but noisy. Batch-processed post-session. |
| SPARK | 0.6 | Self-directed. High variance. Best for curiosity/creativity. |
| Facilitator | 0.5 | Subjective human judgment. Valuable for what algorithms can't see. |
| Artifact | 0.9 | Capstone evaluation. Infrequent but high-weight. Joint AI+human. |

### 5.4 Processing Latency Tiers

| Tier | Latency | Events | Processing |
|------|---------|--------|-----------|
| **Hot Path** | < 200ms | MCQ response + confidence | Direct BKT update → immediate P(L) change → next question selection. Must not block the student. |
| **Warm Path** | 1–30 seconds | SPARK chat turn, facilitator note | Near-real-time. SPARK topic classification, engagement modifier. |
| **Cold Path** | 1–10 minutes | Session transcript, project artifact | Batch LLM assessment. Speaker diarisation, multi-competency evaluation. Produces multiple EvidenceEvents. |
| **Scheduled** | Daily / Weekly | Forgetting decay, parent reports | Cron job applies temporal decay to all P(L) states. Weekly report generation from graph snapshots. |

### 5.5 LLM Assessment Rubric Structure

**For Session Transcripts:**

```
System prompt: You are an educational assessment engine. Given a session
transcript and student identifier, evaluate the student's demonstrated
competencies.

For each competency observed:
- competencyId: the competency code (C1.1 through C4.19)
- rating: 0.0 to 1.0 (0 = no evidence, 0.5 = developing, 1.0 = mastered)
- evidence: the exact quote or behavior that supports this rating
- confidence: "high" | "medium" | "low"

Only assess competencies where you see clear evidence. Do not infer.
Absence of evidence is not evidence of absence.
```

**For SPARK Chat Logs:**

```
System prompt: You are assessing a student's SPARK companion conversation.
Focus on:
- Curiosity signals: topic depth, hypothetical framing, cross-session recurrence
- AI literacy: prompt iteration, pushback on AI, understanding vs answer-seeking
- Communication: quality of questions, reasoning in conversation

For each competency observed, provide competencyId, rating (0-1),
evidence quote, and confidence level.
```

---

## 6. SPARK Diagnostic

### 6.1 Purpose

A 10-minute conversational assessment that seeds the learning graph before a student's first class. Without it, every student starts at P(L) = 0.10 for all 59 competencies — meaning the first 3-4 sessions would be wasted on calibration. The diagnostic provides informed starting points so the curriculum predictor can make good recommendations from day one.

### 6.2 Flow

```
1. Student opens SPARK for the first time
2. SPARK introduces itself as a friendly AI companion
3. SPARK asks ~15-20 adaptive questions over ~10 minutes
4. Each question is designed to assess 1-3 capabilities simultaneously
5. SPARK adapts: if a student shows strength, it probes deeper;
   if they struggle, it moves to a different capability
6. At the end, SPARK produces a DiagnosticProfile
7. The profile seeds the learning graph
8. SPARK seamlessly transitions from assessor mode to companion mode
   (the student doesn't notice a "test" happened)
```

### 6.3 Adaptive Question Selection

**Information-theoretic approach:** At each step, SPARK picks the question that maximally reduces uncertainty across unassessed capabilities.

```
For each candidate question Q:
  expectedInfoGain(Q) = Σ over capabilities C that Q assesses:
    H(C_current) - E[H(C_after_answer)]

  Where H(C) = entropy of the current stage estimate for capability C

Pick the Q with highest expectedInfoGain.
```

In practice, this means:
- Early questions target multiple capabilities (high info gain per question)
- Later questions target the capabilities with the most uncertainty remaining
- If a student is clearly strong in one area, SPARK doesn't waste time confirming — it moves to uncertain areas

### 6.4 Dual Role: Assessor + Conversationalist

SPARK simultaneously converses naturally AND evaluates internally. The student experiences a fun conversation. Internally, SPARK maintains:

```
InternalState {
  capabilityEstimates: Map<CapabilityId, {
    stage: 1-5,
    confidence: "high" | "medium" | "low",
    evidenceCount: number
  }>,
  questionsAsked: number,
  remainingUncertainty: number,
  curiosityTopics: string[]
}
```

### 6.5 Output: DiagnosticProfile

```
DiagnosticProfile {
  capabilityEstimates: {
    "A_listening":         { stage: 2, confidence: "medium" },
    "B_arguments":         { stage: 2, confidence: "high" },
    "E_idea_generation":   { stage: 3, confidence: "high" },
    "M_logical_reasoning": { stage: 2, confidence: "medium" },
    "P_math_foundations":  { stage: 2, confidence: "high" },
    ...all 16 capabilities
  },

  // Specific overrides where a response clearly indicated a competency level
  competencyOverrides: [
    { competencyId: "C4.8", estimatedPL: 0.15,
      reason: "gambler's fallacy on coin flip" },
    { competencyId: "C2.3", estimatedPL: 0.65,
      reason: "strong hypothetical reasoning about island animal" },
  ],

  // Personal parameters
  confidenceBias: +0.3,       // tends overconfident
  responseLatency: "medium",

  // For SPARK personalization
  curiosityTopics: ["space exploration", "AI emotions", "game design"],
}
```

### 6.6 Graph Seeding: How the Profile Becomes Student State

```
For each competency under a capability:
  1. Start with capability stage → convert to P(L₀) prior
     Stage 1 → P(L₀) = 0.10
     Stage 2 → P(L₀) = 0.30
     Stage 3 → P(L₀) = 0.50
     Stage 4 → P(L₀) = 0.70
     Stage 5 → P(L₀) = 0.85

  2. Apply competency override if one exists
     (e.g., C4.8 gets 0.15 instead of the capability default)

  3. Ensure prerequisite consistency
     If a competency is estimated above its prerequisite,
     bump the prerequisite up (you can't do conditional probability
     without basic probability)

  4. Set personal BKT parameters from diagnostic
     pGuess = default (0.25) adjusted by confidenceBias
     pSlip = default (0.10) adjusted by responseLatency
     pTransit = default (0.15) — will individualize from data

  5. Set confidence = "low" for everything
     (10 minutes of conversation ≠ reliable estimates)
     The system knows these are priors, not truths.
```

Within 3-4 sessions, real evidence starts overriding the diagnostic priors. The diagnostic just ensures the student isn't bored (everything too easy) or lost (everything too hard) during those first sessions.

### 6.7 Grade-Band Question Banks

Questions are organized by grade band (4-5, 6-7, 8-9) and calibrated for age-appropriate language and complexity. The existing diagnostic question banks from the Signal Design document serve as the starting point, with each question tagged to the capabilities it assesses.

---

## 7. Curriculum Predictor

### 7.1 The Problem

Given a student's state across 59 competencies + a registry of available activities, what should they do next?

### 7.2 Activity Registry

Every curriculum module registers its activities with competency mappings:

```
Activity {
  id:             string
  moduleId:       string          // "level_1" | "math_v1" | ...
  name:           string
  type:           "warmup" | "key_topic" | "diy" | "ai_lab" | "artifact"

  // What it develops
  primaryCompetencies:   { competencyId, expectedGain }[]
  secondaryCompetencies: { competencyId, expectedGain }[]

  // What it requires
  prerequisites: { competencyId, minStage }[]

  // Metadata
  duration:       number          // minutes
  gradeBands:     ("4-5" | "6-7" | "8-9")[]
  signalSources:  ("mcq" | "short_answer" | "transcript" | "spark" | "artifact")[]
}
```

### 7.3 Phase 1 — Rule-Based (MVP, Day 1)

The expert curriculum (the 14-session Level 1 sequence) is the default path for all students. The predictor makes **deviations** from this default based on student state.

**Scoring function:**

```
Score(activity, student) =
  Σ (competency_gap × expected_gain × prerequisite_met)
  across all primary + secondary competencies

Where:
  competency_gap = how far from mastery (biggest gap = most room to grow)
  expected_gain = how much this activity typically improves this competency
  prerequisite_met = 1 if all prereqs satisfied, 0 if not
```

**Within-activity adaptation (BKT-driven question selection):**

- For activities with MCQ components, the system selects questions targeting the student's zone of proximal development
- Too easy (P(L) > 0.85): skip or challenge version
- Too hard (prerequisites not met): scaffold or easier version
- Sweet spot (P(L) 0.3-0.7): maximum learning rate

**Diagnostic-informed deviations:**

- If SPARK diagnostic shows a student is already Stage 3+ on a competency that Session 2 targets → skip ahead or offer enrichment
- If a student is Stage 1 on a prerequisite for the current session → provide prerequisite scaffolding first

### 7.4 Phase 2 — Contextual Bandit (Month 3-6)

Once the MVP has collected enough (student_state, activity, outcome) tuples, the rule-based predictor can be replaced with a contextual bandit.

```
Context = student state vector (56-dimensional P(L) vector + metadata)
Arms    = available activities
Reward  = learning gain (P(L) delta after activity)
```

**Training data:** Every MVP session produces training examples:
- Student state snapshot before activity
- Activity that was assigned
- Student state snapshot after activity
- Delta = learning gain

**Exploration vs. exploitation:** Thompson sampling or epsilon-greedy. The bandit occasionally tries non-optimal activities to discover better paths.

### 7.5 Phase 3 — RL Path Planner (Month 12+)

The contextual bandit optimizes single-step decisions. An RL agent optimizes multi-session sequences.

```
State   = student competency vector (56-dim) + session history
Action  = next activity to assign
Reward  = learning gain (immediate) + engagement (immediate) +
          Demo Day readiness (delayed)
```

**Compound objective:**
- **Mastery gain** — weighted by competency importance and prerequisite urgency
- **Engagement** — facilitator engagement scores, SPARK usage, attendance
- **Demo Day readiness** — are the competencies needed for the final project on track?

### 7.6 Data Instrumentation (What the MVP Must Log from Day 1)

To enable Phase 2 and Phase 3, the MVP must log:

1. **Student state snapshot before every activity** — the 56-dimensional P(L) vector
2. **Activity assignment** — what was assigned and why (rule-based score)
3. **Student state snapshot after every activity** — for computing deltas
4. **Engagement signal** — facilitator engagement rating for that session
5. **Time-on-task** — how long the student actually spent
6. **Activity completion** — did the student finish?
7. **Student choice data** — when students choose between activities, what did they pick?

This data accumulates into the training set for the contextual bandit.

---

## 8. Consumer Surfaces

### 8.1 Student App (Built)

The student frontend is a React SPA with two learning modes:

**Two Learning Modes:**

| Mode | How it works |
|------|-------------|
| **Live Sessions** (teacher-led) | Student → cohort → active session → activity's competencies → ZPD-matched questions. Teacher assigns skills via session's activity. All students in cohort learn same competencies but get personalized difficulty. |
| **Self-serve Practice** (student-driven) | Student browses 4 pillar accordions → picks a competency → practices at `/practice?competency=C4.1`. No session context. |

**Implemented Surfaces:**

| Surface | Status | Description |
|---------|--------|-------------|
| **Dashboard** | Built | WelcomeCard (avatar, XP, streak, level), PillarProgress (2x2 grid), SessionsCard (LIVE NOW / no session), PracticePicker (pillar → competency browser), JourneyTimeline (session-based with scores), MessageBox |
| **Live Class View** | Built | Mock video area (facilitator name, LIVE badge, student thumbnails, media controls), ConfidenceChips ("Got it / Kinda / Lost" + privacy note), ActivityPanel (session-driven competency tabs + MCQ), BKTUpdateToast (P(L) change after submission) |
| **Self-serve Practice** | Built | PracticePage at `/practice?competency=X` — competency name, stage, progress bar, MCQ questions, BKT toast |
| **AI Companion** | Shell only | Visual UI with "Coming soon" placeholder. No backend AI agent yet. Ready to wire up when `/chat` endpoint is added. |
| **Skill Map** | Planned | 4-pillar spider/web visualization. Each pillar shows Stage 1-5. |

**Tech Stack (Frontend):**
- React 18 + TypeScript + Vite
- Vanilla Extract (zero-runtime CSS-in-TypeScript, `.css.ts` files) — NOT Tailwind
- React Router v7
- TanStack Query for server state
- Framer Motion for animations
- Lucide React for icons
- Axios for HTTP client

**Key Data Flows:**
```
Dashboard:
  useStudentState(id)          → 59 competency states (pillar progress)
  useActiveSession(cohort_id)  → polls every 15s for live session
  useCohortSessions(cohort_id) → all sessions (journey timeline)
  useEvidenceHistory(id)       → evidence (streak, timeline scores)

Live:
  useActiveSession(cohort_id)  → find active session
  useActivity(activity_id)     → get session's activity + competencies
  useNextQuestions(id, comp_id)→ ZPD-matched questions per competency
  useSubmitEvidence()          → POST /evidence → BKT update toast

Self-serve:
  useCompetencies()            → all competency details (practice picker)
  useNextQuestions(id, comp_id)→ ZPD-matched questions
  useSubmitEvidence()          → POST /evidence (no session_id)
```

### 8.2 Teacher Dashboard (Planned)

| Surface | Description |
|---------|-------------|
| **Live Class Grid** | Real-time P(L) indicators per student per competency being assessed in current activity. Color-coded: red (struggling) → yellow (developing) → green (proficient). |
| **Stuck Alerts** | Real-time notifications when any student hits 4+ consecutive failures. Suggested intervention actions. |
| **Suggested Questions** | BKT-driven question recommendations: "Push this question to the class — 60% of students are in the sweet spot for C4.7." |
| **Post-Session Form** | 3-tap form per student: engagement (engaged/partial/motions). Optional free-text notable moment. Intervention flag. Takes < 2 minutes. Backend API exists: `POST /sessions/{id}/facilitator-notes`. |
| **Class Trends** | Week-over-week competency progress. Identifies class-wide gaps. Informs session planning. |

### 8.3 Parent Report (Planned — Weekly, AI-Generated)

| Component | Description |
|-----------|-------------|
| **Narrative Summary** | 3-4 sentence AI-generated summary of the week's highlights. Written in accessible language. |
| **4-Pillar Progress Web** | Spider chart showing Stage 1-5 per pillar, with last week's outline overlaid for comparison. |
| **Curiosity Map** | Topics the student explored in SPARK this week. What they're interested in. |
| **Suggested Home Activities** | "Your child showed interest in X — try Y at home." Based on SPARK curiosity profile + curriculum alignment. |

### 8.4 Admin Analytics (Planned)

| Surface | Description |
|---------|-------------|
| **Cohort Metrics** | Aggregate competency distributions, progress rates, stuck rates across cohorts. |
| **Signal Health** | Are all 7 signal sources producing data? Processing latency monitoring. LLM assessment quality checks. |
| **Model Accuracy** | BKT prediction accuracy: does P(L) predict actual performance on held-out questions? Calibration curves. |

---

## 9. Infrastructure & Data (AWS)

### 9.0 Current Dev Stack

The MVP runs locally with:

| Layer | Technology | Details |
|-------|-----------|---------|
| **Frontend** | React + Vite | `localhost:3001`, proxies `/api` → backend |
| **Backend** | FastAPI (uvicorn) | `localhost:8000`, 34 API endpoints |
| **Database** | PostgreSQL (local) | All 11 tables, seeded with 59 competencies, 91 activities, 206 questions |
| **Styling** | Vanilla Extract | Zero-runtime CSS-in-TypeScript (`.css.ts` files) |
| **State** | TanStack Query | Server state caching, polling, cache invalidation |

The AWS architecture below is the production target.

### 9.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                         │
│              AWS Amplify (Hosting + CI/CD)                    │
│                                                              │
│  Student App  │  Teacher Dashboard  │  Parent Report  │ Admin │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────┴───────────────────────────────────────┐
│                  API LAYER (Python / FastAPI)                  │
│            API Gateway + Lambda (via Mangum)                  │
│         or ECS/Fargate for persistent API                    │
└──────────────────────┬───────────────────────────────────────┘
                       │
    ┌──────────┬───────┴───────┬──────────┬──────────┐
    │          │               │          │          │
┌───┴───┐ ┌───┴───┐   ┌──────┴──┐  ┌────┴────┐ ┌───┴────┐
│  RDS  │ │ Redis │   │   SQS   │  │   S3    │ │Bedrock │
│Postgres│ │ElastiC│   │Job Queue│  │Storage  │ │Claude  │
│       │ │ ache  │   │         │  │         │ │  API   │
└───────┘ └───────┘   └────┬────┘  └─────────┘ └────────┘
                           │
                    ┌──────┴──────┐
                    │   Lambda    │
                    │ Cold Path   │
                    │ Processing  │
                    └─────────────┘
```

### 9.2 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React SPA (Vite + Vanilla Extract) on AWS Amplify | Hosting, CI/CD, custom domains |
| **Backend** | Python (FastAPI) | Single language for API, BKT engine, ML pipeline, and future ML models |
| **API** | API Gateway + Lambda (via Mangum) | Serverless API. Or ECS/Fargate for persistent API if Lambda cold starts are an issue. |
| **Database** | Amazon RDS (PostgreSQL) | Entities, skill graph, student states, evidence events, activity registry |
| **Cache** | Amazon ElastiCache (Redis) | Hot-path BKT state reads during live class. Student state cached for < 200ms MCQ response. |
| **Storage** | Amazon S3 | Session transcripts, SPARK chat logs, recordings, project artifacts |
| **Job Queue** | Amazon SQS | Async processing: evidence processing, LLM assessment triggers, report generation |
| **Serverless Compute** | AWS Lambda | Cold-path processing: transcript assessment, decay jobs, report generation |
| **AI/LLM** | Amazon Bedrock (Claude) or direct Anthropic API | SPARK companion, LLM assessments, report generation |
| **Auth** | Amplify Auth (Cognito) | Student/teacher/parent authentication with role-based access |

### 9.3 Why Python (FastAPI) as Single Backend Language

- BKT engine is numerical/statistical — Python is natural
- Future ML models (DKT, contextual bandit, RL) are Python-native (PyTorch, scikit-learn)
- LLM integration (Anthropic SDK) is Python-first
- NumPy/SciPy for BKT math
- FastAPI is high-performance async Python — comparable to Node.js for API workloads
- One language = one team, one deployment pipeline, one debugging experience

### 9.4 Data Flow by Processing Tier

**Hot Path (< 200ms):**
```
Student answers MCQ
  → API Gateway → Lambda/FastAPI
  → Read student state from Redis cache
  → BKT update (in-memory computation)
  → Write updated state to Redis + RDS
  → Return next question recommendation
```

**Warm Path (1-30s):**
```
SPARK chat message | Facilitator note
  → API Gateway → Lambda/FastAPI
  → Publish to SQS
  → Lambda consumer processes
  → BKT update → write to RDS + invalidate Redis
```

**Cold Path (1-10 min):**
```
Session ends → transcript uploaded to S3
  → S3 event → SQS
  → Lambda: send transcript to Bedrock/Claude for assessment
  → LLM returns competency ratings
  → Generate EvidenceEvents
  → Process through BKT engine
  → Write to RDS + invalidate Redis
```

**Scheduled:**
```
Daily cron (CloudWatch Events → Lambda):
  → Apply forgetting decay to all student states
  → Update stages and trends

Weekly cron:
  → Generate parent reports (Bedrock/Claude)
  → Snapshot cohort analytics
```

### 9.5 Database Schema (Implemented — 11 Tables)

```sql
-- Skill Framework
pillars (id PK, name, color, description, created_at)
capabilities (id PK, pillar_id FK→pillars, name, description, created_at)
competencies (id PK, capability_id FK→capabilities, name, description,
              assessment_method, default_params JSONB, created_at)
prerequisite_edges (source_id FK→competencies, target_id FK→competencies, min_stage)
codevelopment_edges (source_id FK→competencies, target_id FK→competencies,
                     transfer_weight, rationale)

-- Content
activities (id PK, module_id, name, type, week, session_number, duration_minutes,
            grade_bands JSONB, description, learning_outcomes JSONB,
            primary_competencies JSONB, secondary_competencies JSONB,
            prerequisites JSONB, created_at)
questions (id UUID PK, module_id, competency_id FK→competencies, text, type,
           options JSONB, correct_answer, difficulty, grade_band, explanation, created_at)

-- Delivery
cohorts (id UUID PK, name, grade_band, created_at)
sessions (id UUID PK, cohort_id FK→cohorts, activity_id, facilitator_name,
          started_at, ended_at)
facilitator_notes (id UUID PK, session_id FK→sessions, student_id FK→students,
                   engagement, notable_moment, intervention_flag, created_at)

-- Student Tracking
students (id UUID PK, name, grade, grade_band, cohort_id, diagnostic_completed,
          diagnostic_profile JSONB, created_at, updated_at)
student_competency_states (
  student_id FK→students, competency_id FK→competencies,  -- composite PK
  p_learned, p_transit, p_guess, p_slip,
  total_evidence, consecutive_failures, is_stuck,
  last_evidence_at, stability, avg_response_time_ms,
  stage, confidence, updated_at
)
evidence_events (
  id UUID PK, student_id FK→students, competency_id FK→competencies,
  source, module_id, session_id,  -- session_id is loose ref (not FK)
  outcome, weight, meta JSONB,
  is_propagated, source_event_id, created_at
)
```

**Seed data:** 4 pillars, 16 capabilities, 59 competencies, 91 activities, 206 questions, skill graph edges

### 9.6 Scale Estimates

| Metric | 100 Students | 1,000 Students | 10,000 Students |
|--------|-------------|----------------|-----------------|
| MCQ events/day | ~500 | ~5,000 | ~50,000 |
| Transcript assessments/day | ~10 | ~100 | ~1,000 |
| SPARK chat turns/day | ~1,000 | ~10,000 | ~100,000 |
| BKT state reads/day | ~2,000 | ~20,000 | ~200,000 |
| LLM API calls/day | ~50 | ~500 | ~5,000 |
| Storage growth/month | ~1 GB | ~10 GB | ~100 GB |

At 100 students, a single Lambda function handles everything. At 10,000, you need Redis caching and SQS queuing, but it's still well within AWS managed service limits.

### 9.7 Privacy Considerations

| Concern | Approach |
|---------|----------|
| **COPPA Compliance** | Students are minors (ages 9-15). Parental consent required before data collection. No direct marketing to students. |
| **Data Retention** | Evidence events retained for model training. Transcripts and recordings retained per policy (e.g., 2 years). Student data deletable on request. |
| **Consent** | Parents must opt-in to: SPARK companion, transcript recording, LLM assessment. Clear data usage policy. |
| **Data Residency** | AWS region selected for data residency requirements (e.g., ap-south-1 for India). |
| **Access Control** | Role-based: students see own data only. Teachers see their cohort. Parents see their children. Admins see aggregate. |
| **Encryption** | At rest (RDS encryption, S3 encryption) and in transit (HTTPS, TLS). |

---

## 10. Implementation Phases

### Phase 1: MVP (Month 1-3) — COMPLETE

**Goal:** Working system with basic adaptive learning for 1-2 cohorts.

| Component | Scope | Status |
|-----------|-------|--------|
| Competency model | All 59 competencies defined and stored as data | Done |
| Mastery engine | BKT implementation with full algorithm | Done |
| Evidence pipeline | MCQ (hot path) + facilitator notes (warm path) | Done |
| SPARK diagnostic | Basic diagnostic flow, seeds learning graph | Done |
| Curriculum predictor | Rule-based: ZPD question selection + activity recommendations | Done |
| Student app — Dashboard | WelcomeCard, PillarProgress, SessionsCard, PracticePicker, JourneyTimeline | Done |
| Student app — Live | Session-driven MCQ, ConfidenceChips, BKT toast, ActivityPanel | Done |
| Student app — Self-serve | PracticePage: pillar → competency → practice | Done |
| Backend API | 34 endpoints (students, competencies, activities, questions, sessions, cohorts, evidence, skill-graph) | Done |
| AI Companion | Shell-only UI placeholder | Done (shell) |
| Infrastructure — Local | FastAPI + PostgreSQL + Vite dev server | Done |
| Infrastructure — AWS | RDS + Redis + S3 + SQS + Lambda + Amplify | Planned |

**Not in Phase 1:** LLM transcript assessment, parent reports, contextual bandit, SPARK companion backend, teacher dashboard frontend.

### Phase 2: LLM Integration (Month 3-6)

| Component | Scope |
|-----------|-------|
| LLM transcript assessment | Cold-path processing of session transcripts via Bedrock/Claude |
| SPARK companion | Free-range AI chat with curiosity tracking |
| Parent reports | Weekly AI-generated narrative reports |
| Math module | Capability P (Math Foundations) with dedicated question bank |
| Contextual bandit | Begin training on accumulated (state, activity, outcome) data |
| Confidence self-reports | Added to MCQ flow, feeding BKT modifier |

### Phase 3: ML Pipeline (Month 6-12)

| Component | Scope |
|-----------|-------|
| Full NLP pipeline | All 7 signal sources operational |
| Contextual bandit | Replace rule-based predictor for activity selection |
| Advanced analytics | Model accuracy tracking, cohort trends, signal health monitoring |
| Model comparison | Run BKT and DKT in parallel, compare predictions |
| Project artifact assessment | LLM + facilitator joint rubric evaluation |

### Phase 4: Full Personalization (Month 12+)

| Component | Scope |
|-----------|-------|
| Model swap evaluation | If DKT outperforms BKT, swap (config change, not code change) |
| RL path planner | Multi-session sequence optimization |
| Full personalized paths | Each student gets a unique activity sequence |
| Scale infrastructure | Optimize for 10,000+ students |
| Co-development learning | Transfer weights learned from data instead of hand-set |

---

## 11. Current Implementation

### 11.1 Backend (Complete)

**Stack:** FastAPI (async) + SQLAlchemy (async ORM) + PostgreSQL + Alembic migrations

**34 API endpoints** across 8 tags:

| Tag | Count | Endpoints |
|-----|-------|-----------|
| students | 9 | Register, List, Get Profile, Assign to Cohort, Full Mastery Profile, Single Competency Mastery, Recommend Next Activities, Adaptive Practice Questions, Diagnostic Assessment |
| competencies | 7 | List All, Get Details, Create Competency, List Pillars, Create Pillar, List Capabilities, Create Capability |
| activities | 3 | Browse All, Get Details, Create Activity |
| questions | 2 | Browse Question Bank, Add Question |
| sessions | 6 | List, Start New, Get Details, End Live, Record Facilitator Observation, Get Session Observations |
| cohorts | 3 | List All, Create, Get Details |
| evidence | 2 | Submit Learning Evidence, Get Learning History |
| skill-graph | 1 | Get Skill Dependency Graph |

**Key services:**
- `app/engine/bkt.py` — BKT update formula, stage thresholds (5 stages), source weights (mcq=1.0, facilitator=0.5, diagnostic=0.8)
- `app/services/predictor_service.py` — ZPD-based question selection, activity recommendations
- `app/services/evidence_service.py` — Evidence processing pipeline (BKT update + codevelopment propagation)

**Seed data:** 59 competencies, 91 activities, 206 questions, 4 pillars, 16 capabilities, prerequisite + codevelopment edges

### 11.2 Frontend (Complete)

**Stack:** React 18 + TypeScript + Vite + Vanilla Extract (zero-runtime CSS) + React Router v7 + TanStack Query + Framer Motion + Lucide React

**Pages:**

| Route | Page | Description |
|-------|------|-------------|
| `/` | StudentSelectPage | Dev page: pick a student |
| `/dashboard` | DashboardPage | Welcome card, pillar progress, sessions, practice picker, journey timeline |
| `/live` | LivePage | Session-driven live learning with video area, confidence chips, MCQ questions |
| `/practice` | PracticePage | Self-serve practice (`?competency=C4.1`) |

**API hooks (11):** useStudentState, usePillars, useCompetencies, useNextQuestions, useActivities, useSubmitEvidence, useEvidenceHistory, useStudents, useActiveSession, useCohortSessions, useActivity

**Design system:** Vanilla Extract theme contract (`vars.color.*`, `vars.font.*`, `vars.space.*`), Nunito + Inter fonts, warm cream background (#F5F0EB), pillar-colored accents, folder-per-component pattern

### 11.3 Two Learning Modes

**Live Sessions (teacher-led):**
```
Student → cohort_id → active session (polls 15s) → activity_id
  → activity's primary_competencies → ZPD-matched questions per competency
  → student answers → POST /evidence (with session_id) → BKT update toast
```
- Teacher assigns competencies via the session's activity
- All students in a cohort learn the same competencies; questions are personalized by difficulty
- Confidence chips: "Got it / Kinda / Lost" sent as meta in evidence

**Self-serve Practice (student-driven):**
```
Dashboard → PracticePicker → 4 pillar accordions → competency list
  → navigate to /practice?competency=C4.1 → ZPD-matched questions
  → POST /evidence (no session_id) → BKT update toast
```
- LLM-only competencies dimmed (can't practice via MCQ)

### 11.4 What's Built vs Planned

| Component | Status |
|-----------|--------|
| BKT mastery engine | Built |
| 34 REST API endpoints | Built |
| Student dashboard (pillar progress, XP, streak, timeline) | Built |
| Live session UI (video mock, MCQ, confidence chips) | Built |
| Self-serve practice mode | Built |
| Seed data (59 competencies, 91 activities, 206 questions) | Built |
| ER diagram + API reference docs | Built |
| Framer Motion animations / polish | Pending |
| Responsive breakpoints | Pending |
| Loading / error / empty states | Pending |
| Facilitator dashboard | Planned |
| AI Companion backend (`/chat` endpoint) | Planned |
| SPARK diagnostic UI | Planned |
| AWS deployment | Planned |

---

## Appendix: Key Reference Documents

- **Signal Design v2:** `ground_zero_signal_design_v3.html` — the five signal sources, signal taxonomy, progression arcs, onboarding diagnostic questions
- **System Design v1:** `ground_zero_system_design.html` — entity model, 5-layer architecture, data schemas, event bus
- **Level 1 Curriculum:** `Ground Zero Curriculum - Level 1.csv` — 14-session curriculum with activities and learning outcomes
- **BKT Simulation:** `bkt-simulation.jsx` — interactive BKT simulation with forgetting curves, stuck detection, and AI interaction boost
- **ML/KT Research:** `ML_Knowledge_Tracing_Research.pdf` — literature review of knowledge tracing approaches (BKT, DKT, transformers)
