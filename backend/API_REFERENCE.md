# Ground Zero API Reference

**Base URL:** `http://localhost:8000`  

> Swagger UI: http://localhost:8000/docs  
> ReDoc: http://localhost:8000/redoc

---

## Endpoints

**Total:** 34 endpoints | **Schemas:** 33

| # | Name | Method | Path | Tag |
|---|------|--------|------|-----|
| 1 | Browse All Activities | `GET` | `/api/v1/activities` | activities |
| 2 | Create Activity | `POST` | `/api/v1/activities` | activities |
| 3 | Get Activity Details | `GET` | `/api/v1/activities/{activity_id}` | activities |
| 4 | List All Cohorts | `GET` | `/api/v1/cohorts` | cohorts |
| 5 | Create New Cohort | `POST` | `/api/v1/cohorts` | cohorts |
| 6 | Get Cohort Details | `GET` | `/api/v1/cohorts/{cohort_id}` | cohorts |
| 7 | List All Competencies | `GET` | `/api/v1/competencies` | competencies |
| 8 | Create Competency | `POST` | `/api/v1/competencies` | competencies |
| 9 | List Capability Groups | `GET` | `/api/v1/competencies/capabilities` | competencies |
| 10 | Create Capability Group | `POST` | `/api/v1/competencies/capabilities` | competencies |
| 11 | List Learning Pillars | `GET` | `/api/v1/competencies/pillars` | competencies |
| 12 | Create Learning Pillar | `POST` | `/api/v1/competencies/pillars` | competencies |
| 13 | Get Competency Details | `GET` | `/api/v1/competencies/{competency_id}` | competencies |
| 14 | Submit Learning Evidence | `POST` | `/api/v1/evidence` | evidence |
| 15 | Get Learning History | `GET` | `/api/v1/evidence` | evidence |
| 16 | Health Check | `GET` | `/health` | other |
| 17 | Browse Question Bank | `GET` | `/api/v1/questions` | questions |
| 18 | Add Question to Bank | `POST` | `/api/v1/questions` | questions |
| 19 | List Sessions | `GET` | `/api/v1/sessions` | sessions |
| 20 | Start New Session | `POST` | `/api/v1/sessions` | sessions |
| 21 | Get Session Details | `GET` | `/api/v1/sessions/{session_id}` | sessions |
| 22 | End Live Session | `POST` | `/api/v1/sessions/{session_id}/end` | sessions |
| 23 | Record Facilitator Observation | `POST` | `/api/v1/sessions/{session_id}/facilitator-notes` | sessions |
| 24 | Get Session Observations | `GET` | `/api/v1/sessions/{session_id}/facilitator-notes` | sessions |
| 25 | Get Skill Dependency Graph | `GET` | `/api/v1/skill-graph` | skill-graph |
| 26 | List All Students | `GET` | `/api/v1/students` | students |
| 27 | Register New Student | `POST` | `/api/v1/students` | students |
| 28 | Get Student Profile | `GET` | `/api/v1/students/{student_id}` | students |
| 29 | Assign Student to Cohort | `PATCH` | `/api/v1/students/{student_id}` | students |
| 30 | Submit Diagnostic Assessment | `POST` | `/api/v1/students/{student_id}/diagnostic` | students |
| 31 | Recommend Next Activities | `GET` | `/api/v1/students/{student_id}/next-activity` | students |
| 32 | Get Adaptive Practice Questions | `GET` | `/api/v1/students/{student_id}/next-questions` | students |
| 33 | Get Full Mastery Profile | `GET` | `/api/v1/students/{student_id}/state` | students |
| 34 | Get Single Competency Mastery | `GET` | `/api/v1/students/{student_id}/state/{competency_id}` | students |

---

## Activities

### Browse All Activities
`GET /api/v1/activities`

> List all learning activities, optionally filtered by module, week, or type (warmup, key_topic, diy, ai_lab, artifact).

**Query Parameters**

| Param | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `module_id` | `string` | False | `—` |  |
| `week` | `string` | False | `—` |  |
| `type` | `string` | False | `—` |  |

**Response `200`** `ActivityOut[]`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | Yes |  |
| `module_id` | `string` | Yes |  |
| `name` | `string` | Yes |  |
| `type` | `string` | Yes |  |
| `week` | `integer \| null` | No |  |
| `session_number` | `integer \| null` | No |  |
| `duration_minutes` | `integer \| null` | No |  |
| `grade_bands` | `array \| null` | No |  |
| `description` | `string \| null` | No |  |
| `learning_outcomes` | `array \| null` | No |  |
| `primary_competencies` | `array \| null` | No |  |
| `secondary_competencies` | `array \| null` | No |  |
| `prerequisites` | `array \| null` | No |  |

---

### Create Activity
`POST /api/v1/activities`

