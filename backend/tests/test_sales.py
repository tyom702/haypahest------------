import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_sale_processing_and_stock_validation(client: AsyncClient, auth_headers: dict):
    # 1. Fetch Warehouse
    wh = (await client.get("/api/v1/inventory/warehouses", headers=auth_headers)).json()[0]
    wh_id = wh["id"]

    # 2. Create Product with exactly 5 in stock
    prod_payload = {
        "sku": "HP-PHONE-01",
        "name_am": "Սմարթֆոն Xiaomi Redmi 13C",
        "unit": "հատ",
        "cost_price": 52000,   # AMD integer
        "selling_price": 68000, # AMD integer
        "initial_stock": 5,
        "warehouse_id": wh_id
    }
    prod = (await client.post("/api/v1/products", headers=auth_headers, json=prod_payload)).json()
    prod_id = prod["id"]

    # 3. Attempt to buy 10 items (more than available 5) -> must be rejected
    oversell_sale = {
        "warehouse_id": wh_id,
        "customer_name": "Հակոբ Սարգսյան",
        "payment_method": "cash",
        "items": [
            {
                "product_id": prod_id,
                "quantity": 10,
                "unit_price": 68000,
                "discount_percent": 0
            }
        ]
    }
    fail_res = await client.post("/api/v1/sales", headers=auth_headers, json=oversell_sale)
    assert fail_res.status_code == 400
    assert "Անբավարար մնացորդ" in fail_res.json()["detail"]

    # Stock must remain intact at 5
    check_prod = (await client.get(f"/api/v1/products/{prod_id}", headers=auth_headers)).json()
    assert check_prod["total_stock"] == 5

    # 4. Valid sale of 2 items
    valid_sale = {
        "warehouse_id": wh_id,
        "customer_name": "Արտակ Հակոբյան",
        "payment_method": "card",
        "items": [
            {
                "product_id": prod_id,
                "quantity": 2,
                "unit_price": 68000,
                "discount_percent": 5  # 5% discount
            }
        ]
    }
    sale_res = await client.post("/api/v1/sales", headers=auth_headers, json=valid_sale)
    assert sale_res.status_code == 201
    sale = sale_res.json()
    assert "HP-" in sale["receipt_number"]
    # 2 * 68000 = 136000; 5% of 136000 = 6800; total = 129200 AMD (strictly integer)
    assert sale["subtotal"] == 136000
    assert sale["discount_total"] == 6800
    assert sale["total"] == 129200

    # Stock must now be decremented to 3
    final_prod = (await client.get(f"/api/v1/products/{prod_id}", headers=auth_headers)).json()
    assert final_prod["total_stock"] == 3
