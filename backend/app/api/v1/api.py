from fastapi import APIRouter
from app.api.v1 import (
    auth,
    businesses,
    categories,
    products,
    inventory,
    sales,
    employees,
    reports,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(businesses.router)
api_router.include_router(categories.router)
api_router.include_router(products.router)
api_router.include_router(inventory.router)
api_router.include_router(sales.router)
api_router.include_router(employees.router)
api_router.include_router(reports.router)

