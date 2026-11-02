import uuid
from typing import List, Optional
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.product import Product, Category, WarehouseStock
from app.models.inventory import Warehouse, InventoryMovement, MovementTypeEnum
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut, CategoryCreate, CategoryUpdate, CategoryOut


class ProductService:
    @staticmethod
    async def list_products(
        db: AsyncSession,
        business_id: str,
        category_id: Optional[str] = None,
        search: Optional[str] = None,
        active_only: bool = True
    ) -> List[ProductOut]:
        query = (
            select(Product)
            .options(selectinload(Product.category), selectinload(Product.stocks))
            .where(Product.business_id == business_id)
        )
        if active_only:
            query = query.where(Product.is_active == True)
        if category_id:
            query = query.where(Product.category_id == category_id)

        result = await db.execute(query)
        products = result.scalars().all()

        output = []
        for p in products:
            if search:
                q = search.lower()
                matches = (
                    q in p.name_am.lower() or
                    q in p.sku.lower() or
                    (p.barcode and q in p.barcode.lower())
                )
                if not matches:
                    continue

            stock_map = {s.warehouse_id: s.quantity for s in p.stocks}
            total_stock = sum(stock_map.values())

            output.append(
                ProductOut(
                    id=p.id,
                    business_id=p.business_id,
                    category_id=p.category_id,
                    sku=p.sku,
                    barcode=p.barcode,
                    name_am=p.name_am,
                    unit=p.unit,
                    cost_price=p.cost_price,
                    selling_price=p.selling_price,
                    min_stock=p.min_stock,
                    is_active=p.is_active,
                    created_at=p.created_at,
                    updated_at=p.updated_at,
                    total_stock=total_stock,
                    warehouse_stock=stock_map,
                    category_name=p.category.name_am if p.category else None
                )
            )
        return output

    @staticmethod
    async def get_product(db: AsyncSession, business_id: str, product_id: str) -> ProductOut:
        stmt = (
            select(Product)
            .options(selectinload(Product.category), selectinload(Product.stocks))
            .where(Product.business_id == business_id, Product.id == product_id)
        )
        res = await db.execute(stmt)
        p = res.scalar_one_or_none()
        if not p:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ապրանքը չի գտնվել:")

        stock_map = {s.warehouse_id: s.quantity for s in p.stocks}
        total_stock = sum(stock_map.values())

        return ProductOut(
            id=p.id,
            business_id=p.business_id,
            category_id=p.category_id,
            sku=p.sku,
            barcode=p.barcode,
            name_am=p.name_am,
            unit=p.unit,
            cost_price=p.cost_price,
            selling_price=p.selling_price,
            min_stock=p.min_stock,
            is_active=p.is_active,
            created_at=p.created_at,
            updated_at=p.updated_at,
            total_stock=total_stock,
            warehouse_stock=stock_map,
            category_name=p.category.name_am if p.category else None
        )

    @staticmethod
    async def create_product(
        db: AsyncSession,
        business_id: str,
        data: ProductCreate,
        user_id: Optional[str] = None
    ) -> ProductOut:
        # Check duplicate SKU within the business
        check_stmt = select(Product).where(
            Product.business_id == business_id,
            Product.sku == data.sku.strip()
        )
        existing = (await db.execute(check_stmt)).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"'{data.sku}' արտիկուլով ապրանք արդեն գոյություն ունի այս բիզնեսում:"
            )

        product = Product(
            id=str(uuid.uuid4()),
            business_id=business_id,
            category_id=data.category_id,
            sku=data.sku.strip(),
            barcode=data.barcode.strip() if data.barcode else None,
            name_am=data.name_am.strip(),
            unit=data.unit,
            cost_price=data.cost_price,
            selling_price=data.selling_price,
            min_stock=data.min_stock,
            is_active=True
        )
        db.add(product)
        await db.flush()

        # Handle initial stock if specified
        stock_map = {}
        if data.initial_stock and data.initial_stock > 0:
            target_wh_id = data.warehouse_id
            if not target_wh_id:
                # Find default warehouse
                wh_stmt = select(Warehouse).where(Warehouse.business_id == business_id, Warehouse.is_default == True)
                wh_res = await db.execute(wh_stmt)
                wh = wh_res.scalars().first()
                if not wh:
                    wh = (await db.execute(select(Warehouse).where(Warehouse.business_id == business_id))).scalars().first()
                target_wh_id = wh.id if wh else None

            if target_wh_id:
                wh_stock = WarehouseStock(
                    id=str(uuid.uuid4()),
                    business_id=business_id,
                    product_id=product.id,
                    warehouse_id=target_wh_id,
                    quantity=data.initial_stock
                )
                db.add(wh_stock)
                stock_map[target_wh_id] = data.initial_stock

                # Record movement
                movement = InventoryMovement(
                    id=str(uuid.uuid4()),
                    business_id=business_id,
                    product_id=product.id,
                    warehouse_id=target_wh_id,
                    movement_type=MovementTypeEnum.IN,
                    quantity=data.initial_stock,
                    cost_price=data.cost_price,
                    reason="Սկզբնական մնացորդի գրանցում",
                    created_by_user_id=user_id
                )
                db.add(movement)

        await db.commit()
        return await ProductService.get_product(db, business_id, product.id)

    @staticmethod
    async def update_product(
        db: AsyncSession,
        business_id: str,
        product_id: str,
        updates: ProductUpdate
    ) -> ProductOut:
        stmt = select(Product).where(Product.business_id == business_id, Product.id == product_id)
        res = await db.execute(stmt)
        p = res.scalar_one_or_none()
        if not p:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ապրանքը չի գտնվել:")

        update_dict = updates.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(p, key, val)

        await db.commit()
        return await ProductService.get_product(db, business_id, product_id)

    @staticmethod
    async def delete_product(db: AsyncSession, business_id: str, product_id: str) -> bool:
        stmt = select(Product).where(Product.business_id == business_id, Product.id == product_id)
        res = await db.execute(stmt)
        p = res.scalar_one_or_none()
        if not p:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ապրանքը չի գտնվել:")

        # Soft delete or hard delete if no sales
        p.is_active = False
        await db.commit()
        return True
