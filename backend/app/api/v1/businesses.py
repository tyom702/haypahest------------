from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.business import Business, BusinessMembership, RoleEnum
from app.models.user import User
from app.schemas.business import BusinessOut, BusinessUpdate, MembershipOut
from app.api.deps import get_current_membership, RoleChecker

router = APIRouter(prefix="/businesses", tags=["Businesses"])


@router.get("/current", response_model=BusinessOut)
async def get_current_business(
    db: AsyncSession = Depends(get_db),
    membership: BusinessMembership = Depends(get_current_membership)
):
    stmt = select(Business).where(Business.id == membership.business_id)
    res = await db.execute(stmt)
    business = res.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Բիզնեսը չի գտնվել:")
    return business


@router.put("/current", response_model=BusinessOut)
async def update_current_business(
    data: BusinessUpdate,
    db: AsyncSession = Depends(get_db),
    membership: BusinessMembership = Depends(RoleChecker([RoleEnum.OWNER]))
):
    stmt = select(Business).where(Business.id == membership.business_id)
    res = await db.execute(stmt)
    business = res.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Բիզնեսը չի գտնվել:")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(business, k, v)

    await db.commit()
    await db.refresh(business)
    return business


@router.get("/members", response_model=List[MembershipOut])
async def list_members(
    db: AsyncSession = Depends(get_db),
    membership: BusinessMembership = Depends(RoleChecker([RoleEnum.OWNER, RoleEnum.MANAGER]))
):
    stmt = select(BusinessMembership).where(
        BusinessMembership.business_id == membership.business_id,
        BusinessMembership.is_active == True
    )
    res = await db.execute(stmt)
    return list(res.scalars().all())
