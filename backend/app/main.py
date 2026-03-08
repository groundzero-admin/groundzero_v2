from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.admin_students import router as admin_students_router
from app.api.auth import router as auth_router
from app.api.competencies import router as competencies_router, skill_graph_router
from app.api.curriculum import activities_router, questions_router
from app.api.curriculum_topics import router as curriculum_topics_router
from app.api.evidence import router as evidence_router
from app.api.live_batches import router as live_batches_router
from app.api.sessions import cohort_router, router as sessions_router
from app.api.spark import router as spark_router
from app.api.students import router as students_router
from app.api.teacher import router as teacher_router
from app.api.template_cohorts import router as template_cohorts_router
from app.config import settings

app = FastAPI(
    title="Ground Zero API",
    version="0.1.0",
    description="BKT mastery engine + evidence pipeline for student learning",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", summary="Health Check", description="Check if the API server is running.")
async def health():
    return {"status": "ok", "version": "0.1.0"}


# Mount API routers
app.include_router(students_router, prefix=settings.API_V1_PREFIX)
app.include_router(evidence_router, prefix=settings.API_V1_PREFIX)
app.include_router(competencies_router, prefix=settings.API_V1_PREFIX)
app.include_router(skill_graph_router, prefix=settings.API_V1_PREFIX)
app.include_router(activities_router, prefix=settings.API_V1_PREFIX)
app.include_router(questions_router, prefix=settings.API_V1_PREFIX)
app.include_router(curriculum_topics_router, prefix=settings.API_V1_PREFIX)
app.include_router(sessions_router, prefix=settings.API_V1_PREFIX)
app.include_router(cohort_router, prefix=settings.API_V1_PREFIX)
app.include_router(spark_router, prefix=settings.API_V1_PREFIX)
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(teacher_router, prefix=settings.API_V1_PREFIX)
app.include_router(template_cohorts_router, prefix=settings.API_V1_PREFIX)
app.include_router(live_batches_router, prefix=settings.API_V1_PREFIX)
app.include_router(admin_students_router, prefix=settings.API_V1_PREFIX)

from app.api.batch_enrollments import router as batch_enrollments_router
app.include_router(batch_enrollments_router, prefix=settings.API_V1_PREFIX)

from app.api.live_class import router as live_class_router
app.include_router(live_class_router, prefix=settings.API_V1_PREFIX)

from app.api.student_live import router as student_live_router
app.include_router(student_live_router, prefix=settings.API_V1_PREFIX)
