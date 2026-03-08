"""CogniCode — FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.api.routes import auth, repositories, files, notebooks, memory
from app.api import websocket

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create DB tables and initialize LangGraph memory. Shutdown: clean up."""
    # Import all models to register them with Base
    import app.models  # noqa: F401
    # Create extension and tables
    from app.database import init_db
    from app.services import graph_service
    
    await init_db()
    
    async with engine.begin() as conn:

        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")

    # Initialize LangGraph tri-layer memory (AsyncSqliteSaver)
    await graph_service.initialize()

    yield

    # Shutdown
    await graph_service.shutdown()
    await engine.dispose()
    logger.info("CogniCode shutdown complete")


app = FastAPI(
    title="CogniCode",
    description="Autonomous Educational Web App — distills repos into Logical Skeletons",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
origins = settings.cors_origins_list
# Add some common variants for robustness
extra_origins = []
for o in origins:
    if o.endswith("/"):
        extra_origins.append(o[:-1])
    else:
        extra_origins.append(o + "/")
origins.extend(extra_origins)

logger.info(f"Allowing CORS origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router, prefix="/api")
app.include_router(repositories.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(notebooks.router, prefix="/api")
app.include_router(memory.router, prefix="/api")
app.include_router(websocket.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "cognicode"}
