from typing import Optional, Dict
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class CategoryCreate(BaseModel):
    name_am: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None


class CategoryUpdate(BaseModel):
    name_am: Optional[str] = None
    description: Optional[str] = None


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    business_id: str
    name_am: str
    description: Optional[str]
    created_at: datetime


class ProductCreate(BaseModel):
    sku: str = Field(min_length=1, max_length=100)
    barcode: Optional[str] = None
    name_am: str = Field(min_length=1, max_length=255)
    category_id: Optional[str] = None
    unit: str = "հատ"
    
    # Financial values in AMD (strictly integer, zero float)
    cost_price: int = Field(default=0, ge=0)
    selling_price: int = Field(default=0, ge=0)
    
    min_stock: int = Field(default=5, ge=0)
    initial_stock: Optional[int] = Field(default=0, ge=0)
    warehouse_id: Optional[str] = None


class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    barcode: Optional[str] = None
    name_am: Optional[str] = None
    category_id: Optional[str] = None
    unit: Optional[str] = None
    cost_price: Optional[int] = Field(default=None, ge=0)
    selling_price: Optional[int] = Field(default=None, ge=0)
    min_stock: Optional[int] = Field(default=None, ge=0)
    is_active: Optional[bool] = None


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    business_id: str
    category_id: Optional[str]
    sku: str
    barcode: Optional[str]
    name_am: str
    unit: str
    cost_price: int
    selling_price: int
    min_stock: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    # Aggregated stock info
    total_stock: int = 0
    warehouse_stock: Dict[str, int] = {}
    category_name: Optional[str] = None


class StockAdjustRequest(BaseModel):
    product_id: str
    warehouse_id: str
    new_quantity: int = Field(ge=0)
    reason: str = Field(min_length=2, max_length=255)
    notes: Optional[str] = None
