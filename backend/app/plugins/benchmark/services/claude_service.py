"""Benchmark AI service — answer evaluation via Bedrock-Mantle proxy.

Uses the same SPARK_* credentials (OpenAI-compatible proxy to Bedrock)
that the SPARK companion uses.
"""

import json
import logging
import re

from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

from app.config import settings

CHARACTER_PERSONALITIES = {
    "harry_potter": {
        "name": "Harry Potter",
        "tone": "warm, curious, and encouraging — like a Hogwarts friend who genuinely wants to explore ideas together",
    },
    "doraemon": {
        "name": "Doraemon",
        "tone": "enthusiastic, inventive, and playful — like a clever robot cat who finds everything fascinating",
    },
    "peppa_pig": {
        "name": "Peppa Pig",
        "tone": "cheerful, simple, and supportive — like a friendly buddy who makes everything feel safe and fun",
    },
    "simba": {
        "name": "Simba",
        "tone": "brave, thoughtful, and encouraging — like a young lion learning alongside you",
    },
    "dora": {
        "name": "Dora",
        "tone": "adventurous, collaborative, and positive — like an explorer who thinks every question is a new discovery",
    },
}


def _get_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=settings.SPARK_API_KEY,
        base_url=settings.SPARK_BASE_URL,
    )


async def evaluate_answers(
    student_name: str,
    age: int,
    grade: str,
    character: str,
    qa_pairs: list[dict],
) -> dict:
    """Evaluate all Q&A pairs against rubrics and produce benchmark scores."""
    qa_block = ""
    for qa in qa_pairs:
        qa_block += f"""
--- Question {qa['question_number']} ---
QUESTION: {qa['question_text']}
STUDENT ANSWER: {qa['answer_text']}
PILLARS TESTED: {', '.join(qa['pillars'])}
STRONG RESPONSE SIGNALS: {'; '.join(qa['strong_signals'])}
WATCH-OUT SIGNALS: {'; '.join(qa['watchout_signals'])}
"""

    system_prompt = f"""You are an expert child educational psychologist assessing {student_name}, aged {age}, grade {grade}.

You are evaluating 20 structured diagnostic questions with the student's answers. Each question has predefined rubrics (strong signals and watch-out signals). Use these rubrics to evaluate each answer precisely.

STAGE SCALE (relative to enrolled grade):
- 1 (Novice): Minimal evidence; does not demonstrate capability unprompted
- 2 (Emerging): Basic awareness but cannot apply independently; needs scaffolding
- 3 (Developing): Demonstrates with some consistency; may struggle with complexity
- 4 (Proficient): Demonstrates reliably and can explain reasoning; handles moderate complexity
- 5 (Mastered): Demonstrates flexibly across contexts; teaches others; handles novel situations

THE 4 PILLARS AND 16 CAPABILITIES:

PILLAR 1: Communication + Argumentation (communication)
  A: Listening & Comprehension - understands others' ideas accurately
  B: Constructing Arguments - builds logical, evidence-based arguments
  C: Adaptive Communication - adjusts style for different contexts
  D: Dialogue & Debate - engages in productive dialogue, defends positions

PILLAR 2: Creativity + Curiosity (creativity)
  E: Idea Generation - produces diverse, original ideas
  F: Creative Depth - develops, evaluates, connects ideas across domains
  G: Curiosity Drive - asks questions and explores with genuine curiosity
  H: Creative Application - applies creativity to real-world problems

PILLAR 3: AI + Systems Thinking (ai_systems)
  I: AI Understanding - understands AI capabilities and limitations
  J: AI Fluency - uses AI tools effectively through iteration
  K: Systems Thinking - analyzes systems through inputs, processes, outputs
  L: Builder Mindset - identifies needs, makes trade-offs, delivers

PILLAR 4: Math + Logic + Reasoning (math_logic)
  M: Logical Reasoning - pattern recognition, boolean logic, structured reasoning
  N: Probabilistic & Statistical Reasoning - probability, sets, data interpretation
  O: Abstract & Strategic Reasoning - variables, game theory, cost-benefit
  P: Math Foundations - number sense, fractions, decimals, ratios, algebra, geometry

SCORING RULES:
- No single question produces a definitive pillar placement
- Each question produces a 1-3 evidence signal per relevant pillar
- The pillar stage is the weighted average across the 5-7 questions that tested it
- Questions 17 and 20 (curiosity/metacognition) should be weighted more heavily for Creativity
- Only score capabilities you have EVIDENCE for. If not observable, set to null
- Compare the answer against both strong signals AND watch-out signals from the rubric
- A student matching strong signals = stage 3-5; matching watch-out signals = stage 1-2

Return ONLY a valid JSON object:
{{
  "pillar_stages": {{
    "communication": <1-5>,
    "creativity": <1-5>,
    "ai_systems": <1-5>,
    "math_logic": <1-5>
  }},
  "capability_stages": {{
    "A": <1-5 or null>, "B": <1-5 or null>, "C": <1-5 or null>, "D": <1-5 or null>,
    "E": <1-5 or null>, "F": <1-5 or null>, "G": <1-5 or null>, "H": <1-5 or null>,
    "I": <1-5 or null>, "J": <1-5 or null>, "K": <1-5 or null>, "L": <1-5 or null>,
    "M": <1-5 or null>, "N": <1-5 or null>, "O": <1-5 or null>, "P": <1-5 or null>
  }},
  "capability_evidence": {{
    "<capability_letter>": "1-2 sentence evidence from the student's answers justifying the stage"
  }},
  "per_question_scores": {{
    "<question_number>": {{
      "pillars_hit": {{"<pillar_id>": <1-5>}},
      "signal_match": "strong|watchout|mixed|minimal",
      "note": "1 sentence on what the answer revealed"
    }}
  }},
  "insights": {{
    "strongest_areas": ["max 3 capability names"],
    "growth_areas": ["max 3 capability names"],
    "dominant_interests": ["max 5"],
    "learning_style": "visual|auditory|kinesthetic|reading-writing|mixed",
    "engagement_level": "high|medium|low",
    "notable_observations": ["4-6 specific observations"]
  }},
  "summary": "2-3 paragraph evidence-based narrative of the student's capabilities"
}}"""

    client = _get_client()
    model = settings.SPARK_MODEL

    response = await client.chat.completions.create(
        model=model,
        max_tokens=4000,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Here are the 20 diagnostic questions and the student's answers:\n{qa_block}"},
        ],
    )

    raw_text = response.choices[0].message.content.strip()
    parsed = _robust_json_parse(raw_text)
    if parsed is not None:
        return parsed

    # Retry with a JSON-repair prompt
    retry_resp = await client.chat.completions.create(
        model=model,
        max_tokens=4000,
        messages=[
            {"role": "system", "content": "You are a JSON repair tool. Return ONLY a valid JSON object."},
            {"role": "user", "content": f"Fix this JSON:\n\n{raw_text}"},
        ],
    )
    retry_text = retry_resp.choices[0].message.content.strip()
    parsed = _robust_json_parse(retry_text)
    if parsed is not None:
        return parsed

    raise ValueError(f"Could not parse benchmark JSON: {raw_text[:200]}")


