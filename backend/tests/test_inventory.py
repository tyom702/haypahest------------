import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_inventory_adjustment_and_movements(client: AsyncClient, auth_headers: dict):
    # 1. Fetch Warehouses
    wh_res = await client.get("/api/v1/inventory/warehouses", headers=auth_headers)
    assert wh_res.status_code == 200
    warehouses = wh_res.json()
    assert len(warehouses) >= 1
    wh_id = warehouses[0]["id"]

    # 2. Create Product with initial stock 10
    prod_payload = {
        "sku": "HP-COFFEE-01",
        "name_am": "Սուրճ Lavazza Espresso 250գ",
        "unit": "տուփ",
        "cost_price": 2800,
        "selling_price": 4100,
        "initial_stock": 10,
        "warehouse_id": wh_id
    }
    p_res = await client.post("/api/v1/products", headers=auth_headers, json=prod_payload)
    product_id = p_res.json()["id"]

    # 3. Reject negative inventory
    bad_adj = await client.post(
        "/api/v1/inventory/adjust",
        headers=auth_headers,
        json={
            "product_id": product_id,
            "warehouse_id": wh_id,
            "new_quantity": -5,
            "reason": "Invalid test"
        }
    )
    assert bad_adj.status_code == 422 or bad_adj.status_code == 400

    # 4. Valid stock adjustment from 10 to 18
    adj_res = await client.post(
        "/api/v1/inventory/adjust",
        headers=auth_headers,
        json={
            "product_id": product_id,
            "warehouse_id": wh_id,
            "new_quantity": 18,
            "reason": "Գույքագրման վերահաշվարկ"
        }
    )
    assert adj_res.status_code == 200

    # 5. Verify updated stock
    updated_prod = (await client.get(f"/api/v1/products/{product_id}", headers=auth_headers)).json()
    assert updated_prod["total_stock"] == 18

    # 6. Verify movement history
    mov_res = await client.get("/api/v1/inventory/movements", headers=auth_headers)
    assert mov_res.status_code == 200
    movements = mov_res.json()
    assert len(movements) >= 2
