# Import all models so Alembic can discover them
from app.models.competency import Pillar, Capability, Competency  # noqa: F401
from app.models.skill_graph import PrerequisiteEdge, CodevelopmentEdge  # noqa: F401
from app.models.student import Student, StudentCompetencyState  # noqa: F401
from app.models.evidence import EvidenceEvent  # noqa: F401
from app.models.curriculum import Activity, Question  # noqa: F401
from app.models.curriculum_topic import CurriculumTopic, TopicCompetencyMap  # noqa: F401
from app.models.session import Cohort, Session, SessionActivity, LiveRoom, FacilitatorNote  # noqa: F401
from app.models.spark import SparkConversation, SparkMessage  # noqa: F401
from app.models.user import User, RefreshToken  # noqa: F401
from app.plugins.benchmark.models import BenchmarkSession, BenchmarkTurn, BenchmarkResult  # noqa: F401  # Plugin: benchmark
from app.models.template_cohort import Template  # noqa: F401
from app.models.batch_enrollment import CohortEnrollment  # noqa: F401
from app.models.student_invite import StudentInvite  # noqa: F401
from app.models.question_template import QuestionTemplate  # noqa: F401
