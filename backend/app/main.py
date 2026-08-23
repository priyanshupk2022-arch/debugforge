import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import get_settings
from backend.app.storage.db import DatabaseManager
from backend.app.engine.queue_manager import ScraperQueueManager
from backend.app.api.routes_proxy import router as proxy_router
from backend.app.api.routes_chaos import router as chaos_router
from backend.app.api.routes_scrapers import router as scraper_router
from backend.app.api.routes_threats import router as threats_router
from backend.app.api.routes_telemetry import router as telemetry_router
from backend.app.api.routes_targets import router as targets_router
from backend.app.api.routes_discovery import router as discovery_router
from backend.app.api.routes_exposure import router as exposure_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("sentinel.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("Initializing Sentinel-Chain Backend & Storage...")
    db = DatabaseManager(settings.DATABASE_PATH)
    await db.initialize()

    # Seed default demo target if none exist
    existing_targets = await db.list_targets()
    if not existing_targets:
        from backend.app.models.domain import Target, TargetStatus, ExtractionSchema, ExtractionField
        from datetime import datetime
        demo_target = Target(
            id="target-demo-exploitdb",
            name="Exploit-DB Advisory Portal",
            url="https://www.exploit-db.com/exploits/advisories",
            domain="exploit-db.com",
            status=TargetStatus.READY,
            health=0.96,
            is_demo=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        await db.save_target(demo_target)

        demo_schema = ExtractionSchema(
            id="schema-demo-1",
            target_id="target-demo-exploitdb",
            name="Exploit-DB Advisory Schema",
            version=1,
            intent_prompt="Extract CVE id, vulnerability title, severity ranking, author name, and publication date",
            fields=[
                ExtractionField(name="cve_id", selector="table.cve-grid td.cve-id a", field_type="text", required=True, description="CVE identifier"),
                ExtractionField(name="title", selector="table.cve-grid td.title a", field_type="text", required=True, description="Advisory headline"),
                ExtractionField(name="severity", selector="table.cve-grid td.severity span", field_type="text", required=False, description="Vulnerability severity"),
                ExtractionField(name="author", selector="table.cve-grid td.author span", field_type="text", required=False, description="Exploit author"),
                ExtractionField(name="date", selector="table.cve-grid td.date", field_type="date", required=False, description="Publication timestamp")
            ],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        await db.save_schema(demo_schema)

    queue_mgr = ScraperQueueManager()
    await queue_mgr.start()
    logger.info("Sentinel-Chain Backend is operational.")
    yield
    logger.info("Shutting down Sentinel-Chain background workers...")
    await queue_mgr.stop()
    await db.close()

app = FastAPI(
    title="SENTINEL-CHAIN: Autonomous Web Intelligence & Self-Healing Platform",
    description="Autonomous user-controlled web scraping, schema synthesis, and self-healing platform for Bright Data Scraper Studio",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    # Local dev surface only. Wildcard "*" is invalid together with credentials
    # and would let any origin drive mutating endpoints (heal/approve/chaos).
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(exposure_router)
app.include_router(targets_router)
app.include_router(discovery_router)
app.include_router(proxy_router)
app.include_router(chaos_router)
app.include_router(scraper_router)
app.include_router(threats_router)
app.include_router(telemetry_router)

@app.get("/api/health")
async def health_check():
    settings = get_settings()
    bright_status = "connected" if settings.BRIGHT_DATA_API_KEY else "degraded"
    gemini_status = "connected" if settings.GEMINI_API_KEY else "degraded"
    return {
        "status": "healthy",
        "service": "SENTINEL-CHAIN",
        "version": "2.0.0",
        "environment": settings.ENVIRONMENT,
        "services": {
            "database": "connected",
            "bright_data": bright_status,
            "gemini_ai": gemini_status,
            "chaos_proxy": "connected",
        },
    }

if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
