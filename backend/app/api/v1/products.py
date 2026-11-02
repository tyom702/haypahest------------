from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.business import BusinessMembership, RoleEnum
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut
from app.services.product_service import ProductService
from app.api.deps import get_current_membership, RoleChecker, get_current_user
from app.models.user import User

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=List[ProductOut])
async def list_products(
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
    membership: BusinessMembership = Depends(get_current_membership)
):
    """
    Returns products strictly scoped to the caller's business workspace.
    Supports filtering by category, search by name/SKU/barcode.
    """
    return await ProductService.list_products(
        db=db,
        business_id=membership.business_id,
        category_id=category_id,
        search=search,
        active_only=active_only
    )


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    membership: BusinessMembership = Depends(get_current_membership)
):
    return await ProductService.get_product(
        db=db,
        business_id=membership.business_id,
        product_id=product_id
    )


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    membership: BusinessMembership = Depends(RoleChecker([RoleEnum.OWNER, RoleEnum.MANAGER]))
):
    """Creates a new product with initial inventory."""

    return await ProductService.create_product(
        db=db,
        business_id=membership.business_id,
        data=data,
        user_id=user.id
    )


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: str,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    membership: BusinessMembership = Depends(RoleChecker([RoleEnum.OWNER, RoleEnum.MANAGER]))
):
    return await ProductService.update_product(
        db=db,
        business_id=membership.business_id,
        product_id=product_id,
        updates=data
    )


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    membership: BusinessMembership = Depends(RoleChecker([RoleEnum.OWNER, RoleEnum.MANAGER]))
):
    await ProductService.delete_product(
        db=db,
        business_id=membership.business_id,
        product_id=product_id
    )
    return None
