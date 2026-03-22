"""
Evaluate student responses for activity questions.

Returns (outcome: float 0-1, source: str, feedback: str)

Deterministic slugs: outcome computed from response data
LLM slugs: call Spark LLM with rubric from question data
"""
from __future__ import annotations

import json
import logging
import re

logger = logging.getLogger(__name__)

# Source reliability weights by evaluation method
_MCQ_SOURCE = "mcq"
_LLM_SOURCE = "llm_transcript"

DETERMINISTIC_SLUGS = {
    "mcq_single", "mcq_timed",
    "fill_blanks",
    "slider_input",
    "drag_drop_classifier",
    "drag_drop_placement",
    "flowchart",
    "geometry_explorer",
    "geometry_animated",
    "label_elements",
}

LLM_SLUGS = {
    "short_answer",
    "image_response",
    "audio_response",
    "debate_opinion",
    "ai_conversation",
    "draw_scribble",
    "reflection_rating",
}


def evaluate_deterministic(
    slug: str,
    question_data: dict,
    response: dict,
) -> tuple[float, str, str]:
    """Evaluate response without LLM. Returns (outcome, source, feedback)."""

    if slug in ("mcq_single", "mcq_timed"):
        selected = response.get("selected")
        options = question_data.get("options", [])
        if selected is None or not isinstance(options, list):
            return 0.0, _MCQ_SOURCE, "No answer selected."
        try:
            opt = options[int(selected)]
            if isinstance(opt, str):
                opt = json.loads(opt)
            correct = bool(opt.get("is_correct", False))
        except (IndexError, ValueError, TypeError, json.JSONDecodeError):
            correct = False
        return (1.0 if correct else 0.0), _MCQ_SOURCE, ("Correct!" if correct else "Incorrect.")

    if slug == "fill_blanks":
        correct = bool(response.get("correct", False))
        return (1.0 if correct else 0.0), _MCQ_SOURCE, ("All blanks correct!" if correct else "Some blanks were wrong.")

    if slug == "slider_input":
        correct = bool(response.get("correct", False))
        val = response.get("value", "?")
        return (1.0 if correct else 0.0), _MCQ_SOURCE, (f"Correct! Value: {val}" if correct else f"Not quite. You selected {val}.")

    if slug in ("drag_drop_classifier", "drag_drop_placement", "flowchart"):
        correct = bool(response.get("correct", False))
        return (1.0 if correct else 0.0), _MCQ_SOURCE, ("All items placed correctly!" if correct else "Some items were in the wrong position.")

    if slug in ("geometry_explorer", "geometry_animated"):
        correct = bool(response.get("correct", False))
        return (1.0 if correct else 0.0), _MCQ_SOURCE, ("Correct!" if correct else "Not quite.")

    if slug == "label_elements":
        placed = set(response.get("placed", []))
        correct_labels = set(question_data.get("correct_labels", []))
        if not correct_labels:
            # No rubric defined — give credit for engagement
            return 0.8, _MCQ_SOURCE, "Labels submitted."
        overlap = len(placed & correct_labels)
        outcome = overlap / len(correct_labels) if correct_labels else 1.0
        return round(outcome, 2), _MCQ_SOURCE, f"{overlap}/{len(correct_labels)} labels correct."

    return 0.5, _MCQ_SOURCE, "Answer recorded."


