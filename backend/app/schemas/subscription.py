from typing import Optional, List, Dict
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.subscription import SubscriptionPlanEnum, SubscriptionStatusEnum, BillingCycleEnum


class PlanLimitsSchema(BaseModel):
    max_products: int
    max_warehouses: int
    max_employees: int
    has_advanced_reports: bool
    has_cogs_analysis: bool
    has_multi_warehouse_transfer: bool
    has_custom_export: bool
    has_priority_support: bool
    has_api_access: bool


class SubscriptionPlanConfigSchema(BaseModel):
    id: SubscriptionPlanEnum
    name_am: str
    badge_am: str
    description_am: str
    target_audience_am: str
    is_popular: bool = False
    monthly_price_amd: int
    annual_monthly_price_amd: int
    annual_total_amd: int
    annual_savings_percent: int
    limits: PlanLimitsSchema
    highlight_features: List[str]


class SubscriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    business_id: str
    plan: SubscriptionPlanEnum
    status: SubscriptionStatusEnum
    billing_cycle: BillingCycleEnum
    amount_amd: int
    auto_renew: bool
    start_date: datetime
    expires_at: datetime
    days_remaining: int
    payment_method: Optional[str]
    last_payment_ref: Optional[str]
    created_at: datetime


class UsageQuotasSchema(BaseModel):
    products_count: int
    products_limit: int
    warehouses_count: int
    warehouses_limit: int
    employees_count: int
    employees_limit: int


class SubscriptionDetailsOut(BaseModel):
    subscription: SubscriptionOut
    quotas: UsageQuotasSchema
    can_add_product: bool
    can_add_warehouse: bool
    can_add_employee: bool


class InitiatePaymentRequest(BaseModel):
    plan: SubscriptionPlanEnum
    billing_cycle: BillingCycleEnum
    gateway: str = Field(default="arca_vpos", description="arca_vpos, idram, bank_transfer")
    return_url: Optional[str] = None


class InitiatePaymentResponse(BaseModel):
    order_id: str
    amount_amd: int
    currency: str = "AMD"
    gateway_name: str
    checkout_url: str
    checksum: str
    status: str = "pending_confirmation"
    instructions_am: str


class ConfirmPaymentWebhookRequest(BaseModel):
    order_id: str
    transaction_id: str
    amount_amd: int
    status: str
    signature: str


class SubscriptionInvoiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    business_id: str
    invoice_number: str
    plan: SubscriptionPlanEnum
    billing_cycle: BillingCycleEnum
    amount_amd: int
    status: str
    payment_gateway: str
    transaction_id: Optional[str]
    created_at: datetime
