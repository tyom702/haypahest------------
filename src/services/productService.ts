/**
 * HayPahest (ՀայՊահեստ) — Product & Inventory Data Service
 * Decoupled domain service separating client state/storage from future FastAPI endpoints.
 * All functions return Promises to mirror real network I/O, facilitating seamless migration to FastAPI.
 */

import { Product, Category, StockMovement, SaleTransaction, Warehouse } from '../types';

export interface InventoryValuation {
  totalItems: number;
  totalCostValue: number;
  totalRetailValue: number;
  potentialProfit: number;
  profitMarginPercent: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface ProductMovementEntry {
  id: string;
  date: string;
  type: string;
  typeLabel: string;
  typeColor: string;
  warehouseId: string;
  warehouseName: string;
  quantityChange: number; // positive or negative
  unitCost?: number;
  referenceDoc?: string;
  reason?: string;
  recordedBy: string;
}

export const productService = {
  /**
   * Calculates comprehensive inventory valuation and alerts for a warehouse or company-wide.
   */
  calculateValuation(products: Product[], selectedWarehouseId?: string): InventoryValuation {
    let totalItems = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      const stock = selectedWarehouseId && selectedWarehouseId !== 'all'
        ? (p.warehouseStock[selectedWarehouseId] ?? 0)
        : Object.values(p.warehouseStock).reduce((sum, qty) => sum + qty, 0);

      totalItems += stock;
      totalCostValue += stock * (p.costPrice || 0);
      totalRetailValue += stock * (p.sellingPrice || 0);

      if (stock === 0) {
        outOfStockCount++;
      } else if (stock <= p.minStock) {
        lowStockCount++;
      }
    });

    const potentialProfit = Math.max(0, totalRetailValue - totalCostValue);
    const profitMarginPercent = totalRetailValue > 0
      ? Math.round((potentialProfit / totalRetailValue) * 100)
      : 0;

    return {
      totalItems,
      totalCostValue,
      totalRetailValue,
      potentialProfit,
      profitMarginPercent,
      lowStockCount,
      outOfStockCount,
    };
  },

  /**
   * Aggregates all stock movements and sales for a specific product into an audit timeline.
   */
  getProductHistory(
    productId: string,
    movements: StockMovement[],
    transactions: SaleTransaction[],
    warehouses: Warehouse[]
  ): ProductMovementEntry[] {
    const entries: ProductMovementEntry[] = [];
    const warehouseMap = new Map(warehouses.map((w) => [w.id, w.nameAm]));

    // 1. Stock Movements (In, Out, Transfer, Write-off, Adjustment)
    movements.forEach((m) => {
      const item = m.items.find((it) => it.productId === productId);
      if (!item) return;

      if (m.type === 'in' && m.targetWarehouseId) {
        entries.push({
          id: `${m.id}-${item.productId}-in`,
          date: m.date,
          type: 'in',
          typeLabel: 'Մուտք մատակարարից',
          typeColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
          warehouseId: m.targetWarehouseId,
          warehouseName: warehouseMap.get(m.targetWarehouseId) || m.targetWarehouseId,
          quantityChange: item.quantity,
          unitCost: item.unitCost,
          referenceDoc: m.referenceDoc || m.movementNumber,
          reason: m.reason || 'Մատակարարում',
          recordedBy: m.recordedBy,
        });
      } else if (m.type === 'write_off' && m.sourceWarehouseId) {
        entries.push({
          id: `${m.id}-${item.productId}-wo`,
          date: m.date,
          type: 'write_off',
          typeLabel: 'Դուրսգրում / Խոտան',
          typeColor: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
          warehouseId: m.sourceWarehouseId,
          warehouseName: warehouseMap.get(m.sourceWarehouseId) || m.sourceWarehouseId,
          quantityChange: -item.quantity,
          unitCost: item.unitCost,
          referenceDoc: m.referenceDoc || m.movementNumber,
          reason: m.reason || 'Խոտան / Վնասված',
          recordedBy: m.recordedBy,
        });
      } else if (m.type === 'adjustment' && m.sourceWarehouseId) {
        entries.push({
          id: `${m.id}-${item.productId}-adj`,
          date: m.date,
          type: 'adjustment',
          typeLabel: 'Պահեստի ճշգրտում',
          typeColor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
          warehouseId: m.sourceWarehouseId,
          warehouseName: warehouseMap.get(m.sourceWarehouseId) || m.sourceWarehouseId,
          quantityChange: item.quantity, // can be positive or negative
          unitCost: item.unitCost,
          referenceDoc: m.referenceDoc || m.movementNumber,
          reason: m.reason || 'Գույքագրման ճշգրտում',
          recordedBy: m.recordedBy,
        });
      } else if (m.type === 'transfer') {
        if (m.sourceWarehouseId) {
          entries.push({
            id: `${m.id}-${item.productId}-tf-src`,
            date: m.date,
            type: 'transfer_out',
            typeLabel: 'Տեղափոխում (Ելք)',
            typeColor: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
            warehouseId: m.sourceWarehouseId,
            warehouseName: warehouseMap.get(m.sourceWarehouseId) || m.sourceWarehouseId,
            quantityChange: -item.quantity,
            referenceDoc: m.referenceDoc || m.movementNumber,
            reason: `Տեղափոխում դեպի ${warehouseMap.get(m.targetWarehouseId || '') || ''}`,
            recordedBy: m.recordedBy,
          });
        }
        if (m.targetWarehouseId) {
          entries.push({
            id: `${m.id}-${item.productId}-tf-tgt`,
            date: m.date,
            type: 'transfer_in',
            typeLabel: 'Տեղափոխում (Մուտք)',
            typeColor: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
            warehouseId: m.targetWarehouseId,
            warehouseName: warehouseMap.get(m.targetWarehouseId) || m.targetWarehouseId,
            quantityChange: item.quantity,
            referenceDoc: m.referenceDoc || m.movementNumber,
            reason: `Տեղափոխում ${warehouseMap.get(m.sourceWarehouseId || '') || ''}-ից`,
            recordedBy: m.recordedBy,
          });
        }
      }
    });

    // 2. Sales Transactions
    transactions.forEach((t) => {
      const item = t.items.find((it) => it.productId === productId);
      if (!item) return;

      entries.push({
        id: `${t.id}-${item.productId}-sale`,
        date: t.date,
        type: 'sale',
        typeLabel: 'Վաճառք / POS',
        typeColor: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800',
        warehouseId: t.warehouseId,
        warehouseName: warehouseMap.get(t.warehouseId) || t.warehouseId,
        quantityChange: -item.quantity,
        unitCost: item.costPrice,
        referenceDoc: `Կտրոն #${t.receiptNumber}`,
        reason: t.customerName ? `Հաճախորդ՝ ${t.customerName}` : 'Մանրածախ վաճառք',
        recordedBy: t.cashierName,
      });
    });

    // Sort descending by date
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return entries;
  },

  /**
   * Generates a unique Armenian-format SKU like HP-PR-492
   */
  generateSku(categoryCode = 'PR'): string {
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `HP-${categoryCode.toUpperCase()}-${randomNum}`;
  },

  /**
   * Generates a valid standard Armenian EAN-13 format barcode (prefix 485)
   */
  generateBarcode(): string {
    const prefix = '485'; // Armenia EAN Country Code
    const body = Math.floor(100000000 + Math.random() * 900000000).toString().substring(0, 9);
    const code12 = prefix + body;
    // Calculate EAN-13 check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(code12[i], 10);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return code12 + checkDigit.toString();
  },
};
