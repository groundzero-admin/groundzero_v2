# SPARK Agent — Technical Design

## Architecture

SPARK is a skills-based AI agent built on **DeepAgents** (LangGraph). It uses a single-node graph with custom tools that connect to Ground Zero's BKT engine. The agent receives conversation context, reasons about student gaps, and submits evidence signals — all through tool calls.

```
┌─────────────────────────────────────────────────────────┐
│  Frontend                                               │
│                                                         │
│  PracticePage / LivePage                                │
│    └─ SPARKDrawer (slide-up chat panel)                 │
│         POST /api/v1/spark/conversations                │
│         POST /api/v1/spark/conversations/{id}/turn      │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  FastAPI — app/api/spark.py                             │
│                                                         │
│  POST /spark/conversations        → create + first turn │
│  POST /spark/conversations/:id/turn  → student reply    │
│  POST /spark/conversations/:id/end   → wrap up          │
│  POST /spark/hint                    → one-shot hint    │
│  GET  /spark/conversations/:id       → get messages     │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  DeepAgents Agent — app/agent/spark_agent.py            │
│                                                         │
│  create_deep_agent(                                     │
│    model="openai:gpt-4.1",                              │
│    tools=[                                              │
│      get_student_context,    # read BKT state           │
│      get_question_context,   # read MCQ + options       │
│      submit_evidence,        # write to BKT engine      │
│    ],                                                   │
│    skills=["./skills/"],     # diagnostic, hint skills  │
│    checkpointer=PostgresSaver,  # conversation state    │
│  )                                                      │
│                                                         │
│  Single LangGraph node:                                 │
│    LLM call → tool calls → LLM call → ... → response   │
│                                                         │
└───────────┬──────────────┬──────────────────────────────┘
            │              │
            ▼              ▼
┌──────────────────┐  ┌──────────────────────────────────┐
│  OpenAI API      │  │  BKT Engine (existing)            │
│  (gpt-4.1)       │  │                                   │
│                  │  │  evidence_service.process_evidence │
│                  │  │  → 10-step BKT update             │
│                  │  │  → co-dev propagation             │
│                  │  │  → returns BKTUpdateResult[]       │
└──────────────────┘  └──────────────────────────────────┘
```

## Why DeepAgents?

DeepAgents wraps LangGraph and gives us:

1. **Skills (progressive disclosure)** — SKILL.md files loaded on-demand. Diagnostic mode, hint mode, and exploration mode are separate skills. The agent reads the right skill based on conversation context, keeping the context window lean.

2. **Checkpointing** — Conversation state persists across HTTP requests via PostgreSQL. Each `/turn` call resumes the graph exactly where it left off. No manual message history management.

3. **Tool calling** — Agent decides when to read student context, inspect the question, or submit evidence. We don't hardcode the flow — the LLM reasons about what tool to use.

4. **Single node simplicity** — One LLM node in a tool-calling loop. No complex graph routing. The skills pattern handles mode switching (diagnose vs hint vs explore) without graph branching.

## Agent Tools

### 1. `get_student_context`

Reads the student's BKT state for relevant competencies. The agent uses this to understand what the student knows and where the gaps are.

```python
@tool
def get_student_context(student_id: str, competency_ids: list[str]) -> dict:
    """Get a student's mastery state for specific competencies.

    Returns p_learned, stage, confidence, and recent evidence count
    for each competency. Use this to understand what the student
    knows before diagnosing their gap.
    """
```

**Returns:**
```json
{
  "student_grade": 6,
  "states": [
    {
      "competency_id": "C4.5",
      "name": "Fractions & Ratios",
      "p_learned": 0.35,
      "stage": 2,
      "total_evidence": 8,
      "is_stuck": false
    }
  ]
}
```

### 2. `get_question_context`

Reads the MCQ that triggered the conversation — question text, options, correct answer, tagged competency, and the student's selected answer.

```python
@tool
def get_question_context(question_id: str) -> dict:
    """Get the MCQ question details including text, options,
    correct answer, and tagged competency.

    Use this to understand what the student was trying to answer
    and what kind of mistake they might have made.
    """
```