> Add a new learning activity. Activities are assigned to sessions and link to competencies via primary_competencies.

**Request Body** `ActivityCreate`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | Yes |  |
| `module_id` | `string` | Yes |  |
| `name` | `string` | Yes |  |
| `type` | `string` | Yes |  |
| `week` | `integer \| null` | No |  |
| `session_number` | `integer \| null` | No |  |
| `duration_minutes` | `integer \| null` | No |  |
| `grade_bands` | `array \| null` | No |  |
| `description` | `string \| null` | No |  |
| `learning_outcomes` | `array \| null` | No |  |
| `primary_competencies` | `array \| null` | No |  |
| `secondary_competencies` | `array \| null` | No |  |
| `prerequisites` | `array \| null` | No |  |

**Response `201`** `ActivityOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | Yes |  |
| `module_id` | `string` | Yes |  |
| `name` | `string` | Yes |  |
| `type` | `string` | Yes |  |
| `week` | `integer \| null` | No |  |
| `session_number` | `integer \| null` | No |  |
| `duration_minutes` | `integer \| null` | No |  |
| `grade_bands` | `array \| null` | No |  |
| `description` | `string \| null` | No |  |
| `learning_outcomes` | `array \| null` | No |  |
| `primary_competencies` | `array \| null` | No |  |
| `secondary_competencies` | `array \| null` | No |  |
| `prerequisites` | `array \| null` | No |  |

---

### Get Activity Details
`GET /api/v1/activities/{activity_id}`

> Retrieve a single activity with its full details including primary competencies, duration, module, and description.

**Path Parameters**

| Param | Type |
|-------|------|
| `activity_id` | `string` |

**Response `200`** `ActivityOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | Yes |  |
| `module_id` | `string` | Yes |  |
| `name` | `string` | Yes |  |
| `type` | `string` | Yes |  |
| `week` | `integer \| null` | No |  |
| `session_number` | `integer \| null` | No |  |
| `duration_minutes` | `integer \| null` | No |  |
| `grade_bands` | `array \| null` | No |  |
| `description` | `string \| null` | No |  |
| `learning_outcomes` | `array \| null` | No |  |
| `primary_competencies` | `array \| null` | No |  |
| `secondary_competencies` | `array \| null` | No |  |
| `prerequisites` | `array \| null` | No |  |

---

## Cohorts

### List All Cohorts
`GET /api/v1/cohorts`

> Retrieve all cohorts (class groups), ordered by most recently created.

**Response `200`** `CohortOut[]`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string (uuid)` | Yes |  |
| `name` | `string` | Yes |  |
| `grade_band` | `string` | Yes |  |
| `created_at` | `string (date-time)` | Yes |  |

---

### Create New Cohort
`POST /api/v1/cohorts`

> Create a new student cohort (class group) with a name and grade band. Students are enrolled into cohorts to participate in live sessions.

**Request Body** `CohortCreate`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | `string` | Yes |  |
| `grade_band` | `string` | Yes | pattern: `^(4-5|6-7|8-9)$` |

**Response `201`** `CohortOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string (uuid)` | Yes |  |
| `name` | `string` | Yes |  |
| `grade_band` | `string` | Yes |  |
| `created_at` | `string (date-time)` | Yes |  |

---

### Get Cohort Details
`GET /api/v1/cohorts/{cohort_id}`

> Retrieve a single cohort by its UUID.

**Path Parameters**

| Param | Type |
|-------|------|
| `cohort_id` | `string (uuid)` |

**Response `200`** `CohortOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string (uuid)` | Yes |  |
| `name` | `string` | Yes |  |
| `grade_band` | `string` | Yes |  |
| `created_at` | `string (date-time)` | Yes |  |

---

## Competencies

### List All Competencies
`GET /api/v1/competencies`

> Retrieve all 59 competencies across 4 pillars, including assessment method, grade band, and capability groupings.

**Response `200`** `CompetencyOut[]`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | Yes |  |
| `capability_id` | `string` | Yes |  |
| `name` | `string` | Yes |  |
| `description` | `string` | Yes |  |
| `assessment_method` | `string` | Yes |  |
| `default_params` | `object` | Yes |  |

---

### Create Competency
`POST /api/v1/competencies`

> Add a new competency under a capability group. Competencies are the atomic skills tracked by the BKT mastery engine (e.g., C1.1 Articulating Ideas Clearly).

**Request Body** `CompetencyCreate`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | Yes | pattern: `^C\d+\.\d+$` |
| `capability_id` | `string` | Yes |  |
| `name` | `string` | Yes |  |
| `description` | `string` | Yes |  |
| `assessment_method` | `string` | Yes | pattern: `^(mcq|llm|both)$` |
| `default_params` | `object` | No | default: `{'pL0': 0.1, 'pT': 0.15, 'pG': 0.25, 'pS': 0.1}` |

**Response `201`** `CompetencyOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | Yes |  |
| `capability_id` | `string` | Yes |  |
| `name` | `string` | Yes |  |
| `description` | `string` | Yes |  |
| `assessment_method` | `string` | Yes |  |
| `default_params` | `object` | Yes |  |

