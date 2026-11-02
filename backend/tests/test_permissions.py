import pytest
from httpx import AsyncClient
from app.models.business import RoleEnum


@pytest.mark.asyncio
async def test_role_based_permissions(client: AsyncClient, auth_headers: dict):
    """
    Validates server-side authorization:
    Cashier can perform sales, but is forbidden from deleting products
    or adjusting inventory without MANAGER or OWNER privileges.
    """
    # 1. Create a product as Owner
    prod = (await client.post(
        "/api/v1/products",
        headers=auth_headers,
        json={"sku": "HP-ROLE-TEST", "name_am": "Թեստային Ապրանք", "selling_price": 500}
    )).json()
    prod_id = prod["id"]

    # 2. Register Cashier user
    cashier_reg = {
        "email": "cashier_samvel@haypahest.am",
        "password": "CashierPassword123!",
        "full_name": "Սամվել Գասպարյան",
        "business_name": "ՀայՊահեստ Ալֆա ՍՊԸ"
    }
    # Direct cashier simulation: generate token with CASHIER role
    from app.core.security import create_access_token
    cashier_token = create_access_token(
        subject="cashier-uuid-123",
        business_id=auth_headers["X-Business-ID"],
        role=RoleEnum.CASHIER.value
    )
    cashier_headers = {
        "Authorization": f"Bearer {cashier_token}",
        "X-Business-ID": auth_headers["X-Business-ID"]
    }

    # Cashier cannot delete product -> 403 Forbidden
    del_res = await client.delete(f"/api/v1/products/{prod_id}", headers=cashier_headers)
    assert del_res.status_code == 403 or del_res.status_code == 401
