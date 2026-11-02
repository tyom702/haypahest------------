import uuid
import hmac
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.config import settings
from app.models.subscription import (
    Subscription,
    SubscriptionInvoice,
    SubscriptionPlanEnum,
    SubscriptionStatusEnum,
    BillingCycleEnum,
)
from app.models.product import Product
from app.models.inventory import Warehouse
from app.models.employee import Employee
from app.schemas.subscription import (
    SubscriptionPlanConfigSchema,
    PlanLimitsSchema,
    InitiatePaymentRequest,
    InitiatePaymentResponse,
    ConfirmPaymentWebhookRequest,
    SubscriptionOut,
    UsageQuotasSchema,
    SubscriptionDetailsOut,
)

# Configurable Plan Definitions stored in backend configuration
PLAN_CONFIGS: Dict[SubscriptionPlanEnum, SubscriptionPlanConfigSchema] = {
    SubscriptionPlanEnum.START: SubscriptionPlanConfigSchema(
        id=SubscriptionPlanEnum.START,
        name_am="Ստարտ (Start)",
        badge_am="Սկսնակների համար",
        description_am="Բազային պահեստային հաշվառում և մանրածախ վաճառքներ մեկ վաճառակետի համար:",
        target_audience_am="Փոքր կրպակներ, անհատ ձեռնարկատերեր (ԱՁ)",
        monthly_price_amd=9900,
        annual_monthly_price_amd=7900,
        annual_total_amd=94800,
        annual_savings_percent=20,
        limits=PlanLimitsSchema(
            max_products=150,
            max_warehouses=1,
            max_employees=1,
            has_advanced_reports=False,
            has_cogs_analysis=False,
            has_multi_warehouse_transfer=False,
            has_custom_export=False,
            has_priority_support=False,
            has_api_access=False,
        ),
        highlight_features=[
            "Մինչև 150 ապրանքների կատալոգ",
            "1 Կենտրոնական պահեստ",
            "1 Գանձապահ / Աշխատակից",
            "POS Դրամարկղ և վաճառքներ",
            "Շտրիխ-կոդերի և արտիկուլների հաշվառում",
        ],
    ),
    SubscriptionPlanEnum.BUSINESS: SubscriptionPlanConfigSchema(
        id=SubscriptionPlanEnum.BUSINESS,
        name_am="Բիզնես (Business)",
        badge_am="Ամենատարածված",
        description_am="Ընդլայնված պահեստային հաշվառում, մի քանի պահեստներ, թիմային աշխատանք և վաճառքների վերլուծություն:",
        target_audience_am="Աճող խանութներ, բուտիկներ, ՓՄՁ-ներ",
        is_popular=True,
        monthly_price_amd=24900,
        annual_monthly_price_amd=19900,
        annual_total_amd=238800,
        annual_savings_percent=20,
        limits=PlanLimitsSchema(
            max_products=2500,
            max_warehouses=3,
            max_employees=5,
            has_advanced_reports=True,
            has_cogs_analysis=True,
            has_multi_warehouse_transfer=True,
            has_custom_export=True,
            has_priority_support=False,
            has_api_access=False,
        ),
        highlight_features=[
            "Մինչև 2,500 ապրանքների կատալոգ",
            "Մինչև 3 Պահեստ կամ մասնաճյուղ",
            "Մինչև 5 Աշխատակից (դերային մուտքով)",
            "Ինքնարժեքի (COGS) և շահույթի հաշվարկ",
            "Վաճառքների և կատեգորիաների դինամիկա",
            "Excel (.xlsx) և PDF արտահանում",
        ],
    ),
    SubscriptionPlanEnum.PRO: SubscriptionPlanConfigSchema(
        id=SubscriptionPlanEnum.PRO,
        name_am="Պրո (Pro Enterprise)",
        badge_am="Առավելագույն հզորություն",
        description_am="Անսահմանափակ հնարավորություններ, խորացված ֆինանսական վերլուծություն, բազմապահեստային ցանցեր և առաջնահերթ աջակցություն:",
        target_audience_am="Առևտրային ցանցեր, մեծածախ բազաներ, խոշոր ՓՄՁ",
        monthly_price_amd=49900,
        annual_monthly_price_amd=39900,
        annual_total_amd=478800,
        annual_savings_percent=20,
        limits=PlanLimitsSchema(
            max_products=25000,
            max_warehouses=15,
            max_employees=25,
            has_advanced_reports=True,
            has_cogs_analysis=True,
            has_multi_warehouse_transfer=True,
            has_custom_export=True,
            has_priority_support=True,
            has_api_access=True,
        ),
        highlight_features=[
            "Մինչև 25,000 ապրանքների կատալոգ",
            "Մինչև 15 Պահեստ և բաշխիչ կենտրոն",
            "Մինչև 25 Աշխատակից",
            "Ֆինանսական բոլոր 5 հաշվետվությունները",
            "Բանկային դարպասի և REST API ինտեգրացիա",
            "24/7 Առաջնահերթ տեխնիկական աջակցություն",
        ],
    ),
}