---

### List Capability Groups
`GET /api/v1/competencies/capabilities`

> Retrieve capability groups that organize competencies within each pillar (e.g., 'Verbal Expression' under Communication).

**Response `200`** `CapabilityOut[]`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | Yes |  |
| `pillar_id` | `string` | Yes |  |
| `name` | `string` | Yes |  |
| `description` | `string` | Yes |  |

---

### Create Capability Group
`POST /api/v1/competencies/capabilities`

> Add a new capability group under a pillar. Capabilities organize related competencies (e.g., 'Verbal Expression' under Communication).

**Request Body** `CapabilityCreate`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | Yes |  |
| `pillar_id` | `string` | Yes |  |
| `name` | `string` | Yes |  |
| `description` | `string` | Yes |  |

**Response `201`** `CapabilityOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | Yes |  |
| `pillar_id` | `string` | Yes |  |
| `name` | `string` | Yes |  |
| `description` | `string` | Yes |  |

---

### List Learning Pillars
`GET /api/v1/competencies/pillars`

> Retrieve the 4 learning pillars (Communication, Creativity, AI & Systems, Math & Logic) with their colors and display names.

**Response `200`** `PillarOut[]`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | Yes |  |
| `name` | `string` | Yes |  |
| `color` | `string` | Yes |  |
| `description` | `string` | Yes |  |

---

### Create Learning Pillar
`POST /api/v1/competencies/pillars`

> Add a new learning pillar (e.g., Communication, Creativity). Each pillar groups related capabilities and competencies.

**Request Body** `PillarCreate`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | Yes | pattern: `^[a-z_]+$` |
| `name` | `string` | Yes |  |
| `color` | `string` | Yes | pattern: `^#[0-9A-Fa-f]{6}$` |
| `description` | `string` | Yes |  |

**Response `201`** `PillarOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | Yes |  |
| `name` | `string` | Yes |  |
| `color` | `string` | Yes |  |
| `description` | `string` | Yes |  |

---

### Get Competency Details
`GET /api/v1/competencies/{competency_id}`

> Retrieve a single competency by ID (e.g., C1.1) with its full details including name, description, assessment method, and grade band.

**Path Parameters**

| Param | Type |
|-------|------|
| `competency_id` | `string` |

**Response `200`** `CompetencyOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | Yes |  |
| `capability_id` | `string` | Yes |  |
| `name` | `string` | Yes |  |
| `description` | `string` | Yes |  |
| `assessment_method` | `string` | Yes |  |
| `default_params` | `object` | Yes |  |

---

## Evidence

### Submit Learning Evidence
`POST /api/v1/evidence`

> Record a learning event (MCQ answer, facilitator observation, etc.) and trigger a BKT mastery update. Returns the created event plus before/after mastery state changes.

**Request Body** `EvidenceCreate`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `student_id` | `string (uuid)` | Yes |  |
| `competency_id` | `string` | Yes |  |
| `outcome` | `number` | Yes | min: 0.0, max: 1.0 |
| `source` | `string` | Yes |  |
| `module_id` | `string \| null` | No |  |
| `session_id` | `string \| null` | No |  |
| `weight` | `number \| null` | No |  |
| `response_time_ms` | `integer \| null` | No |  |
| `confidence_report` | `string \| null` | No |  |
| `ai_interaction` | `string` | No | default: `none`, enum: ['none', 'hint', 'conversation'] |

**Response `201`** `EvidenceResultOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `event` | `EvidenceOut` | Yes |  |
| `updates` | `BKTUpdateOut[]` | Yes |  |

---

### Get Learning History
`GET /api/v1/evidence`

> Retrieve evidence events for a student and/or competency. Used for journey timelines, progress reviews, and analytics.

**Query Parameters**

| Param | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `student_id` | `string` | False | `—` |  |
| `competency_id` | `string` | False | `—` |  |
| `limit` | `integer` | False | `50` | max 200 |

**Response `200`** `EvidenceOut[]`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string (uuid)` | Yes |  |
| `student_id` | `string (uuid)` | Yes |  |
| `competency_id` | `string` | Yes |  |
| `source` | `string` | Yes |  |
| `module_id` | `string \| null` | No |  |
| `session_id` | `string \| null` | No |  |
| `outcome` | `number` | Yes |  |
| `weight` | `number` | Yes |  |
| `meta` | `object \| null` | No |  |
| `is_propagated` | `boolean` | Yes |  |
| `source_event_id` | `string \| null` | No |  |
| `created_at` | `string (date-time)` | Yes |  |

---

## Other

### Health Check
`GET /health`

