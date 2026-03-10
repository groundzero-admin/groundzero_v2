# GroundZero — Architecture Document

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │
│  │ Student  │  │ Teacher  │  │  Admin   │  │  Live Class   │   │
│  │Dashboard │  │Dashboard │  │  Panel   │  │  (HMS SDK)    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬────────┘   │
│       └──────────────┴─────────────┴───────────────┘            │
│                         Axios + React Query                      │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP (JWT Auth)
┌──────────────────────────────▼──────────────────────────────────┐
│                     BACKEND (FastAPI + SQLAlchemy)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │
│  │ API      │  │ Services │  │  Engine  │  │  SPARK Agent  │   │
│  │ Routes   │──│ (DB +    │──│  (Pure   │  │  (Bedrock     │   │
│  │ (thin)   │  │  Logic)  │  │  Python) │  │   LLM)        │   │
│  └──────────┘  └──────────┘  └──────────┘  └───────────────┘   │
│                         SQLAlchemy Async                         │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   PostgreSQL        │
                    │   (25 tables)       │
                    └─────────────────────┘
```

**Ports**: Frontend `:3000` → Backend `:8001` (proxied via Vite at `:3001`)

---

## 2. High-Level Architecture (HLD)

### 2.1 Layer Architecture

```
┌─────────────────────────────────────────────────┐
│  PRESENTATION         Frontend (React)          │
│  - Pages, Components, Hooks                     │
│  - Dumb renderer — no business logic            │
├─────────────────────────────────────────────────┤
│  API LAYER            FastAPI Routes            │
│  - Thin: validation + auth only                 │
│  - /auth, /students, /sessions, /evidence, etc. │
├─────────────────────────────────────────────────┤
│  SERVICE LAYER        Python Services           │
│  - evidence_service: BKT orchestration          │
│  - predictor_service: ZPD + recommendations     │
│  - spark_service: AI companion orchestration     │
│  - auth_service: JWT + refresh tokens           │
├─────────────────────────────────────────────────┤
│  ENGINE LAYER         Pure Python (no DB)       │
│  - bkt.py: 10-step Bayesian Knowledge Tracing  │
│  - propagation.py: prerequisite graph traversal │
│  - decay.py: forgetting curves                  │
├─────────────────────────────────────────────────┤
│  DATA LAYER           SQLAlchemy Async + PG     │
│  - 25 tables, async sessions                    │
│  - Seed: idempotent upserts                     │
└─────────────────────────────────────────────────┘
```

### 2.2 Core Domains

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  COMPETENCY  │    │   LEARNING   │    │   DELIVERY   │
│  GRAPH       │    │   ENGINE     │    │   SYSTEM     │
│              │    │              │    │              │
│ 4 Pillars    │    │ BKT Mastery  │    │ Cohorts      │
│ 16 Capabil.  │    │ FIRe Decay   │    │ Sessions     │
│ 59 Compet.   │    │ ZPD Selector │    │ Activities   │
│ 58 Prereq    │    │ 421 Questns  │    │ HMS Video    │
│ Edges        │    │ SPARK AI     │    │ Enrollments  │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                    Evidence Events
              (the glue between domains)
```

---

## 3. Database Schema (25 Tables)

### 3.1 Entity Relationship Diagram

