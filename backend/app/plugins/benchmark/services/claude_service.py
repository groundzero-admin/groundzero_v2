"""Claude AI service for benchmark answer evaluation.

Supports direct Anthropic API (local dev) and AWS Bedrock (production).
Set CLAUDE_PROVIDER=bedrock to use Bedrock, otherwise uses direct API.
"""

import json
import os
import re

import anthropic
from anthropic import AsyncAnthropicBedrock

BEDROCK_DEFAULT_MODEL = "anthropic.claude-3-haiku-20240307-v1:0"


def _get_claude_client():
    provider = os.getenv("CLAUDE_PROVIDER", "direct").lower()
    if provider == "bedrock":
        return AsyncAnthropicBedrock(
            aws_region=os.getenv("AWS_REGION", "us-west-2"),
        )
    return anthropic.AsyncAnthropic(api_key=os.getenv("CLAUDE_API_KEY"))


def _get_claude_model():
    provider = os.getenv("CLAUDE_PROVIDER", "direct").lower()
    if provider == "bedrock":
        return os.getenv("BENCHMARK_CLAUDE_MODEL", BEDROCK_DEFAULT_MODEL)
    return os.getenv("BENCHMARK_CLAUDE_MODEL", "claude-3-haiku-20240307")


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


async def evaluate_answers(
    student_name: str,
    age: int,
    grade: str,
    character: str,
    qa_pairs: list[dict],
) -> dict:
    """Evaluate all Q&A pairs against rubrics and produce benchmark scores.

    qa_pairs: list of {
        "question_number": int,
        "question_text": str,
        "answer_text": str,
        "pillars": list[str],
        "strong_signals": list[str],
        "watchout_signals": list[str],
    }
    """
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

    client = _get_claude_client()
    model = _get_claude_model()
    response = await client.messages.create(
        model=model,
        max_tokens=4000,
        system=system_prompt,
        messages=[{"role": "user", "content": f"Here are the 20 diagnostic questions and the student's answers:\n{qa_block}"}],
    )

    raw_text = response.content[0].text.strip()
    parsed = _robust_json_parse(raw_text)
    if parsed is not None:
        return parsed

    retry_resp = await client.messages.create(
        model=model,
        max_tokens=4000,
        system="You are a JSON repair tool. Return ONLY a valid JSON object.",
        messages=[{"role": "user", "content": f"Fix this JSON:\n\n{raw_text}"}],
    )
    retry_text = retry_resp.content[0].text.strip()
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
) -> str:
    """Generate brief, friendly, constructive feedback for a single answer.

    Returns a 2-3 sentence feedback string in the character's voice.
    Designed to be fast (small prompt, short output).
    """
    persona = CHARACTER_PERSONALITIES.get(character, CHARACTER_PERSONALITIES["harry_potter"])

    system_prompt = f"""You are {persona['name']}, talking to {student_name} (grade {grade}).
Your tone is {persona['tone']}.

Give brief, constructive feedback on the student's answer to a question.
Rules:
- 2-3 sentences MAX. Keep it short and conversational.
- Start with something positive about what they said (even if partially correct).
- If the answer is weak or wrong, gently point toward better thinking without giving the answer away.
- Use simple, age-appropriate language.
- Stay in character.
- Do NOT use markdown, asterisks, or special formatting.
- Do NOT repeat the question back."""

    user_msg = f"Question {question_number}: {question_text}\n\nStudent's answer: {answer_text}"

    client = _get_claude_client()
    model = _get_claude_model()
    response = await client.messages.create(
        model=model,
        max_tokens=200,
        system=system_prompt,
        messages=[{"role": "user", "content": user_msg}],
    )

    return response.content[0].text.strip()


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
