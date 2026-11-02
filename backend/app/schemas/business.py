from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.business import RoleEnum


class BusinessCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    legal_name: Optional[str] = None
    hvhh: str = Field(min_length=8, max_length=20)
    address: Optional[str] = None
    phone: Optional[str] = None


class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    legal_name: Optional[str] = None
    hvhh: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None


class BusinessOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    legal_name: str
    hvhh: str
    address: Optional[str]
    phone: Optional[str]
    is_active: bool
    created_at: datetime


class MembershipOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    business_id: str
    role: RoleEnum
    is_active: bool
    created_at: datetime
    business: Optional[BusinessOut] = None
