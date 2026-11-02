from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.business import BusinessMembership, RoleEnum
from app.models.user import User
from app.schemas.inventory import WarehouseCreate, WarehouseOut, InventoryMovementOut
from app.schemas.product import StockAdjustRequest
from app.services.inventory_service import InventoryService
from app.api.deps import get_current_membership, RoleChecker, get_current_user

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("/warehouses", response_model=List[WarehouseOut])
async def list_warehouses(
    db: AsyncSession = Depends(get_db),
    membership: BusinessMembership = Depends(get_current_membership)
):
    return await InventoryService.list_warehouses(db, membership.business_id)


@router.post("/warehouses", response_model=WarehouseOut, status_code=status.HTTP_201_CREATED)
async def create_warehouse(
    data: WarehouseCreate,
    db: AsyncSession = Depends(get_db),
    membership: BusinessMembership = Depends(RoleChecker([RoleEnum.OWNER, RoleEnum.MANAGER]))
):
    return await InventoryService.create_warehouse(db, membership.business_id, data)


@router.post("/adjust", status_code=status.HTTP_200_OK)
async def adjust_stock(
    data: StockAdjustRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    membership: BusinessMembership = Depends(RoleChecker([RoleEnum.OWNER, RoleEnum.MANAGER]))
):
    """
    Performs atomic stock adjustment and logs audit movement.
    Prevents negative stock counts.
    """
    success = await InventoryService.adjust_stock(
        db=db,
        business_id=membership.business_id,
        data=data,
        user_id=user.id
    )
    return {"success": success, "message": "Պահեստի մնացորդը հաջողությամբ ճշգրտվել է:"}


@router.get("/movements", response_model=List[InventoryMovementOut])
async def list_movements(
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    membership: BusinessMembership = Depends(RoleChecker([RoleEnum.OWNER, RoleEnum.MANAGER]))
):
    return await InventoryService.list_movements(db, membership.business_id, limit=limit)
