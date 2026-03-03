# AI Companion (SPARK) — Jobs To Be Done

## What is SPARK?

SPARK is the AI companion embedded in Ground Zero. It's not a chatbot that gives answers — it's a thinking partner that helps students understand *why* they got something wrong, diagnoses the real skill gap, and routes richer signals into the BKT engine than binary right/wrong.

The student experiences a friendly conversation. The system gets multi-competency evidence at 0.6-0.7 weight that MCQs alone can't capture — especially for Communication and Creativity pillars.

---

## Job 1: Post-MCQ Diagnosis ("I got it wrong — but why?")

**When** a student answers an MCQ wrong (or right but says "kinda"/"lost"),
**I want to** understand what specific gap caused the mistake,
**So that** the BKT engine updates the *right* competency, not just the one the question was tagged to.

### Scenario
Student gets a fractions MCQ wrong. The question is tagged to `C4.5 (Fractions & Ratios)`. But the real issue might be:
- They can't read the number line → `C4.1 (Number Sense)`
- They misread the word problem → `C1.3 (Reading Comprehension)`
- They actually understand fractions but made a careless slip → no real gap

### How it works
1. After submitting a wrong answer (or correct + "kinda"/"lost"), a chat drawer slides up
2. SPARK says: *"Hmm, that was tricky! Can you walk me through what you were thinking?"*
3. 2-4 turn conversation (60-90 seconds max)
4. SPARK internally classifies the root cause and generates evidence events for the actual weak competencies
5. Evidence submitted as `source: "llm_spark"` (weight 0.6) with `ai_interaction: "conversation"`

