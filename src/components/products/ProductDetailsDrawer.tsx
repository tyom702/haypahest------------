import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Warehouse } from '../../types';
import {
  X,
  Boxes,
  Barcode,
  Tag,
  DollarSign,
  TrendingUp,
  Clock,
  Warehouse as WarehouseIcon,
  Calendar,
  Building2,
  FileText,
  Edit2,
  Scale,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  History,
  TrendingDown,
  ArrowUpRight
} from 'lucide-react';
import { formatAMD } from '../../utils/formatters';
import { productService, ProductMovementEntry } from '../../services/productService';

interface ProductDetailsDrawerProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onAdjust: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export const ProductDetailsDrawer: React.FC<ProductDetailsDrawerProps> = ({
  product,
  isOpen,
  onClose,
  onEdit,
  onAdjust,
  onDelete,
}) => {
  const { categories, warehouses, suppliers, movements, transactions } = useApp();
  const [activeTab, setActiveTab] = useState<'details' | 'warehouses' | 'history'>('details');
  const [copiedBarcode, setCopiedBarcode] = useState(false);

  if (!isOpen || !product) return null;

  const category = categories.find((c) => c.id === product.categoryId);
  const supplier = suppliers.find((s) => s.id === product.supplierId);

  // Compute total stock across all warehouses
  const totalStock = Object.values(product.warehouseStock).reduce((sum, q) => sum + q, 0);
  const totalCostValuation = totalStock * (product.costPrice || 0);
  const totalRetailValuation = totalStock * (product.sellingPrice || 0);
  const marginAMD = Math.max(0, product.sellingPrice - product.costPrice);
  const marginPercent = product.sellingPrice > 0 ? Math.round((marginAMD / product.sellingPrice) * 100) : 0;

  // History timeline
  const productHistory: ProductMovementEntry[] = productService.getProductHistory(
    product.id,
    movements,
    transactions,
    warehouses
  );

  const handleCopyBarcode = () => {
    if (product.barcode) {
      navigator.clipboard.writeText(product.barcode);
      setCopiedBarcode(true);
      setTimeout(() => setCopiedBarcode(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                {category?.nameAm || 'Անկատեգորիա'}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {product.sku}
              </span>
              {totalStock === 0 ? (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  Սպառված է
                </span>
              ) : totalStock <= product.minStock ? (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  Ցածր մնացորդ
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Առկա է
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {product.nameAm}
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-4">
              <span>Ստեղծվել է՝ {product.createdAt}</span>
              <span>Թարմացվել է՝ {product.updatedAt}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-6 shrink-0 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Հիմնական Տվյալներ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('warehouses')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'warehouses'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Պահեստներ</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {warehouses.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Շարժերի Պատմություն</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {productHistory.length}
            </span>
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Ինքնարժեք / Գնում
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {formatAMD(product.costPrice)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">1 {product.unit}-ի համար</div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50">
                  <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                    Մանրածախ Վաճառք
                  </div>
                  <div className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                    {formatAMD(product.sellingPrice)}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5 font-medium">
                    Մարժա՝ +{marginPercent}% ({formatAMD(marginAMD)})
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 col-span-2 sm:col-span-1">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Մեծածախ Գին
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {formatAMD(product.wholesalePrice)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Կորպորատիվ գնորդներին</div>
                </div>
              </div>

              {/* Barcode Display */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Barcode className="w-4 h-4 text-emerald-600" />
                    <span>Շտրիխ-կոդ (EAN-13 / Code-128)</span>
                  </span>
                  {product.barcode && (
                    <button
                      type="button"
                      onClick={handleCopyBarcode}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                    >
                      {copiedBarcode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedBarcode ? 'Պատճենված է' : 'Պատճենել'}</span>
                    </button>
                  )}
                </div>

                {product.barcode ? (
                  <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col items-center justify-center">
                    {/* Visual Barcode Pattern */}
                    <div className="flex items-center gap-0.5 h-10 px-4">
                      {Array.from({ length: 38 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-full ${
                            i % 2 === 0
                              ? i % 4 === 0 ? 'w-1 bg-black' : 'w-0.5 bg-black'
                              : 'w-0.5 bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-xs font-mono font-bold tracking-widest text-black mt-1">
                      {product.barcode}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic py-2 text-center">
                    Շտրիխ-կոդը կցված չէ: Կարող եք ավելացնել «Խմբագրել» բաժնից:
                  </div>
                )}
              </div>

              {/* Specs Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Ապրանքի Պարամետրեր
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Համակարգային ID.</span>
                    <span className="font-mono text-slate-900 dark:text-white">{product.id}</span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Չափման Միավոր.</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{product.unit}</span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Նվազագույն Շեմ.</span>
                    <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                      {product.minStock} {product.unit}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Հարկային Ռեժիմ (ԱԱՀ).</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {product.taxRate ? `${product.taxRate * 100}%` : '20%'}
                    </span>
                  </div>

                  {supplier && (
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 sm:col-span-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-500 dark:text-slate-400">Հիմնական Մատակարար.</span>
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {supplier.nameAm} (ՀՎՀՀ՝ {supplier.hvhh})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description & Notes */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  Նկարագրություն և Նշումներ
                </h4>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs text-slate-700 dark:text-slate-300 leading-relaxed min-h-[60px]">
                  {product.description || product.notes || 'Լրացուցիչ նկարագրություն նշված չէ:'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'warehouses' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Ընդհանուր Մնացորդ Բոլոր Պահեստներում</div>
                  <div className="text-2xl font-bold font-mono mt-1">
                    {totalStock} {product.unit}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Ընդհանուր Արժեք (Վաճառք)</div>
                  <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                    {formatAMD(totalRetailValuation)}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {warehouses.map((wh) => {
                  const qty = product.warehouseStock[wh.id] ?? 0;
                  const percentOfTotal = totalStock > 0 ? Math.round((qty / totalStock) * 100) : 0;
                  const isLow = qty <= product.minStock && qty > 0;
                  const isOut = qty === 0;

                  return (
                    <div
                      key={wh.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <WarehouseIcon className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold text-xs text-slate-900 dark:text-white">
                            {wh.nameAm}
                          </span>
                          {wh.isDefault && (
                            <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              ՀԻՄՆԱԿԱՆ
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {isOut ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                              Սպառված է
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              Ցածր ({qty} {product.unit})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              Բավարար
                            </span>
                          )}
                          <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                            {qty} {product.unit}
                          </span>
                        </div>
                      </div>

                      {/* Distribution Progress Bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percentOfTotal}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Հասցե՝ {wh.address}</span>
                        <span>Արժեքը՝ {formatAMD(qty * product.costPrice)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {productHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs">
                  Այս ապրանքի համար շարժերի պատմություն դեռ չկա:
                </div>
              ) : (
                <div className="space-y-2.5">
                  {productHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${entry.typeColor}`}>
                            {entry.typeLabel}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            {entry.warehouseName}
                          </span>
                        </div>
                        <span className={`text-xs font-bold font-mono ${
                          entry.quantityChange > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {entry.quantityChange > 0 ? `+${entry.quantityChange}` : entry.quantityChange} {product.unit}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                        <span>{entry.referenceDoc} {entry.reason ? `· ${entry.reason}` : ''}</span>
                        <span>Գրանցող՝ {entry.recordedBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onDelete(product)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Հեռացնել</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onAdjust(product)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Scale className="w-4 h-4" />
              <span>Ճշգրտել Մնացորդը</span>
            </button>
            <button
              type="button"
              onClick={() => onEdit(product)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <span>Խմբագրել</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