**Returns:**
```json
{
  "text": "What is 3/4 + 1/2?",
  "options": [
    {"label": "A", "text": "4/6", "is_correct": false},
    {"label": "B", "text": "5/4", "is_correct": true},
    {"label": "C", "text": "4/4", "is_correct": false},
    {"label": "D", "text": "3/8", "is_correct": false}
  ],
  "competency_id": "C4.5",
  "competency_name": "Fractions & Ratios",
  "difficulty": 0.45
}
```

### 3. `submit_evidence`

Submits a diagnosed evidence event to the BKT engine. This is the key output — SPARK assesses the conversation and routes the signal to the right competency.

```python
@tool
def submit_evidence(
    student_id: str,
    competency_id: str,
    outcome: float,
    evidence_text: str,
) -> dict:
    """Submit an evidence signal to the BKT mastery engine.

    Call this ONLY after you've gathered enough information from the
    conversation to make an assessment. The competency_id may differ
    from the question's tagged competency if you diagnose a different
    root cause.

    Args:
        student_id: The student's UUID
        competency_id: The competency this evidence is for (e.g. "C4.1")
        outcome: 0.0 to 1.0 — how well the student demonstrated this skill
        evidence_text: The student quote or behavior that supports this rating
    """
```

**Returns:**
```json
{
  "submitted": true,
  "updates": [
    {
      "competency_id": "C4.1",
      "p_learned_before": 0.30,
      "p_learned_after": 0.25,
      "stage_before": 2,
      "stage_after": 2
    }
  ]
}
```

## Skills

Skills are loaded on-demand via the DeepAgents progressive disclosure pattern. Each skill is a directory with a `SKILL.md` file.

```
backend/
  app/
    agent/
      skills/
        diagnose/
          SKILL.md       # Post-MCQ diagnosis instructions
        hint/
          SKILL.md       # Hint generation instructions
```

### Skill: `diagnose`

```yaml
---
name: diagnose
description: >
  Diagnose why a student got an MCQ wrong. Use when a student answers
  incorrectly or reports low confidence (kinda/lost). Ask 1-2 questions
  to understand their thinking, then submit evidence for the actual
  skill gap.
---
```

**Instructions summary:**
- Read the question context and student state
- Ask 1-2 short diagnostic questions (never reveal the answer)
- Classify the root cause: conceptual gap, procedural error, or careless slip
- Determine if the gap is in the tagged competency or a prerequisite
- Submit evidence via `submit_evidence` tool with the diagnosed competency
- Keep it to 3-4 exchanges max, then wrap up naturally

### Skill: `hint`

```yaml
---
name: hint
description: >
  Give a student a thinking scaffold for an MCQ they're stuck on.
  One-shot: provide a single hint that helps them reason without
  revealing the answer.
---
```

**Instructions summary:**
- Read the question context
- Generate ONE short hint (1-2 sentences)
- Use scaffolding: "What do you know about..." or "Try thinking about..."
- Never eliminate options or reveal the answer
- No follow-up conversation needed

## Checkpointing

Conversations persist across HTTP requests using **LangGraph PostgreSQL checkpointer** (`langgraph-checkpoint-postgres`).

```python
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

checkpointer = AsyncPostgresSaver.from_conn_string(DATABASE_URL)
```

Each conversation gets a unique `thread_id` (= conversation UUID). When a student sends a new message via `POST /spark/conversations/{id}/turn`, the agent resumes from the exact checkpoint — all prior messages and tool calls are restored.

This means:
- No manual message history management
- Agent "remembers" what it already asked
- Multi-turn diagnosis works across HTTP requests
- Conversation state survives server restarts

## Data Model

### `spark_conversations` table

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | Also used as LangGraph thread_id |
| student_id | UUID FK → students | |
| question_id | UUID FK → questions, nullable | MCQ that triggered this |
| trigger | varchar(20) | `wrong_answer`, `low_confidence`, `hint_request`, `free_chat` |
| status | varchar(20) | `active`, `completed`, `dismissed` |
| competency_id | varchar(100) | Primary competency context |
| evidence_submitted | boolean default false | Whether agent submitted evidence |
| created_at | timestamp | |
| ended_at | timestamp, nullable | |

