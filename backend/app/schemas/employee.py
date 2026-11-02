from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, ConfigDict


class EmployeeCreate(BaseModel):
    full_name_am: str = Field(min_length=2, max_length=255)
    role: str = Field(default="գանձապահ", max_length=100)
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    salary_amd: int = Field(default=0, ge=0)
    warehouse_id: Optional[str] = None
    hire_date: Optional[str] = None


class EmployeeUpdate(BaseModel):
    full_name_am: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    salary_amd: Optional[int] = Field(default=None, ge=0)
    warehouse_id: Optional[str] = None
    is_active: Optional[bool] = None


class EmployeeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    business_id: str
    user_id: Optional[str]
    warehouse_id: Optional[str]
    full_name_am: str
    role: str
    phone: Optional[str]
    email: Optional[str]
    salary_amd: int
    is_active: bool
    hire_date: Optional[str]
    created_at: datetime