```
                    ┌──────────────┐
                    │    users     │
                    │──────────────│
                    │ id (PK)      │
                    │ email        │
                    │ role         │ ──── student | teacher | admin
                    │ full_name    │
                    │ hashed_pw    │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────────┐
              │            │                │
              ▼            ▼                ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
   │   students   │ │refresh_tokens│ │ student_invites  │
   │──────────────│ │──────────────│ │──────────────────│
   │ id (PK)      │ │ user_id (FK) │ │ user_id (FK)     │
   │ user_id (FK) │ │ token_hash   │ │ token_hash       │
   │ name         │ │ expires_at   │ │ expires_at       │
   │ board        │ └──────────────┘ │ used_at          │
   │ grade (4-9)  │                  └──────────────────┘
   │ grade_band   │
   │ cohort_id    │─────────────────────────────┐
   │ diagnostic_  │                             │
   │  completed   │                             │
   └──────┬───────┘                             │
          │                                     │
          │  ┌──────────────────────┐           │
          ├──│ cohort_enrollments   │           │
          │  │──────────────────────│           │
          │  │ student_id (FK)      │           │
          │  │ cohort_id (FK) ──────│───┐       │
          │  │ enrolled_at          │   │       │
          │  └──────────────────────┘   │       │
          │                             ▼       │
          │                    ┌──────────────┐ │
          │                    │   cohorts    │◄┘
          │                    │──────────────│
          │                    │ id (PK)      │
          │                    │ name         │
          │                    │ grade_band   │
          │                    │ level        │
          │                    │ board        │
          │                    │ current_     │
          │                    │  session_num │
          │                    └──────┬───────┘
          │                           │
          │                           │ has many
          │                           ▼
          │                    ┌──────────────────┐
          │                    │    sessions      │
          │                    │──────────────────│
          │                    │ id (PK)          │
          │                    │ cohort_id (FK)   │
          │                    │ template_session │
          │                    │   _id (FK)       │
          │                    │ teacher_id (FK)  │
          │                    │ title            │
          │                    │ session_number   │
          │                    │ day, order       │
          │                    │ scheduled_at     │
          │                    │ current_activity │
          │                    │   _id            │
          │                    │ started_at       │
          │                    │ ended_at         │
          │                    │ is_locally_      │
          │                    │   modified       │
          │                    └──┬───────┬───────┘
          │                       │       │
          │            ┌──────────┘       └──────────┐
          │            ▼                             ▼
          │  ┌──────────────────┐          ┌──────────────┐
          │  │session_activities│          │  live_rooms  │
          │  │──────────────────│          │──────────────│
          │  │ session_id (FK)  │          │ session_id   │
          │  │ activity_id     │          │ hms_room_id  │
          │  │ order           │          │ room_code_   │
          │  │ status          │ pending  │   host/guest │
          │  │ launched_at     │ active   │ is_live      │
          │  └────────┬────────┘ completed└──────────────┘
          │           │
          │           ▼
          │  ┌──────────────────┐
          │  │   activities     │
          │  │──────────────────│
          │  │ id (PK, string)  │
          │  │ module_id        │
          │  │ name             │
          │  │ type             │ warmup | key_topic | diy | ai_lab | artifact
          │  │ mode             │ timed_mcq | open_ended | discussion | default
          │  │ session_number   │
          │  │ duration_minutes │
          │  │ primary_         │
          │  │  competencies    │
          │  └──────────────────┘
          │
          │ has many
          ▼
   ┌─────────────────────────┐       ┌──────────────────┐
   │  student_competency_    │       │ evidence_events  │
   │     states              │       │──────────────────│
   │─────────────────────────│       │ id (PK)          │
   │ student_id (PK, FK)     │       │ student_id (FK)  │
   │ competency_id (PK, FK)  │       │ competency_id    │
   │ p_learned (0.10)        │       │ source           │ mcq | llm_spark |
   │ p_transit (0.15)        │       │ session_id       │ facilitator | etc.
   │ p_guess (0.25)          │       │ outcome (0-1)    │
   │ p_slip (0.10)           │       │ weight           │
   │ total_evidence          │       │ meta (JSONB)     │
   │ consecutive_failures    │       │ is_propagated    │
   │ is_stuck                │       │ created_at       │
   │ last_evidence_at        │       └──────────────────┘
   │ stability (half-life)   │
   │ stage (1-5)             │
   │ confidence (0-1)        │
   └─────────────────────────┘
```

### 3.2 Competency Graph Tables

```
   ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
   │   pillars    │     │ capabilities │     │  competencies    │
   │──────────────│     │──────────────│     │──────────────────│
   │ id (PK)      │◄────│ pillar_id    │◄────│ capability_id    │
   │ name         │     │ id (PK)      │     │ id (PK)          │
   │ color        │     │ name         │     │ name             │
   │ description  │     │ description  │     │ assessment_method│
   └──────────────┘     └──────────────┘     │ default_params   │
                                              └────────┬─────────┘
   4 pillars             16 capabilities               │
   - Communication       - A through P         59 competencies
   - Creativity                                (31 are grade-
   - AI Systems                                 level math)
   - Math & Logic
                                              ┌────────┴─────────┐
                                              │                  │
                                              ▼                  ▼
                                    ┌──────────────┐   ┌──────────────────┐
                                    │prerequisite_ │   │codevelopment_    │
                                    │  edges       │   │  edges           │
                                    │──────────────│   │──────────────────│
                                    │ source_id(PK)│   │ source_id (PK)   │
                                    │ target_id(PK)│   │ target_id (PK)   │
                                    │ min_stage    │   │ transfer_weight  │
                                    │ encompassing │   └──────────────────┘
                                    │   _weight    │
                                    └──────────────┘
                                    58 edges
```

