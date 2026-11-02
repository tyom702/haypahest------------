from typing import List, Optional
from pydantic import BaseModel


class AnalyticsSummaryOut(BaseModel):
    daily_sales_amd: int
    weekly_sales_amd: int
    monthly_sales_amd: int
    period_revenue_amd: int
    period_transactions_count: int
    average_transaction_value_amd: int
    period_cogs_amd: int
    estimated_gross_profit_amd: int
    profit_margin_percent: int
    inventory_cost_value_amd: int
    inventory_retail_value_amd: int


class DailyTrendPointOut(BaseModel):
    date: str
    label: str
    հասույթ: int
    շահույթ: int
    գործարքներ: int
    միավորներ: int


class CategoryShareOut(BaseModel):
    category_id: str
    category_name: str
    revenue_amd: int
    units_sold: int
    percentage: int


class ProductPerformanceOut(BaseModel):
    product_id: str
    sku: str
    name_am: str
    category_name: str
    units_sold: int
    revenue_amd: int
    cogs_amd: int
    gross_profit_amd: int
    profit_margin_percent: int
    current_stock: int
    turnover_rank: str  # best, moderate, low


class EmployeePerformanceOut(BaseModel):
    employee_name: str
    role: str
    transactions_count: int
    total_revenue_amd: int
    average_ticket_amd: int
    share_of_sales_percent: int
