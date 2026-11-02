from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.business import BusinessMembership, RoleEnum
from app.schemas.report import AnalyticsSummaryOut, DailyTrendPointOut
from app.services.report_service import ReportService
from app.api.deps import get_current_membership, RoleChecker

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/summary", response_model=AnalyticsSummaryOut)
async def get_summary_kpis(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    warehouse_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    membership: BusinessMembership = Depends(RoleChecker([RoleEnum.OWNER, RoleEnum.MANAGER]))
):
    """
    Returns financial KPIs, COGS, and gross profit strictly derived from stored business transactions.
    """
    return await ReportService.get_summary_kpis(
        db=db,
        business_id=membership.business_id,
        start_date=start_date,
        end_date=end_date,
        warehouse_id=warehouse_id
    )


@router.get("/trends", response_model=List[DailyTrendPointOut])
async def get_daily_trends(
    days: int = Query(default=14, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
    membership: BusinessMembership = Depends(RoleChecker([RoleEnum.OWNER, RoleEnum.MANAGER]))
):
    """Returns daily revenue, gross profit, and unit volumes for charts."""
    return await ReportService.get_daily_trends(
        db=db,
        business_id=membership.business_id,
        days=days
    )
