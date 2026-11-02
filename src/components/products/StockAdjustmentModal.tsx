import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  X,
  Scale,
  Warehouse as WarehouseIcon,
  AlertTriangle,
  Check,
  TrendingDown,
  TrendingUp,
  Info
} from 'lucide-react';
import { formatAMD } from '../../utils/formatters';

interface StockAdjustmentModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { warehouses, selectedWarehouseId, companySettings, adjustProductStock } = useApp();

  const [warehouseId, setWarehouseId] = useState(selectedWarehouseId);
  const [mode, setMode] = useState<'set' | 'add' | 'subtract'>('set');
  const [inputValue, setInputValue] = useState<number>(0);
  const [reason, setReason] = useState('Գույքագրման ճշգրտում');
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (product) {
      setWarehouseId(selectedWarehouseId);
      const currentQty = product.warehouseStock[selectedWarehouseId] ?? 0;
      setInputValue(currentQty);
      setMode('set');
      setReason('Գույքագրման ճշգրտում');
      setCustomReason('');
      setNotes('');
      setErrorMsg('');
    }
  }, [product, selectedWarehouseId, isOpen]);

  if (!isOpen || !product) return null;

  const currentStock = product.warehouseStock[warehouseId] ?? 0;

  // Calculate resulting stock based on mode
  let finalStock = currentStock;
  if (mode === 'set') {
    finalStock = Number(inputValue) || 0;
  } else if (mode === 'add') {
    finalStock = currentStock + (Number(inputValue) || 0);
  } else if (mode === 'subtract') {
    finalStock = currentStock - (Number(inputValue) || 0);
  }

  const diff = finalStock - currentStock;
  const valuationImpact = diff * (product.costPrice || 0);
  const isNegative = finalStock < 0;
  const isNegativeBlocked = isNegative && !companySettings.allowNegativeStock;

  const standardReasons = [
    'Գույքագրման ճշգրտում',
    'Վնասված / Խոտանված ապրանք',
    'Հաճախորդի վերադարձ',
    'Ավելցուկի հայտնաբերում',
    'Ժամկետանց ապրանքի դուրսգրում',
    'Այլ պատճառ',
  ];

  const handleWarehouseChange = (wId: string) => {
    setWarehouseId(wId);
    const curr = product.warehouseStock[wId] ?? 0;
    if (mode === 'set') {
      setInputValue(curr);
    }
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNegativeBlocked) {
      setErrorMsg('Բացասական մնացորդներն արգելված են ընկերության կարգավորումներով:');
      return;
    }

    if (diff === 0) {
      setErrorMsg('Մնացորդի փոփոխություն չկա:');
      return;
    }

    const effectiveReason = reason === 'Այլ պատճառ' && customReason.trim() ? customReason.trim() : reason;
    const result = adjustProductStock(product.id, warehouseId, finalStock, effectiveReason, notes.trim());

    if (result.success) {
      onClose();
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Պահեստի Մնացորդի Ճշգրտում
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                «{product.nameAm}» ({product.sku})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Warehouse Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ընտրել Պահեստը
            </label>
            <div className="relative">
              <WarehouseIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={warehouseId}
                onChange={(e) => handleWarehouseChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nameAm} (Առկա՝ {product.warehouseStock[w.id] ?? 0} {product.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Current Stock Banner */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Ընթացիկ մնացորդ այս պահեստում.</span>
            <span className="font-bold font-mono text-slate-900 dark:text-white text-sm">
              {currentStock} {product.unit}
            </span>
          </div>

          {/* Mode Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ճշգրտման Եղանակ
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setMode('set');
                  setInputValue(currentStock);
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  mode === 'set'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Ճշգրիտ Քանակ
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('add');
                  setInputValue(1);
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  mode === 'add'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Ավելացնել (+)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('subtract');
                  setInputValue(1);
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  mode === 'subtract'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Նվազեցնել (-)
              </button>
            </div>
          </div>

          {/* Value Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {mode === 'set' ? 'Նոր Սահմանվող Քանակ' : mode === 'add' ? 'Ավելացվող Քանակ' : 'Նվազեցվող Քանակ'} ({product.unit}) *
            </label>
            <input
              type="number"
              min={mode === 'set' ? 0 : 1}
              step="any"
              required
              value={inputValue}
              onChange={(e) => {
                setInputValue(parseFloat(e.target.value) || 0);
                setErrorMsg('');
              }}
              className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
            />
          </div>

          {/* Impact preview */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/40 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Վերջնական մնացորդ.</span>
              <span className={`font-bold font-mono text-sm ${isNegative ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                {finalStock} {product.unit}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Փոփոխություն (տարբերություն).</span>
              <span className={`font-mono font-semibold flex items-center gap-1 ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                {diff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : diff < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                {diff > 0 ? `+${diff}` : diff} {product.unit}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400">Ազդեցությունը պահեստի ինքնարժեքի վրա.</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {formatAMD(valuationImpact)}
              </span>
            </div>
          </div>

          {/* Negative stock alert */}
          {isNegativeBlocked && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Բացասական մնացորդը կանխված է.</strong> Ընկերության կարգավորումներով արգելված է ունենալ 0-ից պակաս մնացորդ:
              </div>
            </div>
          )}

          {/* Reason Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ճշգրտման Պատճառ *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
            >
              {standardReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {reason === 'Այլ պատճառ' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Նշեք Ձեր Պատճառը *
              </label>
              <input
                type="text"
                required
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="օր.՝ Գույքագրման վերահաշվարկ"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Լրացուցիչ Մեկնաբանություն (Ընտրովի)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Նշումներ, ակտի համար կամ հիմնավորում..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Չեղարկել
            </button>
            <button
              type="submit"
              disabled={isNegativeBlocked || diff === 0}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition-colors ${
                isNegativeBlocked || diff === 0
                  ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Հաստատել Ճշգրտումը</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