> Check if the API server is running.

**Response `200`:** _(empty)_

---

## Questions

### Browse Question Bank
`GET /api/v1/questions`

> List questions from the question bank, filterable by competency, module, difficulty range, and grade band. Returns up to 200 questions.

**Query Parameters**

| Param | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `competency_id` | `string` | False | `—` |  |
| `module_id` | `string` | False | `—` |  |
| `difficulty_min` | `string` | False | `—` |  |
| `difficulty_max` | `string` | False | `—` |  |
| `grade_band` | `string` | False | `—` |  |
| `limit` | `integer` | False | `50` | max 200 |

**Response `200`** `QuestionOut[]`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string (uuid)` | Yes |  |
| `module_id` | `string` | Yes |  |
| `competency_id` | `string` | Yes |  |
| `text` | `string` | Yes |  |
| `type` | `string` | Yes |  |
| `options` | `array \| null` | No |  |
| `correct_answer` | `string \| null` | No |  |
| `difficulty` | `number` | Yes |  |
| `grade_band` | `string` | Yes |  |
| `explanation` | `string \| null` | No |  |

---

### Add Question to Bank
`POST /api/v1/questions`

> Add a new question to the question bank for a specific competency. Questions are served adaptively based on student mastery level.

**Request Body** `QuestionCreate`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `module_id` | `string` | Yes |  |
| `competency_id` | `string` | Yes |  |
| `text` | `string` | Yes |  |
| `type` | `string` | No | default: `mcq` |
| `options` | `array \| null` | No |  |
| `correct_answer` | `string \| null` | No |  |
| `difficulty` | `number` | Yes | min: 0.0, max: 1.0 |
| `grade_band` | `string` | Yes | pattern: `^(4-5|6-7|8-9)$` |
| `explanation` | `string \| null` | No |  |

**Response `201`** `QuestionOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string (uuid)` | Yes |  |
| `module_id` | `string` | Yes |  |
| `competency_id` | `string` | Yes |  |
| `text` | `string` | Yes |  |
| `type` | `string` | Yes |  |
| `options` | `array \| null` | No |  |
| `correct_answer` | `string \| null` | No |  |
| `difficulty` | `number` | Yes |  |
| `grade_band` | `string` | Yes |  |
| `explanation` | `string \| null` | No |  |

---

## Sessions

### List Sessions
`GET /api/v1/sessions`

> List all sessions, optionally filtered by cohort and active/ended status. Used to find live sessions for a student's cohort.

**Query Parameters**

| Param | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `cohort_id` | `string` | False | `—` |  |
| `active` | `string` | False | `—` |  |

**Response `200`** `SessionOut[]`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string (uuid)` | Yes |  |
| `cohort_id` | `string \| null` | No |  |
| `activity_id` | `string \| null` | No |  |
| `facilitator_name` | `string \| null` | No |  |
| `started_at` | `string (date-time)` | Yes |  |
| `ended_at` | `string \| null` | No |  |

---

### Start New Session
`POST /api/v1/sessions`

> Create a new live session for a cohort. Assigns an activity (with its competencies) and a facilitator. The session is immediately active until ended.

**Request Body** `SessionCreate`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `cohort_id` | `string \| null` | No |  |
| `activity_id` | `string \| null` | No |  |
| `facilitator_name` | `string \| null` | No |  |

**Response `201`** `SessionOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string (uuid)` | Yes |  |
| `cohort_id` | `string \| null` | No |  |
| `activity_id` | `string \| null` | No |  |
| `facilitator_name` | `string \| null` | No |  |
| `started_at` | `string (date-time)` | Yes |  |
| `ended_at` | `string \| null` | No |  |

---

### Get Session Details
`GET /api/v1/sessions/{session_id}`

> Retrieve a single session by its UUID, including cohort, activity, facilitator, and start/end times.

**Path Parameters**

| Param | Type |
|-------|------|
| `session_id` | `string (uuid)` |

**Response `200`** `SessionOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string (uuid)` | Yes |  |
| `cohort_id` | `string \| null` | No |  |
| `activity_id` | `string \| null` | No |  |
| `facilitator_name` | `string \| null` | No |  |
| `started_at` | `string (date-time)` | Yes |  |
| `ended_at` | `string \| null` | No |  |

---

### End Live Session
`POST /api/v1/sessions/{session_id}/end`

> Mark an active session as ended by setting its ended_at timestamp. Fails if the session is already ended.

**Path Parameters**

| Param | Type |
|-------|------|
| `session_id` | `string (uuid)` |

**Response `200`** `SessionOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string (uuid)` | Yes |  |
| `cohort_id` | `string \| null` | No |  |
| `activity_id` | `string \| null` | No |  |
| `facilitator_name` | `string \| null` | No |  |
| `started_at` | `string (date-time)` | Yes |  |
| `ended_at` | `string \| null` | No |  |

