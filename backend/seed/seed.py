"""
Idempotent seed script — loads all reference data into the database.

Usage:
    python -m seed.seed

Uses upsert (INSERT ... ON CONFLICT DO UPDATE) so it's safe to run multiple times.
"""

import json
import uuid
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.config import Settings
from app.models.competency import Capability, Competency, Pillar
from app.models.curriculum import Activity, Question
from app.models.curriculum_topic import CurriculumTopic, TopicCompetencyMap
from app.models.skill_graph import CodevelopmentEdge, PrerequisiteEdge

SEED_DIR = Path(__file__).parent


def load_json(filename: str) -> list | dict:
    with open(SEED_DIR / filename) as f:
        return json.load(f)


def seed_pillars(session: Session, data: dict) -> None:
    for p in data["pillars"]:
        stmt = insert(Pillar).values(
            id=p["id"], name=p["name"], color=p["color"], description=p["description"]
        ).on_conflict_do_update(
            index_elements=["id"],
            set_=dict(name=p["name"], color=p["color"], description=p["description"]),
        )
        session.execute(stmt)
    print(f"  Pillars: {len(data['pillars'])} upserted")


def seed_capabilities(session: Session, data: dict) -> None:
    for c in data["capabilities"]:
        stmt = insert(Capability).values(
            id=c["id"], pillar_id=c["pillar_id"], name=c["name"], description=c["description"]
        ).on_conflict_do_update(
            index_elements=["id"],
            set_=dict(pillar_id=c["pillar_id"], name=c["name"], description=c["description"]),
        )
        session.execute(stmt)
    print(f"  Capabilities: {len(data['capabilities'])} upserted")


def seed_competencies(session: Session, data: dict) -> None:
    for c in data["competencies"]:
        stmt = insert(Competency).values(
            id=c["id"],
            capability_id=c["capability_id"],
            name=c["name"],
            description=c["description"],
            assessment_method=c["assessment_method"],
            default_params=c["default_params"],
        ).on_conflict_do_update(
            index_elements=["id"],
            set_=dict(
                capability_id=c["capability_id"],
                name=c["name"],
                description=c["description"],
                assessment_method=c["assessment_method"],
                default_params=c["default_params"],
            ),
        )
        session.execute(stmt)
    print(f"  Competencies: {len(data['competencies'])} upserted")


def seed_prerequisite_edges(session: Session, edges: list) -> None:
    for e in edges:
        stmt = insert(PrerequisiteEdge).values(
            source_id=e["source_id"],
            target_id=e["target_id"],
            min_stage=e.get("min_stage", 2),
            encompassing_weight=e.get("encompassing_weight", 0.0),
        ).on_conflict_do_update(
            index_elements=["source_id", "target_id"],
            set_=dict(
                min_stage=e.get("min_stage", 2),
                encompassing_weight=e.get("encompassing_weight", 0.0),
            ),
        )
        session.execute(stmt)
    print(f"  Prerequisite edges: {len(edges)} upserted")


def seed_codevelopment_edges(session: Session, edges: list) -> None:
    for e in edges:
        stmt = insert(CodevelopmentEdge).values(
            source_id=e["source_id"],
            target_id=e["target_id"],
            transfer_weight=e["transfer_weight"],
            rationale=e.get("rationale"),
        ).on_conflict_do_update(
            index_elements=["source_id", "target_id"],
            set_=dict(transfer_weight=e["transfer_weight"], rationale=e.get("rationale")),
        )
        session.execute(stmt)
    print(f"  Co-development edges: {len(edges)} upserted")


def seed_activities(session: Session, activities: list) -> None:
    for a in activities:
        stmt = insert(Activity).values(
            id=a["id"],
            module_id=a["module_id"],
            name=a["name"],
            type=a["type"],
            mode=a.get("mode", "default"),
            week=a.get("week"),
            session_number=a.get("session_number"),
            duration_minutes=a.get("duration_minutes"),
            grade_bands=a.get("grade_bands"),
            description=a.get("description"),
            learning_outcomes=a.get("learning_outcomes"),
            primary_competencies=a.get("primary_competencies"),
            secondary_competencies=a.get("secondary_competencies"),
            prerequisites=a.get("prerequisites"),
        ).on_conflict_do_update(
            index_elements=["id"],
            set_=dict(
                module_id=a["module_id"],
                name=a["name"],
                type=a["type"],
                mode=a.get("mode", "default"),
                week=a.get("week"),
                session_number=a.get("session_number"),
                duration_minutes=a.get("duration_minutes"),
                grade_bands=a.get("grade_bands"),
                description=a.get("description"),
                learning_outcomes=a.get("learning_outcomes"),
                primary_competencies=a.get("primary_competencies"),
                secondary_competencies=a.get("secondary_competencies"),
                prerequisites=a.get("prerequisites"),
            ),
        )
        session.execute(stmt)
    print(f"  Activities: {len(activities)} upserted")


