/**
 * HayPahest (ՀայՊահեստ) — Domain Data Types
 * Comprehensive data models for Armenian SMB Inventory & Sales Management
 */

export type Currency = 'AMD'; // Armenian Dram ֏
export type ThemeMode = 'light' | 'dark';

export interface Warehouse {
  id: string;
  nameAm: string;
  code: string;
  address: string;
  phone: string;
  manager: string;
  isDefault: boolean;
}

export interface Category {
  id: string;
  nameAm: string;
  description?: string;
}

export type UnitType = 'հատ' | 'կգ' | 'լիտր' | 'մետր' | 'տուփ' | 'պարկ' | 'հավաքածու';

export interface Product {
  id: string;
  sku: string; // Արտիկուլ
  barcode: string; // Շտրիխ-կոդ (EAN-13 or Code-128)
  nameAm: string; // Ապրանքի անվանում
  categoryId: string;
  unit: UnitType;
  costPrice: number; // Ինքնարժեք / Գնման գին (֏)
  sellingPrice: number; // Մանրածախ վաճառքի գին (֏)
  wholesalePrice: number; // Մեծածախ վաճառքի գին (֏)
  minStock: number; // Նվազագույն մնացորդ (alert threshold)
  warehouseStock: Record<string, number>; // warehouseId -> quantity
  supplierId?: string;
  expiryDate?: string; // YYYY-MM-DD
  taxRate: number; // e.g. 0.20 for 20% VAT, 0.05 for 5% turnover
  notes?: string;
  description?: string; // Ապրանքի մանրամասն նկարագրություն
  createdAt: string; // DD.MM.YYYY
  updatedAt: string; // DD.MM.YYYY
}

export type PaymentMethod = 
  | 'cash'          // Կանխիկ
  | 'card'          // Քարտով
  | 'bank_transfer' // Բանկային փոխանցում
  | 'arca'          // ArCa / Քարտ (համատեղելիության համար)
  | 'idram'         // Իդրամ QR
  | 'telcell'       // Թելսելլ Դրամապանակ
  | 'credit';       // Ապառիկ / Պարտքով

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  unit: UnitType;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discountPercent: number;
  taxRate: number;
  total: number;
  discountAMD?: number;
  tax?: number;
}

export interface SaleTransaction {
  id: string;
  receiptNumber: string; // e.g., HP-2026-0042
  fiscalReceiptNumber: string; // ՀԴՄ Ֆիսկալ կտրոնի համար (e.g. 08249117)
  date: string;
  warehouseId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountTendered?: number; // Տրված գումար (կանխիկի դեպքում)
  changeDue?: number; // Մանր
  isPaid: boolean;
  notes?: string;
}

export interface Supplier {
  id: string;
  nameAm: string;
  hvhh: string; // ՀՎՀՀ (8-նիշ հարկային կոդ)
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  totalPurchases: number; // Ընդհանուր մատակարարումների ծավալ
  currentDebt: number; // Ընկերության պարտքը մատակարարին
}

export interface Customer {
  id: string;
  nameAm: string;
  hvhh?: string; // Իրավաբանական անձանց համար
  phone: string;
  email?: string;
  address?: string;
  customerType: 'retail' | 'wholesale' | 'corporate';
  balanceDebt: number; // Հաճախորդի պարտքը մեզ (դեբիտորական)
  loyaltyPoints?: number;
  totalSpent: number;
}

export type EmployeeRole = 
  | 'ադմինիստրատոր' 
  | 'գանձապահ' 
  | 'պահեստապետ' 
  | 'մենեջեր' 
  | 'հաշվապահ'
  | 'OWNER'
  | 'MANAGER'
  | 'CASHIER'
  | 'WAREHOUSE'
  | 'ACCOUNTANT';

export interface Employee {
  id: string;
  fullNameAm: string;
  role: EmployeeRole;
  phone: string;
  email: string;
  warehouseId: string;
  isActive: boolean;
  hireDate: string; // DD.MM.YYYY
  salaryAMD: number;
  accessPermissions: string[];
}

export type MovementType = 
  | 'in'          // Մուտքագրում մատակարարից
  | 'out'         // Ելքագրում
  | 'transfer'    // Տեղաշարժ պահեստների միջև
  | 'write_off'   // Դուրսգրում (խոտան/ժամկետանց)
  | 'adjustment'; // Գույքագրման ճշգրտում

export interface StockMovement {
  id: string;
  movementNumber: string; // e.g., SM-2026-102
  date: string;
  type: MovementType;
  sourceWarehouseId?: string;
  targetWarehouseId?: string;
  supplierId?: string;
  items: {
    productId: string;
    productName: string;
    sku: string;
    unit: UnitType;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }[];
  totalCost: number;
  referenceDoc?: string; // e.g., Հաշիվ-ապրանքագիր Ա-9281
  reason?: string;
  recordedBy: string;
}

export interface InventoryAuditItem {
  productId: string;
  productName: string;
  sku: string;
  unit: UnitType;
  systemQty: number;
  actualQty: number;
  difference: number; // actual - system
  unitCost: number;
  discrepancyValue: number; // difference * unitCost
  notes?: string;
}

export interface InventoryAudit {
  id: string;
  auditNumber: string; // e.g., AUD-2026-05
  date: string;
  warehouseId: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  auditor: string;
  items: InventoryAuditItem[];
  totalDiscrepancyValue: number;
  notes?: string;
}

export interface CompanySettings {
  companyName: string; // «Արաքս Թրեյդ» ՍՊԸ
  brandName?: string; // HayPahest
  legalName: string;
  hvhh: string; // 8-digit Tax ID (օր.` 02584931)
  address: string;
  phone: string;
  email: string;
  taxSystem?: 'turnover' | 'vat' | 'micro'; // Շրջհարկ (5%), ԱԱՀ (20%), Միկրո (0%)
  taxationSystem?: 'turnover_tax' | 'vat' | 'micro' | string;
  vatRate?: number;
  vatPercent?: number;
  turnoverTaxPercent?: number;
  defaultWarehouseId?: string;
  bankName: string;
  bankAccount?: string;
  bankAccountNumber?: string;
  receiptHeader?: string;
  receiptFooterText?: string;
  receiptFooter?: string;
  currency?: string;
  enableFiscalReceipts?: boolean;
  activeCashier: string;
  autoDeductStockOnSale?: boolean;
  allowNegativeStock?: boolean; // Թույլատրել բացասական մնացորդներ պահեստում (լռելյայն` false)
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'stock' | 'debt' | 'system';
  timestamp: string; // DD.MM.YYYY, HH:mm
  isRead: boolean;
  link?: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