async def evaluate_with_llm(
    slug: str,
    question_data: dict,
    response: dict,
    spark_client,
    spark_model: str,
) -> tuple[float, str, str]:
    """Evaluate open-ended response using LLM. Returns (outcome, source, feedback)."""

    # Build grading prompt based on slug
    if slug in ("short_answer", "image_response", "audio_response"):
        prompt_text = question_data.get("prompt") or question_data.get("question", "")
        model_answer = question_data.get("model_answer") or question_data.get("correct_answer", "")
        rubric = question_data.get("rubric", "")
        student_text = response.get("text", "")

        prompt = f"""You are grading a student's written answer. Be fair and encouraging.

Question: {prompt_text}
{f'Model answer: {model_answer}' if model_answer else ''}
{f'Rubric: {rubric}' if rubric else ''}
Student answer: {student_text}

Score the answer 0.0 to 1.0:
- 1.0 = fully correct / complete
- 0.7 = mostly correct, minor gaps
- 0.5 = partially correct
- 0.2 = attempted but mostly wrong
- 0.0 = blank or completely wrong

Respond with JSON only: {{"score": 0.8, "feedback": "Good explanation of..."}}"""

    elif slug == "debate_opinion":
        topic = question_data.get("topic", "")
        stance = response.get("stance", "")
        messages = response.get("messages", [])
        argument_text = " ".join(messages) if messages else ""

        prompt = f"""You are evaluating a student's debate argument.

Topic: {topic}
Stance chosen: {stance}
Student's argument: {argument_text}

Score 0.0 to 1.0 based on:
- Clarity of reasoning (took a position and supported it)
- Engagement (at least one substantive message)
- 1.0 = well-reasoned argument, 0.5 = basic engagement, 0.0 = no argument

Respond with JSON only: {{"score": 0.7, "feedback": "You argued your position clearly..."}}"""

    elif slug == "ai_conversation":
        goal = question_data.get("goal", "")
        messages = response.get("messages", [])
        user_messages = [m.get("text", "") for m in messages if m.get("role") == "user"]
        conversation = " | ".join(user_messages)

        prompt = f"""You are evaluating a student's AI conversation engagement.

Goal: {goal}
Student messages: {conversation}

Score 0.0 to 1.0 based on:
- Depth of engagement (asked follow-up questions, explored the topic)
- Number of meaningful exchanges (3+ = full credit)
- 1.0 = deep exploration, 0.5 = basic chat, 0.0 = no engagement

Respond with JSON only: {{"score": 0.8, "feedback": "Great exploration of the topic!"}}"""

    elif slug == "draw_scribble":
        prompt_text = question_data.get("prompt", "")
        rubric = question_data.get("rubric", "")
        shapes = response.get("shapes", [])
        drawing_b64 = response.get("drawing", "")

        # If we have a base64 image and the model supports vision, use multimodal
        if drawing_b64:
            shape_desc = json.dumps(shapes, default=str) if shapes else "no shape metadata"
            text_prompt = f"""You are evaluating a student's drawing/diagram.

Task: {prompt_text}
{f'Rubric: {rubric}' if rubric else ''}
Shape metadata: {shape_desc}

Look at the student's drawing and evaluate it.

Score 0.0 to 1.0 based on:
- 1.0 = fully meets the task requirements, clear and accurate
- 0.7 = mostly correct, minor issues
- 0.5 = partial attempt, some elements correct
- 0.2 = attempted but mostly wrong or unclear
- 0.0 = blank or completely unrelated

Respond with JSON only: {{"score": 0.7, "feedback": "Your diagram shows..."}}"""

            try:
                resp = await spark_client.chat.completions.create(
                    model=spark_model,
                    messages=[{"role": "user", "content": [
                        {"type": "text", "text": text_prompt},
                        {"type": "image_url", "image_url": {"url": drawing_b64}},
                    ]}],
                    temperature=0.1,
                )
                return _parse_llm_score(resp, slug)
            except Exception:
                logger.warning("Vision eval failed for draw_scribble, falling back to text-only")
                # Fall through to text-only evaluation below

        # Text-only fallback: evaluate based on shape metadata
        shape_desc = json.dumps(shapes, default=str) if shapes else "empty canvas"
        prompt = f"""You are evaluating a student's drawing/diagram based on its shape metadata.

Task: {prompt_text}
{f'Rubric: {rubric}' if rubric else ''}
Shapes drawn: {shape_desc}

Score 0.0 to 1.0 based on:
- Did the student draw relevant shapes for the task?
- Are shapes labeled appropriately?
- 1.0 = clear, complete diagram, 0.5 = partial attempt, 0.0 = empty/unrelated

Respond with JSON only: {{"score": 0.7, "feedback": "Your diagram shows..."}}"""

    elif slug == "reflection_rating":
        prompt_text = question_data.get("prompt", "")
        rating = response.get("rating")
        follow_up = response.get("followUp", "")
        scale_type = question_data.get("scale_type", "likert_5")

        prompt = f"""You are evaluating a student's reflection response.

Reflection question: {prompt_text}
Scale type: {scale_type}
Student's rating: {rating}
Student's written reflection: {follow_up}

Score 0.0 to 1.0 based on:
- Thoughtfulness of the reflection (not the rating value itself)
- If they wrote a follow-up, how meaningful and self-aware is it?
- A high rating alone without reflection = 0.5
- Any genuine written reflection = at least 0.7
- Deep, specific self-awareness = 1.0
- No follow-up and just a rating click = 0.4

Respond with JSON only: {{"score": 0.7, "feedback": "Good reflection! ..."}}"""

    else:
        return 0.5, _LLM_SOURCE, "Answer recorded."

    try:
        resp = await spark_client.chat.completions.create(
            model=spark_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
        )
        return _parse_llm_score(resp, slug)
    except Exception:
        logger.exception("LLM grading failed for slug=%s", slug)
        return 0.5, _LLM_SOURCE, "Answer recorded."


