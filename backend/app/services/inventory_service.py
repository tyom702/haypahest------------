import uuid
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.inventory import Warehouse, InventoryMovement, MovementTypeEnum
from app.models.product import Product, WarehouseStock
from app.schemas.product import StockAdjustRequest
from app.schemas.inventory import WarehouseCreate, WarehouseOut, InventoryMovementOut


class InventoryService:
    @staticmethod
    async def list_warehouses(db: AsyncSession, business_id: str) -> List[WarehouseOut]:
        stmt = select(Warehouse).where(Warehouse.business_id == business_id).order_by(Warehouse.created_at)
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def create_warehouse(db: AsyncSession, business_id: str, data: WarehouseCreate) -> WarehouseOut:
        wh = Warehouse(
            id=str(uuid.uuid4()),
            business_id=business_id,
            name_am=data.name_am.strip(),
            code=data.code.strip(),
            address=data.address,
            phone=data.phone,
            is_default=data.is_default
        )
        db.add(wh)
        await db.commit()
        await db.refresh(wh)
        return wh

    @staticmethod
    async def adjust_stock(
        db: AsyncSession,
        business_id: str,
        data: StockAdjustRequest,
        user_id: str
    ) -> bool:
        """
        Adjust stock quantity atomically with audit movement logging.
        Strictly prevents negative inventory.
        """
        if data.new_quantity < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Մնացորդը չի կարող լինել բացասական:")

        # Lock product & stock row
        prod_stmt = select(Product).where(Product.business_id == business_id, Product.id == data.product_id)
        prod = (await db.execute(prod_stmt)).scalar_one_or_none()
        if not prod:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ապրանքը չի գտնվել:")

        wh_stmt = select(Warehouse).where(Warehouse.business_id == business_id, Warehouse.id == data.warehouse_id)
        wh = (await db.execute(wh_stmt)).scalar_one_or_none()
        if not wh:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Պահեստը չի գտնվել:")

        # Find or create WarehouseStock row with row-level lock
        stock_stmt = (
            select(WarehouseStock)
            .where(
                WarehouseStock.business_id == business_id,
                WarehouseStock.product_id == data.product_id,
                WarehouseStock.warehouse_id == data.warehouse_id
            )
            .with_for_update()
        )
        stock_res = await db.execute(stock_stmt)
        stock_row = stock_res.scalar_one_or_none()

        old_qty = stock_row.quantity if stock_row else 0
        diff = data.new_quantity - old_qty

        if not stock_row:
            stock_row = WarehouseStock(
                id=str(uuid.uuid4()),
                business_id=business_id,
                product_id=data.product_id,
                warehouse_id=data.warehouse_id,
                quantity=data.new_quantity
            )
            db.add(stock_row)
        else:
            stock_row.quantity = data.new_quantity

        # Record movement
        movement = InventoryMovement(
            id=str(uuid.uuid4()),
            business_id=business_id,
            product_id=data.product_id,
            warehouse_id=data.warehouse_id,
            movement_type=MovementTypeEnum.ADJUSTMENT,
            quantity=diff,
            cost_price=prod.cost_price,
            reason=f"{data.reason} (Նախկին՝ {old_qty}, Նոր՝ {data.new_quantity})",
            created_by_user_id=user_id
        )
        db.add(movement)

        await db.commit()
        return True

    @staticmethod
    async def list_movements(
        db: AsyncSession,
        business_id: str,
        limit: int = 100
    ) -> List[InventoryMovementOut]:
        stmt = (
            select(InventoryMovement)
            .where(InventoryMovement.business_id == business_id)
            .order_by(InventoryMovement.created_at.desc())
            .limit(limit)
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())