---

### Record Facilitator Observation
`POST /api/v1/sessions/{session_id}/facilitator-notes`

> Submit a facilitator's observation note for a student during a session. Includes engagement level (1-3), notable moments, and optional intervention flag. Optionally creates a BKT evidence event if a competency_id is provided.

**Path Parameters**

| Param | Type |
|-------|------|
| `session_id` | `string (uuid)` |

**Request Body** `FacilitatorNoteCreate`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `student_id` | `string (uuid)` | Yes |  |
| `engagement` | `integer` | Yes | min: 1.0, max: 3.0 |
| `notable_moment` | `string \| null` | No |  |
| `intervention_flag` | `boolean` | No | default: `False` |
| `competency_id` | `string \| null` | No |  |

**Response `201`** `FacilitatorNoteOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string (uuid)` | Yes |  |
| `session_id` | `string (uuid)` | Yes |  |
| `student_id` | `string (uuid)` | Yes |  |
| `engagement` | `integer` | Yes |  |
| `notable_moment` | `string \| null` | No |  |
| `intervention_flag` | `boolean` | Yes |  |
| `created_at` | `string (date-time)` | Yes |  |

---

### Get Session Observations
`GET /api/v1/sessions/{session_id}/facilitator-notes`

> Retrieve all facilitator observation notes for a session, ordered by most recent first.

**Path Parameters**

| Param | Type |
|-------|------|
| `session_id` | `string (uuid)` |

**Response `200`** `FacilitatorNoteOut[]`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string (uuid)` | Yes |  |
| `session_id` | `string (uuid)` | Yes |  |
| `student_id` | `string (uuid)` | Yes |  |
| `engagement` | `integer` | Yes |  |
| `notable_moment` | `string \| null` | No |  |
| `intervention_flag` | `boolean` | Yes |  |
| `created_at` | `string (date-time)` | Yes |  |

---

## Skill Graph

### Get Skill Dependency Graph
`GET /api/v1/skill-graph`

> Retrieve the full skill graph including all competencies, prerequisite edges, and codevelopment edges. Used for visualizing learning pathways.

**Response `200`** `SkillGraphOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `competencies` | `CompetencyOut[]` | Yes |  |
| `prerequisite_edges` | `PrerequisiteEdgeOut[]` | Yes |  |
| `codevelopment_edges` | `CodevelopmentEdgeOut[]` | Yes |  |

---

## Students

### List All Students
`GET /api/v1/students`

> Retrieve all registered students, ordered by creation date.

