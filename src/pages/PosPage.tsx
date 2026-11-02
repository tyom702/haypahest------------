import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  Barcode,
  Scan,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Receipt,
  User,
  Percent,
  CheckCircle2,
  Building2,
  RotateCcw,
  ShoppingCart,
  History,
  AlertTriangle,
  XCircle,
  Sparkles,
  Layers,
  Boxes
} from 'lucide-react';
import { Product, SaleItem, PaymentMethod, SaleTransaction } from '../types';
import { ReceiptModal } from '../components/common/ReceiptModal';
import { BarcodeScannerModal } from '../components/common/BarcodeScannerModal';
import { PosCheckoutModal } from '../components/sales/PosCheckoutModal';
import { SalesHistoryView } from '../components/sales/SalesHistoryView';
import { formatAMD } from '../utils/formatters';

export const PosPage: React.FC = () => {
  const {
    products,
    categories,
    customers,
    warehouses,
    selectedWarehouseId,
    companySettings,
    addSaleTransaction,
    addToast,
  } = useApp();

  // Top view mode: 'pos' or 'history'
  const [viewMode, setViewMode] = useState<'pos' | 'history'>('pos');

  // POS State
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pricingMode, setPricingMode] = useState<'retail' | 'wholesale'>('retail');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<SaleTransaction | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const currentWarehouse = warehouses.find((w) => w.id === selectedWarehouseId);
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Auto-switch to wholesale pricing if customer is wholesale/corporate
  useEffect(() => {
    if (selectedCustomer?.customerType === 'wholesale' || selectedCustomer?.customerType === 'corporate') {
      setPricingMode('wholesale');
    }
  }, [selectedCustomerId, selectedCustomer]);

  // Keyboard shortcut listener (F2 for checkout, Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0 && !isCheckoutOpen) {
          setIsCheckoutOpen(true);
        }
      } else if (e.key === 'Escape') {
        if (isCheckoutOpen) setIsCheckoutOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, isCheckoutOpen]);

  // Add product to cart with inventory check
  const handleAddToCart = (product: Product) => {
    const warehouseStock = product.warehouseStock[selectedWarehouseId] ?? 0;
    const existingIndex = cart.findIndex((item) => item.productId === product.id);
    const price = pricingMode === 'wholesale' ? (product.wholesalePrice || product.sellingPrice) : product.sellingPrice;

    if (existingIndex > -1) {
      const updated = [...cart];
      const newQty = updated[existingIndex].quantity + 1;

      if (newQty > warehouseStock && !companySettings.allowNegativeStock) {
        addToast(
          'Մնացորդի սահմանափակում',
          `«${product.nameAm}» ապրանքի մնացորդը պահեստում կազմում է ${warehouseStock} ${product.unit}:`,
          'warning'
        );
        return;
      }

      updated[existingIndex].quantity = newQty;
      updated[existingIndex].total = newQty * updated[existingIndex].unitPrice;
      setCart(updated);
    } else {
      if (warehouseStock < 1 && !companySettings.allowNegativeStock) {
        addToast(
          'Ապրանքը սպառված է',
          `«${product.nameAm}» ապրանքի մնացորդը ընտրված պահեստում 0 է:`,
          'warning'
        );
        return;
      }

      const newItem: SaleItem = {
        productId: product.id,
        productName: product.nameAm,
        sku: product.sku,
        unit: product.unit,
        quantity: 1,
        unitPrice: price,
        costPrice: product.costPrice,
        discountPercent: 0,
        taxRate: product.taxRate || 0.20,
        total: price,
      };
      setCart([...cart, newItem]);
    }
  };

  // Update item quantity in cart with inventory check
  const handleUpdateQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    const prod = products.find((p) => p.id === productId);
    const warehouseStock = prod ? (prod.warehouseStock[selectedWarehouseId] ?? 0) : 0;

    if (newQty > warehouseStock && !companySettings.allowNegativeStock) {
      addToast(
        'Առավելագույն մնացորդ',
        `«${prod?.nameAm}» ապրանքից առկա է միայն ${warehouseStock} ${prod?.unit}:`,
        'warning'
      );
      newQty = warehouseStock;
      if (newQty <= 0) {
        handleRemoveItem(productId);
        return;
      }
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          return {
            ...item,
            quantity: newQty,
            total: newQty * item.unitPrice,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleClearCart = () => {
    if (cart.length > 0) {
      setCart([]);
      setDiscountPercent(0);
      setSelectedCustomerId('');
      addToast('Զամբյուղը մաքրվեց', 'Բոլոր ընտրված ապրանքները հեռացվեցին', 'info');
    }
  };

  // Barcode Submission
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    const matched = products.find(
      (p) =>
        p.barcode.toLowerCase() === query.toLowerCase() ||
        p.sku.toLowerCase() === query.toLowerCase()
    );

    if (matched) {
      handleAddToCart(matched);
      setSearchQuery('');
      addToast('Ապրանքն ավելացվեց', `«${matched.nameAm}»`);
    } else {
      addToast('Չի գտնվել', `«${query}» շտրիխ-կոդով ապրանք գոյություն չունի`, 'warning');
    }
  };

  // Calculations
  const subtotal = cart.reduce((acc, it) => acc + it.total, 0);
  const discountTotal = Math.round((subtotal * discountPercent) / 100);
  const total = Math.max(0, subtotal - discountTotal);
  const vatRate = companySettings.vatRate || 0.20;
  const taxTotal = Math.round(total * (vatRate / (1 + vatRate)));

  // Finalize Sale
  const handleFinalizeSale = async (data: {
    paymentMethod: PaymentMethod;
    amountTendered?: number;
    changeDue?: number;
    notes?: string;
  }) => {
    if (cart.length === 0) return;

    // Validate inventory availability
    for (const item of cart) {
      const prod = products.find((p) => p.id === item.productId);
      const stock = prod ? (prod.warehouseStock[selectedWarehouseId] ?? 0) : 0;
      if (item.quantity > stock && !companySettings.allowNegativeStock) {
        throw new Error(
          `«${item.productName}» ապրանքի պահանջվող քանակը (${item.quantity} ${item.unit}) գերազանցում է պահեստում առկա մնացորդը (${stock} ${item.unit}):`
        );
      }
    }

    const trx = addSaleTransaction({
      items: cart,
      subtotal,
      discountTotal,
      taxTotal,
      total,
      paymentMethod: data.paymentMethod,
      customerId: selectedCustomerId || undefined,
      customerName: selectedCustomer?.nameAm || undefined,
      warehouseId: selectedWarehouseId,
      amountTendered: data.amountTendered,
      changeDue: data.changeDue,
      notes: data.notes,
    });

    setCompletedTransaction(trx);
    setIsCheckoutOpen(false);
    setCart([]);
    setDiscountPercent(0);
  };

  // Filter products for catalog grid
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.nameAm.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      (p.barcode && p.barcode.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-8">
      {/* View Switcher: POS vs History */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setViewMode('pos')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              viewMode === 'pos'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>POS Դրամարկղ</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('history')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              viewMode === 'history'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Վաճառքների Պատմություն</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <span>Ակտիվ պահեստ՝</span>
          <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
            {currentWarehouse?.nameAm}
          </strong>
        </div>
      </div>

      {/* Conditionally render History View or POS View */}
      {viewMode === 'history' ? (
        <SalesHistoryView onViewReceipt={(trx) => setCompletedTransaction(trx)} />
      ) : (
        <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-10rem)] overflow-hidden">
          {/* LEFT COLUMN: Product Search & Catalog Grid */}
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            {/* Top Barcode Input & Scanner Strip */}
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center gap-2.5">
              <form onSubmit={handleBarcodeSubmit} className="relative flex-1">
                <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Սկանավորել շտրիխ-կոդը (Enter) կամ որոնել ըստ անվանման/արտիկուլի..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                />
              </form>

              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                <Scan className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Սկաներ</span>
              </button>
            </div>

            {/* Categories horizontal rail */}
            <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0 bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Բոլորը ({products.length})
              </button>
              {categories.map((c) => {
                const count = products.filter((p) => p.categoryId === c.id).length;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedCategory === c.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {c.nameAm} ({count})
                  </button>
                );
              })}
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <Boxes className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  <p className="font-medium text-slate-600 dark:text-slate-400">
                    {products.length === 0
                      ? 'Դուք դեռ ապրանքներ չեք ավելացրել: Անցեք «Ապրանքներ» բաժին նոր ապրանք մուտքագրելու համար:'
                      : 'Որոնմամբ համապատասխան ապրանքներ չեն գտնվել:'}
                  </p>
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const stock = p.warehouseStock[selectedWarehouseId] ?? 0;
                  const price = pricingMode === 'wholesale' ? (p.wholesalePrice || p.sellingPrice) : p.sellingPrice;
                  const isOutOfStock = stock === 0;
                  const isLowStock = stock > 0 && stock <= p.minStock;

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleAddToCart(p)}
                      className={`p-3 rounded-xl border flex flex-col justify-between text-left transition-all cursor-pointer relative group ${
                        isOutOfStock
                          ? 'border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 opacity-75 hover:border-slate-400'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-mono text-slate-400 uppercase truncate">
                            {p.sku}
                          </span>
                          {isOutOfStock ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                              Սպառված
                            </span>
                          ) : isLowStock ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                              {stock} {p.unit}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {stock} {p.unit}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                          {p.nameAm}
                        </h4>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {formatAMD(price)}
                        </span>
                        <span className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Shopping Cart & Checkout */}
          <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden shrink-0">
            {/* Cart Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Զամբյուղ ({cart.reduce((s, it) => s + it.quantity, 0)})
                </h3>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Մաքրել</span>
                </button>
              )}
            </div>

            {/* Price Mode & Customer Selectors */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Գնային ռեժիմ՝</span>
                <div className="flex items-center bg-slate-200 dark:bg-slate-800 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setPricingMode('retail')}
                    className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                      pricingMode === 'retail'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Մանրածախ
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingMode('wholesale')}
                    className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                      pricingMode === 'wholesale'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Մեծածախ
                  </button>
                </div>
              </div>

              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              >
                <option value="">Մանրածախ գնորդ</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameAm} (Պարտք՝ {formatAMD(c.balanceDebt)})
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
                  <ShoppingCart className="w-10 h-10 stroke-1 text-slate-300 dark:text-slate-600 mb-2" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Զամբյուղը դատարկ է
                  </span>
                  <span className="text-[11px] mt-1 text-slate-400">
                    Ընտրեք ապրանքներ կատալոգից կամ սկանավորեք շտրիխ-կոդը
                  </span>
                </div>
              ) : (
                cart.map((item) => {
                  const prod = products.find((p) => p.id === item.productId);
                  const availableStock = prod ? (prod.warehouseStock[selectedWarehouseId] ?? 0) : 0;
                  const isExceeding = item.quantity > availableStock && !companySettings.allowNegativeStock;

                  return (
                    <div
                      key={item.productId}
                      className={`p-2.5 rounded-xl border transition-colors ${
                        isExceeding
                          ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/30'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                            {item.productName}
                          </h5>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {formatAMD(item.unitPrice)} / {item.unit}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productId)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Quantity Stepper & Line Total */}
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.productId, item.quantity - 1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => handleUpdateQty(item.productId, parseInt(e.target.value, 10) || 1)}
                            className="w-12 py-0.5 text-xs font-mono font-bold text-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {formatAMD(item.total)}
                        </span>
                      </div>

                      {isExceeding && (
                        <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
                          Առկա է միայն {availableStock} {item.unit}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Discount Selector */}
            {cart.length > 0 && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Ընդհանուր զեղչ՝</span>
                <div className="flex items-center gap-1">
                  {[0, 5, 10, 15].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiscountPercent(d)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                        discountPercent === d
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {d}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cart Summary & Checkout Trigger Button */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Ենթահանրագումար.</span>
                  <span className="font-mono">{formatAMD(subtotal)}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Զեղչ ({discountPercent}%).</span>
                    <span className="font-mono">-{formatAMD(discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Հաշվարկված ԱԱՀ ({vatRate * 100}%).</span>
                  <span className="font-mono">{formatAMD(taxTotal)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Ընդամենը.</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    {formatAMD(total)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Ձևակերպել Վաճառքը (F2)</span>
                <span className="font-mono">· {formatAMD(total)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      <PosCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        subtotal={subtotal}
        discountTotal={discountTotal}
        taxTotal={taxTotal}
        total={total}
        selectedCustomerId={selectedCustomerId}
        onSelectCustomer={setSelectedCustomerId}
        onConfirmSale={handleFinalizeSale}
      />

      {/* Printable Receipt Modal (Strictly Non-Fiscal Sales Summary) */}
      <ReceiptModal
        transaction={completedTransaction}
        onClose={() => setCompletedTransaction(null)}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanResult={(p) => {
          handleAddToCart(p);
          addToast('Ապրանքն ավելացվեց', `«${p.nameAm}»`);
        }}
        title="Շտրիխ-կոդի Սկանավորում"
      />
    </div>
  );
};