### 3.3 Content Tables

```
   ┌──────────────────┐         ┌──────────────────┐
   │    questions     │         │ curriculum_topics │
   │──────────────────│         │──────────────────│
   │ id (UUID, PK)    │         │ id (string, PK)  │
   │ competency_id(FK)│         │ board            │
   │ module_id        │         │ subject          │
   │ text             │         │ grade            │
   │ type (mcq)       │         │ chapter_number   │
   │ options (JSONB)  │         │ name             │
   │ difficulty (0-1) │         │ content (JSONB)  │
   │ grade_band       │         └────────┬─────────┘
   │ topic_id (FK) ───│─────────────────►│
   └──────────────────┘                  │
   421 questions              ┌──────────┴─────────┐
                              │topic_competency_map│
                              │────────────────────│
                              │ topic_id (PK, FK)  │
                              │ competency_id(PK)  │
                              │ relevance (0-1)    │
                              └────────────────────┘
```

### 3.4 Template Tables

```
   ┌──────────────────┐       ┌──────────────────┐
   │ template_cohorts │       │template_sessions │
   │──────────────────│       │──────────────────│
   │ id (PK)          │◄──────│template_cohort_id│
   │ name             │       │ id (PK)          │
   │ level            │       │ title            │
   │ mode             │       │ description      │
   └──────────────────┘       │ day, order       │
                              └──────────────────┘
   Templates are blueprints. Import copies sessions into a live cohort
   with template_session_id FK linking back to the original.
```

### 3.5 SPARK AI Tables

```
   ┌──────────────────────┐       ┌──────────────────┐
   │ spark_conversations  │       │  spark_messages  │
   │──────────────────────│       │──────────────────│
   │ id (PK)              │◄──────│conversation_id   │
   │ student_id (FK)      │       │ id (PK)          │
   │ question_id          │       │ role             │ student | spark | system
   │ trigger              │       │ content          │
   │ status               │       │ tool_calls       │
   │ competency_id        │       │ created_at       │
   │ evidence_submitted   │       └──────────────────┘
   └──────────────────────┘
   Triggers: wrong_answer, low_confidence, hint_request, free_chat
```

---

## 4. BKT Engine — 10-Step Algorithm

```
Evidence Event In
       │
       ▼
  ┌─────────────┐
  │ 1. DECAY    │ ── Exponential forgetting toward prior
  │             │    half-life = stability (days)
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ 2. BAYESIAN │ ── Posterior P(L|evidence)
  │    UPDATE   │    P(L) = P(correct|L)*P(L) / P(correct)
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ 3. SOURCE   │ ── Weight by source reliability
  │   WEIGHTING │    mcq=1.0, llm_spark=0.6, facilitator=0.5
  └──────┬──────┘    + response time modifier
         ▼
  ┌─────────────┐
  │ 4. LEARNING │ ── P(T) boost on success or AI interaction
  │ TRANSITION  │
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ 5. CONFID.  │ ── Adjust based on "Got it / Kinda / Lost"
  │   MODIFIER  │
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ 6. STUCK    │ ── consecutive_failures >= 4 → is_stuck
  │  DETECTION  │
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ 7. STABIL.  │ ── Increase half-life on success + P(L)>0.7
  │   UPDATE    │
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ 8. FIRe     │ ── Reset last_evidence_at on prerequisite
  │   REFRESH   │    ancestors (prevents decay, P(L) unchanged)
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ 9. STAGE    │ ── P(L) → Stage 1-5
  │  DERIVATION │    ≥0.85→5, ≥0.65→4, ≥0.40→3, ≥0.20→2, else→1
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │10. CONFID.  │ ── Bayesian confidence from evidence count
  │   SCORE     │
  └──────┬──────┘
         ▼
  Updated CompetencyState Out
```

---

## 5. Data Flows

### 5.1 Student Answers a Question (Core Loop)

