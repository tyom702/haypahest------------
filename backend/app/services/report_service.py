from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.sale import Sale, SaleItem
from app.models.product import Product, WarehouseStock, Category
from app.models.employee import Employee
from app.schemas.report import (
    AnalyticsSummaryOut,
    DailyTrendPointOut,
    CategoryShareOut,
    ProductPerformanceOut,
    EmployeePerformanceOut,
)


class ReportService:
    @staticmethod
    async def get_summary_kpis(
        db: AsyncSession,
        business_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        warehouse_id: Optional[str] = None
    ) -> AnalyticsSummaryOut:
        now = datetime.utcnow()
        today_start = datetime(now.year, now.month, now.day)
        seven_days_ago = now - timedelta(days=7)
        first_day_of_month = datetime(now.year, now.month, 1)

        # Base sale query
        base_query = select(Sale).options(selectinload(Sale.items)).where(Sale.business_id == business_id)
        if warehouse_id and warehouse_id != "all":
            base_query = base_query.where(Sale.warehouse_id == warehouse_id)

        all_sales = (await db.execute(base_query)).scalars().all()

        daily_sales = sum(s.total for s in all_sales if s.created_at >= today_start)
        weekly_sales = sum(s.total for s in all_sales if s.created_at >= seven_days_ago)
        monthly_sales = sum(s.total for s in all_sales if s.created_at >= first_day_of_month)

        # Filtered period sales
        filtered_sales = all_sales
        if start_date:
            filtered_sales = [s for s in filtered_sales if s.created_at >= start_date]
        if end_date:
            filtered_sales = [s for s in filtered_sales if s.created_at <= end_date]

        period_revenue = sum(s.total for s in filtered_sales)
        period_count = len(filtered_sales)
        avg_ticket = period_revenue // period_count if period_count > 0 else 0

        # Calculate COGS (Cost of Goods Sold)
        period_cogs = 0
        for s in filtered_sales:
            for item in s.items:
                period_cogs += item.quantity * item.cost_price

        gross_profit = max(0, period_revenue - period_cogs)
        profit_margin = (gross_profit * 100) // period_revenue if period_revenue > 0 else 0

        # Current Inventory Value
        stock_query = (
            select(WarehouseStock, Product)
            .join(Product, WarehouseStock.product_id == Product.id)
            .where(WarehouseStock.business_id == business_id)
        )
        if warehouse_id and warehouse_id != "all":
            stock_query = stock_query.where(WarehouseStock.warehouse_id == warehouse_id)

        stock_rows = (await db.execute(stock_query)).all()
        inventory_cost = 0
        inventory_retail = 0
        for stock, prod in stock_rows:
            inventory_cost += stock.quantity * prod.cost_price
            inventory_retail += stock.quantity * prod.selling_price

        return AnalyticsSummaryOut(
            daily_sales_amd=daily_sales,
            weekly_sales_amd=weekly_sales,
            monthly_sales_amd=monthly_sales,
            period_revenue_amd=period_revenue,
            period_transactions_count=period_count,
            average_transaction_value_amd=avg_ticket,
            period_cogs_amd=period_cogs,
            estimated_gross_profit_amd=gross_profit,
            profit_margin_percent=profit_margin,
            inventory_cost_value_amd=inventory_cost,
            inventory_retail_value_amd=inventory_retail
        )

    @staticmethod
    async def get_daily_trends(
        db: AsyncSession,
        business_id: str,
        days: int = 14
    ) -> List[DailyTrendPointOut]:
        now = datetime.utcnow()
        start_date = now - timedelta(days=days)
        
        stmt = (
            select(Sale)
            .options(selectinload(Sale.items))
            .where(Sale.business_id == business_id, Sale.created_at >= start_date)
            .order_by(Sale.created_at.asc())
        )
        sales = (await db.execute(stmt)).scalars().all()

        day_map = {}
        for s in sales:
            d_key = s.created_at.strftime("%Y-%m-%d")
            label = s.created_at.strftime("%d.%m")
            if d_key not in day_map:
                day_map[d_key] = {
                    "label": label,
                    "revenue": 0,
                    "cogs": 0,
                    "count": 0,
                    "units": 0
                }
            day_map[d_key]["revenue"] += s.total
            day_map[d_key]["count"] += 1
            for item in s.items:
                day_map[d_key]["cogs"] += item.quantity * item.cost_price
                day_map[d_key]["units"] += item.quantity

        result = []
        for d_key in sorted(day_map.keys()):
            data = day_map[d_key]
            rev = data["revenue"]
            cogs = data["cogs"]
            profit = max(0, rev - cogs)
            result.append(
                DailyTrendPointOut(
                    date=d_key,
                    label=data["label"],
                    հասույթ=rev,
                    շահույթ=profit,
                    գործարքներ=data["count"],
                    միավորներ=data["units"]
                )
            )
        return result
