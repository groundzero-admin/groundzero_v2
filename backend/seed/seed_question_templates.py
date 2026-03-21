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
        "llm_prompt_template": """Generate a fill-in-the-blanks question based on: "{{description}}" (grade band: {{grade_band}}).
Return ONLY a JSON object: {"sentence": "sentence with {{blank}} placeholders", "answers": ["answer1"], "distractors": ["wrong1", "wrong2", "wrong3"]}
Rules: use the literal text {{blank}} (with double curly braces) for each blank in the sentence. answers array must have one entry per blank in order. distractors are 2-3 wrong options for the word bank. Return ONLY JSON.""",
    },
    {
        "slug": "drag_drop_placement",
        "name": "Flowchart - Interactive",
        "description": "Student completes an interactive flowchart by tapping items from a bank and placing them into blank nodes. Supports linear sequences, decision branches, and converging paths.",
        "example_use_cases": "Decision trees, algorithm steps, process flows, sequencing, if-then logic",
        "frontend_component": "FlowchartQuestion",
        "icon": "\U0001F4CC",
        "scorable": True,
        "sort_order": 2,
        "input_schema": {
            "fields": [
                {"key": "instruction", "type": "text", "label": "Instruction text", "required": True},
                {"key": "nodes", "type": "flowchart_nodes", "label": "Nodes", "required": True},
                {"key": "edges", "type": "flowchart_edges", "label": "Edges", "required": True},
                {"key": "items", "type": "list", "label": "Word bank items (correct answers + distractors)", "required": True},
            ]
        },
        "llm_prompt_template": """You are a curriculum designer. Generate an interactive flowchart question based on this description:

"{{description}}"

Grade band: {{grade_band}}

Return ONLY a JSON object with these exact keys:
{
  "instruction": "string — what the student should do",
  "nodes": [
    {"id": "n1", "type": "start", "label": "Start", "x": 50, "y": 8},
    {"id": "n2", "type": "process", "label": "Step text", "x": 50, "y": 30},
    {"id": "n3", "type": "process", "blank": true, "correct": "correct answer", "x": 50, "y": 52},
    {"id": "n4", "type": "end", "label": "End", "x": 50, "y": 88}
  ],
  "edges": [
    {"from": "n1", "to": "n2"},
    {"from": "n2", "to": "n3"},
    {"from": "n3", "to": "n4"}
  ],
  "items": ["correct answer", "distractor 1", "distractor 2"]
}

Rules:
- Use type "start" (1 node), "end" (1 node), "process" (steps), "decision" (yes/no branch)
- Blank nodes: set blank=true, correct="answer text", omit label
- Non-blank nodes: set label="text", omit blank/correct
- x/y are 0-100 percentages. start y=8, end y=88, space others evenly in between
- For decision branches: decision x=50, left branch x=25, right branch x=75, converge back at x=50
- items = all correct answers for blank nodes + 2-3 distractors (same type of text)
- Return ONLY the JSON, no explanation""",
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
        "llm_prompt_template": """Generate a drag-and-drop classifier question based on: "{{description}}" (grade band: {{grade_band}}).
Return ONLY a JSON object: {"instruction": "string", "categories": ["Cat A", "Cat B"], "items": [{"label": "item text", "correct_category": "Cat A"}]}
Include 2-4 categories and 6-10 items distributed across them. Return ONLY JSON.""",
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
                {"key": "image_url", "type": "image_upload", "label": "Image", "required": False},
                {"key": "label_options", "type": "list", "label": "Labels to choose from", "required": True},
            ]
        },
        "llm_prompt_template": """Generate a label-the-diagram question based on: "{{description}}" (grade band: {{grade_band}}).
Return ONLY a JSON object: {"instruction": "string", "image_url": "", "label_options": ["label1", "label2", "label3", "distractor1"]}
Leave image_url empty — teacher will paste the image link. label_options = all correct labels + 2-3 distractors mixed in. Return ONLY JSON.""",
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
                {"key": "options", "type": "mcq_options", "label": "Answer options", "required": True},
                {"key": "explanation", "type": "text", "label": "Explanation for correct answer", "required": False},
            ]
        },
        "llm_prompt_template": """Generate a multiple-choice question based on: "{{description}}" (grade band: {{grade_band}}).
Return ONLY a JSON object: {"question": "string", "options": [{"text": "option text", "is_correct": false}], "explanation": "why the correct answer is right"}
Exactly 4 options, exactly 1 with is_correct=true. Return ONLY JSON.""",
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
                {"key": "options", "type": "mcq_options", "label": "Answer options", "required": True},
                {"key": "time_limit_seconds", "type": "number", "label": "Time limit (seconds)", "required": True},
                {"key": "difficulty", "type": "select", "label": "Difficulty", "options": ["easy", "medium", "hard"], "required": False},
            ]
        },
        "llm_prompt_template": """Generate a timed MCQ question based on: "{{description}}" (grade band: {{grade_band}}).
Return ONLY a JSON object: {"question": "string", "options": [{"text": "option text", "is_correct": false}], "time_limit_seconds": 30, "difficulty": "medium"}
Exactly 4 options, exactly 1 correct. difficulty = easy/medium/hard. time_limit_seconds = 15-60. Return ONLY JSON.""",
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
        "llm_prompt_template": """Generate a short answer question based on: "{{description}}" (grade band: {{grade_band}}).
Return ONLY a JSON object: {"prompt": "question text", "sample_answer": "ideal answer", "rubric": "how to grade it", "max_words": 50}
Keep sample_answer concise. rubric should describe what earns full marks. Return ONLY JSON.""",
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
                {"key": "image_url", "type": "image_upload", "label": "Image", "required": True},
                {"key": "prompt", "type": "text", "label": "Question about the image", "required": True},
                {"key": "rubric", "type": "text", "label": "Grading rubric", "required": False},
                {"key": "sample_answer", "type": "text", "label": "Sample answer", "required": False},
            ]
        },
        "llm_prompt_template": """Generate an image-response question based on: "{{description}}" (grade band: {{grade_band}}).
Return ONLY a JSON object: {"image_url": "", "prompt": "question about the image", "rubric": "grading criteria", "sample_answer": "ideal answer"}
Leave image_url empty — teacher will add it. prompt should work with any relevant image of this topic. Return ONLY JSON.""",
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
        "llm_prompt_template": """Generate an audio-response question based on: "{{description}}" (grade band: {{grade_band}}).
Return ONLY a JSON object: {"audio_url": "", "prompt": "question after audio plays", "transcript": "what the audio clip should say", "allow_replay": false}
Leave audio_url empty — teacher will add it. transcript should be 2-4 sentences the teacher can use to record audio. Return ONLY JSON.""",
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
                {"key": "steps", "type": "multi_step_builder", "label": "Steps", "required": True},
                {"key": "overall_instruction", "type": "text", "label": "Overall instruction", "required": False},
            ]
        },
        "llm_prompt_template": """Generate a multi-step question based on: "{{description}}" (grade band: {{grade_band}}).
Return ONLY a JSON object with this exact structure:
{"overall_instruction": "string", "steps": [
  {"step_number": 1, "type": "mcq_single", "data": {"question": "...", "options": [{"text": "...", "is_correct": false}, {"text": "...", "is_correct": true}]}},
  {"step_number": 2, "type": "fill_blanks", "data": {"sentence": "sentence with {{blank}} placeholder", "answers": ["correct"], "distractors": ["wrong1", "wrong2"]}},
  {"step_number": 3, "type": "short_answer", "data": {"prompt": "question text here", "example_answer": "sample answer"}}
]}
Use 2-3 steps. Step types and their required data keys:
- mcq_single: {question, options:[{text, is_correct}]}
- fill_blanks: {sentence (use {{blank}} for blanks), answers:[...], distractors:[...]}
- short_answer: {prompt, example_answer}
Return ONLY JSON.""",
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
                {"key": "image_url", "type": "image_upload", "label": "Diagram image (optional)", "required": False},
                {"key": "min_value", "type": "number", "label": "Minimum value", "required": True},
                {"key": "max_value", "type": "number", "label": "Maximum value", "required": True},
                {"key": "correct_value", "type": "number", "label": "Correct value", "required": True},
                {"key": "tolerance", "type": "number", "label": "Acceptable tolerance (+/-)", "required": False},
                {"key": "unit", "type": "text", "label": "Unit label (degrees, cm, etc.)", "required": False},
            ]
        },
        "llm_prompt_template": """Generate a slider input question based on: "{{description}}" (grade band: {{grade_band}}).
Return ONLY a JSON object: {"prompt": "question text", "min_value": 0, "max_value": 100, "correct_value": 45, "tolerance": 5, "unit": "degrees"}
Pick a specific numeric answer. tolerance is acceptable error margin. unit is the measurement unit. Return ONLY JSON.""",
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
        "llm_prompt_template": """Generate a debate activity based on: "{{description}}" (grade band: {{grade_band}}).
Return ONLY a JSON object: {"topic": "debate question", "stances": ["For", "Against", "Neutral"], "rubric": "what makes a strong argument", "rounds": 3}
topic should be a clear yes/no or for/against question. Return ONLY JSON.""",
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
        "llm_prompt_template": """Generate an AI conversation activity based on: "{{description}}" (grade band: {{grade_band}}).
Return ONLY a JSON object: {"system_prompt": "You are a helpful tutor. Your goal is to...", "opening_message": "Spark's first message to student", "goal": "what student should learn/achieve", "max_turns": 6}
system_prompt should guide Spark to stay on topic and age-appropriate. Return ONLY JSON.""",
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
                {"key": "reference_image_url", "type": "image_upload", "label": "Reference image (optional)", "required": False},
                {"key": "rubric", "type": "text", "label": "Evaluation criteria", "required": False},
            ]
        },
        "llm_prompt_template": """Generate a drawing activity based on: "{{description}}" (grade band: {{grade_band}}).
Return ONLY a JSON object: {"prompt": "what to draw", "reference_image_url": "", "rubric": "what to look for when evaluating"}
prompt should be specific and achievable. Leave reference_image_url empty. Return ONLY JSON.""",
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
        "llm_prompt_template": """Generate a reflection/rating question based on: "{{description}}" (grade band: {{grade_band}}).
Return ONLY a JSON object: {"prompt": "reflection question", "scale_type": "likert_5", "labels": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"], "follow_up_prompt": "optional follow-up question"}
scale_type options: likert_5, emoji, stars, thumbs. Match labels to scale_type. Return ONLY JSON.""",
    },
    {
        "slug": "geometry_explorer",
        "name": "Geometry - Interactive Explorer",
        "description": "Student explores geometry interactively — drag a ray to change angles, or slide to morph shapes. Builds intuition before answering a question.",
        "example_use_cases": "Angle types (acute/obtuse/reflex), interior angles of polygons, angle sum property",
        "frontend_component": "GeometryExplorer",
        "icon": "📐",
        "scorable": True,
        "sort_order": 16,
        "input_schema": {
            "fields": [
                {"key": "mode", "type": "select", "label": "Interaction mode", "options": ["angle_drag", "angle_slider", "shape_explorer"], "required": True},
                {"key": "question", "type": "text", "label": "Question text (shown below the figure)", "required": True},
                {"key": "options", "type": "list", "label": "MCQ answer options", "required": True},
                {"key": "correct_answer", "type": "text", "label": "Correct answer (must match one option exactly)", "required": True},
                {"key": "hint", "type": "text", "label": "Hint shown after wrong attempt", "required": False},
            ]
        },
        "llm_prompt_template": """Generate a geometry explorer question based on: "{{description}}" (grade band: {{grade_band}}).
Return ONLY a JSON object: {"mode": "angle_drag", "question": "what is the type of this angle?", "options": ["Acute", "Right", "Obtuse", "Reflex"], "correct_answer": "Acute", "hint": "hint text"}
mode must be one of: angle_drag, angle_slider, shape_explorer. correct_answer must exactly match one of the options. Return ONLY JSON.""",
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