def _parse_llm_score(resp, slug: str) -> tuple[float, str, str]:
    """Extract score + feedback JSON from LLM response."""
    content = resp.choices[0].message.content or ""
    match = re.search(r"\{[\s\S]*\}", content)
    if not match:
        raise ValueError("No JSON in LLM response")
    result = json.loads(match.group())
    score = max(0.0, min(1.0, float(result.get("score", 0.5))))
    feedback = str(result.get("feedback", "Answer evaluated."))
    return score, _LLM_SOURCE, feedback


async def evaluate(
    slug: str,
    question_data: dict,
    response: dict,
    spark_client=None,
    spark_model: str = "",
) -> tuple[float, str, str]:
    """
    Main entry point. Returns (outcome, source, feedback).

    For LLM slugs, spark_client must be provided. If not, falls back to 0.5.
    """
    if slug == "multi_step":
        return await _evaluate_multi_step(question_data, response, spark_client, spark_model)

    if slug in DETERMINISTIC_SLUGS:
        return evaluate_deterministic(slug, question_data, response)

    if slug in LLM_SLUGS:
        if spark_client is None:
            return 0.5, _LLM_SOURCE, "Answer recorded."
        return await evaluate_with_llm(slug, question_data, response, spark_client, spark_model)

    # Unknown slug — fallback
    return 0.5, _LLM_SOURCE, "Answer recorded."


async def _evaluate_multi_step(
    question_data: dict,
    response: dict,
    spark_client,
    spark_model: str,
) -> tuple[float, str, str]:
    """Average outcomes across all steps."""
    steps = question_data.get("steps", [])
    answers = response.get("answers", {})
    if not steps or not answers:
        return 0.5, _LLM_SOURCE, "Multi-step answer recorded."

    outcomes = []
    for i, step in enumerate(steps):
        step_slug = str(step.get("type", "short_answer"))
        step_data = step.get("data", {})
        step_response = answers.get(str(i)) or answers.get(i, {})
        if not isinstance(step_response, dict):
            step_response = {"value": step_response}
        outcome, _, _ = await evaluate(step_slug, step_data, step_response, spark_client, spark_model)
        outcomes.append(outcome)

    avg = sum(outcomes) / len(outcomes) if outcomes else 0.5
    return round(avg, 3), _LLM_SOURCE, f"Completed {len(outcomes)} steps."