```
Student UI                    Backend API              Engine            Database
    │                              │                     │                  │
    │  GET /next-question          │                     │                  │
    │─────────────────────────────►│                     │                  │
    │                              │  ZPD: pick skill    │                  │
    │                              │  + question from    │                  │
    │                              │  prerequisite graph │                  │
    │                              │  ORDER BY random()  │                  │
    │◄─────────────────────────────│                     │                  │
    │  {question, competency_id}   │                     │                  │
    │                              │                     │                  │
    │  POST /evidence              │                     │                  │
    │  {outcome, source, meta}     │                     │                  │
    │─────────────────────────────►│                     │                  │
    │                              │  Load student state │                  │
    │                              │──────────────────────────────────────►│
    │                              │◄──────────────────────────────────────│
    │                              │                     │                  │
    │                              │  Load prereq edges  │                  │
    │                              │──────────────────────────────────────►│
    │                              │◄──────────────────────────────────────│
    │                              │                     │                  │
    │                              │  Run 10-step BKT ──►│                  │
    │                              │                     │ 1. Decay         │
    │                              │                     │ 2. Bayes update  │
    │                              │                     │ ...              │
    │                              │                     │ 8. FIRe refresh  │
    │                              │◄────────────────────│                  │
    │                              │  {before, after,    │                  │
    │                              │   fire_refreshed}   │                  │
    │                              │                     │                  │
    │                              │  Persist updates    │                  │
    │                              │──────────────────────────────────────►│
    │                              │                     │                  │
    │◄─────────────────────────────│                     │                  │
    │  {updates: [{before, after}]}│                     │                  │
    │                              │                     │                  │
    │  Refetch next question       │                     │                  │
    │─────────────────────────────►│                     │                  │
```

### 5.2 Live Session Flow (Teacher → Student)

```
Admin/Teacher                  Backend                    Student
     │                            │                          │
     │  POST /sessions            │                          │
     │  {cohort_id, session_id}   │                          │
     │───────────────────────────►│                          │
     │                            │ Set started_at           │
     │                            │ Auto-assign activities   │
     │◄───────────────────────────│                          │
     │  Session started           │                          │
     │                            │                          │
     │                            │   GET /sessions?active   │
     │                            │◄─────────────────────────│ (polls 5s)
     │                            │─────────────────────────►│
     │                            │   {session, activity=null}│
     │                            │                          │
     │                            │                          │ "No activity yet"
     │                            │                          │
     │  PUT /sessions/:id/        │                          │
     │    launch-activity         │                          │
     │  {activity_id}             │                          │
     │───────────────────────────►│                          │
     │                            │ Set current_activity_id  │
     │                            │ Mark SA as "active"      │
     │◄───────────────────────────│                          │
     │                            │                          │
     │                            │   GET /sessions?active   │
     │                            │◄─────────────────────────│ (next poll)
     │                            │─────────────────────────►│
     │                            │  {current_activity_id}   │
     │                            │                          │
     │                            │   GET /next-question     │
     │                            │◄─────────────────────────│
     │                            │─────────────────────────►│
     │                            │                          │ Shows question!
     │                            │                          │
     │  [Optional] Start HMS      │                          │
     │  POST /create-room         │                          │
     │  POST /start-class         │                          │
     │───────────────────────────►│                          │
     │                            │                          │
     │                            │  GET /live-sessions      │
     │                            │◄─────────────────────────│
     │                            │  {is_live, room_code}   ─│──► HMS Video
     │                            │                          │
     │  POST /sessions/:id/end   │                          │
     │───────────────────────────►│                          │
     │                            │ Set ended_at             │
     │                            │ Advance cohort number    │
     │                            │ Mark all SA completed    │
```

### 5.3 SPARK AI Companion Flow

```
Student                        Backend                    Bedrock LLM
   │                              │                          │
   │  Wrong answer / "Lost"       │                          │
   │  POST /spark/conversations   │                          │
   │  {trigger, question_id}      │                          │
   │─────────────────────────────►│                          │
   │                              │  Create conversation     │
   │                              │  Build system prompt     │
   │                              │  (question + student     │
   │                              │   mastery context)       │
   │                              │─────────────────────────►│
   │                              │◄─────────────────────────│
   │◄─────────────────────────────│  SPARK opening message   │
   │                              │                          │
   │  "I don't understand X"      │                          │
   │  POST /spark/.../turn       │                          │
   │─────────────────────────────►│                          │
   │                              │  Resume from checkpoint  │
   │                              │─────────────────────────►│
   │                              │◄─────────────────────────│
   │◄─────────────────────────────│  Socratic response       │
   │                              │                          │
   │  (max 4 turns)               │                          │
   │                              │                          │
   │  POST /spark/.../end        │                          │
   │─────────────────────────────►│                          │
   │                              │  Agent wraps up          │
   │                              │  Submit evidence         │
   │                              │  (source: llm_spark,     │
   │                              │   weight: 0.6)           │
   │◄─────────────────────────────│                          │
```

