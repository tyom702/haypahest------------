from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.business import BusinessMembership, RoleEnum
from app.models.user import User
from app.schemas.subscription import (
    SubscriptionPlanConfigSchema,
    SubscriptionDetailsOut,
    InitiatePaymentRequest,
    InitiatePaymentResponse,
    ConfirmPaymentWebhookRequest,
    SubscriptionOut,
    SubscriptionInvoiceOut,
)
from app.services.subscription_service import SubscriptionService
from app.api.deps import get_current_membership, RoleChecker, get_current_user

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


@router.get("/plans", response_model=List[SubscriptionPlanConfigSchema])
async def get_subscription_plans():
    """
    Returns all configurable SaaS subscription plans with Armenian AMD pricing,
    limits, and feature sets.
    """
    return SubscriptionService.get_all_plans()


@router.get("/current", response_model=SubscriptionDetailsOut)
async def get_current_subscription(
    db: AsyncSession = Depends(get_db),
    membership: BusinessMembership = Depends(get_current_membership)
):
    """
    Returns the active subscription plan, expiration countdown,
    and usage quotas for the caller's business workspace.
    """
    return await SubscriptionService.get_subscription_details(db, membership.business_id)


@router.post("/initiate-payment", response_model=InitiatePaymentResponse)
async def initiate_payment(
    req: InitiatePaymentRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    membership: BusinessMembership = Depends(RoleChecker([RoleEnum.OWNER]))
):
    """
    Initiates payment with legitimate Armenian payment provider (ArCa, Ameriabank vPOS, Idram).
    Generates HMAC-signed order. Requires OWNER role.
    """
    return await SubscriptionService.initiate_payment(db, membership.business_id, req)


@router.post("/confirm-payment-webhook", response_model=SubscriptionOut)
async def confirm_payment_webhook(
    req: ConfirmPaymentWebhookRequest,
    db: AsyncSession = Depends(get_db),
    membership: BusinessMembership = Depends(RoleChecker([RoleEnum.OWNER]))
):
    """
    Secure backend-confirmed payment activation.
    Verifies cryptographic signature. Refuses unverified frontend status updates.
    """
    return await SubscriptionService.confirm_payment_webhook(db, membership.business_id, req)


@router.get("/invoices", response_model=List[SubscriptionInvoiceOut])
async def list_invoices(
    db: AsyncSession = Depends(get_db),
    membership: BusinessMembership = Depends(RoleChecker([RoleEnum.OWNER, RoleEnum.MANAGER]))
):
    """Lists subscription billing history and invoices."""
    return await SubscriptionService.list_invoices(db, membership.business_id)