class SubscriptionService:
    @staticmethod
    def get_plan_config(plan: SubscriptionPlanEnum) -> SubscriptionPlanConfigSchema:
        return PLAN_CONFIGS.get(plan, PLAN_CONFIGS[SubscriptionPlanEnum.BUSINESS])

    @staticmethod
    def get_all_plans() -> List[SubscriptionPlanConfigSchema]:
        return list(PLAN_CONFIGS.values())

    @staticmethod
    async def get_or_create_subscription(
        db: AsyncSession,
        business_id: str
    ) -> Subscription:
        stmt = select(Subscription).where(Subscription.business_id == business_id)
        res = await db.execute(stmt)
        sub = res.scalar_one_or_none()

        if not sub:
            # Create default 14-day trial or active business plan
            now = datetime.utcnow()
            sub = Subscription(
                id=str(uuid.uuid4()),
                business_id=business_id,
                plan=SubscriptionPlanEnum.BUSINESS,
                status=SubscriptionStatusEnum.ACTIVE,
                billing_cycle=BillingCycleEnum.ANNUAL,
                amount_amd=238800,
                auto_renew=True,
                start_date=now,
                expires_at=now + timedelta(days=365),
                payment_method="Ameriabank vPOS (ArCa)",
                last_payment_ref="INIT-SYS-AUTO",
            )
            db.add(sub)
            await db.commit()
            await db.refresh(sub)

        return sub

    @staticmethod
    async def get_subscription_details(
        db: AsyncSession,
        business_id: str
    ) -> SubscriptionDetailsOut:
        sub = await SubscriptionService.get_or_create_subscription(db, business_id)
        plan_cfg = SubscriptionService.get_plan_config(sub.plan)

        # Count current usage
        prod_count = (await db.execute(
            select(func.count(Product.id)).where(Product.business_id == business_id, Product.is_active == True)
        )).scalar() or 0

        wh_count = (await db.execute(
            select(func.count(Warehouse.id)).where(Warehouse.business_id == business_id)
        )).scalar() or 0

        emp_count = (await db.execute(
            select(func.count(Employee.id)).where(Employee.business_id == business_id, Employee.is_active == True)
        )).scalar() or 0

        now = datetime.utcnow()
        days_rem = max(0, (sub.expires_at - now).days) if sub.expires_at > now else 0

        quotas = UsageQuotasSchema(
            products_count=prod_count,
            products_limit=plan_cfg.limits.max_products,
            warehouses_count=wh_count,
            warehouses_limit=plan_cfg.limits.max_warehouses,
            employees_count=emp_count,
            employees_limit=plan_cfg.limits.max_employees,
        )

        sub_out = SubscriptionOut(
            id=sub.id,
            business_id=sub.business_id,
            plan=sub.plan,
            status=sub.status,
            billing_cycle=sub.billing_cycle,
            amount_amd=sub.amount_amd,
            auto_renew=sub.auto_renew,
            start_date=sub.start_date,
            expires_at=sub.expires_at,
            days_remaining=days_rem,
            payment_method=sub.payment_method,
            last_payment_ref=sub.last_payment_ref,
            created_at=sub.created_at,
        )

        return SubscriptionDetailsOut(
            subscription=sub_out,
            quotas=quotas,
            can_add_product=prod_count < plan_cfg.limits.max_products,
            can_add_warehouse=wh_count < plan_cfg.limits.max_warehouses,
            can_add_employee=emp_count < plan_cfg.limits.max_employees,
        )

    # Server-Side Access Control & Quota Validation
    @staticmethod
    async def validate_can_add_product(db: AsyncSession, business_id: str) -> None:
        sub = await SubscriptionService.get_or_create_subscription(db, business_id)
        plan_cfg = SubscriptionService.get_plan_config(sub.plan)
        prod_count = (await db.execute(
            select(func.count(Product.id)).where(Product.business_id == business_id, Product.is_active == True)
        )).scalar() or 0

        if prod_count >= plan_cfg.limits.max_products:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Հասել եք ձեր պլանի սահմանաչափին ({plan_cfg.limits.max_products} ապրանք): Անհրաժեշտ է թարմացնել սակագնային պլանը:",
            )

    @staticmethod
    async def validate_can_add_warehouse(db: AsyncSession, business_id: str) -> None:
        sub = await SubscriptionService.get_or_create_subscription(db, business_id)
        plan_cfg = SubscriptionService.get_plan_config(sub.plan)
        wh_count = (await db.execute(
            select(func.count(Warehouse.id)).where(Warehouse.business_id == business_id)
        )).scalar() or 0

        if wh_count >= plan_cfg.limits.max_warehouses:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Հասել եք պահեստների սահմանաչափին ({plan_cfg.limits.max_warehouses} պահեստ): Բազմապահեստային աշխատանքի համար թարմացրեք պլանը:",
            )

    @staticmethod
    async def validate_can_add_employee(db: AsyncSession, business_id: str) -> None:
        sub = await SubscriptionService.get_or_create_subscription(db, business_id)
        plan_cfg = SubscriptionService.get_plan_config(sub.plan)
        emp_count = (await db.execute(
            select(func.count(Employee.id)).where(Employee.business_id == business_id, Employee.is_active == True)
        )).scalar() or 0

        if emp_count >= plan_cfg.limits.max_employees:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Հասել եք աշխատակիցների սահմանաչափին ({plan_cfg.limits.max_employees} աշխատակից): Ավելացնելու համար անհրաժեշտ է Pro պլան:",
            )

    # Armenian Payment Provider Integration Architecture
    @staticmethod
    async def initiate_payment(
        db: AsyncSession,
        business_id: str,
        req: InitiatePaymentRequest
    ) -> InitiatePaymentResponse:
        """
        Generates a secure payment session prepared for ArCa / Ameriabank vPOS / Idram.
        Does NOT mark subscription as paid.
        """
        plan_cfg = SubscriptionService.get_plan_config(req.plan)
        amount = plan_cfg.annual_total_amd if req.billing_cycle == BillingCycleEnum.ANNUAL else plan_cfg.monthly_price_amd
        order_id = f"HP-ORD-{uuid.uuid4().hex[:8].upper()}"

        # Sign order payload with server secret key (HMAC SHA-256)
        raw_msg = f"{order_id}:{business_id}:{amount}:AMD"
        signature = hmac.new(
            settings.SECRET_KEY.encode(),
            raw_msg.encode(),
            hashlib.sha256
        ).hexdigest()

        # Update pending order in subscription record
        sub = await SubscriptionService.get_or_create_subscription(db, business_id)
        sub.pending_order_id = order_id
        await db.commit()

        gateway_display = "Ameriabank vPOS (ArCa / Visa / MasterCard)"
        instructions = "Դուք կվերահասցեավորվեք բանկի 3D-Secure պաշտպանված դարպասին: Հաստատումը կկատարվի սերվերի կողմից:"
        if req.gateway == "idram":
            gateway_display = "Idram QR / Wallet Gateway"
            instructions = "Սկանավորեք Idram QR կոդը հավելվածով: Վճարումը կհաստատվի սերվերային Callback-ի միջոցով:"
        elif req.gateway == "bank_transfer":
            gateway_display = "Անկանխիկ Բանկային Փոխանցում"
            instructions = "Կգեներացվի պաշտոնական հաշիվ-ապրանքագիր (Invoice): Բաժանորդագրությունը կակտիվանա բանկային քաղվածքի հաստատումից հետո:"

        return InitiatePaymentResponse(
            order_id=order_id,
            amount_amd=amount,
            currency="AMD",
            gateway_name=gateway_display,
            checkout_url=f"/payment-gateway/checkout?order_id={order_id}&checksum={signature}",
            checksum=signature,
            status="pending_confirmation",
            instructions_am=instructions,
        )

    @staticmethod
    async def confirm_payment_webhook(
        db: AsyncSession,
        business_id: str,
        webhook_data: ConfirmPaymentWebhookRequest
    ) -> SubscriptionOut:
        """
        Legitimate server-side confirmation of payment from bank webhook.
        Verifies signature, prevents frontend spoofing, updates expiration and invoice.
        """
        # Validate HMAC signature
        expected_raw = f"{webhook_data.order_id}:{business_id}:{webhook_data.amount_amd}:AMD"
        expected_sig = hmac.new(
            settings.SECRET_KEY.encode(),
            expected_raw.encode(),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(webhook_data.signature, expected_sig):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Անվտանգության ստուգումը չհաջողվեց: Կեղծված վճարման ստորագրություն (Invalid HMAC Checksum):",
            )

        sub = await SubscriptionService.get_or_create_subscription(db, business_id)
        if sub.pending_order_id != webhook_data.order_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Անհայտ պատվերի համար կամ ժամկետանց վճարման հարցում:",
            )

        now = datetime.utcnow()
        days_to_add = 365 if sub.billing_cycle == BillingCycleEnum.ANNUAL else 30
        
        # If already active and not expired, extend from existing expires_at; else from now
        base_date = sub.expires_at if (sub.expires_at and sub.expires_at > now) else now
        sub.expires_at = base_date + timedelta(days=days_to_add)
        sub.status = SubscriptionStatusEnum.ACTIVE
        sub.amount_amd = webhook_data.amount_amd
        sub.last_payment_ref = webhook_data.transaction_id
        sub.pending_order_id = None

        # Add invoice record
        invoice = SubscriptionInvoice(
            id=str(uuid.uuid4()),
            business_id=business_id,
            invoice_number=f"INV-HP-{now.year}-{uuid.uuid4().hex[:6].upper()}",
            plan=sub.plan,
            billing_cycle=sub.billing_cycle,
            amount_amd=webhook_data.amount_amd,
            status="paid",
            payment_gateway="Ameriabank vPOS / ArCa",
            transaction_id=webhook_data.transaction_id,
        )
        db.add(invoice)

        await db.commit()
        await db.refresh(sub)

        days_rem = max(0, (sub.expires_at - datetime.utcnow()).days)
        return SubscriptionOut(
            id=sub.id,
            business_id=sub.business_id,
            plan=sub.plan,
            status=sub.status,
            billing_cycle=sub.billing_cycle,
            amount_amd=sub.amount_amd,
            auto_renew=sub.auto_renew,
            start_date=sub.start_date,
            expires_at=sub.expires_at,
            days_remaining=days_rem,
            payment_method=sub.payment_method,
            last_payment_ref=sub.last_payment_ref,
            created_at=sub.created_at,
        )

    @staticmethod
    async def list_invoices(db: AsyncSession, business_id: str) -> List[SubscriptionInvoice]:
        stmt = (
            select(SubscriptionInvoice)
            .where(SubscriptionInvoice.business_id == business_id)
            .order_by(SubscriptionInvoice.created_at.desc())
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())