---

## 6. Competency Graph Structure

```
PILLARS (4)                CAPABILITIES (16)           COMPETENCIES (59)
─────────                  ──────────────              ────────────────
                           ┌─ A: Active Listening ──── C1.1, C1.2, C1.3
Communication ─────────────┤  B: Verbal Expression ─── C1.4, C1.5, C1.6
                           ├─ C: Written Comm ──────── C1.7, C1.8, C1.9
                           └─ D: Collaboration ─────── C1.10, C1.11

                           ┌─ E: Idea Generation ───── C2.1, C2.2
Creativity ────────────────┤  F: Design Thinking ───── C2.3, C2.4
                           ├─ G: Problem Solving ───── C2.5, C2.6
                           └─ H: Innovation ────────── C2.7, C2.8

                           ┌─ I: AI Awareness ──────── C3.1, C3.2
AI & Systems ──────────────┤  J: Data Literacy ─────── C3.3, C3.4
                           ├─ K: Computational ─────── C3.5, C3.6
                           └─ L: Ethics ────────────── C3.7, C3.8

                           ┌─ M: Estimation ────────── C4.1, C4.2, C4.3
Math & Logic ──────────────┤  N: Patterns ──────────── C4.4, C4.5, C4.6
                           ├─ O: Reasoning ─────────── C4.7, C4.8, C4.9, C4.10
                           │                           C4.11, C4.12, C4.13
                           └─ P: Grade-Level Math ──── C4.14.4 - C4.19.9
                                                       (31 grade-level nodes)
```

### Grade-Level Math Nodes (Capability P)

```
Skill               Grades Available    Chain
──────────────      ────────────────    ─────────────────────────
Number Sense        4,5,6,7,8,9         C4.14.4 → .5 → .6 → .7 → .8 → .9
Fractions           4,5,6,7             C4.15.4 → .5 → .6 → .7
Decimals            5,6,7               C4.16.5 → .6 → .7
Ratios              6,7,8               C4.17.6 → .7 → .8
Algebra             5,6,7,8,9           C4.18.5 → .6 → .7 → .8 → .9
Geometry            4,5,6,7,8,9         C4.19.4 → .5 → .6 → .7 → .8 → .9

Cross-skill prereqs:
  C4.14.5 → C4.15.5  (number sense before fractions)
  C4.15.5 → C4.16.5  (fractions before decimals)
  C4.15.6 → C4.17.6  (fractions before ratios)
  C4.14.6 → C4.18.6  (number sense before algebra)
```

---

## 7. Session & Activity Model

### 7.1 Session Lifecycle

```
Template Cohort                    Live Cohort
┌─────────────┐   Import     ┌──────────────────────────────────────┐
│ Template     │─────────────►│ Session (started_at=NULL)            │
│ Session      │              │ status: NOT STARTED                  │
│ - title      │              │ template_session_id → FK back        │
│ - day        │              └──────────────┬───────────────────────┘
│ - order      │                             │
└─────────────┘                              │ Teacher clicks "Start"
                                             │ POST /sessions
                                             ▼
                              ┌──────────────────────────────────────┐
                              │ Session (started_at=NOW)             │
                              │ status: ACTIVE                       │
                              │ Auto-assigns 7 activities from       │
                              │ lesson plan (session_activities)     │
                              └──────────────┬───────────────────────┘
                                             │
                                             │ Teacher clicks "End"
                                             │ POST /sessions/:id/end
                                             ▼
                              ┌──────────────────────────────────────┐
                              │ Session (ended_at=NOW)               │
                              │ status: ENDED                        │
                              │ cohort.current_session_number++      │
                              │ All remaining activities → completed │
                              └──────────────────────────────────────┘
```

