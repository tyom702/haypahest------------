import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.sale import Sale, SaleItem
from app.models.product import Product, WarehouseStock
from app.models.inventory import InventoryMovement, MovementTypeEnum, Warehouse
from app.models.user import User
from app.schemas.sale import SaleCreate, SaleOut, SaleItemOut
from app.core.exceptions import InsufficientStockException


class SaleService:
    @staticmethod
    async def process_sale(
        db: AsyncSession,
        business_id: str,
        sale_data: SaleCreate,
        user: User
    ) -> SaleOut:
        """
        Executes a sale transaction atomically:
        1. Validates warehouse existence
        2. Locks stock rows via `SELECT ... FOR UPDATE` to completely eliminate race conditions
        3. Verifies stock availability (rejects overselling)
        4. Calculates monetary sums strictly as integer AMD
        5. Atomically decrements stock and writes inventory movement records
        6. Persists the Sale and SaleItem records inside the single transaction
        """
        # 1. Validate warehouse
        wh_stmt = select(Warehouse).where(
            Warehouse.business_id == business_id,
            Warehouse.id == sale_data.warehouse_id
        )
        wh = (await db.execute(wh_stmt)).scalar_one_or_none()
        if not wh:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Պահեստը չի գտնվել:")

        # 2. Generate unique receipt number
        count_stmt = select(func.count(Sale.id)).where(Sale.business_id == business_id)
        sales_count = (await db.execute(count_stmt)).scalar() or 0
        receipt_number = f"HP-{datetime.utcnow().year}-{str(sales_count + 1).zfill(5)}"
        fiscal_number = str(10000000 + sales_count + 1)

        # 3. Process items with row-level locks
        total_subtotal = 0
        total_discount = 0
        total_tax = 0
        final_sale_items = []
        movements_to_add = []

        for item_in in sale_data.items:
            # Query product
            prod_stmt = select(Product).where(
                Product.business_id == business_id,
                Product.id == item_in.product_id,
                Product.is_active == True
            )
            prod = (await db.execute(prod_stmt)).scalar_one_or_none()
            if not prod:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Ապրանքը '{item_in.product_id}' չի գտնվել կամ ապաակտիվացված է:"
                )

            # Lock stock row for this product in this warehouse
            stock_stmt = (
                select(WarehouseStock)
                .where(
                    WarehouseStock.business_id == business_id,
                    WarehouseStock.product_id == prod.id,
                    WarehouseStock.warehouse_id == sale_data.warehouse_id
                )
                .with_for_update()
            )
            stock_res = await db.execute(stock_stmt)
            stock_row = stock_res.scalar_one_or_none()
            current_qty = stock_row.quantity if stock_row else 0

            # Prevent race conditions & overselling
            if current_qty < item_in.quantity:
                raise InsufficientStockException(
                    product_name=prod.name_am,
                    requested=item_in.quantity,
                    available=current_qty
                )

            # Decrement stock atomically
            stock_row.quantity -= item_in.quantity

            # Calculate money strictly in integer AMD
            # subtotal = quantity * unit_price
            item_subtotal = item_in.quantity * item_in.unit_price
            discount_amount = (item_subtotal * item_in.discount_percent) // 100
            item_total = max(0, item_subtotal - discount_amount)
            
            # Tax calculation (20% standard VAT component included)
            item_tax = (item_total * 20) // 120

            total_subtotal += item_subtotal
            total_discount += discount_amount
            total_tax += item_tax

            sale_item = SaleItem(
                id=str(uuid.uuid4()),
                product_id=prod.id,
                product_name=prod.name_am,
                sku=prod.sku,
                unit=prod.unit,
                quantity=item_in.quantity,
                unit_price=item_in.unit_price,
                cost_price=prod.cost_price,
                discount_percent=item_in.discount_percent,
                total=item_total
            )
            final_sale_items.append(sale_item)

            # Record inventory movement
            movement = InventoryMovement(
                id=str(uuid.uuid4()),
                business_id=business_id,
                product_id=prod.id,
                warehouse_id=sale_data.warehouse_id,
                movement_type=MovementTypeEnum.SALE,
                quantity=-item_in.quantity,
                cost_price=prod.cost_price,
                reason=f"Վաճառք կտրոնով #{receipt_number}",
                reference_id=receipt_number,
                created_by_user_id=user.id
            )
            movements_to_add.append(movement)

        final_total = max(0, total_subtotal - total_discount)

        # 4. Create Sale
        sale = Sale(
            id=str(uuid.uuid4()),
            business_id=business_id,
            warehouse_id=sale_data.warehouse_id,
            user_id=user.id,
            cashier_name=user.full_name,
            customer_name=sale_data.customer_name,
            receipt_number=receipt_number,
            fiscal_receipt_number=fiscal_number,
            payment_method=sale_data.payment_method,
            subtotal=total_subtotal,
            discount_total=total_discount,
            tax_total=total_tax,
            total=final_total,
            is_paid=True,
            notes=sale_data.notes,
            created_at=datetime.utcnow()
        )
        db.add(sale)
        await db.flush()

        for item in final_sale_items:
            item.sale_id = sale.id
            db.add(item)

        for m in movements_to_add:
            db.add(m)

        # Atomic commit
        await db.commit()

        return await SaleService.get_sale_by_id(db, business_id, sale.id)

    @staticmethod
    async def get_sale_by_id(db: AsyncSession, business_id: str, sale_id: str) -> SaleOut:
        stmt = (
            select(Sale)
            .options(selectinload(Sale.items))
            .where(Sale.business_id == business_id, Sale.id == sale_id)
        )
        res = await db.execute(stmt)
        sale = res.scalar_one_or_none()
        if not sale:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Վաճառքի գործարքը չի գտնվել:")

        return SaleOut.model_validate(sale)

    @staticmethod
    async def list_sales(
        db: AsyncSession,
        business_id: str,
        limit: int = 100,
        warehouse_id: Optional[str] = None
    ) -> List[SaleOut]:
        query = (
            select(Sale)
            .options(selectinload(Sale.items))
            .where(Sale.business_id == business_id)
            .order_by(Sale.created_at.desc())
            .limit(limit)
        )
        if warehouse_id and warehouse_id != "all":
            query = query.where(Sale.warehouse_id == warehouse_id)

        res = await db.execute(query)
        sales = res.scalars().all()
        return [SaleOut.model_validate(s) for s in sales]
