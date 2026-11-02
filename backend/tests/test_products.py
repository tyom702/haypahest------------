import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_product_crud_and_validation(client: AsyncClient, auth_headers: dict):
    # 1. Create Category
    cat_res = await client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"name_am": "Էլեկտրոնիկա", "description": "Համակարգչային տեխնիկա"}
    )
    assert cat_res.status_code == 201
    cat_id = cat_res.json()["id"]

    # 2. Create Product
    prod_payload = {
        "sku": "HP-LOG-01",
        "barcode": "7640123456789",
        "name_am": "Անլար Մկնիկ Logitech M185",
        "category_id": cat_id,
        "unit": "հատ",
        "cost_price": 4200,     # 4,200 AMD (integer)
        "selling_price": 6500,  # 6,500 AMD (integer)
        "min_stock": 5,
        "initial_stock": 25
    }
    prod_res = await client.post("/api/v1/products", headers=auth_headers, json=prod_payload)
    assert prod_res.status_code == 201
    product = prod_res.json()
    assert product["sku"] == "HP-LOG-01"
    assert product["cost_price"] == 4200
    assert product["selling_price"] == 6500
    assert product["total_stock"] == 25
    assert product["category_name"] == "Էլեկտրոնիկա"

    # 3. Prevent duplicate SKU in the same business
    dup_res = await client.post("/api/v1/products", headers=auth_headers, json=prod_payload)
    assert dup_res.status_code == 400

    # 4. Search product
    search_res = await client.get("/api/v1/products?search=Logitech", headers=auth_headers)
    assert search_res.status_code == 200
    items = search_res.json()
    assert len(items) == 1
    assert items[0]["sku"] == "HP-LOG-01"
