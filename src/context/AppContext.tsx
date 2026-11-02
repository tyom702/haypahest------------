import React, { createContext, useContext, useState, useEffect } from 'react';
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
  ToastNotification,
  SaleItem,
  Employee,
  SystemNotification,
  ThemeMode,
} from '../types';
import { useAuth } from './AuthContext';
import {
  initialWarehouses,
  initialCategories,
  initialSuppliers,
  initialCustomers,
  initialProducts,
  initialTransactions,
  initialMovements,
  initialAudits,
  initialCompanySettings,
  initialEmployees,
  defaultSystemUser,
  initialNotifications,
} from '../data/initialData';

interface AppContextType {
  products: Product[];
  warehouses: Warehouse[];
  categories: Category[];
  suppliers: Supplier[];
  customers: Customer[];
  employees: Employee[];
  transactions: SaleTransaction[];
  movements: StockMovement[];
  audits: InventoryAudit[];
  companySettings: CompanySettings;
  notifications: SystemNotification[];
  selectedWarehouseId: string;
  toasts: ToastNotification[];
  theme: ThemeMode;
  currentUser: Employee;
  
  toggleTheme: () => void;
  setCurrentUser: (emp: Employee) => void;
  setSelectedWarehouseId: (id: string) => void;
  
  // Products & Inventory
  addProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => boolean;
  adjustProductStock: (
    productId: string,
    warehouseId: string,
    newQuantity: number,
    reason: string,
    notes?: string
  ) => { success: boolean; message: string };

  // Categories
  addCategory: (nameAm: string, description?: string) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => { success: boolean; message: string };
  
  // Sales
  addSaleTransaction: (data: {
    items: SaleItem[];
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    total: number;
    paymentMethod: SaleTransaction['paymentMethod'];
    customerId?: string;
    customerName?: string;
    notes?: string;
    warehouseId: string;
    amountTendered?: number;
    changeDue?: number;
  }) => SaleTransaction;
  
  // Movements
  addStockMovement: (data: {
    type: StockMovement['type'];
    sourceWarehouseId?: string;
    targetWarehouseId?: string;
    supplierId?: string;
    items: StockMovement['items'];
    totalCost: number;
    referenceDoc?: string;
    reason?: string;
  }) => StockMovement;
  
  createAudit: (warehouseId: string, items: InventoryAudit['items'], notes?: string) => InventoryAudit;
  applyAuditAdjustments: (auditId: string) => void;
  