### Signals generated
- `competency_id`: the *diagnosed* competency (may differ from question's tagged competency)
- `outcome`: 0.0-1.0 (continuous, not binary)
- `meta.evidence_text`: the student quote that supports the assessment
- BKT P(T) boost: 2.0x (conversation mode) — student is actively learning through reflection

### Constraints
- Max 4 turns. Not a tutoring session — a diagnostic moment.
- SPARK never gives the answer. It asks *"What part felt confusing?"* not *"The answer is B."*
- Student can dismiss at any time. The MCQ evidence still stands.

---

## Job 2: Curiosity Companion ("I want to explore this more")

**When** a student finishes a practice set or is between activities,
**I want to** explore a topic that interests me with an AI that adapts to my level,
**So that** I learn through conversation and the system captures signals about my thinking quality.

### Scenario
Student finishes a fractions practice set. SPARK says: *"You crushed fractions! Did you know fractions are how music works? Want to explore that?"* Or the student just types a question: *"Why can't you divide by zero?"*

### How it works
1. Student opens SPARK from the companion panel (always accessible)
2. Free-form conversation — SPARK follows the student's curiosity
3. SPARK steers toward depth: *"Interesting! What do you think would happen if..."*
4. After the conversation ends (student closes or natural pause), SPARK assesses the transcript
5. Evidence submitted for observed competencies (Creativity, Communication, AI Literacy)

### Signals generated
- Curiosity depth → `C2.7 (Curiosity & Exploration)` or `C2.3 (Hypothesis Generation)`
- Quality of questions → `C1.2 (Articulation)` or `C1.5 (Critical Evaluation)`
- AI literacy signals → `C3.1 (AI Awareness)` if student pushes back on SPARK or iterates prompts
- All as `source: "llm_spark"`, weight 0.6

### Constraints
- SPARK adapts language to student's grade level (uses student.grade)
- No time limit, but SPARK naturally wraps up after ~5 minutes
- Assessment happens async (warm path, 1-30s) — student doesn't wait

---

## Job 3: Concept Hint During Practice ("I'm stuck on this question")

**When** I'm staring at an MCQ and don't know where to start,
**I want to** get a hint that helps me think without giving away the answer,
**So that** I can solve it myself and actually learn.

### Scenario
Student has been on a question for 30+ seconds without selecting anything. Or they tap "Need a hint?"

### How it works
1. Student taps hint button (or SPARK proactively offers after inactivity)
2. SPARK provides a *thinking scaffold*: *"What do you know about how fractions compare? Try thinking about the numerators first."*
3. Single turn — no extended conversation
4. Student answers the MCQ
5. Evidence is submitted with `ai_interaction: "hint"` — P(T) boost of 1.5x (less than full conversation)

### Signals generated
- Standard MCQ evidence but with `ai_interaction: "hint"` modifier
- If student gets it right after hint → real understanding (boosted learning transition)
- If student still gets it wrong after hint → deeper gap (the hint wasn't enough)

### Constraints
- Hint never reveals the answer
- One hint per question
- Hint mode is lighter than full conversation — no evidence extraction from the hint interaction itself

---

## Job 4: SPARK Diagnostic ("First time here — who is this student?")

**When** a new student joins Ground Zero for the first time,
**I want to** have a natural 10-minute conversation that secretly assesses their starting level,
**So that** the BKT engine has informed priors instead of assuming everyone starts at P(L) = 0.10.

### Scenario
New student opens the app. Instead of a boring placement test, SPARK says: *"Hey! I'm SPARK. I'm curious about how you think. Can I ask you a few fun questions?"*

### How it works
1. Triggered on first login (no existing BKT state)
2. ~15-20 adaptive questions over ~10 minutes
3. Information-theoretic question selection: each question maximally reduces uncertainty
4. Student experiences a fun conversation, not a test
5. Produces a DiagnosticProfile that seeds P(L₀) for all competencies
6. Evidence submitted as `source: "diagnostic"` (weight 0.8)

### Signals generated
- Capability-level stage estimates (1-5) for all 16 capabilities
- Specific competency overrides where a response clearly indicates a level
- Personal BKT parameter adjustments (confidence bias, response latency)
- Curiosity topics for future SPARK personalization

### Constraints
- This is a **Phase 2** feature. Not in MVP.
- Requires structured question bank organized by grade band (4-5, 6-7, 8-9)
- Must feel conversational, not test-like

---

## What We Build Now (MVP Scope)

**Job 1 (Post-MCQ Diagnosis)** and **Job 3 (Hint)** are the MVP.

They're the highest-signal, lowest-complexity entry points:
- Triggered from existing MCQ flow (no new navigation)
- Short interactions (1-4 turns)
- Directly improve BKT accuracy for every student
- Evidence pipeline already supports `llm_spark` and `ai_interaction`

### MVP Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend                                               │
│                                                         │
│  PracticePage / LivePage                                │
│    └─ MCQQuestion                                       │
│         ├─ [wrong / kinda / lost] → SPARKDrawer opens   │
│         └─ [stuck 30s / tap hint] → Hint bubble          │
│                                                         │
│  SPARKDrawer (slide-up chat panel)                      │
│    ├─ Message list (student + SPARK turns)              │
│    ├─ Text input                                        │
│    └─ "Skip" dismiss button                             │
└───────────────────────┬─────────────────────────────────┘
                        │ POST /api/v1/spark/turn
                        │ POST /api/v1/spark/hint
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Backend                                                │
│                                                         │
│  app/api/spark.py                                       │
│    ├─ POST /spark/conversations      (start)            │
│    ├─ POST /spark/conversations/:id/turn  (chat turn)   │
│    ├─ POST /spark/hint               (one-shot hint)    │
│    └─ POST /spark/conversations/:id/end   (wrap up)     │
│                                                         │
│  app/services/spark_service.py                          │
│    ├─ LangGraph agent with checkpointing                │
│    ├─ System prompt: diagnostic, not tutoring            │
│    ├─ Tool: submit_evidence() — routes to BKT engine    │
│    └─ Tool: get_student_context() — reads BKT state     │
│                                                         │
│  PostgreSQL                                             │
│    ├─ spark_conversations (id, student_id, question_id, │
│    │    trigger, status, created_at)                     │
│    ├─ spark_messages (id, conversation_id, role,        │
│    │    content, created_at)                              │
│    └─ LangGraph checkpoint tables (auto-managed)        │
│                                                         │
│  LLM (Claude API)                                       │
│    ├─ Diagnostic prompt: classify root cause             │
│    ├─ Evidence extraction: competency + rating + quote   │
│    └─ Hint generation: scaffold without revealing answer │
└─────────────────────────────────────────────────────────┘
```

### MVP Data Model

**spark_conversations**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| student_id | UUID FK → students | |
| question_id | UUID FK → questions, nullable | The MCQ that triggered this |
| trigger | enum | `wrong_answer`, `low_confidence`, `hint_request`, `free_chat` |
| status | enum | `active`, `completed`, `dismissed` |
| competency_id | string | Primary competency context |
| evidence_submitted | boolean | Whether SPARK generated evidence from this |
| created_at | timestamp | |
| ended_at | timestamp, nullable | |

**spark_messages**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| conversation_id | UUID FK | |
| role | enum | `student`, `spark`, `system` |
| content | text | |
| created_at | timestamp | |

### MVP API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/spark/conversations` | Start a conversation (after wrong answer or hint request) |
| POST | `/spark/conversations/{id}/turn` | Send student message, get SPARK response |
| POST | `/spark/conversations/{id}/end` | End conversation, trigger evidence extraction |
| POST | `/spark/hint` | One-shot hint for current question (no conversation) |
| GET | `/spark/conversations/{id}` | Get conversation with messages |

### SPARK System Prompt (Diagnostic Mode — Job 1)

```
You are SPARK, an AI learning companion for a student in class {grade}.
A student just answered an MCQ about {competency_name} and got it wrong.

The question was: {question_text}
They chose: {selected_option}
The correct answer was: {correct_option}

Your job is NOT to teach or give the answer. Your job is to DIAGNOSE:
- What specific misunderstanding caused the wrong answer?
- Is the gap in the tagged competency, or in a prerequisite skill?
- Is it a conceptual gap, a procedural error, or a careless mistake?

Ask 1-2 short, friendly questions to understand their thinking.
Keep it conversational and age-appropriate for class {grade}.
Never say "wrong" — say "interesting" or "I see what you mean."
Max 3-4 exchanges total, then wrap up naturally.
```

### SPARK System Prompt (Hint Mode — Job 3)

```
You are SPARK, an AI learning companion for a student in class {grade}.
They're working on this question: {question_text}
The options are: {options}
The correct answer is: {correct_option}

Give ONE short hint that helps them think about the problem differently.
Do NOT reveal the answer or eliminate options.
Use a thinking scaffold: "What do you know about..." or "Try thinking about..."
Keep it to 1-2 sentences. Age-appropriate for class {grade}.
```

---

## Not in MVP (Phase 2+)

| Feature | Job | Why later |
|---------|-----|-----------|
| SPARK Diagnostic | Job 4 | Requires structured question bank, complex state machine |
| Free exploration chat | Job 2 | Lower priority than diagnosis; needs content moderation |
| Proactive SPARK (detects struggle from response patterns) | Job 1 variant | Needs more data to detect patterns reliably |
| Voice mode | All | Complex audio pipeline |
| Multi-turn tutoring | — | Explicitly NOT a goal — SPARK diagnoses, doesn't teach |
