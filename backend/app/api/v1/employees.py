import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.employee import Employee
from app.models.business import BusinessMembership, RoleEnum
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeOut
from app.api.deps import get_current_membership, RoleChecker

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.get("", response_model=List[EmployeeOut])
async def list_employees(
    db: AsyncSession = Depends(get_db),
    membership: BusinessMembership = Depends(RoleChecker([RoleEnum.OWNER, RoleEnum.MANAGER]))
):
    stmt = (
        select(Employee)
        .where(Employee.business_id == membership.business_id)
        .order_by(Employee.created_at.desc())
    )
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
async def create_employee(
    data: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    membership: BusinessMembership = Depends(RoleChecker([RoleEnum.OWNER, RoleEnum.MANAGER]))
):
    emp = Employee(
        id=str(uuid.uuid4()),
        business_id=membership.business_id,
        warehouse_id=data.warehouse_id,
        full_name_am=data.full_name_am.strip(),
        role=data.role,
        phone=data.phone,
        email=data.email,
        salary_amd=data.salary_amd,
        hire_date=data.hire_date,
        is_active=True
    )
    db.add(emp)
    await db.commit()
    await db.refresh(emp)
    return emp


@router.put("/{employee_id}", response_model=EmployeeOut)
async def update_employee(
    employee_id: str,
    data: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
    membership: BusinessMembership = Depends(RoleChecker([RoleEnum.OWNER, RoleEnum.MANAGER]))
):
    stmt = select(Employee).where(Employee.business_id == membership.business_id, Employee.id == employee_id)
    res = await db.execute(stmt)
    emp = res.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Աշխատակիցը չի գտնվել:")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(emp, k, v)

    await db.commit()
    await db.refresh(emp)
    return emp
