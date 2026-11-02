import { pgTable, serial, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

// 1. Users table (linked to Firebase Auth UID & workspace)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  fullNameAm: text('full_name_am').notNull(),
  role: text('role').notNull().default('owner'), // 'owner', 'manager', 'cashier'
  phone: text('phone'),
  workspaceId: text('workspace_id').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Multi-tenant Business Workspaces
export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  hvhh: text('hvhh').notNull(),
  ownerId: text('owner_id').notNull(),
  ownerName: text('owner_name').notNull(),
  ownerEmail: text('owner_email').notNull(),
  plan: text('plan').notNull().default('BUSINESS'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Warehouses
export const warehouses = pgTable('warehouses', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  nameAm: text('name_am').notNull(),
  code: text('code').notNull(),
  address: text('address'),
  phone: text('phone'),
  manager: text('manager'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Product Categories
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  nameAm: text('name_am').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. Products
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  sku: text('sku').notNull(),
  nameAm: text('name_am').notNull(),
  barcode: text('barcode'),
  categoryId: text('category_id'),
  unit: text('unit').notNull().default('հատ'),
  costPrice: integer('cost_price').notNull().default(0),
  sellingPrice: integer('selling_price').notNull().default(0),
  wholesalePrice: integer('wholesale_price').notNull().default(0),
  minStock: integer('min_stock').notNull().default(0),
  description: text('description'),
  warehouseStock: text('warehouse_stock').notNull().default('{}'), // JSON string: Record<warehouseId, quantity>
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 6. Customers
export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  nameAm: text('name_am').notNull(),
  hvhh: text('hvhh'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  customerType: text('customer_type').notNull().default('retail'), // 'retail', 'wholesale', 'corporate'
  balanceDebt: integer('balance_debt').notNull().default(0),
  loyaltyPoints: integer('loyalty_points').notNull().default(0),
  totalSpent: integer('total_spent').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// 7. Suppliers
export const suppliers = pgTable('suppliers', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  nameAm: text('name_am').notNull(),
  hvhh: text('hvhh'),
  contactPerson: text('contact_person'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  totalPurchases: integer('total_purchases').notNull().default(0),
  currentDebt: integer('current_debt').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// 8. Sales Transactions
export const sales = pgTable('sales', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  receiptNumber: text('receipt_number').notNull(),
  fiscalReceiptNumber: text('fiscal_receipt_number').notNull(),
  date: text('date').notNull(),
  warehouseId: text('warehouse_id').notNull(),
  cashierName: text('cashier_name').notNull(),
  customerId: text('customer_id'),
  customerName: text('customer_name'),
  items: text('items').notNull(), // JSON string: SaleItem[]
  subtotal: integer('subtotal').notNull().default(0),
  discountTotal: integer('discount_total').notNull().default(0),
  taxTotal: integer('tax_total').notNull().default(0),
  total: integer('total').notNull().default(0),
  costTotal: integer('cost_total').notNull().default(0),
  paymentMethod: text('payment_method').notNull(),
  amountTendered: integer('amount_tendered'),
  changeDue: integer('change_due'),
  isPaid: boolean('is_paid').notNull().default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. Stock Movements
export const movements = pgTable('movements', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  movementNumber: text('movement_number').notNull(),
  date: text('date').notNull(),
  type: text('type').notNull(), // 'in', 'transfer', 'write_off'
  sourceWarehouseId: text('source_warehouse_id'),
  targetWarehouseId: text('target_warehouse_id'),
  supplierId: text('supplier_id'),
  items: text('items').notNull(), // JSON string
  totalCost: integer('total_cost').notNull().default(0),
  referenceDoc: text('reference_doc'),
  reason: text('reason'),
  recordedBy: text('recorded_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 10. Inventory Audits
export const audits = pgTable('audits', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  auditNumber: text('audit_number').notNull(),
  date: text('date').notNull(),
  warehouseId: text('warehouse_id').notNull(),
  status: text('status').notNull().default('completed'),
  auditor: text('auditor').notNull(),
  items: text('items').notNull(), // JSON string
  totalDiscrepancyValue: integer('total_discrepancy_value').notNull().default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 11. System Notifications
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(),
  timestamp: text('timestamp').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  link: text('link'),
  createdAt: timestamp('created_at').defaultNow(),
});
