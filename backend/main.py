from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.routers import health, analyze, diagnose

app = FastAPI(
    title="DevForge Control Plane",
    description="Central AI brain for the DevForge enterprise platform",
    version="0.1.0"
)

# CORS middleware with explicit allow-list
allowed_origins = [origin.strip() for origin in settings.allowed_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-API-Key"],
)

# Include routers
app.include_router(health.router)
app.include_router(analyze.router)
app.include_router(diagnose.router)


@app.get("/")
async def root():
    return {
        "message": "DevForge Control Plane",
        "version": "0.1.0",
        "status": "running"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