**Response `200`** `StudentOut[]`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string (uuid)` | Yes |  |
| `name` | `string` | Yes |  |
| `grade` | `integer` | Yes |  |
| `grade_band` | `string` | Yes |  |
| `cohort_id` | `string \| null` | No |  |
| `diagnostic_completed` | `boolean` | Yes |  |
| `created_at` | `string (date-time)` | Yes |  |

---

### Register New Student
`POST /api/v1/students`

> Create a new student profile. Returns the student record with a generated UUID.

**Request Body** `StudentCreate`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | `string` | Yes |  |
| `grade` | `integer` | Yes | min: 4.0, max: 9.0 |
| `grade_band` | `string` | Yes | pattern: `^(4-5|6-7|8-9)$` |
| `cohort_id` | `string \| null` | No |  |

**Response `201`** `StudentOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string (uuid)` | Yes |  |
| `name` | `string` | Yes |  |
| `grade` | `integer` | Yes |  |
| `grade_band` | `string` | Yes |  |
| `cohort_id` | `string \| null` | No |  |
| `diagnostic_completed` | `boolean` | Yes |  |
| `created_at` | `string (date-time)` | Yes |  |

---

### Get Student Profile
`GET /api/v1/students/{student_id}`

> Retrieve a single student's profile by their UUID.

**Path Parameters**

| Param | Type |
|-------|------|
| `student_id` | `string (uuid)` |

**Response `200`** `StudentOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string (uuid)` | Yes |  |
| `name` | `string` | Yes |  |
| `grade` | `integer` | Yes |  |
| `grade_band` | `string` | Yes |  |
| `cohort_id` | `string \| null` | No |  |
| `diagnostic_completed` | `boolean` | Yes |  |
| `created_at` | `string (date-time)` | Yes |  |

---

### Assign Student to Cohort
`PATCH /api/v1/students/{student_id}`

> Update a student's cohort assignment. Used to enroll a student into a class group.

**Path Parameters**

| Param | Type |
|-------|------|
| `student_id` | `string (uuid)` |

**Request Body** `StudentPatch`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `cohort_id` | `string \| null` | No |  |

**Response `200`** `StudentOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string (uuid)` | Yes |  |
| `name` | `string` | Yes |  |
| `grade` | `integer` | Yes |  |
| `grade_band` | `string` | Yes |  |
| `cohort_id` | `string \| null` | No |  |
| `diagnostic_completed` | `boolean` | Yes |  |
| `created_at` | `string (date-time)` | Yes |  |

---

### Submit Diagnostic Assessment
`POST /api/v1/students/{student_id}/diagnostic`

> Initialize a student's mastery profile from a diagnostic assessment. Sets BKT priors for all competencies based on pillar-level stage estimates and optional per-competency overrides.

**Path Parameters**

| Param | Type |
|-------|------|
| `student_id` | `string (uuid)` |

**Request Body** `DiagnosticProfile`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `pillar_stages` | `object` | No | default: `{}` |
| `overrides` | `object` | No | default: `{}` |

**Response `200`** `DiagnosticResultItem[]`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `competency_id` | `string` | Yes |  |
| `stage` | `integer` | Yes |  |
| `p_learned` | `number` | Yes |  |

---

### Recommend Next Activities
`GET /api/v1/students/{student_id}/next-activity`

> Get personalized activity recommendations based on the student's ZPD (Zone of Proximal Development). Returns activities scored by relevance to the student's current mastery level.

**Path Parameters**

| Param | Type |
|-------|------|
| `student_id` | `string (uuid)` |

**Query Parameters**

| Param | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `module_id` | `string` | False | `—` |  |
| `limit` | `integer` | False | `5` | max 20 |

**Response `200`** `ActivityRecommendation[]`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `activity_id` | `string` | Yes |  |
| `activity_name` | `string` | Yes |  |
| `module_id` | `string` | Yes |  |
| `score` | `number` | Yes |  |
| `reasons` | `string[]` | Yes |  |

---

### Get Adaptive Practice Questions
`GET /api/v1/students/{student_id}/next-questions`

> Fetch questions matched to the student's current mastery level for a given competency. Uses ZPD targeting to select appropriately challenging questions.

**Path Parameters**

| Param | Type |
|-------|------|
| `student_id` | `string (uuid)` |

**Query Parameters**

| Param | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `competency_id` | `string` | True | `—` |  |
| `count` | `integer` | False | `5` | max 20 |
| `module_id` | `string` | False | `—` |  |

**Response `200`** `QuestionOut[]`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string (uuid)` | Yes |  |
| `module_id` | `string` | Yes |  |
| `competency_id` | `string` | Yes |  |
| `text` | `string` | Yes |  |
| `type` | `string` | Yes |  |
| `options` | `array \| null` | No |  |
| `correct_answer` | `string \| null` | No |  |
| `difficulty` | `number` | Yes |  |
| `grade_band` | `string` | Yes |  |
| `explanation` | `string \| null` | No |  |

---

### Get Full Mastery Profile
`GET /api/v1/students/{student_id}/state`

> Retrieve the student's mastery state across all 59 competencies, including P(Learned), stage, and streak data.

**Path Parameters**

| Param | Type |
|-------|------|
| `student_id` | `string (uuid)` |

**Response `200`** `StudentStateOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `student` | `StudentOut` | Yes |  |
| `states` | `CompetencyStateOut[]` | Yes |  |

---

### Get Single Competency Mastery
`GET /api/v1/students/{student_id}/state/{competency_id}`

> Retrieve the student's BKT state for a specific competency (P(Learned), stage, attempts).

**Path Parameters**

| Param | Type |
|-------|------|
| `student_id` | `string (uuid)` |
| `competency_id` | `string` |

**Response `200`** `CompetencyStateOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `competency_id` | `string` | Yes |  |
| `p_learned` | `number` | Yes |  |
| `p_transit` | `number` | Yes |  |
| `p_guess` | `number` | Yes |  |
| `p_slip` | `number` | Yes |  |
| `total_evidence` | `integer` | Yes |  |
| `consecutive_failures` | `integer` | Yes |  |
| `is_stuck` | `boolean` | Yes |  |
| `last_evidence_at` | `string \| null` | No |  |
| `stability` | `number` | Yes |  |
| `avg_response_time_ms` | `number \| null` | No |  |
| `stage` | `integer` | Yes |  |
| `confidence` | `number` | Yes |  |
| `updated_at` | `string \| null` | No |  |

---

## Schemas

### `ActivityCreate`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | Yes |  |
| `module_id` | `string` | Yes |  |
| `name` | `string` | Yes |  |
| `type` | `string` | Yes |  |
| `week` | `integer \| null` | No |  |
| `session_number` | `integer \| null` | No |  |
| `duration_minutes` | `integer \| null` | No |  |
| `grade_bands` | `array \| null` | No |  |
| `description` | `string \| null` | No |  |
| `learning_outcomes` | `array \| null` | No |  |
| `primary_competencies` | `array \| null` | No |  |
| `secondary_competencies` | `array \| null` | No |  |
| `prerequisites` | `array \| null` | No |  |

