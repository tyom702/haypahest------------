from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.sale import PaymentMethodEnum


class SaleItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)
    unit_price: int = Field(ge=0)  # AMD
    discount_percent: int = Field(default=0, ge=0, le=100)


class SaleCreate(BaseModel):
    warehouse_id: str
    customer_name: Optional[str] = None
    payment_method: PaymentMethodEnum = PaymentMethodEnum.CASH
    items: List[SaleItemCreate] = Field(min_length=1)
    notes: Optional[str] = None


class SaleItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    product_id: str
    product_name: str
    sku: str
    unit: str
    quantity: int
    unit_price: int
    cost_price: int
    discount_percent: int
    total: int


class SaleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    business_id: str
    warehouse_id: str
    cashier_name: str
    customer_name: Optional[str]
    receipt_number: str
    fiscal_receipt_number: Optional[str]
    payment_method: PaymentMethodEnum
    subtotal: int
    discount_total: int
    tax_total: int
    total: int
    is_paid: bool
    notes: Optional[str]
    created_at: datetime
    items: List[SaleItemOut] = []


class SaleSummaryOut(BaseModel):
    total_sales_count: int
    total_revenue_amd: int
    total_cogs_amd: int
    gross_profit_amd: int
    profit_margin_percent: int
