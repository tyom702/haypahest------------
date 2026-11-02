from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.inventory import MovementTypeEnum


class WarehouseCreate(BaseModel):
    name_am: str = Field(min_length=2, max_length=255)
    code: str = Field(min_length=1, max_length=50)
    address: Optional[str] = None
    phone: Optional[str] = None
    is_default: bool = False


class WarehouseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    business_id: str
    name_am: str
    code: str
    address: Optional[str]
    phone: Optional[str]
    is_default: bool
    created_at: datetime


class InventoryMovementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    business_id: str
    product_id: str
    warehouse_id: str
    movement_type: MovementTypeEnum
    quantity: int
    cost_price: int
    reason: str
    reference_id: Optional[str]
    created_by_user_id: Optional[str]
    created_at: datetime
