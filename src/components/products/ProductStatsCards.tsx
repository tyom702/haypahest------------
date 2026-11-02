import React from 'react';
import {
  Boxes,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  XCircle,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { formatAMD } from '../../utils/formatters';
import { InventoryValuation } from '../../services/productService';

interface ProductStatsCardsProps {
  valuation: InventoryValuation;
  selectedFilter: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  onFilterChange: (filter: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock') => void;
  warehouseName?: string;
}

export const ProductStatsCards: React.FC<ProductStatsCardsProps> = ({
  valuation,
  selectedFilter,
  onFilterChange,
  warehouseName,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Ընդհանուր Տեսականի */}
      <div
        onClick={() => onFilterChange('all')}
        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
          selectedFilter === 'all'
            ? 'bg-slate-900 dark:bg-slate-800 text-white border-slate-700 shadow-md ring-2 ring-emerald-500/30'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold ${selectedFilter === 'all' ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
            Ընդհանուր Մնացորդ
          </span>
          <div className={`p-2 rounded-xl ${selectedFilter === 'all' ? 'bg-white/10 text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
            <Boxes className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono tabular-nums">
            {valuation.totalItems.toLocaleString()}
          </div>
          <div className={`text-xs mt-1 truncate ${selectedFilter === 'all' ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
            {warehouseName ? `${warehouseName}` : 'Բոլոր պահեստները'}
          </div>
        </div>
      </div>

      {/* 2. Պահեստի Ինքնարժեք */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Պահեստի Ինքնարժեք
          </span>
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {formatAMD(valuation.totalCostValue)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Գնման գումարային արժեք
          </div>
        </div>
      </div>

      {/* 3. Վաճառքի Արժեք */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Վաճառքի Արժեք
          </span>
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatAMD(valuation.totalRetailValue)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            <span>Մարժա՝ ~{valuation.profitMarginPercent}%</span>
            <span className="text-slate-400 dark:text-slate-500">({formatAMD(valuation.potentialProfit)})</span>
          </div>
        </div>
      </div>

      {/* 4. Ցածր Մնացորդ */}
      <div
        onClick={() => onFilterChange(selectedFilter === 'low_stock' ? 'all' : 'low_stock')}
        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
          selectedFilter === 'low_stock'
            ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-500/30'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold ${selectedFilter === 'low_stock' ? 'text-amber-100' : 'text-slate-500 dark:text-slate-400'}`}>
            Ցածր Մնացորդ
          </span>
          <div className={`p-2 rounded-xl ${selectedFilter === 'low_stock' ? 'bg-white/20 text-white' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'}`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-2xl font-bold font-mono tabular-nums ${selectedFilter === 'low_stock' ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`}>
            {valuation.lowStockCount}
          </div>
          <div className={`text-xs mt-1 ${selectedFilter === 'low_stock' ? 'text-amber-100' : 'text-slate-500 dark:text-slate-400'}`}>
            Համալրման ենթակա դիրքեր
          </div>
        </div>
      </div>

      {/* 5. Սպառված Ապրանքներ */}
      <div
        onClick={() => onFilterChange(selectedFilter === 'out_of_stock' ? 'all' : 'out_of_stock')}
        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
          selectedFilter === 'out_of_stock'
            ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-500/30'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-600 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold ${selectedFilter === 'out_of_stock' ? 'text-rose-100' : 'text-slate-500 dark:text-slate-400'}`}>
            Սպառված (0 Մնացորդ)
          </span>
          <div className={`p-2 rounded-xl ${selectedFilter === 'out_of_stock' ? 'bg-white/20 text-white' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'}`}>
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-2xl font-bold font-mono tabular-nums ${selectedFilter === 'out_of_stock' ? 'text-white' : 'text-rose-600 dark:text-rose-400'}`}>
            {valuation.outOfStockCount}
          </div>
          <div className={`text-xs mt-1 ${selectedFilter === 'out_of_stock' ? 'text-rose-100' : 'text-slate-500 dark:text-slate-400'}`}>
            Անհապաղ պատվիրել
          </div>
        </div>
      </div>
    </div>
  );
};
