"""Run with: python -m app.migrations.add_misconception_to_evidence"""
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.config import settings

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        await conn.execute(text("""
            ALTER TABLE evidence_events
            ADD COLUMN IF NOT EXISTS misconception JSONB DEFAULT NULL
        """))
    print("Done: misconception column added")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