### 7.2 Activity Phases (per session)

```
Order   Type        Mode          Example                   Duration
─────   ──────────  ────────────  ────────────────────────  ────────
  1     warmup      default       My Creativity Map           10 min
  2     key_topic   default       Active Listening            25 min
  3     key_topic   default       Number Sense — Estimation   30 min
  4     diy         timed_mcq     Math Sprint                 10 min
  5     diy         default       Estimation Sprint           20 min
  6     ai_lab      default       Emotional Questions to AI   15 min
  7     artifact    default       SPARK — Product Ideation    20 min
```

---

## 8. Authentication Flow

```
┌──────────┐   POST /auth/login    ┌──────────┐
│  Client  │──────────────────────►│  Backend │
│          │                       │          │
│          │◄──────────────────────│          │
│          │  { access_token }     │          │  Set-Cookie: refresh_token
│          │  + httpOnly cookie    │          │  (httpOnly, 7 days)
│          │                       │          │
│          │  GET /api/* (Bearer)  │          │
│          │──────────────────────►│          │
│          │                       │  Verify JWT (15 min)
│          │                       │          │
│          │  401 Expired          │          │
│          │◄──────────────────────│          │
│          │                       │          │
│          │  POST /auth/refresh   │          │
│          │  (cookie auto-sent)   │          │
│          │──────────────────────►│          │
│          │                       │  Rotate: revoke old token,
│          │                       │  issue new refresh + access
│          │◄──────────────────────│          │
│          │  { new access_token } │          │
└──────────┘                       └──────────┘
```

---

## 9. Frontend Routes & Pages

```
/                           → HomePage (student hub)
/login                      → LoginPage
/register                   → RegisterPage
/dashboard                  → DashboardPage (mastery overview)
/live                       → LivePage (join live class)
/practice                   → PracticePage (self-serve)
/practice/:topicId          → PracticePage (specific topic)
/skill-graph                → SkillGraphPage (prerequisite visualization)
/fun                        → FunPage

/teacher                    → TeacherDashboardPage (cohorts, sessions, cockpit)
/teacher/live-class         → AdminLiveClassPage (full-screen teaching)

/admin/cohorts              → LiveBatchListPage
/admin/cohorts/:id          → LiveBatchDetailPage (configure sessions, students)
/admin/templates            → TemplateCohortListPage
/admin/templates/:id        → TemplateCohortDetailPage
/admin/students             → AdminStudentsPage
```

### Role Access

```
Student:  /, /dashboard, /live, /practice, /skill-graph, /fun
Teacher:  /teacher, /teacher/live-class
Admin:    /admin/*, /teacher/* (admin can teach)
```

---

## 10. Key Design Principles

| Principle | Detail |
|-----------|--------|
| Backend owns logic | Frontend is a dumb renderer. No BKT, no ZPD, no competency selection on client. |
| 1 question at a time | Never batch questions. Backend picks via ZPD + prerequisite graph. |
| Engine is pure Python | `app/engine/` has zero DB imports. Swappable for DKT/transformer. |
| FIRe only resets decay | Practicing advanced skill refreshes prereq decay clocks. Does NOT change P(L). |
| Idempotent seeds | `seed.py` uses upserts. Safe to run repeatedly. |
| Thin API routes | Routes do auth + validation only. Business logic lives in services. |
| Session = started_at | A session is "live" when `started_at IS NOT NULL` and `ended_at IS NULL`. HMS video is optional. |
| Loose coupling | `session_id` on evidence_events is not a strict FK. Domains are decoupled. |

---

## 11. Infrastructure

| Component | Technology | Port |
|-----------|-----------|------|
| Frontend | React 19 + Vite + TypeScript + Vanilla Extract | 3000 |
| Backend | Python 3.11 + FastAPI + SQLAlchemy 2.0 async | 8001 |
| Database | PostgreSQL 15 | 5432 |
| Video | 100ms HMS (broadcaster/co-broadcaster roles) | — |
| AI | AWS Bedrock (OpenAI-compat proxy) | — |
| Proxy | Vite dev server proxies /api → :8001 | 3001 |

### Seed Users

| Email | Password | Role |
|-------|----------|------|
| student@groundzero.in | student123 | student |
| teacher@groundzero.in | teacher123 | teacher |
| admin@groundzero.in | admin123 | admin |
