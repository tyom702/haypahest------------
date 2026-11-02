import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, UnitType } from '../../types';
import {
  X,
  Plus,
  Wand2,
  Barcode,
  Building2,
  DollarSign,
  Boxes,
  Check,
  AlertCircle,
  FolderPlus
} from 'lucide-react';
import { productService } from '../../services/productService';
import { formatAMD } from '../../utils/formatters';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: Product | null;
  onOpenCategoryModal: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onOpenCategoryModal,
}) => {
  const {
    categories,
    suppliers,
    warehouses,
    selectedWarehouseId,
    addProduct,
    updateProduct,
    companySettings,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'main' | 'pricing' | 'stock' | 'description'>('main');

  const [formData, setFormData] = useState({
    nameAm: '',
    sku: '',
    barcode: '',
    categoryId: '',
    unit: 'հատ' as UnitType,
    costPrice: 0,
    sellingPrice: 0,
    wholesalePrice: 0,
    minStock: 5,
    supplierId: '',
    notes: '',
    description: '',
    taxRate: 0.20,
    warehouseStock: {} as Record<string, number>,
  });

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setFormData({
          nameAm: productToEdit.nameAm,
          sku: productToEdit.sku,
          barcode: productToEdit.barcode || '',
          categoryId: productToEdit.categoryId,
          unit: productToEdit.unit,
          costPrice: productToEdit.costPrice,
          sellingPrice: productToEdit.sellingPrice,
          wholesalePrice: productToEdit.wholesalePrice || 0,
          minStock: productToEdit.minStock,
          supplierId: productToEdit.supplierId || '',
          notes: productToEdit.notes || '',
          description: productToEdit.description || productToEdit.notes || '',
          taxRate: productToEdit.taxRate || 0.20,
          warehouseStock: { ...productToEdit.warehouseStock },
        });
      } else {
        const initialStockMap: Record<string, number> = {};
        warehouses.forEach((w) => {
          initialStockMap[w.id] = w.id === selectedWarehouseId ? 10 : 0;
        });

        setFormData({
          nameAm: '',
          sku: productService.generateSku('PR'),
          barcode: productService.generateBarcode(),
          categoryId: categories[0]?.id || '',
          unit: 'հատ',
          costPrice: 1000,
          sellingPrice: 1500,
          wholesalePrice: 1300,
          minStock: 5,
          supplierId: suppliers[0]?.id || '',
          notes: '',
          description: '',
          taxRate: 0.20,
          warehouseStock: initialStockMap,
        });
      }
      setActiveTab('main');
      setErrorMsg('');
    }
  }, [isOpen, productToEdit, categories, suppliers, warehouses, selectedWarehouseId]);

  if (!isOpen) return null;

  const unitOptions: UnitType[] = ['հատ', 'կգ', 'լիտր', 'մետր', 'տուփ', 'պարկ', 'հավաքածու'];

  const handleGenerateSku = () => {
    const cat = categories.find((c) => c.id === formData.categoryId);
    const prefix = cat ? cat.nameAm.substring(0, 2).toUpperCase() : 'PR';
    setFormData((prev) => ({ ...prev, sku: productService.generateSku(prefix) }));
  };

  const handleGenerateBarcode = () => {
    setFormData((prev) => ({ ...prev, barcode: productService.generateBarcode() }));
  };

  const marginAMD = Math.max(0, formData.sellingPrice - formData.costPrice);
  const marginPercent = formData.sellingPrice > 0 ? Math.round((marginAMD / formData.sellingPrice) * 100) : 0;

  const handleStockChange = (whId: string, val: string) => {
    const num = parseFloat(val) || 0;
    const finalVal = !companySettings.allowNegativeStock ? Math.max(0, num) : num;
    setFormData((prev) => ({
      ...prev,
      warehouseStock: {
        ...prev.warehouseStock,
        [whId]: finalVal,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nameAm.trim()) {
      setErrorMsg('Ապրանքի անվանումը պարտադիր է');
      setActiveTab('main');
      return;
    }

    if (!formData.sku.trim()) {
      setErrorMsg('Արտիկուլը (SKU) պարտադիր է');
      setActiveTab('main');
      return;
    }

    if (!formData.categoryId) {
      setErrorMsg('Խնդրում ենք ընտրել կամ ստեղծել կատեգորիա');
      setActiveTab('main');
      return;
    }

    if (formData.costPrice < 0 || formData.sellingPrice < 0) {
      setErrorMsg('Գները չեն կարող լինել բացասական');
      setActiveTab('pricing');
      return;
    }

    if (productToEdit) {
      updateProduct(productToEdit.id, {
        nameAm: formData.nameAm.trim(),
        sku: formData.sku.trim(),
        barcode: formData.barcode.trim(),
        categoryId: formData.categoryId,
        unit: formData.unit,
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
        wholesalePrice: Number(formData.wholesalePrice),
        minStock: Number(formData.minStock),
        supplierId: formData.supplierId || undefined,
        notes: formData.notes.trim(),
        description: formData.description.trim() || formData.notes.trim(),
        taxRate: Number(formData.taxRate),
        warehouseStock: formData.warehouseStock,
      });
    } else {
      addProduct({
        nameAm: formData.nameAm.trim(),
        sku: formData.sku.trim(),
        barcode: formData.barcode.trim(),
        categoryId: formData.categoryId,
        unit: formData.unit,
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
        wholesalePrice: Number(formData.wholesalePrice),
        minStock: Number(formData.minStock),
        supplierId: formData.supplierId || undefined,
        notes: formData.notes.trim(),
        description: formData.description.trim() || formData.notes.trim(),
        taxRate: Number(formData.taxRate),
        warehouseStock: formData.warehouseStock,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {productToEdit ? 'Խմբագրել Ապրանքը' : 'Ավելացնել Նոր Ապրանք'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {productToEdit ? `Ապրանք #${productToEdit.sku}` : 'Լրացրեք տվյալները կատալոգում գրանցելու համար'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-6 shrink-0 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('main')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'main'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Հիմնական
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'pricing'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Գնագոյացում (֏)</span>
            <span className="text-[10px] text-emerald-600 font-mono">+{marginPercent}%</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'stock'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Պահեստներ & Շեմ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('description')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'description'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Նկարագրություն
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'main' && (
            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ապրանքի Անվանում (Հայերեն) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nameAm}
                  onChange={(e) => {
                    setFormData({ ...formData, nameAm: e.target.value });
                    setErrorMsg('');
                  }}
                  placeholder="օր.՝ Լվացքի Փոշի «Persil Color» 3կգ Ավտոմատ"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                />
              </div>

              {/* SKU & Barcode in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Արտիկուլ / SKU *
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateSku}
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>Գեներացնել</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="HP-PR-101"
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Շտրիխ-կոդ (EAN-13, Ընտրովի)
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateBarcode}
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold"
                    >
                      <Barcode className="w-3 h-3" />
                      <span>ՀՀ Կոդ (485)</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="4850001234567"
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Կատեգորիա *
                    </label>
                    <button
                      type="button"
                      onClick={onOpenCategoryModal}
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold"
                    >
                      <FolderPlus className="w-3 h-3" />
                      <span>Կառավարել</span>
                    </button>
                  </div>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameAm}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Չափման Միավոր *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as UnitType })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                  >
                    {unitOptions.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Հիմնական Մատակարար (Ընտրովի)
                </label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                >
                  <option value="">-- Առանց մատակարարի --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameAm} (ՀՎՀՀ՝ {s.hvhh})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ինքնարժեք / Գնման Գին (֏) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    required
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Մատակարարից գնված գինը
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Մանրածախ Վաճառքի Գին (֏) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    POS դրամարկղում վաճառվող գինը
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Մեծածախ Վաճառքի Գին (֏)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={formData.wholesalePrice}
                    onChange={(e) => setFormData({ ...formData, wholesalePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Հարկային Դրույքաչափ
                  </label>
                  <select
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value={0.20}>ԱԱՀ (20%)</option>
                    <option value={0.05}>Շրջհարկ (5%)</option>
                    <option value={0.00}>Ազատված է (0%)</option>
                  </select>
                </div>
              </div>

              {/* Margin preview box */}
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-emerald-800 dark:text-emerald-300 font-semibold block">
                    Հաշվարկված Հավելագին (Մարժա)
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">
                    1 {formData.unit}-ի վաճառքից պոտենցիալ շահույթ
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-300">
                    +{formatAMD(marginAMD)}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Մարժա՝ ~{marginPercent}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stock' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Նվազագույն Մնացորդի Շեմ (Զգուշացման համար) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Երբ պահեստում մնացորդը հավասարվի կամ նվազի այս թվից, համակարգը կցուցադրի «Ցածր մնացորդ» ահազանգ
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Մնացորդներն ըստ Պահեստների ({formData.unit})
                </label>
                {warehouses.map((wh) => (
                  <div
                    key={wh.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-900 dark:text-white">
                        {wh.nameAm}
                      </div>
                      <div className="text-[10px] text-slate-400">{wh.address}</div>
                    </div>
                    <div className="w-28 shrink-0">
                      <input
                        type="number"
                        min={companySettings.allowNegativeStock ? undefined : 0}
                        step="any"
                        value={formData.warehouseStock[wh.id] ?? 0}
                        onChange={(e) => handleStockChange(wh.id, e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-mono font-bold text-right rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'description' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ապրանքի Մանրամասն Նկարագրություն
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value, notes: e.target.value })}
                  placeholder="Ապրանքի տեխնիկական բնութագիր, բաղադրություն, կիրառություն կամ այլ նշումներ..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Footer Actions inside Form */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Չեղարկել
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{productToEdit ? 'Պահպանել Փոփոխությունները' : 'Ավելացնել Ապրանքը'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
