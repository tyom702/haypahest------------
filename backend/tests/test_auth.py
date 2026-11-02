import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_and_login_success(client: AsyncClient):
    # 1. Register
    reg_data = {
        "email": "test_owner@haypahest.am",
        "password": "SecretPassword123!",
        "full_name": "Գուրգեն Մարտիրոսյան",
        "business_name": "Մարտիրոսյան Թրեյդ",
        "hvhh": "01478523"
    }
    res = await client.post("/api/v1/auth/register", json=reg_data)
    assert res.status_code == 201
    body = res.json()
    assert "access_token" in body
    assert body["email"] == reg_data["email"]
    assert body["role"] == "OWNER"

    # 2. Duplicate registration rejection
    dup_res = await client.post("/api/v1/auth/register", json=reg_data)
    assert dup_res.status_code == 400

    # 3. Login with correct password
    login_res = await client.post("/api/v1/auth/login", json={
        "email": reg_data["email"],
        "password": reg_data["password"]
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 4. Login with wrong password
    bad_login = await client.post("/api/v1/auth/login", json={
        "email": reg_data["email"],
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401
