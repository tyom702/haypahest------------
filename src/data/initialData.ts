import {
  Product,
  Warehouse,
  Category,
  Supplier,
  Customer,
  SaleTransaction,
  StockMovement,
  InventoryAudit,
  CompanySettings,
  Employee,
  SystemNotification
} from '../types';

// Default initial warehouse for newly registered business workspace
export const initialWarehouses: Warehouse[] = [
  {
    id: 'wh-1',
    nameAm: 'Գլխավոր Պահեստ',
    code: 'WH-01',
    address: 'ք. Երևան',
    phone: '',
    manager: '',
    isDefault: true,
  },
];

// Essential starter category (can be customized or added to)
export const initialCategories: Category[] = [
  { id: 'cat-1', nameAm: 'Ընդհանուր', description: 'Ապրանքների հիմնական կատեգորիա' },
];

// STRICT RULE: All new workspaces start with ZERO records.
// Absolutely no fake/mock items, sales, customers, suppliers or fake employees.
export const initialSuppliers: Supplier[] = [];
export const initialCustomers: Customer[] = [];
export const initialProducts: Product[] = [];
export const initialTransactions: SaleTransaction[] = [];
export const initialMovements: StockMovement[] = [];
export const initialAudits: InventoryAudit[] = [];
export const initialEmployees: Employee[] = [];
export const defaultSystemUser: Employee = {
  id: 'usr-default',
  fullNameAm: 'Ադմինիստրատոր',
  role: 'OWNER',
  email: '',
  phone: '',
  warehouseId: 'wh-1',
  hireDate: new Date().toLocaleDateString('hy-AM'),
  salaryAMD: 0,
  accessPermissions: ['view_reports', 'manage_inventory', 'create_sales', 'manage_settings', 'manage_employees'],
  isActive: true,
};
export const initialNotifications: SystemNotification[] = [];

export const initialCompanySettings: CompanySettings = {
  companyName: 'ՀայՊահեստ Բիզնես',
  legalName: '«ՀայՊահեստ» ՍՊԸ',
  hvhh: '00000000',
  taxationSystem: 'turnover_tax',
  address: 'ք. Երևան, Հայաստան',
  phone: '+374 10 00-00-00',
  email: 'info@haypahest.am',
  bankName: 'Ամերիաբանկ ՓԲԸ',
  bankAccountNumber: '1570000000000000',
  vatPercent: 20,
  turnoverTaxPercent: 5,
  activeCashier: 'Սեփականատեր',
  currency: 'AMD',
  receiptHeader: 'ԲԱՐԻ ԳԱԼՈՒՍՏ',
  receiptFooter: 'ՇՆՈՐՀԱԿԱԼՈՒԹՅՈՒՆ ԳՆՈՒՄՆԵՐԻ ՀԱՄԱՐ',
  autoDeductStockOnSale: true,
  allowNegativeStock: false,
};
