from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine, Base
from app.api.v1.api import api_router
from app.core.exceptions import (
    InsufficientStockException,
    PermissionDeniedException,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Աղյուսակները ավտոմատ ստեղծել development/test միջավայրերում։
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="ՀայՊահեստ (HayPahest) — ՓՄՁ Պահեստային և Վաճառքի Կառավարման Համակարգի API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(InsufficientStockException)
async def insufficient_stock_handler(
    request: Request,
    exc: InsufficientStockException,
):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "type": "INSUFFICIENT_STOCK",
        },
    )


@app.exception_handler(PermissionDeniedException)
async def permission_denied_handler(
    request: Request,
    exc: PermissionDeniedException,
):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "type": "PERMISSION_DENIED",
        },
    )


# API endpoint-ներ, օրինակ՝ /api/v1/auth/login
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "version": "1.0.0",
        "message": "ՀայՊահեստ API սերվերը գործում է նորմալ ռեժիմով:",
    }