async def generate_answer_feedback(
    question_text: str,
    answer_text: str,
    question_number: int,
    character: str,
    student_name: str,
    grade: str,
    is_retry: bool = False,
) -> dict:
    """Generate brief, friendly, constructive feedback for a single answer.

    Returns dict with keys: feedback, needs_retry, hint.
    """
    persona = CHARACTER_PERSONALITIES.get(character, CHARACTER_PERSONALITIES["harry_potter"])

    retry_context = ""
    if is_retry:
        retry_context = "\nThis is the student's SECOND attempt after receiving a hint. Acknowledge improvement if any, but still be honest."

    system_prompt = f"""You are {persona['name']}, talking to {student_name} (grade {grade}).
Your tone is {persona['tone']}.

Evaluate the student's answer and respond in EXACTLY this format (three lines, no extras):

FEEDBACK: <your 1-3 sentence feedback here>
CORRECT: <true or false>
HINT: <if incorrect, a specific 1-sentence hint; if correct, write "none">

Rules for FEEDBACK:
- If CORRECT: Start with "That's correct!" or "Exactly right!" then briefly say WHY it's correct.
- If WRONG: Start with "That's not quite right." or "Nope, that's incorrect." then explain SPECIFICALLY what's wrong. Example: "You added the numerators directly, but you need a common denominator first." NEVER praise a wrong answer. NEVER say "good thinking" or "you're on the right track" for wrong answers.
- If the student said "I don't know" or gave a nonsense/unrelated answer: Say "You need to give this a real try!" and explain what the question is asking.
- If PARTIALLY correct: Say exactly which part is right and which is wrong.
- Use simple language appropriate for grade {grade}.
- No markdown, no asterisks, no special formatting.
- Do NOT repeat the question.

Rules for HINT:
- Must be a SPECIFIC, actionable clue that guides toward the answer without giving it away.
- Bad hint: "Think harder" or "Try again" (too vague)
- Good hint: "Try finding a number that both 3 and 7 divide into evenly" (specific and helpful)
- For correct answers, write "none".{retry_context}"""

    user_msg = f"Question {question_number}: {question_text}\n\nStudent's answer: {answer_text}"

    client = _get_client()
    response = await client.chat.completions.create(
        model=settings.SPARK_MODEL,
        max_tokens=400,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_msg},
        ],
    )

    raw_content = response.choices[0].message.content
    if not raw_content:
        return {"feedback": "Good effort on that one! Let's keep going.", "needs_retry": False, "hint": None}
    raw = raw_content.strip()

    is_correct = False
    hint = None

    correct_match = re.search(r"(?i)\bCORRECT\s*:\s*(true|false|yes|no)", raw)
    if correct_match:
        is_correct = correct_match.group(1).lower() in ("true", "yes")

    hint_match = re.search(r"(?i)\bHINT\s*:\s*(.+?)(?:\n|$)", raw)
    if hint_match:
        hint_val = hint_match.group(1).strip()
        if hint_val.lower() not in ("none", "n/a", ""):
            hint = hint_val

    feedback = raw
    feedback = re.sub(r"(?i)\bFEEDBACK\s*:\s*", "", feedback)
    feedback = re.sub(r"(?i)\bCORRECT\s*:\s*(true|false|yes|no)\b", "", feedback)
    feedback = re.sub(r"(?i)\bHINT\s*:\s*.+?(?:\n|$)", "", feedback)
    feedback = re.sub(r"[*_`•]", "", feedback).strip()
    feedback = re.sub(r"\n{2,}", "\n", feedback).strip()

    if not feedback:
        feedback = re.sub(r"[*_`•]", "", raw.split("\n")[0]).strip() or "Good effort! Let's see the next one."

    needs_retry = not is_correct

    logger.info(
        "Feedback parse: correct=%s, needs_retry=%s, hint=%r, feedback_start=%r",
        is_correct, needs_retry, hint, feedback[:80],
    )

    if is_retry:
        needs_retry = False
        hint = None

    return {"feedback": feedback, "needs_retry": needs_retry, "hint": hint}


def _robust_json_parse(text: str):
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        text = text[start : end + 1]

    try:
        return json.loads(text, strict=False)
    except json.JSONDecodeError:
        pass

    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", text)
    try:
        return json.loads(cleaned, strict=False)
    except json.JSONDecodeError:
        pass

    fixed = re.sub(r",\s*([}\]])", r"\1", cleaned)
    try:
        return json.loads(fixed, strict=False)
    except json.JSONDecodeError:
        pass

    return None