  // Partners
  addSupplier: (data: Omit<Supplier, 'id' | 'totalPurchases' | 'currentDebt'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  paySupplierDebt: (supplierId: string, amount: number) => void;
  
  addCustomer: (data: Omit<Customer, 'id' | 'balanceDebt' | 'loyaltyPoints' | 'totalSpent'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  settleCustomerDebt: (customerId: string, amount: number) => void;
  
  // Employees
  addEmployee: (data: Omit<Employee, 'id'>) => Employee;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  
  // Warehouses & Settings
  addWarehouse: (data: Omit<Warehouse, 'id'>) => Warehouse;
  updateWarehouse: (id: string, updates: Partial<Warehouse>) => void;
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;
  
  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  
  // Workspace Data Management & Backup
  clearWorkspaceData: () => void;
  resetToDemoData: () => void;
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => boolean;
  
  addToast: (title: string, message: string, type?: ToastNotification['type']) => void;
  removeToast: (id: string) => void;

}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'hp_products_v2',
  WAREHOUSES: 'hp_warehouses_v2',
  CATEGORIES: 'hp_categories_v2',
  SUPPLIERS: 'hp_suppliers_v2',
  CUSTOMERS: 'hp_customers_v2',
  EMPLOYEES: 'hp_employees_v2',
  TRANSACTIONS: 'hp_transactions_v2',
  MOVEMENTS: 'hp_movements_v2',
  AUDITS: 'hp_audits_v2',
  SETTINGS: 'hp_settings_v2',
  NOTIFICATIONS: 'hp_notifications_v2',
  SELECTED_WH: 'hp_selected_wh_v2',
  THEME: 'hp_theme_mode_v2',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return (saved as ThemeMode) || 'light';
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WAREHOUSES);
    return saved ? JSON.parse(saved) : initialWarehouses;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    return saved ? JSON.parse(saved) : initialEmployees;
  });

  const { user } = useAuth();

  const [currentUser, setCurrentUserState] = useState<Employee>(() => {
    if (user) {
      return {
        id: user.id,
        fullNameAm: user.fullNameAm || 'Ադմինիստրատոր',
        role: (user.role as Employee['role']) || 'OWNER',
        email: user.email || '',
        phone: user.phone || '',
        warehouseId: user.warehouseId || 'wh-1',
        hireDate: user.createdAt || new Date().toLocaleDateString('hy-AM'),
        salaryAMD: 0,
        accessPermissions: ['view_reports', 'manage_inventory', 'create_sales', 'manage_settings', 'manage_employees'],
        isActive: user.isActive ?? true,
      };
    }
    return defaultSystemUser;
  });

  useEffect(() => {
    if (user) {
      setCurrentUserState({
        id: user.id,
        fullNameAm: user.fullNameAm || 'Ադմինիստրատոր',
        role: (user.role as Employee['role']) || 'OWNER',
        email: user.email || '',
        phone: user.phone || '',
        warehouseId: user.warehouseId || 'wh-1',
        hireDate: user.createdAt || new Date().toLocaleDateString('hy-AM'),
        salaryAMD: 0,
        accessPermissions: ['view_reports', 'manage_inventory', 'create_sales', 'manage_settings', 'manage_employees'],
        isActive: user.isActive ?? true,
      });
    }
  }, [user]);

  const [transactions, setTransactions] = useState<SaleTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    return saved ? JSON.parse(saved) : initialMovements;
  });

  const [audits, setAudits] = useState<InventoryAudit[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDITS);
    return saved ? JSON.parse(saved) : initialAudits;
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : initialCompanySettings;
  });

  const [selectedWarehouseId, setSelectedWarehouseIdState] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_WH);
    return saved || 'wh-1';
  });

  const [toasts, setToasts] = useState<ToastNotification[]>([]);




  // Apply dark class to documentElement
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(warehouses));
  }, [warehouses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(audits));
  }, [audits]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(companySettings));
  }, [companySettings]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setCurrentUser = (emp: Employee) => {
    setCurrentUserState(emp);
    updateCompanySettings({ activeCashier: emp.fullNameAm });
    addToast('Օգտատերը փոխվեց', `Ընթացիկ աշխատակից՝ ${emp.fullNameAm} (${emp.role})`, 'info');
  };

  const setSelectedWarehouseId = (id: string) => {
    setSelectedWarehouseIdState(id);
    localStorage.setItem(STORAGE_KEYS.SELECTED_WH, id);
    const wh = warehouses.find((w) => w.id === id);
    addToast('Պահեստը փոխվեց', `Ակտիվ պահեստ՝ ${wh?.nameAm || id}`, 'info');
  };

  const addToast = (title: string, message: string, type: ToastNotification['type'] = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Products
  const addProduct = (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const formattedDate = `${day}.${month}.${year}`;

    // Negative stock check if any initial warehouse stock is negative
    const validatedStock: Record<string, number> = {};
    Object.entries(data.warehouseStock || {}).forEach(([wId, qty]) => {
      validatedStock[wId] = !companySettings.allowNegativeStock ? Math.max(0, Number(qty) || 0) : Number(qty) || 0;
    });

    const newProduct: Product = {
      ...data,
      id: 'prod-' + Date.now(),
      warehouseStock: validatedStock,
      notes: data.notes || data.description || '',
      description: data.description || data.notes || '',
      createdAt: formattedDate,
      updatedAt: formattedDate,
    };

    setProducts((prev) => [newProduct, ...prev]);
    addToast('Ապրանքը ավելացվեց', `«${newProduct.nameAm}» ապրանքը հաջողությամբ պահպանվեց`);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const formattedDate = `${day}.${month}.${year}`;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;

        let validatedStock = p.warehouseStock;
        if (updates.warehouseStock) {
          validatedStock = { ...p.warehouseStock };
          Object.entries(updates.warehouseStock).forEach(([wId, qty]) => {
            validatedStock[wId] = !companySettings.allowNegativeStock ? Math.max(0, Number(qty) || 0) : Number(qty) || 0;
          });
        }

        return {
          ...p,
          ...updates,
          warehouseStock: validatedStock,
          notes: updates.notes ?? updates.description ?? p.notes,
          description: updates.description ?? updates.notes ?? p.description,
          updatedAt: formattedDate,
        };
      })
    );
    addToast('Թարմացված է', 'Ապրանքի տվյալները հաջողությամբ փոփոխվեցին');
  };

  const deleteProduct = (id: string): boolean => {
    const prod = products.find((p) => p.id === id);
    if (!prod) return false;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    addToast('Հեռացված է', `«${prod.nameAm}» ապրանքը հեռացվեց կատալոգից`, 'info');
    return true;
  };

  const adjustProductStock = (
    productId: string,
    warehouseId: string,
    newQuantity: number,
    reason: string,
    notes?: string
  ): { success: boolean; message: string } => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) {
      return { success: false, message: 'Ապրանքը չի գտնվել համակարգում:' };
    }

    if (newQuantity < 0 && !companySettings.allowNegativeStock) {
      const errorMsg = 'Գործողությունը մերժված է. բացասական մնացորդներն արգելված են ընկերության կարգավորումներով:';
      addToast('Սխալ', errorMsg, 'error');
      return { success: false, message: errorMsg };
    }

    const currentQty = prod.warehouseStock[warehouseId] ?? 0;
    const diff = newQuantity - currentQty;
    if (diff === 0) {
      return { success: true, message: 'Մնացորդի փոփոխություն չկա:' };
    }

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const formattedDate = `${day}.${month}.${year}`;

    // Update product stock
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            warehouseStock: {
              ...p.warehouseStock,
              [warehouseId]: newQuantity,
            },
            updatedAt: formattedDate,
          };
        }
        return p;
      })
    );

    // Register movement in audit trail
    const wh = warehouses.find((w) => w.id === warehouseId);
    const movNumber = `ADJ-${new Date().getFullYear()}-${String(movements.length + 105).padStart(4, '0')}`;
    const newMovement: StockMovement = {
      id: 'mov-adj-' + Date.now(),
      movementNumber: movNumber,
      date: new Date().toISOString(),
      type: 'adjustment',
      sourceWarehouseId: warehouseId,
      targetWarehouseId: warehouseId,
      items: [
        {
          productId: prod.id,
          productName: prod.nameAm,
          sku: prod.sku,
          unit: prod.unit,
          quantity: diff,
          unitCost: prod.costPrice,
          totalCost: Math.abs(diff * prod.costPrice),
        },
      ],
      totalCost: Math.abs(diff * prod.costPrice),
      reason: reason || 'Գույքագրման ճշգրտում',
      referenceDoc: notes || `Մնացորդի ճշգրտում (${currentQty} -> ${newQuantity})`,
      recordedBy: currentUser?.fullNameAm || companySettings.activeCashier || 'Աշխատակից',
    };
    setMovements((prev) => [newMovement, ...prev]);

    // Check if new stock triggers low stock alert or out-of-stock
    if (newQuantity <= prod.minStock) {
      const formattedTime = `${formattedDate}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setNotifications((prev) => [
        {
          id: 'notif-stock-' + Date.now(),
          title: newQuantity === 0 ? 'Ապրանքը սպառվեց' : 'Ցածր մնացորդի նախազգուշացում',
          message: `«${prod.nameAm}» ապրանքի մնացորդը ${wh?.nameAm || 'պահեստում'} հասել է ${newQuantity} ${prod.unit}-ի:`,
          type: 'stock',
          timestamp: formattedTime,
          isRead: false,
          link: '/products',
        },
        ...prev,
      ]);
    }

    addToast(
      'Մնացորդը ճշգրտվեց',
      `«${prod.nameAm}»՝ ${newQuantity} ${prod.unit} (${wh?.nameAm || 'պահեստ'})`
    );
    return { success: true, message: 'Մնացորդը հաջողությամբ ճշգրտվեց:' };
  };

  // Categories
  const addCategory = (nameAm: string, description?: string): Category => {
    const newCat: Category = {
      id: 'cat-' + Date.now(),
      nameAm: nameAm.trim(),
      description: description?.trim() || '',
    };
    setCategories((prev) => [...prev, newCat]);
    addToast('Կատեգորիան ավելացվեց', `«${newCat.nameAm}» կատեգորիան հաջողությամբ ստեղծվեց`);
    return newCat;
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    addToast('Կատեգորիան թարմացվեց', 'Փոփոխությունները հաջողությամբ պահպանվեցին');
  };

  const deleteCategory = (id: string): { success: boolean; message: string } => {
    const productsInCat = products.filter((p) => p.categoryId === id);
    if (productsInCat.length > 0) {
      const msg = `Հնարավոր չէ հեռացնել կատեգորիան, քանի որ այն պարունակում է ${productsInCat.length} ապրանք: Նախ տեղափոխեք կամ հեռացրեք դրանք:`;
      addToast('Հեռացումը մերժված է', msg, 'error');
      return { success: false, message: msg };
    }
    const cat = categories.find((c) => c.id === id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    addToast('Կատեգորիան հեռացվեց', `«${cat?.nameAm || 'Կատեգորիան'}» հեռացվեց`, 'info');
    return { success: true, message: 'Կատեգորիան հեռացվեց:' };
  };

  // Sales
  const addSaleTransaction = (data: {
    items: SaleItem[];
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    total: number;
    paymentMethod: SaleTransaction['paymentMethod'];
    customerId?: string;
    customerName?: string;
    notes?: string;
    warehouseId: string;
    amountTendered?: number;
    changeDue?: number;
  }): SaleTransaction => {
    // 1. Check stock availability to prevent overselling
    if (!companySettings.allowNegativeStock) {
      for (const item of data.items) {
        const prod = products.find((p) => p.id === item.productId);
        const available = prod?.warehouseStock[data.warehouseId] || 0;
        if (item.quantity > available) {
          const errMsg = `«${item.productName}» ապրանքի մնացորդը պահեստում անբավարար է (առկա է՝ ${available}, պահանջվում է՝ ${item.quantity}):`;
          addToast('Անբավարար մնացորդ', errMsg, 'error');
          throw new Error(errMsg);
        }
      }
    }

    const count = transactions.length + 1;
    const receiptNum = `HP-${new Date().getFullYear()}-${String(count + 940).padStart(4, '0')}`;
    const fiscalNum = String(Math.floor(10000000 + Math.random() * 90000000));

    // Ensure integer AMD amounts (no floating point currencies)
    const roundedSubtotal = Math.round(data.subtotal);
    const roundedDiscount = Math.round(data.discountTotal);
    const roundedTax = Math.round(data.taxTotal);
    const roundedTotal = Math.round(data.total);

    const newTrx: SaleTransaction = {
      id: 'trx-' + Date.now(),
      receiptNumber: receiptNum,
      fiscalReceiptNumber: fiscalNum,
      date: new Date().toISOString(),
      warehouseId: data.warehouseId,
      cashierName: currentUser?.fullNameAm || companySettings.activeCashier || 'Գանձապահ',
      customerId: data.customerId,
      customerName: data.customerName,
      items: data.items.map((it) => ({
        ...it,
        unitPrice: Math.round(it.unitPrice),
        discountAMD: Math.round(it.discountAMD || 0),
        tax: Math.round(it.tax || 0),
        total: Math.round(it.total),
      })),
      subtotal: roundedSubtotal,
      discountTotal: roundedDiscount,
      taxTotal: roundedTax,
      total: roundedTotal,
      paymentMethod: data.paymentMethod,
      amountTendered: data.amountTendered ? Math.round(data.amountTendered) : undefined,
      changeDue: data.changeDue ? Math.round(data.changeDue) : undefined,
      isPaid: data.paymentMethod !== 'credit',
      notes: data.notes,
    };

    // Deduct stock from target warehouse
    setProducts((prev) =>
      prev.map((prod) => {
        const itemSold = data.items.find((it) => it.productId === prod.id);
        if (itemSold) {
          const currentQty = prod.warehouseStock[data.warehouseId] || 0;
          const newQty = Math.max(0, currentQty - itemSold.quantity);
          return {
            ...prod,
            warehouseStock: {
              ...prod.warehouseStock,
              [data.warehouseId]: newQty,
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return prod;
      })
    );

    // Record inventory movement of type 'out' for complete auditability
    const totalCostOfSale = data.items.reduce(
      (sum, it) => sum + Math.round((it.costPrice || 0) * it.quantity),
      0
    );
    const saleMovement: StockMovement = {
      id: 'mov-sale-' + Date.now(),
      movementNumber: `SM-OUT-${new Date().getFullYear()}-${String(movements.length + 1).padStart(4, '0')}`,
      date: newTrx.date,
      type: 'out',
      sourceWarehouseId: data.warehouseId,
      items: data.items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        sku: it.sku || '',
        unit: it.unit || 'հատ',
        quantity: it.quantity,
        unitCost: Math.round(it.costPrice || 0),
        totalCost: Math.round((it.costPrice || 0) * it.quantity),
      })),
      totalCost: totalCostOfSale,
      referenceDoc: newTrx.receiptNumber,
      reason: `POS վաճառք կտրոն #${newTrx.receiptNumber}`,
      recordedBy: newTrx.cashierName,
    };
    setMovements((prev) => [saleMovement, ...prev]);

    // If customer purchased on credit, update customer debt
    if (data.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === data.customerId) {
            const addedDebt = data.paymentMethod === 'credit' ? roundedTotal : 0;
            const pointsEarned = Math.floor(roundedTotal / 1000);
            return {
              ...c,
              balanceDebt: c.balanceDebt + addedDebt,
              totalSpent: c.totalSpent + roundedTotal,
              loyaltyPoints: (c.loyaltyPoints || 0) + pointsEarned,
            };
          }
          return c;
        })
      );
    }

    setTransactions((prev) => [newTrx, ...prev]);

    // Add notification
    const now = new Date();
    const formattedTime = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: 'Նոր Վաճառք',
        message: `Կտրոն #${newTrx.receiptNumber} (${data.total.toLocaleString()} ֏)`,
        type: 'order',
        timestamp: formattedTime,
        isRead: false,
        link: '/reports',
      },
      ...prev,
    ]);

    addToast('Վաճառքը կատարված է', `Կտրոն #${newTrx.receiptNumber} (${data.total.toLocaleString()} ֏)`);
    return newTrx;
  };

  // Stock Movement
  const addStockMovement = (data: {
    type: StockMovement['type'];
    sourceWarehouseId?: string;
    targetWarehouseId?: string;
    supplierId?: string;
    items: StockMovement['items'];
    totalCost: number;
    referenceDoc?: string;
    reason?: string;
  }): StockMovement => {
    const count = movements.length + 1;
    const movNumber = `SM-${new Date().getFullYear()}-${String(count + 180).padStart(4, '0')}`;

    const newMovement: StockMovement = {
      id: 'mov-' + Date.now(),
      movementNumber: movNumber,
      date: new Date().toISOString(),
      type: data.type,
      sourceWarehouseId: data.sourceWarehouseId,
      targetWarehouseId: data.targetWarehouseId,
      supplierId: data.supplierId,
      items: data.items,
      totalCost: data.totalCost,
      referenceDoc: data.referenceDoc,
      reason: data.reason,
      recordedBy: currentUser?.fullNameAm || companySettings.activeCashier || 'Աշխատակից',
    };

    setProducts((prev) =>
      prev.map((prod) => {
        const movedItem = data.items.find((it) => it.productId === prod.id);
        if (!movedItem) return prod;

        const updatedStock = { ...prod.warehouseStock };

        if (data.type === 'in' && data.targetWarehouseId) {
          const curr = updatedStock[data.targetWarehouseId] || 0;
          updatedStock[data.targetWarehouseId] = curr + movedItem.quantity;
        } else if (data.type === 'transfer' && data.sourceWarehouseId && data.targetWarehouseId) {
          const srcCurr = updatedStock[data.sourceWarehouseId] || 0;
          const tgtCurr = updatedStock[data.targetWarehouseId] || 0;
          updatedStock[data.sourceWarehouseId] = Math.max(0, srcCurr - movedItem.quantity);
          updatedStock[data.targetWarehouseId] = tgtCurr + movedItem.quantity;
        } else if (data.type === 'write_off' && data.sourceWarehouseId) {
          const curr = updatedStock[data.sourceWarehouseId] || 0;
          updatedStock[data.sourceWarehouseId] = Math.max(0, curr - movedItem.quantity);
        }

        return {
          ...prod,
          warehouseStock: updatedStock,
        };
      })
    );

    if (data.type === 'in' && data.supplierId) {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === data.supplierId
            ? {
                ...s,
                totalPurchases: s.totalPurchases + data.totalCost,
                currentDebt: s.currentDebt + data.totalCost,
              }
            : s
        )
      );
    }

    setMovements((prev) => [newMovement, ...prev]);
    addToast(
      'Գործառնությունը գրանցվեց',
      `Գրանցված է #${newMovement.movementNumber} (${data.type === 'in' ? 'Մուտք' : data.type === 'transfer' ? 'Տեղաշարժ' : 'Դուրսգրում'})`
    );
    return newMovement;
  };

  // Stocktake
  const createAudit = (warehouseId: string, items: InventoryAudit['items'], notes?: string): InventoryAudit => {
    const count = audits.length + 1;
    const auditNum = `AUD-${new Date().getFullYear()}-${String(count + 5).padStart(2, '0')}`;
    const totalDiscrepancy = items.reduce((acc, it) => acc + it.discrepancyValue, 0);

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const formattedDate = `${day}.${month}.${year}`;

    const newAudit: InventoryAudit = {
      id: 'aud-' + Date.now(),
      auditNumber: auditNum,
      date: formattedDate,
      warehouseId,
      status: 'completed',
      auditor: currentUser?.fullNameAm || companySettings.activeCashier || 'Աուդիտոր',
      items,
      totalDiscrepancyValue: totalDiscrepancy,
      notes,
    };

    setAudits((prev) => [newAudit, ...prev]);
    addToast('Գույքագրումը գրանցվեց', `Փաստաթուղթ #${newAudit.auditNumber}`);
    return newAudit;
  };

  const applyAuditAdjustments = (auditId: string) => {
    const audit = audits.find((a) => a.id === auditId);
    if (!audit) return;

    setProducts((prev) =>
      prev.map((prod) => {
        const auditItem = audit.items.find((it) => it.productId === prod.id);
        if (!auditItem) return prod;
        return {
          ...prod,
          warehouseStock: {
            ...prod.warehouseStock,
            [audit.warehouseId]: auditItem.actualQty,
          },
        };
      })
    );

    addToast('Հաշտեցումը կատարվեց', 'Պահեստի մնացորդները համապատասխանեցվեցին փաստացի քանակներին');
  };

  // Suppliers
  const addSupplier = (data: Omit<Supplier, 'id' | 'totalPurchases' | 'currentDebt'>): Supplier => {
    const newSup: Supplier = {
      ...data,
      id: 'sup-' + Date.now(),
      totalPurchases: 0,
      currentDebt: 0,
    };
    setSuppliers((prev) => [newSup, ...prev]);
    addToast('Մատակարարն ավելացվեց', `«${newSup.nameAm}»`);
    return newSup;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    addToast('Թարմացված է', 'Մատակարարի տվյալները հաջողությամբ պահպանվեցին');
  };

  const paySupplierDebt = (supplierId: string, amount: number) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === supplierId ? { ...s, currentDebt: Math.max(0, s.currentDebt - amount) } : s))
    );
    addToast('Վճարումը գրանցվեց', `Մարվեց ${amount.toLocaleString()} ֏ պարտք`);
  };

  // Customers
  const addCustomer = (data: Omit<Customer, 'id' | 'balanceDebt' | 'loyaltyPoints' | 'totalSpent'>): Customer => {
    const newCust: Customer = {
      ...data,
      id: 'cust-' + Date.now(),
      balanceDebt: 0,
      loyaltyPoints: 0,
      totalSpent: 0,
    };
    setCustomers((prev) => [newCust, ...prev]);
    addToast('Հաճախորդն ավելացվեց', `«${newCust.nameAm}»`);
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    addToast('Թարմացված է', 'Հաճախորդի տվյալները պահպանվեցին');
  };

  const settleCustomerDebt = (customerId: string, amount: number) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, balanceDebt: Math.max(0, c.balanceDebt - amount) } : c))
    );
    addToast('Պարտքի մարում', `Գրանցվեց ${amount.toLocaleString()} ֏ մուտք հաճախորդից`);
  };

  // Employees
  const addEmployee = (data: Omit<Employee, 'id'>): Employee => {

    const newEmp: Employee = {
      ...data,
      id: 'emp-' + Date.now(),
    };
    setEmployees((prev) => [...prev, newEmp]);
    addToast('Աշխատակիցն ավելացվեց', `${newEmp.fullNameAm} (${newEmp.role})`);
    return newEmp;
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    addToast('Թարմացված է', 'Աշխատակցի տվյալները պահպանվեցին');
  };

  const deleteEmployee = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    addToast('Հեռացված է', `${emp?.fullNameAm || 'Աշխատակիցը'} հեռացվեց համակարգից`, 'info');
  };

  // Warehouses & Settings
  const addWarehouse = (data: Omit<Warehouse, 'id'>): Warehouse => {

    const newWh: Warehouse = {
      ...data,
      id: 'wh-' + Date.now(),
    };
    setWarehouses((prev) => [...prev, newWh]);
    addToast('Նոր պահեստ', `«${newWh.nameAm}» հաջողությամբ ավելացվեց`);
    return newWh;
  };

  const updateWarehouse = (id: string, updates: Partial<Warehouse>) => {
    setWarehouses((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
    addToast('Թարմացված է', 'Պահեստի տվյալները պահպանվեցին');
  };

  const updateCompanySettings = (settings: Partial<CompanySettings>) => {
    setCompanySettings((prev) => ({ ...prev, ...settings }));
    addToast('Կարգավորումները պահպանվեցին', 'Ընկերության տվյալները թարմացվեցին');
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    addToast('Ծանուցումներ', 'Բոլոր ծանուցումները նշվեցին որպես կարդացված');
  };

  // Clear workspace data (no demo data)
  const clearWorkspaceData = () => {
    setProducts([]);
    setTransactions([]);
    setMovements([]);
    setAudits([]);
    setCustomers([]);
    setSuppliers([]);
    setNotifications([]);
    addToast('Մաքրում', 'Բիզնեսի գործառնական տվյալները հաջողությամբ զրոյացվեցին', 'info');
  };
  const resetToDemoData = clearWorkspaceData;

  const exportDataJson = (): string => {
    const payload = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      companySettings,
      warehouses,
      categories,
      products,
      suppliers,
      customers,
      employees,
      transactions,
      movements,
      audits,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importDataJson = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.products && Array.isArray(data.products)) setProducts(data.products);
      if (data.warehouses && Array.isArray(data.warehouses)) setWarehouses(data.warehouses);
      if (data.categories && Array.isArray(data.categories)) setCategories(data.categories);
      if (data.suppliers && Array.isArray(data.suppliers)) setSuppliers(data.suppliers);
      if (data.customers && Array.isArray(data.customers)) setCustomers(data.customers);
      if (data.employees && Array.isArray(data.employees)) setEmployees(data.employees);
      if (data.transactions && Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (data.movements && Array.isArray(data.movements)) setMovements(data.movements);
      if (data.audits && Array.isArray(data.audits)) setAudits(data.audits);
      if (data.companySettings) setCompanySettings(data.companySettings);

      addToast('Ներմուծումն ավարտվեց', 'Տվյալները հաջողությամբ ներմուծվեցին');
      return true;
    } catch {
      addToast('Սխալ', 'Ֆայլի ձևաչափը անվավեր է', 'error');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        products,
        warehouses,
        categories,
        suppliers,
        customers,
        employees,
        transactions,
        movements,
        audits,
        companySettings,
        notifications,
        selectedWarehouseId,
        toasts,
        theme,
        currentUser,
        toggleTheme,
        setCurrentUser,
        setSelectedWarehouseId,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustProductStock,
        addCategory,
        updateCategory,
        deleteCategory,
        addSaleTransaction,
        addStockMovement,
        createAudit,
        applyAuditAdjustments,
        addSupplier,
        updateSupplier,
        paySupplierDebt,
        addCustomer,
        updateCustomer,
        settleCustomerDebt,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addWarehouse,
        updateWarehouse,
        updateCompanySettings,
        markNotificationRead,
        markAllNotificationsRead,
        clearWorkspaceData,
        resetToDemoData,
        exportDataJson,
        importDataJson,
        addToast,
        removeToast,

      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