### `spark_messages` table

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| conversation_id | UUID FK | |
| role | varchar(10) | `student`, `spark`, `system` |
| content | text | |
| tool_calls | JSONB, nullable | Agent tool calls (for audit) |
| created_at | timestamp | |

### LangGraph checkpoint tables

Auto-created by `AsyncPostgresSaver.setup()`:
- `checkpoints` — serialized graph state per thread
- `checkpoint_writes` — pending writes
- `checkpoint_blobs` — binary state data

## API Endpoints

### `POST /spark/conversations`

Start a new SPARK conversation. Creates the conversation record, invokes the agent for the first turn (SPARK's opening message).

**Request:**
```json
{
  "student_id": "uuid",
  "question_id": "uuid",          // nullable
  "trigger": "wrong_answer",      // wrong_answer | low_confidence | hint_request | free_chat
  "competency_id": "C4.5",
  "selected_option": "A",         // what the student picked (for diagnosis)
  "confidence_report": "lost"     // nullable
}
```

**Response:**
```json
{
  "conversation_id": "uuid",
  "message": {
    "role": "spark",
    "content": "Hmm, that was tricky! Can you walk me through what you were thinking when you picked A?"
  }
}
```

### `POST /spark/conversations/{id}/turn`

Send a student message, get SPARK's response. Resumes the LangGraph checkpoint.

**Request:**
```json
{
  "content": "I thought you just add the top numbers together"
}
```

**Response:**
```json
{
  "message": {
    "role": "spark",
    "content": "I see! So you added 3 + 1 = 4 for the numerator. What about the denominators — do you need to do anything with those when adding fractions?"
  },
  "evidence_submitted": false,
  "is_complete": false
}
```

### `POST /spark/conversations/{id}/end`

End the conversation. Agent wraps up and submits final evidence if it hasn't already.

**Response:**
```json
{
  "message": {
    "role": "spark",
    "content": "Great chat! I can see you understand fractions but finding common denominators is tricky. Keep practicing — you'll get there!"
  },
  "evidence_submitted": true,
  "updates": [
    {
      "competency_id": "C4.5",
      "p_learned_before": 0.35,
      "p_learned_after": 0.30
    }
  ]
}
```

### `POST /spark/hint`

One-shot hint. No conversation created — just returns a hint for the given question.

**Request:**
```json
{
  "student_id": "uuid",
  "question_id": "uuid"
}
```

**Response:**
```json
{
  "hint": "When adding fractions, think about whether the denominators (bottom numbers) are the same. If they're different, what might you need to do first?"
}
```

### `GET /spark/conversations/{id}`

Get conversation with all messages.

**Response:**
```json
{
  "conversation": {
    "id": "uuid",
    "trigger": "wrong_answer",
    "status": "completed",
    "evidence_submitted": true
  },
  "messages": [
    {"role": "spark", "content": "...", "created_at": "..."},
    {"role": "student", "content": "...", "created_at": "..."},
    {"role": "spark", "content": "...", "created_at": "..."}
  ]
}
```

## Agent Invocation Flow

### Diagnosis Flow (Post-MCQ)

```
1. Student answers wrong → frontend calls POST /spark/conversations
2. API creates conversation record
3. API invokes agent with:
   - system prompt (from SKILL.md diagnostic)
   - initial context: question, student answer, competency
4. Agent calls get_question_context → reads MCQ details
5. Agent calls get_student_context → reads BKT state
6. Agent generates opening diagnostic question
7. API saves spark_message, returns to frontend

8. Student replies → POST /spark/conversations/{id}/turn
9. API resumes agent from checkpoint with student message
10. Agent may ask another clarifying question
11. API saves message, returns to frontend

12. After 2-3 turns, agent calls submit_evidence
    - competency_id: may differ from question's tag
    - outcome: 0.0-1.0 based on conversation
    - evidence_text: student's own words
13. Agent generates wrap-up message
14. API marks conversation as completed
```

### Hint Flow (One-shot)

```
1. Student taps "Hint" → frontend calls POST /spark/hint
2. API invokes agent with hint skill
3. Agent calls get_question_context → reads MCQ details
4. Agent generates a single scaffold hint
5. API returns hint text (no conversation created)
```

## Dependencies

```toml
# Added to pyproject.toml
"deepagents>=0.4.0",
"langgraph-checkpoint-postgres>=2.0.0",
"langchain-openai>=0.3.0",
```

## LLM Gateway (Portkey)

All LLM calls route through **Portkey** via the `llm_gateway` service. This follows the same pattern as the crew-ai platform.

### Feature Config

```python
FEATURE_CONFIG = {
    "spark_diagnosis": {
        "priority": "p0",           # Critical — student-facing real-time
        "name": "SPARK Diagnosis",
        "default_model": "claude-sonnet-4-5-20250929",
    },
    "spark_hint": {
        "priority": "p0",
        "name": "SPARK Hint",
        "default_model": "claude-sonnet-4-5-20250929",
    },
    "spark_explore": {
        "priority": "p1",           # Important — near-real-time
        "name": "SPARK Exploration",
        "default_model": "claude-sonnet-4-5-20250929",
    },
    "transcript_assessment": {
        "priority": "p1",
        "name": "Transcript Assessment",
        "default_model": "claude-sonnet-4-5-20250929",
    },
}
```

### How Portkey Routing Works

1. Feature config determines model + priority tier (p0/p1/p2)
2. Priority tier selects the Portkey API key (different quotas per tier)
3. Model name formatted as `gz-p0-{env}/{model}` (Portkey virtual model)
4. Request routed through `https://api.portkey.ai/v1` with metadata headers
5. Portkey handles rate limiting, retries, fallbacks, and observability

### Environment Variables

```bash
# Portkey API keys per priority tier
PORTKEY_KEY_P0_UAT=...    # Critical features (diagnosis, hints)
PORTKEY_KEY_P1_UAT=...    # Important features (exploration, transcripts)
PORTKEY_KEY_P2_UAT=...    # Background/batch features
PORTKEY_KEY_P0_PROD=...
PORTKEY_KEY_P1_PROD=...
PORTKEY_KEY_P2_PROD=...

# Environment detection
ENVIRONMENT=development   # "production" → prod keys, everything else → uat keys
```

## Configuration

```python
# app/config.py
SPARK_MAX_TURNS: int = 4  # max diagnostic exchanges
```

## File Structure

```
backend/app/
  agent/
    __init__.py
    spark_agent.py       # create_deep_agent with Portkey-routed LLM
    tools.py             # get_student_context, get_question_context, submit_evidence
    skills/
      diagnose/
        SKILL.md
      hint/
        SKILL.md
  models/
    spark.py             # SparkConversation, SparkMessage models
  schemas/
    spark.py             # Request/response schemas
  api/
    spark.py             # FastAPI router
  services/
    llm_gateway/
      __init__.py        # Public API
      config.py          # Feature config + Portkey params
      gateway.py         # call_llm_async + create_langchain_chat_model
    spark_service.py     # Orchestrates agent invocation + DB persistence
```

## Evidence Flow Integration

SPARK evidence flows through the same pipeline as MCQ evidence:

```
SPARK submit_evidence tool
  → evidence_service.process_evidence(db, EvidenceCreate(
      student_id=...,
      competency_id=diagnosed_competency,  # may differ from question tag
      outcome=0.0-1.0,                     # continuous, not binary
      source="llm_spark",                  # weight 0.6
      ai_interaction="conversation",       # P(T) boost 2.0x
      meta={"evidence_text": "student said..."}
    ))
  → BKT 10-step engine
  → co-development propagation
  → returns BKTUpdateResult[]
```

The BKT engine doesn't know SPARK exists. It just processes an evidence event with source weight 0.6 and a 2.0x learning transition boost for conversational AI interaction.

## Constraints

- **Max 4 turns** for diagnosis. SPARK is a diagnostic moment, not a tutoring session.
- **Never reveals answers.** System prompt enforces this. Skills reinforce it.
- **Student can dismiss anytime.** The MCQ evidence still stands independently.
- **Grade-appropriate language.** Agent receives `student.grade` and adapts.
- **Evidence is optional.** If SPARK can't confidently diagnose a gap, it doesn't submit evidence. Bad evidence is worse than no evidence.
