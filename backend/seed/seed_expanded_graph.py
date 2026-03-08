"""
Seed 56 new competency nodes + prerequisite edges + co-development edges.

Usage:
    python -m seed.seed_expanded_graph

Idempotent — uses ON CONFLICT DO NOTHING for competencies and edges.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.config import Settings
from app.models.competency import Competency
from app.models.skill_graph import CodevelopmentEdge, PrerequisiteEdge

DEFAULT_PARAMS = {"pL0": 0.10, "pT": 0.15, "pG": 0.25, "pS": 0.10}

# ── 56 new competency nodes ─────────────────────────────────────────────

NEW_COMPETENCIES = [
    # ── P1 Communication — Curriculum (.N) ──
    {"id": "C1.N1", "capability_id": "C", "name": "Clarity & Precision in Expression", "assessment_method": "llm"},
    {"id": "C1.N2", "capability_id": "B", "name": "Digital Safety & Data Awareness", "assessment_method": "mcq"},
    {"id": "C1.N3", "capability_id": "B", "name": "Sources of Authority & Trust Evaluation", "assessment_method": "both"},
    {"id": "C1.N4", "capability_id": "C", "name": "Persuasion Techniques (Hook, Appeal, Proof)", "assessment_method": "llm"},
    {"id": "C1.N5", "capability_id": "C", "name": "Ethical Persuasion vs Manipulation", "assessment_method": "llm"},
    # ── P1 Communication — IB (.IB) ──
    {"id": "C1.IB1", "capability_id": "A", "name": "Reading Comprehension & Storytelling", "assessment_method": "both"},
    {"id": "C1.IB2", "capability_id": "C", "name": "Persuasive Writing & Essay Structure", "assessment_method": "llm"},
    {"id": "C1.IB3", "capability_id": "A", "name": "Media Analysis & Interpretation", "assessment_method": "both"},
    {"id": "C1.IB4", "capability_id": "C", "name": "Cultural Perspectives in Communication", "assessment_method": "llm"},
    {"id": "C1.IB5", "capability_id": "D", "name": "Rhetoric & Oratory", "assessment_method": "llm"},
    {"id": "C1.IB6", "capability_id": "A", "name": "Literary & Text Analysis", "assessment_method": "llm"},
    {"id": "C1.IB7", "capability_id": "B", "name": "Epistemic Reasoning (Theory of Knowledge)", "assessment_method": "llm"},
    {"id": "C1.IB8", "capability_id": "B", "name": "Academic Research & Extended Writing", "assessment_method": "llm"},
    {"id": "C1.IB9", "capability_id": "C", "name": "Cross-Cultural & Global Communication", "assessment_method": "llm"},

    # ── P2 Creativity — Curriculum (.N) ──
    {"id": "C2.N1", "capability_id": "E", "name": "Creative Fear Removal & Play Mindset", "assessment_method": "llm"},
    {"id": "C2.N2", "capability_id": "E", "name": "Multiple-Use Thinking (Object Reframing)", "assessment_method": "llm"},
    {"id": "C2.N3", "capability_id": "F", "name": "Pattern Breaking & Creative Inversion", "assessment_method": "llm"},
    {"id": "C2.N4", "capability_id": "G", "name": "Vision & Future Thinking", "assessment_method": "llm"},
    {"id": "C2.N5", "capability_id": "H", "name": "End-to-End Product Creation (Demo Day)", "assessment_method": "llm"},
    {"id": "C2.N6", "capability_id": "H", "name": "Constraint-Based Ideation (Trade-off Creativity)", "assessment_method": "llm"},
    # ── P2 Creativity — IB (.IB) ──
    {"id": "C2.IB1", "capability_id": "F", "name": "Visual Arts Fundamentals", "assessment_method": "llm"},
    {"id": "C2.IB2", "capability_id": "E", "name": "Storytelling & Drama", "assessment_method": "llm"},
    {"id": "C2.IB3", "capability_id": "H", "name": "Design Thinking & Prototyping Cycle", "assessment_method": "both"},
    {"id": "C2.IB4", "capability_id": "F", "name": "Cross-Cultural Creative Expression", "assessment_method": "llm"},
    {"id": "C2.IB5", "capability_id": "F", "name": "Musical Composition Thinking", "assessment_method": "llm"},
    {"id": "C2.IB6", "capability_id": "G", "name": "Independent Creative Research", "assessment_method": "llm"},
    {"id": "C2.IB7", "capability_id": "F", "name": "Aesthetic Judgment & Art Criticism", "assessment_method": "llm"},
    {"id": "C2.IB8", "capability_id": "H", "name": "Interdisciplinary Project Creation", "assessment_method": "llm"},
    {"id": "C2.IB9", "capability_id": "G", "name": "Creative Risk-Taking & Resilience", "assessment_method": "llm"},

    # ── P3 AI + Systems — Curriculum (.N) ──
    {"id": "C3.N1", "capability_id": "I", "name": "What is AI? — First Principles", "assessment_method": "mcq"},
    {"id": "C3.N2", "capability_id": "I", "name": "Types of AI (Rule-based / ML / GenAI)", "assessment_method": "mcq"},
    {"id": "C3.N3", "capability_id": "J", "name": "Classification & ML Concepts", "assessment_method": "both"},
    {"id": "C3.N4", "capability_id": "K", "name": "System Fairness & Equity Design", "assessment_method": "llm"},
    {"id": "C3.N5", "capability_id": "K", "name": "System Optimization Under Constraints", "assessment_method": "llm"},
    {"id": "C3.N6", "capability_id": "J", "name": "AI Ethics & Governance", "assessment_method": "llm"},
    {"id": "C3.N7", "capability_id": "K", "name": "Graph Theory & Network Modeling", "assessment_method": "both"},
    # ── P3 AI + Systems — IB (.IB) ──
    {"id": "C3.IB1", "capability_id": "I", "name": "Basic Computing Concepts", "assessment_method": "mcq"},
    {"id": "C3.IB2", "capability_id": "L", "name": "Digital Design & User Experience", "assessment_method": "llm"},
    {"id": "C3.IB3", "capability_id": "L", "name": "Robotics & Automation Thinking", "assessment_method": "both"},
    {"id": "C3.IB4", "capability_id": "K", "name": "Environmental & Complex Systems", "assessment_method": "both"},
    {"id": "C3.IB5", "capability_id": "K", "name": "Network Effects & Incentive Design", "assessment_method": "llm"},
    {"id": "C3.IB6", "capability_id": "J", "name": "CS Algorithms & Computational Thinking", "assessment_method": "both"},
    {"id": "C3.IB7", "capability_id": "L", "name": "Ethical Technology Design", "assessment_method": "llm"},
    {"id": "C3.IB8", "capability_id": "K", "name": "Global Systems & Interdependencies", "assessment_method": "llm"},

    # ── P4 Math + Logic — Curriculum (.N) ──
    {"id": "C4.N1", "capability_id": "N", "name": "Data Interpretation & Graphing (Desmos)", "assessment_method": "both"},
    {"id": "C4.N2", "capability_id": "O", "name": "Revenue, Cost & Profit (Financial Math)", "assessment_method": "mcq"},
    {"id": "C4.N3", "capability_id": "N", "name": "Trend Detection & Predictive Modeling", "assessment_method": "both"},
    {"id": "C4.N4", "capability_id": "O", "name": "Budgeting & Resource Allocation", "assessment_method": "both"},
    {"id": "C4.N5", "capability_id": "M", "name": "Multi-Set Venn Reasoning (3+ sets)", "assessment_method": "both"},
    {"id": "C4.N6", "capability_id": "O", "name": "Opportunity Cost & Time Allocation", "assessment_method": "both"},
    # ── P4 Math + Logic — IB (.IB) ──
    {"id": "C4.IB1", "capability_id": "P", "name": "Trigonometry — Grade 7-8", "assessment_method": "mcq"},
    {"id": "C4.IB2", "capability_id": "N", "name": "Statistics — Distributions & Spread", "assessment_method": "mcq"},
    {"id": "C4.IB3", "capability_id": "O", "name": "Calculus — Introduction", "assessment_method": "mcq"},
    {"id": "C4.IB4", "capability_id": "O", "name": "Mathematical Modeling", "assessment_method": "llm"},
    {"id": "C4.IB5", "capability_id": "N", "name": "Statistical Inference", "assessment_method": "mcq"},
    {"id": "C4.IB6", "capability_id": "M", "name": "Mathematical Proof & Formal Reasoning", "assessment_method": "llm"},
]

assert len(NEW_COMPETENCIES) == 56, f"Expected 56 competencies, got {len(NEW_COMPETENCIES)}"

# ── Prerequisite edges (source → target) ────────────────────────────────

NEW_PREREQ_EDGES = [
    # P1 Communication
    ("C1.IB1", "C1.1"),
    ("C1.N1", "C1.7"),
    ("C1.N3", "C1.6"),
    ("C1.N4", "C1.8"),
    ("C1.IB2", "C1.IB5"),
    ("C1.8", "C1.N5"),
    ("C1.10", "C1.IB7"),
    ("C1.11", "C1.IB7"),
    ("C1.IB3", "C1.IB6"),
    ("C1.7", "C1.IB9"),
    ("C1.IB4", "C1.IB9"),
    ("C1.IB6", "C1.IB8"),
    ("C1.IB5", "C1.IB8"),
    ("C1.IB7", "C1.IB8"),
    ("C1.12", "C1.IB9"),

    # P2 Creativity
    ("C2.N1", "C2.1"),
    ("C2.N2", "C2.1"),
    ("C2.IB2", "C2.3"),
    ("C2.8", "C2.9"),
    ("C2.5", "C2.IB7"),
    ("C2.N3", "C2.6"),
    ("C2.6", "C2.IB8"),
    ("C2.N4", "C2.8"),
    ("C2.IB3", "C2.11"),
    ("C2.11", "C2.N5"),
    ("C2.N6", "C2.11"),
    ("C2.11", "C2.IB8"),
    ("C2.12", "C2.IB6"),
    ("C2.9", "C2.IB6"),
    ("C2.IB1", "C2.IB7"),
    ("C2.IB4", "C2.IB8"),
    ("C2.IB9", "C2.N5"),

    # P3 AI + Systems
    ("C3.N1", "C3.1"),
    ("C3.IB1", "C3.2"),
    ("C3.N2", "C3.N3"),
    ("C3.N3", "C3.7"),
    ("C3.N4", "C3.10"),
    ("C3.IB2", "C3.11"),
    ("C3.IB3", "C3.13"),
    ("C3.IB4", "C3.9"),
    ("C3.6", "C3.N6"),
    ("C3.9", "C3.N5"),
    ("C3.12", "C3.N5"),
    ("C3.N7", "C3.IB5"),
    ("C3.IB6", "C3.13"),
    ("C3.IB5", "C3.IB8"),
    ("C3.N6", "C3.IB7"),
    ("C3.10", "C3.IB7"),
    ("C3.13", "C3.IB7"),

    # P4 Math + Logic
    ("C4.4", "C4.IB6"),
    ("C4.N5", "C4.12"),
    ("C4.9", "C4.N3"),
    ("C4.N1", "C4.10"),
    ("C4.IB2", "C4.IB5"),
    ("C4.10", "C4.N3"),
    ("C4.18.8", "C4.IB1"),
    ("C4.18.9", "C4.IB3"),
    ("C4.IB3", "C4.IB4"),
    ("C4.IB5", "C4.IB4"),
    ("C4.12", "C4.IB4"),
    ("C4.N2", "C4.13"),
    ("C4.N2", "C4.N4"),
    ("C4.N6", "C4.13"),
    ("C4.3", "C4.12"),
]

# ── Co-development edges (bidirectional, upsert) ────────────────────────

NEW_CODEV_EDGES = [
    ("C4.4", "C1.5", 0.30, "Conditional chains and logical argument chains are structurally the same"),
    ("C4.5", "C1.6", 0.30, "Cognitive biases and logical fallacies are two names for the same errors"),
    ("C4.8", "C2.3", 0.25, "What if reasoning underlies both"),
    ("C4.9", "C2.9", 0.20, "Asking why not what is the disposition underlying both"),
    ("C4.13", "C3.12", 0.35, "Quantitative and qualitative trade-offs are the same reasoning"),
    ("C3.10", "C1.10", 0.20, "Perspective-taking is shared mechanism"),
    ("C3.11", "C2.10", 0.40, "Identifying user needs and framing problems are nearly identical"),
]


def main() -> None:
    settings = Settings()
    engine = create_engine(settings.DATABASE_URL_SYNC)

    print("Seeding 56 new competency nodes...")

    with Session(engine) as session:
        with session.begin():
            # 1. Insert competencies
            comp_inserted = 0
            for c in NEW_COMPETENCIES:
                stmt = insert(Competency).values(
                    id=c["id"],
                    capability_id=c["capability_id"],
                    name=c["name"],
                    description=c["name"],  # use name as description
                    assessment_method=c["assessment_method"],
                    default_params=DEFAULT_PARAMS,
                ).on_conflict_do_nothing(index_elements=["id"])
                result = session.execute(stmt)
                if result.rowcount:
                    comp_inserted += 1
            print(f"  Competencies: {comp_inserted} inserted ({len(NEW_COMPETENCIES)} attempted)")

            # 2. Insert prerequisite edges
            prereq_inserted = 0
            for src, tgt in NEW_PREREQ_EDGES:
                stmt = insert(PrerequisiteEdge).values(
                    source_id=src,
                    target_id=tgt,
                    min_stage=2,
                    encompassing_weight=0.0,
                ).on_conflict_do_nothing(index_elements=["source_id", "target_id"])
                result = session.execute(stmt)
                if result.rowcount:
                    prereq_inserted += 1
            print(f"  Prerequisite edges: {prereq_inserted} inserted ({len(NEW_PREREQ_EDGES)} attempted)")

            # 3. Insert co-development edges
            codev_inserted = 0
            for src, tgt, weight, rationale in NEW_CODEV_EDGES:
                stmt = insert(CodevelopmentEdge).values(
                    source_id=src,
                    target_id=tgt,
                    transfer_weight=weight,
                    rationale=rationale,
                ).on_conflict_do_nothing(index_elements=["source_id", "target_id"])
                result = session.execute(stmt)
                if result.rowcount:
                    codev_inserted += 1
            print(f"  Co-development edges: {codev_inserted} inserted ({len(NEW_CODEV_EDGES)} attempted)")

    # Verify totals
    print("\nVerification (total row counts):")
    with Session(engine) as session:
        for table in ["competencies", "prerequisite_edges", "codevelopment_edges"]:
            count = session.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            print(f"  {table}: {count}")

    print("\nDone!")


if __name__ == "__main__":
    main()
