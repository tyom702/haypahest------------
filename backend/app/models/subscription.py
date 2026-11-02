import uuid
from enum import Enum
from datetime import datetime
from sqlalchemy import (
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    BigInteger,
    Enum as SQLEnum,
    CheckConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class SubscriptionPlanEnum(str, Enum):
    START = "START"
    BUSINESS = "BUSINESS"
    PRO = "PRO"


class SubscriptionStatusEnum(str, Enum):
    ACTIVE = "active"
    TRIAL = "trial"
    PENDING_PAYMENT = "pending_payment"
    PAST_DUE = "past_due"
    CANCELED = "canceled"


class BillingCycleEnum(str, Enum):
    MONTHLY = "monthly"
    ANNUAL = "annual"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id: Mapped[str] = mapped_column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    plan: Mapped[SubscriptionPlanEnum] = mapped_column(SQLEnum(SubscriptionPlanEnum), default=SubscriptionPlanEnum.BUSINESS, nullable=False)
    status: Mapped[SubscriptionStatusEnum] = mapped_column(SQLEnum(SubscriptionStatusEnum), default=SubscriptionStatusEnum.ACTIVE, nullable=False)
    billing_cycle: Mapped[BillingCycleEnum] = mapped_column(SQLEnum(BillingCycleEnum), default=BillingCycleEnum.ANNUAL, nullable=False)
    
    # Financial values strictly in integer AMD
    amount_amd: Mapped[int] = mapped_column(BigInteger, default=238800, nullable=False)
    
    auto_renew: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    
    payment_method: Mapped[str] = mapped_column(String(100), default="Ameriabank vPOS (ArCa)", nullable=True)
    last_payment_ref: Mapped[str] = mapped_column(String(100), nullable=True)
    pending_order_id: Mapped[str] = mapped_column(String(100), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    business = relationship("Business", back_populates="subscription")

    __table_args__ = (
        CheckConstraint("amount_amd >= 0", name="chk_subscription_amount_positive"),
    )


class SubscriptionInvoice(Base):
    __tablename__ = "subscription_invoices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id: Mapped[str] = mapped_column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    invoice_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    
    plan: Mapped[SubscriptionPlanEnum] = mapped_column(SQLEnum(SubscriptionPlanEnum), nullable=False)
    billing_cycle: Mapped[BillingCycleEnum] = mapped_column(SQLEnum(BillingCycleEnum), nullable=False)
    amount_amd: Mapped[int] = mapped_column(BigInteger, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="paid", nullable=False)  # paid, pending, failed
    payment_gateway: Mapped[str] = mapped_column(String(100), default="Ameriabank vPOS", nullable=False)
    transaction_id: Mapped[str] = mapped_column(String(100), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    business = relationship("Business", back_populates="subscription_invoices")
