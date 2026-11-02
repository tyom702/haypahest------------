import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_cross_business_tenant_isolation(
    client: AsyncClient,
    auth_headers: dict,
    second_business_headers: dict
):
    """
    Guarantees strict Multi-Tenant isolation:
    Business A and Business B are completely isolated.
    Neither business can see, query, or modify the other's products or sales.
    """
    # 1. Business A creates a private product
    prod_a_payload = {
        "sku": "A-PROD-SECRET",
        "name_am": "Բիզնես Ա-ի Գաղտնի Ապրանք",
        "cost_price": 10000,
        "selling_price": 15000,
        "initial_stock": 50
    }
    prod_a_res = await client.post("/api/v1/products", headers=auth_headers, json=prod_a_payload)
    assert prod_a_res.status_code == 201
    prod_a_id = prod_a_res.json()["id"]

    # 2. Business B creates its own product
    prod_b_payload = {
        "sku": "B-PROD-EXCLUSIVE",
        "name_am": "Բիզնես Բ-ի Բացառիկ Ապրանք",
        "cost_price": 20000,
        "selling_price": 30000,
        "initial_stock": 20
    }
    prod_b_res = await client.post("/api/v1/products", headers=second_business_headers, json=prod_b_payload)
    assert prod_b_res.status_code == 201
    prod_b_id = prod_b_res.json()["id"]

    # 3. Business B listing products must NOT include Business A's product
    b_list = (await client.get("/api/v1/products", headers=second_business_headers)).json()
    b_skus = [p["sku"] for p in b_list]
    assert "B-PROD-EXCLUSIVE" in b_skus
    assert "A-PROD-SECRET" not in b_skus

    # 4. Business B attempting direct GET on Business A's product ID must return 404
    b_direct_get = await client.get(f"/api/v1/products/{prod_a_id}", headers=second_business_headers)
    assert b_direct_get.status_code == 404

    # 5. Business B attempting to update or delete Business A's product must return 404
    b_direct_delete = await client.delete(f"/api/v1/products/{prod_a_id}", headers=second_business_headers)
    assert b_direct_delete.status_code == 404