def seed_questions(session: Session, questions: list, label: str) -> None:
    count = 0
    for q in questions:
        # Use a deterministic UUID based on the question text so re-runs don't create duplicates
        q_id = uuid.uuid5(uuid.NAMESPACE_URL, q["text"])
        stmt = insert(Question).values(
            id=q_id,
            module_id=q["module_id"],
            competency_id=q["competency_id"],
            text=q["text"],
            type=q["type"],
            options=q.get("options"),
            correct_answer=q.get("correct_answer"),
            difficulty=q["difficulty"],
            grade_band=q["grade_band"],
            explanation=q.get("explanation"),
        ).on_conflict_do_update(
            index_elements=["id"],
            set_=dict(
                module_id=q["module_id"],
                competency_id=q["competency_id"],
                text=q["text"],
                type=q["type"],
                options=q.get("options"),
                correct_answer=q.get("correct_answer"),
                difficulty=q["difficulty"],
                grade_band=q["grade_band"],
                explanation=q.get("explanation"),
            ),
        )
        session.execute(stmt)
        count += 1
    print(f"  Questions ({label}): {count} upserted")


def seed_curriculum_topics(session: Session, topics: list) -> None:
    for t in topics:
        stmt = insert(CurriculumTopic).values(
            id=t["id"],
            board=t["board"],
            subject=t["subject"],
            grade=t["grade"],
            chapter_number=t["chapter_number"],
            name=t["name"],
            description=t.get("description"),
            ncert_ref=t.get("ncert_ref"),
            content=t.get("content"),
        ).on_conflict_do_update(
            index_elements=["id"],
            set_=dict(
                board=t["board"],
                subject=t["subject"],
                grade=t["grade"],
                chapter_number=t["chapter_number"],
                name=t["name"],
                description=t.get("description"),
                ncert_ref=t.get("ncert_ref"),
                content=t.get("content"),
            ),
        )
        session.execute(stmt)
    print(f"  Curriculum topics: {len(topics)} upserted")


def seed_topic_competency_map(session: Session, mappings: list) -> None:
    for m in mappings:
        stmt = insert(TopicCompetencyMap).values(
            topic_id=m["topic_id"],
            competency_id=m["competency_id"],
            relevance=m["relevance"],
        ).on_conflict_do_update(
            index_elements=["topic_id", "competency_id"],
            set_=dict(relevance=m["relevance"]),
        )
        session.execute(stmt)
    print(f"  Topic-competency mappings: {len(mappings)} upserted")


def main() -> None:
    settings = Settings()
    engine = create_engine(settings.DATABASE_URL_SYNC)

    print("Loading seed data...")
    competency_data = load_json("competencies.json")
    prereq_edges = load_json("prerequisite_edges.json")
    codev_edges = load_json("codevelopment_edges.json")
    activities = load_json("activities.json")
    questions_l1 = load_json("questions.json")
    questions_math = load_json("questions_math.json")
    curriculum_topics = load_json("curriculum_topics.json")
    topic_competency_map = load_json("topic_competency_map.json")

    with Session(engine) as session:
        with session.begin():
            # Order matters: pillars → capabilities → competencies → edges → activities → questions → topics → mappings
            seed_pillars(session, competency_data)
            seed_capabilities(session, competency_data)
            seed_competencies(session, competency_data)
            seed_prerequisite_edges(session, prereq_edges)
            seed_codevelopment_edges(session, codev_edges)
            seed_activities(session, activities)
            seed_questions(session, questions_l1, "Level 1")
            seed_questions(session, questions_math, "Math")
            seed_curriculum_topics(session, curriculum_topics)
            seed_topic_competency_map(session, topic_competency_map)

    # Verify counts
    with Session(engine) as session:
        counts = {}
        for table in ["pillars", "capabilities", "competencies", "prerequisite_edges",
                       "codevelopment_edges", "activities", "questions",
                       "curriculum_topics", "topic_competency_map"]:
            result = session.execute(text(f"SELECT COUNT(*) FROM {table}"))
            counts[table] = result.scalar()

    print("\nVerification:")
    for table, count in counts.items():
        print(f"  {table}: {count} rows")
    print("\nDone!")


if __name__ == "__main__":
    main()