### `ActivityOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | Yes |  |
| `module_id` | `string` | Yes |  |
| `name` | `string` | Yes |  |
| `type` | `string` | Yes |  |
| `week` | `integer \| null` | No |  |
| `session_number` | `integer \| null` | No |  |
| `duration_minutes` | `integer \| null` | No |  |
| `grade_bands` | `array \| null` | No |  |
| `description` | `string \| null` | No |  |
| `learning_outcomes` | `array \| null` | No |  |
| `primary_competencies` | `array \| null` | No |  |
| `secondary_competencies` | `array \| null` | No |  |
| `prerequisites` | `array \| null` | No |  |

### `ActivityRecommendation`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `activity_id` | `string` | Yes |  |
| `activity_name` | `string` | Yes |  |
| `module_id` | `string` | Yes |  |
| `score` | `number` | Yes |  |
| `reasons` | `string[]` | Yes |  |

### `BKTUpdateOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `competency_id` | `string` | Yes |  |
| `p_learned_before` | `number` | Yes |  |
| `p_learned_after` | `number` | Yes |  |
| `stage_before` | `integer` | Yes |  |
| `stage_after` | `integer` | Yes |  |
| `is_stuck` | `boolean` | Yes |  |

### `CapabilityCreate`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | Yes |  |
| `pillar_id` | `string` | Yes |  |
| `name` | `string` | Yes |  |
| `description` | `string` | Yes |  |

### `CapabilityOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | Yes |  |
| `pillar_id` | `string` | Yes |  |
| `name` | `string` | Yes |  |
| `description` | `string` | Yes |  |

### `CodevelopmentEdgeOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `source_id` | `string` | Yes |  |
| `target_id` | `string` | Yes |  |
| `transfer_weight` | `number` | Yes |  |
| `rationale` | `string \| null` | No |  |

### `CohortCreate`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | `string` | Yes |  |
| `grade_band` | `string` | Yes | pattern: `^(4-5|6-7|8-9)$` |

### `CohortOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string (uuid)` | Yes |  |
| `name` | `string` | Yes |  |
| `grade_band` | `string` | Yes |  |
| `created_at` | `string (date-time)` | Yes |  |

### `CompetencyCreate`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | Yes | pattern: `^C\d+\.\d+$` |
| `capability_id` | `string` | Yes |  |
| `name` | `string` | Yes |  |
| `description` | `string` | Yes |  |
| `assessment_method` | `string` | Yes | pattern: `^(mcq|llm|both)$` |
| `default_params` | `object` | No | default: `{'pL0': 0.1, 'pT': 0.15, 'pG': 0.25, 'pS': 0.1}` |

### `CompetencyOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | Yes |  |
| `capability_id` | `string` | Yes |  |
| `name` | `string` | Yes |  |
| `description` | `string` | Yes |  |
| `assessment_method` | `string` | Yes |  |
| `default_params` | `object` | Yes |  |

### `CompetencyStateOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `competency_id` | `string` | Yes |  |
| `p_learned` | `number` | Yes |  |
| `p_transit` | `number` | Yes |  |
| `p_guess` | `number` | Yes |  |
| `p_slip` | `number` | Yes |  |
| `total_evidence` | `integer` | Yes |  |
| `consecutive_failures` | `integer` | Yes |  |
| `is_stuck` | `boolean` | Yes |  |
| `last_evidence_at` | `string \| null` | No |  |
| `stability` | `number` | Yes |  |
| `avg_response_time_ms` | `number \| null` | No |  |
| `stage` | `integer` | Yes |  |
| `confidence` | `number` | Yes |  |
| `updated_at` | `string \| null` | No |  |

### `DiagnosticProfile`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `pillar_stages` | `object` | No | default: `{}` |
| `overrides` | `object` | No | default: `{}` |

### `DiagnosticResultItem`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `competency_id` | `string` | Yes |  |
| `stage` | `integer` | Yes |  |
| `p_learned` | `number` | Yes |  |

### `EvidenceCreate`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `student_id` | `string (uuid)` | Yes |  |
| `competency_id` | `string` | Yes |  |
| `outcome` | `number` | Yes | min: 0.0, max: 1.0 |
| `source` | `string` | Yes |  |
| `module_id` | `string \| null` | No |  |
| `session_id` | `string \| null` | No |  |
| `weight` | `number \| null` | No |  |
| `response_time_ms` | `integer \| null` | No |  |
| `confidence_report` | `string \| null` | No |  |
| `ai_interaction` | `string` | No | default: `none`, enum: ['none', 'hint', 'conversation'] |

