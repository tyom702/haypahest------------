import asyncio
import pytest
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.business import RoleEnum

# In-memory SQLite async engine for tests
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
async def setup_test_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def auth_headers(client: AsyncClient):
    """Register and authenticate an Owner for Business A."""
    reg_payload = {
        "email": "owner_a@haypahest.am",
        "password": "SecurePassword123!",
        "full_name": "Արմեն Ղազարյան",
        "business_name": "ՀայՊահեստ Ալֆա ՍՊԸ",
        "hvhh": "02589631"
    }
    res = await client.post("/api/v1/auth/register", json=reg_payload)
    data = res.json()
    token = data["access_token"]
    return {
        "Authorization": f"Bearer {token}",
        "X-Business-ID": data["business_id"]
    }


@pytest.fixture
async def second_business_headers(client: AsyncClient):
    """Register and authenticate an Owner for completely separate Business B."""
    reg_payload = {
        "email": "owner_b@otherbusiness.am",
        "password": "SecurePassword456!",
        "full_name": "Տիգրան Սարգսյան",
        "business_name": "Բետա Թրեյդինգ ՍՊԸ",
        "hvhh": "08745214"
    }
    res = await client.post("/api/v1/auth/register", json=reg_payload)
    data = res.json()
    token = data["access_token"]
    return {
        "Authorization": f"Bearer {token}",
        "X-Business-ID": data["business_id"]
    }
