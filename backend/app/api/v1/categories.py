import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.product import Category
from app.models.business import BusinessMembership, RoleEnum
from app.schemas.product import CategoryCreate, CategoryUpdate, CategoryOut
from app.api.deps import get_current_membership, RoleChecker

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=List[CategoryOut])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    membership: BusinessMembership = Depends(get_current_membership)
):
    stmt = select(Category).where(Category.business_id == membership.business_id).order_by(Category.name_am)
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    membership: BusinessMembership = Depends(RoleChecker([RoleEnum.OWNER, RoleEnum.MANAGER]))
):
    category = Category(
        id=str(uuid.uuid4()),
        business_id=membership.business_id,
        name_am=data.name_am.strip(),
        description=data.description
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    db: AsyncSession = Depends(get_db),
    membership: BusinessMembership = Depends(RoleChecker([RoleEnum.OWNER, RoleEnum.MANAGER]))
):
    stmt = select(Category).where(Category.business_id == membership.business_id, Category.id == category_id)
    res = await db.execute(stmt)
    cat = res.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Կատեգորիան չի գտնվել:")

    await db.delete(cat)
    await db.commit()
    return None