### `EvidenceOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string (uuid)` | Yes |  |
| `student_id` | `string (uuid)` | Yes |  |
| `competency_id` | `string` | Yes |  |
| `source` | `string` | Yes |  |
| `module_id` | `string \| null` | No |  |
| `session_id` | `string \| null` | No |  |
| `outcome` | `number` | Yes |  |
| `weight` | `number` | Yes |  |
| `meta` | `object \| null` | No |  |
| `is_propagated` | `boolean` | Yes |  |
| `source_event_id` | `string \| null` | No |  |
| `created_at` | `string (date-time)` | Yes |  |

### `EvidenceResultOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `event` | `EvidenceOut` | Yes |  |
| `updates` | `BKTUpdateOut[]` | Yes |  |

### `FacilitatorNoteCreate`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `student_id` | `string (uuid)` | Yes |  |
| `engagement` | `integer` | Yes | min: 1.0, max: 3.0 |
| `notable_moment` | `string \| null` | No |  |
| `intervention_flag` | `boolean` | No | default: `False` |
| `competency_id` | `string \| null` | No |  |

### `FacilitatorNoteOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string (uuid)` | Yes |  |
| `session_id` | `string (uuid)` | Yes |  |
| `student_id` | `string (uuid)` | Yes |  |
| `engagement` | `integer` | Yes |  |
| `notable_moment` | `string \| null` | No |  |
| `intervention_flag` | `boolean` | Yes |  |
| `created_at` | `string (date-time)` | Yes |  |

### `HTTPValidationError`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `detail` | `ValidationError[]` | No |  |

### `PillarCreate`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | Yes | pattern: `^[a-z_]+$` |
| `name` | `string` | Yes |  |
| `color` | `string` | Yes | pattern: `^#[0-9A-Fa-f]{6}$` |
| `description` | `string` | Yes |  |

### `PillarOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | Yes |  |
| `name` | `string` | Yes |  |
| `color` | `string` | Yes |  |
| `description` | `string` | Yes |  |

### `PrerequisiteEdgeOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `source_id` | `string` | Yes |  |
| `target_id` | `string` | Yes |  |
| `min_stage` | `integer` | Yes |  |

### `QuestionCreate`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `module_id` | `string` | Yes |  |
| `competency_id` | `string` | Yes |  |
| `text` | `string` | Yes |  |
| `type` | `string` | No | default: `mcq` |
| `options` | `array \| null` | No |  |
| `correct_answer` | `string \| null` | No |  |
| `difficulty` | `number` | Yes | min: 0.0, max: 1.0 |
| `grade_band` | `string` | Yes | pattern: `^(4-5|6-7|8-9)$` |
| `explanation` | `string \| null` | No |  |

### `QuestionOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string (uuid)` | Yes |  |
| `module_id` | `string` | Yes |  |
| `competency_id` | `string` | Yes |  |
| `text` | `string` | Yes |  |
| `type` | `string` | Yes |  |
| `options` | `array \| null` | No |  |
| `correct_answer` | `string \| null` | No |  |
| `difficulty` | `number` | Yes |  |
| `grade_band` | `string` | Yes |  |
| `explanation` | `string \| null` | No |  |

### `SessionCreate`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `cohort_id` | `string \| null` | No |  |
| `activity_id` | `string \| null` | No |  |
| `facilitator_name` | `string \| null` | No |  |

### `SessionOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string (uuid)` | Yes |  |
| `cohort_id` | `string \| null` | No |  |
| `activity_id` | `string \| null` | No |  |
| `facilitator_name` | `string \| null` | No |  |
| `started_at` | `string (date-time)` | Yes |  |
| `ended_at` | `string \| null` | No |  |

### `SkillGraphOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `competencies` | `CompetencyOut[]` | Yes |  |
| `prerequisite_edges` | `PrerequisiteEdgeOut[]` | Yes |  |
| `codevelopment_edges` | `CodevelopmentEdgeOut[]` | Yes |  |

### `StudentCreate`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | `string` | Yes |  |
| `grade` | `integer` | Yes | min: 4.0, max: 9.0 |
| `grade_band` | `string` | Yes | pattern: `^(4-5|6-7|8-9)$` |
| `cohort_id` | `string \| null` | No |  |

### `StudentOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string (uuid)` | Yes |  |
| `name` | `string` | Yes |  |
| `grade` | `integer` | Yes |  |
| `grade_band` | `string` | Yes |  |
| `cohort_id` | `string \| null` | No |  |
| `diagnostic_completed` | `boolean` | Yes |  |
| `created_at` | `string (date-time)` | Yes |  |

### `StudentPatch`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `cohort_id` | `string \| null` | No |  |

### `StudentStateOut`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `student` | `StudentOut` | Yes |  |
| `states` | `CompetencyStateOut[]` | Yes |  |

### `ValidationError`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `loc` | `?[]` | Yes |  |
| `msg` | `string` | Yes |  |
| `type` | `string` | Yes |  |
| `input` | `?` | No |  |
| `ctx` | `object` | No |  |
