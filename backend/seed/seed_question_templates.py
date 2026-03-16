"""
Seed the 15 question interaction templates.

Run: python -m seed.seed_question_templates
"""
from sqlalchemy import create_engine, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.config import Settings
from app.models.question_template import QuestionTemplate

settings = Settings()
engine = create_engine(settings.DATABASE_URL_SYNC)

TEMPLATES = [
    {
        "slug": "fill_blanks",
        "name": "Fill in the Blanks",
        "description": "Sentence with one or more blanks for the student to complete. Great for recall and vocabulary.",
        "example_use_cases": "Warm Up - If/Then Chain, vocabulary recall, sentence completion",
        "frontend_component": "FillBlanks",
        "icon": "\u270D",
        "scorable": True,
        "sort_order": 1,
        "input_schema": {
            "fields": [
                {"key": "sentence", "type": "text", "label": "Sentence with {{blank}} placeholders", "required": True},
                {"key": "answers", "type": "list", "label": "Correct answers (one per blank)", "required": True},
                {"key": "distractors", "type": "list", "label": "Wrong options (optional, for word bank)", "required": False},
            ]
        },
        "llm_prompt_template": "Create a fill-in-the-blanks question for grade {{grade}} on the topic: {{topic}}. The sentence should have 1-2 blanks marked as {{blank}}. Return JSON with keys: sentence, answers (array), distractors (array).",
    },
    {
        "slug": "drag_drop_placement",
        "name": "Drag & Drop - Placement",
        "description": "Student drags items into correct positions on a diagram, flowchart, or structured layout.",
        "example_use_cases": "Flowchart symbols, decision trees, sequencing steps",
        "frontend_component": "DragDropPlacement",
        "icon": "\U0001F4CC",
        "scorable": True,
        "sort_order": 2,
        "input_schema": {
            "fields": [
                {"key": "instruction", "type": "text", "label": "Instruction text", "required": True},
                {"key": "items", "type": "list", "label": "Draggable items", "required": True},
                {"key": "zones", "type": "list", "label": "Drop zones with correct item mapping", "required": True},
                {"key": "image_url", "type": "text", "label": "Background image URL (optional)", "required": False},
            ]
        },
        "llm_prompt_template": "Create a drag-and-drop placement question for grade {{grade}} on: {{topic}}. Student drags items into correct positions. Return JSON with keys: instruction, items (array of {id, label}), zones (array of {id, label, correct_item_id}).",
    },
    {
        "slug": "drag_drop_classifier",
        "name": "Drag & Drop - Classifier",
        "description": "Student sorts items into categories by dragging them into the correct bucket.",
        "example_use_cases": "Critique & feedback sorting, classify shapes, group by property",
        "frontend_component": "DragDropClassifier",
        "icon": "\U0001F5C2",
        "scorable": True,
        "sort_order": 3,
        "input_schema": {
            "fields": [
                {"key": "instruction", "type": "text", "label": "Instruction text", "required": True},
                {"key": "categories", "type": "list", "label": "Category names", "required": True},
                {"key": "items", "type": "categorized_list", "label": "Items to classify", "required": True, "category_source": "categories"},
            ]
        },
        "llm_prompt_template": "Create a classification question for grade {{grade}} on: {{topic}}. Student sorts items into categories. Return JSON with keys: instruction, categories (array of strings), items (array of {label, correct_category}).",
    },
    {
        "slug": "label_elements",
        "name": "Label Elements",
        "description": "Student labels parts of a diagram or image by placing text on hotspots.",
        "example_use_cases": "Flowchart symbols, anatomy, geometry diagrams",
        "frontend_component": "LabelElements",
        "icon": "\U0001F3F7",
        "scorable": True,
        "sort_order": 4,
        "input_schema": {
            "fields": [
                {"key": "instruction", "type": "text", "label": "Instruction text", "required": True},
                {"key": "image_url", "type": "text", "label": "Image URL", "required": True},
                {"key": "hotspots", "type": "list", "label": "Hotspots with position and correct label", "required": True},
                {"key": "label_options", "type": "list", "label": "Available labels to choose from", "required": True},
            ]
        },
        "llm_prompt_template": "Create a labeling question for grade {{grade}} on: {{topic}}. Student labels parts of a diagram. Return JSON with keys: instruction, hotspots (array of {id, x_pct, y_pct, correct_label}), label_options (array of strings).",
    },
    {
        "slug": "mcq_single",
        "name": "MCQ - Single Select",
        "description": "Standard multiple choice with one correct answer from 4 options.",
        "example_use_cases": "Feedback understanding, AI shapes, general knowledge check",
        "frontend_component": "McqSingle",
        "icon": "\u2753",
        "scorable": True,
        "sort_order": 5,
        "input_schema": {
            "fields": [
                {"key": "question", "type": "text", "label": "Question text", "required": True},
                {"key": "options", "type": "list", "label": "Answer options (mark one correct)", "required": True},
                {"key": "explanation", "type": "text", "label": "Explanation for correct answer", "required": False},
            ]
        },
        "llm_prompt_template": "Create an MCQ for grade {{grade}} on: {{topic}}. Single correct answer from 4 options. Return JSON with keys: question, options (array of {text, is_correct}), explanation.",
    },
    {
        "slug": "mcq_timed",
        "name": "MCQ - Timed (Sprint)",
        "description": "MCQ with a countdown timer. Difficulty adapts based on speed and accuracy.",
        "example_use_cases": "Fast math drills, word problems, speed rounds",
        "frontend_component": "McqTimed",
        "icon": "\u23F1",
        "scorable": True,
        "sort_order": 6,
        "input_schema": {
            "fields": [
                {"key": "question", "type": "text", "label": "Question text", "required": True},
                {"key": "options", "type": "list", "label": "Answer options (mark one correct)", "required": True},
                {"key": "time_limit_seconds", "type": "number", "label": "Time limit (seconds)", "required": True},
                {"key": "difficulty", "type": "select", "label": "Difficulty", "options": ["easy", "medium", "hard"], "required": False},
            ]
        },
        "llm_prompt_template": "Create a timed MCQ for grade {{grade}} on: {{topic}}. Difficulty: {{difficulty}}. Time limit: {{time_limit_seconds}}s. Return JSON with keys: question, options (array of {text, is_correct}), time_limit_seconds, difficulty.",
    },
    {
        "slug": "short_answer",
        "name": "Short Answer - Text",
        "description": "Open-ended typed response evaluated by AI for correctness and quality.",
        "example_use_cases": "Creativity map, username creation, paraphrasing, parrot exercise",
        "frontend_component": "ShortAnswer",
        "icon": "\U0001F4DD",
        "scorable": True,
        "sort_order": 7,
        "input_schema": {
            "fields": [
                {"key": "prompt", "type": "text", "label": "Question / prompt", "required": True},
                {"key": "rubric", "type": "text", "label": "Grading rubric for AI", "required": False},
                {"key": "sample_answer", "type": "text", "label": "Sample correct answer", "required": False},
                {"key": "max_words", "type": "number", "label": "Max word count", "required": False},
            ]
        },
        "llm_prompt_template": "Create a short answer question for grade {{grade}} on: {{topic}}. Return JSON with keys: prompt, sample_answer, rubric, max_words.",
    },
    {
        "slug": "image_response",
        "name": "Image + Short Answer",
        "description": "An image is shown and the student describes or responds to it in text.",
        "example_use_cases": "What could this be?, visual description, observation skills",
        "frontend_component": "ImageResponse",
        "icon": "\U0001F5BC",
        "scorable": True,
        "sort_order": 8,
        "input_schema": {
            "fields": [
                {"key": "image_url", "type": "text", "label": "Image URL", "required": True},
                {"key": "prompt", "type": "text", "label": "Question about the image", "required": True},
                {"key": "rubric", "type": "text", "label": "Grading rubric", "required": False},
                {"key": "sample_answer", "type": "text", "label": "Sample answer", "required": False},
            ]
        },
        "llm_prompt_template": "Create an image-based question for grade {{grade}} on: {{topic}}. The image shows: {{image_description}}. Return JSON with keys: prompt, rubric, sample_answer.",
    },
    {
        "slug": "audio_response",
        "name": "Audio + Short Answer",
        "description": "An audio clip plays once and the student recalls or responds from memory.",
        "example_use_cases": "Audio memory warm-up, listening comprehension, dictation",
        "frontend_component": "AudioResponse",
        "icon": "\U0001F3A7",
        "scorable": True,
        "sort_order": 9,
        "input_schema": {
            "fields": [
                {"key": "audio_url", "type": "text", "label": "Audio file URL", "required": True},
                {"key": "prompt", "type": "text", "label": "Question after audio plays", "required": True},
                {"key": "transcript", "type": "text", "label": "Audio transcript (for AI grading)", "required": False},
                {"key": "allow_replay", "type": "boolean", "label": "Allow replay?", "required": False},
            ]
        },
        "llm_prompt_template": "Create an audio-based recall question for grade {{grade}} on: {{topic}}. Return JSON with keys: prompt, transcript (what the audio says), rubric.",
    },
    {
        "slug": "multi_step",
        "name": "Multi-Step Response",
        "description": "Sequential steps where each depends on the prior answer. Combines different interaction types.",
        "example_use_cases": "Critique & Feedback (MCQ then drag then answer), multi-part problems",
        "frontend_component": "MultiStep",
        "icon": "\U0001F4CB",
        "scorable": True,
        "sort_order": 10,
        "input_schema": {
            "fields": [
                {"key": "steps", "type": "list", "label": "Ordered steps (each with its own type and data)", "required": True},
                {"key": "overall_instruction", "type": "text", "label": "Overall instruction", "required": False},
            ]
        },
        "llm_prompt_template": "Create a multi-step question for grade {{grade}} on: {{topic}}. It should have 2-3 sequential steps. Return JSON with keys: overall_instruction, steps (array of {step_number, type, data}).",
    },
    {
        "slug": "slider_input",
        "name": "Slider / Interactive Input",
        "description": "Interactive slider, number line, or input widget for precise value selection.",
        "example_use_cases": "Basic geometry angles, number line estimation, temperature reading",
        "frontend_component": "SliderInput",
        "icon": "\U0001F39A",
        "scorable": True,
        "sort_order": 11,
        "input_schema": {
            "fields": [
                {"key": "prompt", "type": "text", "label": "Question text", "required": True},
                {"key": "min_value", "type": "number", "label": "Minimum value", "required": True},
                {"key": "max_value", "type": "number", "label": "Maximum value", "required": True},
                {"key": "correct_value", "type": "number", "label": "Correct value", "required": True},
                {"key": "tolerance", "type": "number", "label": "Acceptable tolerance (+/-)", "required": False},
                {"key": "unit", "type": "text", "label": "Unit label (degrees, cm, etc.)", "required": False},
            ]
        },
        "llm_prompt_template": "Create a slider/interactive input question for grade {{grade}} on: {{topic}}. Return JSON with keys: prompt, min_value, max_value, correct_value, tolerance, unit.",
    },
    {
        "slug": "debate_opinion",
        "name": "Debate / Structured Opinion",
        "description": "Student picks a stance on a topic and argues their position. AI (Spark) plays devil's advocate.",
        "example_use_cases": "Should AI make decisions?, ethics debates, persuasive writing",
        "frontend_component": "DebateOpinion",
        "icon": "\U0001F4E2",
        "scorable": False,
        "sort_order": 12,
        "input_schema": {
            "fields": [
                {"key": "topic", "type": "text", "label": "Debate topic / question", "required": True},
                {"key": "stances", "type": "list", "label": "Available stances (e.g. For, Against, Neutral)", "required": True},
                {"key": "rubric", "type": "text", "label": "Evaluation rubric for AI", "required": False},
                {"key": "rounds", "type": "number", "label": "Number of debate rounds", "required": False},
            ]
        },
        "llm_prompt_template": "Create a debate topic for grade {{grade}} on: {{topic}}. Return JSON with keys: topic, stances (array of strings), rubric, rounds.",
    },
    {
        "slug": "ai_conversation",
        "name": "AI Conversation (Spark)",
        "description": "Free-form chat with Spark AI. Student explores a topic through guided conversation.",
        "example_use_cases": "AI Lab talk to Spark, refine idea, brainstorming, Socratic dialogue",
        "frontend_component": "AiConversation",
        "icon": "\U0001F4AC",
        "scorable": False,
        "sort_order": 13,
        "input_schema": {
            "fields": [
                {"key": "system_prompt", "type": "textarea", "label": "System prompt for Spark AI", "required": True},
                {"key": "opening_message", "type": "text", "label": "Spark's opening message", "required": True},
                {"key": "goal", "type": "text", "label": "Learning goal / success criteria", "required": False},
                {"key": "max_turns", "type": "number", "label": "Max conversation turns", "required": False},
            ]
        },
        "llm_prompt_template": "Design an AI conversation activity for grade {{grade}} on: {{topic}}. Return JSON with keys: system_prompt, opening_message, goal, max_turns.",
    },
    {
        "slug": "draw_scribble",
        "name": "Draw / Scribble Board",
        "description": "Freehand drawing on a canvas. Student sketches diagrams, flowcharts, or creative art.",
        "example_use_cases": "Flowchart symbols, creative expression, math diagram sketching",
        "frontend_component": "DrawScribble",
        "icon": "\U0001F3A8",
        "scorable": False,
        "sort_order": 14,
        "input_schema": {
            "fields": [
                {"key": "prompt", "type": "text", "label": "Drawing prompt / instruction", "required": True},
                {"key": "reference_image_url", "type": "text", "label": "Reference image (optional)", "required": False},
                {"key": "rubric", "type": "text", "label": "Evaluation criteria", "required": False},
            ]
        },
        "llm_prompt_template": "Create a drawing activity for grade {{grade}} on: {{topic}}. Return JSON with keys: prompt, rubric.",
    },
    {
        "slug": "reflection_rating",
        "name": "Reflection / Rating",
        "description": "Likert scale or emoji-based mood/reflection check. Used for self-assessment and emotional awareness.",
        "example_use_cases": "Emotional responses, confidence check, session reflection",
        "frontend_component": "ReflectionRating",
        "icon": "\U0001F31F",
        "scorable": False,
        "sort_order": 15,
        "input_schema": {
            "fields": [
                {"key": "prompt", "type": "text", "label": "Reflection question", "required": True},
                {"key": "scale_type", "type": "select", "label": "Scale type", "options": ["likert_5", "emoji", "stars", "thumbs"], "required": True},
                {"key": "labels", "type": "list", "label": "Scale labels (e.g. Strongly Disagree to Strongly Agree)", "required": False},
                {"key": "follow_up_prompt", "type": "text", "label": "Follow-up text prompt (optional)", "required": False},
            ]
        },
        "llm_prompt_template": "Create a reflection/rating question for grade {{grade}} on: {{topic}}. Return JSON with keys: prompt, scale_type, labels (array), follow_up_prompt.",
    },
]


def seed():
    with Session(engine) as db:
        inserted = 0
        for t in TEMPLATES:
            stmt = (
                insert(QuestionTemplate)
                .values(**t)
                .on_conflict_do_update(
                    index_elements=["slug"],
                    set_={k: v for k, v in t.items() if k != "slug"},
                )
            )
            db.execute(stmt)
            inserted += 1

        db.commit()
        print(f"  Question templates: {inserted} upserted")


if __name__ == "__main__":
    seed()
