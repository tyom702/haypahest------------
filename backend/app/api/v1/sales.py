from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.business import BusinessMembership, RoleEnum
from app.models.user import User
from app.schemas.sale import SaleCreate, SaleOut
from app.services.sale_service import SaleService
from app.api.deps import get_current_membership, get_current_user

router = APIRouter(prefix="/sales", tags=["Sales"])


@router.post("", response_model=SaleOut, status_code=status.HTTP_201_CREATED)
async def process_sale(
    sale_data: SaleCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    membership: BusinessMembership = Depends(get_current_membership)
):
    """
    Executes an atomic sale transaction.
    - Locks rows to eliminate concurrency race conditions.
    - Strictly validates stock availability.
    - Deducts inventory and creates audit movements.
    - Computes totals strictly in integer Armenian drams (AMD).
    """
    return await SaleService.process_sale(
        db=db,
        business_id=membership.business_id,
        sale_data=sale_data,
        user=user
    )


@router.get("", response_model=List[SaleOut])
async def list_sales(
    limit: int = 100,
    warehouse_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    membership: BusinessMembership = Depends(get_current_membership)
):
    """Lists sales history for the current business workspace."""
    return await SaleService.list_sales(
        db=db,
        business_id=membership.business_id,
        limit=limit,
        warehouse_id=warehouse_id
    )


@router.get("/{sale_id}", response_model=SaleOut)
async def get_sale(
    sale_id: str,
    db: AsyncSession = Depends(get_db),
    membership: BusinessMembership = Depends(get_current_membership)
):
    return await SaleService.get_sale_by_id(
        db=db,
        business_id=membership.business_id,
        sale_id=sale_id
    )
