import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Percent,
  Package,
  Calendar,
  Layers,
  Info,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { formatAMD } from '../../utils/formatters';

interface AnalyticsSummaryCardsProps {
  kpis: {
    dailySales: number;
    weeklySales: number;
    monthlySales: number;
    periodRevenue: number;
    periodTransactionsCount: number;
    averageTransactionValue: number;
    periodCogs: number;
    estimatedGrossProfit: number;
    profitMarginPercent: number;
    inventoryCostValue: number;
    inventoryRetailValue: number;
  };
  timeframeLabel: string;
}

export const AnalyticsSummaryCards: React.FC<AnalyticsSummaryCardsProps> = ({
  kpis,
  timeframeLabel,
}) => {
  return (
    <div className="space-y-4">
      {/* Top 3 Quick Cadence Cards: Daily, Weekly, Monthly */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Today's Sales */}
        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Այսօրվա Վաճառքներ
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
              Օրական
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {formatAMD(kpis.dailySales)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>Ընթացիկ օրվա փաստացի հասույթ</span>
          </div>
        </div>

        {/* Weekly Sales */}
        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Շաբաթական Վաճառքներ
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold">
              7 օր
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {formatAMD(kpis.weeklySales)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>Վերջին 7 օրերի համագումար</span>
          </div>
        </div>

        {/* Monthly Sales */}
        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Ամսական Վաճառքներ
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold">
              Այս Ամիս
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {formatAMD(kpis.monthlySales)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>Ամսվա սկզբից մինչ այսօր</span>
          </div>
        </div>
      </div>

      {/* Primary Analytics KPI Cards for the filtered timeframe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Period Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Հասույթ ({timeframeLabel})
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {formatAMD(kpis.periodRevenue)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-slate-400" />
            <span>{kpis.periodTransactionsCount} կատարված գործարք</span>
          </div>
        </div>

        {/* Estimated Gross Profit */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Համախառն Շահույթ (Gross Profit)
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-2">
            +{formatAMD(kpis.estimatedGrossProfit)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1.5 flex items-center justify-between">
            <span>Մարժա՝ {kpis.profitMarginPercent}%</span>
            <span className="text-[10px] text-slate-400 font-normal">Հասույթ - Ինքնարժեք</span>
          </div>
        </div>

        {/* Average Transaction Value */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Միջին Գործարքի Արժեք
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-2">
            {formatAMD(kpis.averageTransactionValue)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-between">
            <span>Միջին կտրոնի մեծություն</span>
            <span className="font-mono text-[10px] text-slate-400">
              {kpis.periodTransactionsCount > 0
                ? `${Math.round(kpis.periodRevenue / kpis.periodTransactionsCount)} ֏`
                : '0 ֏'}
            </span>
          </div>
        </div>

        {/* Inventory Value */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Պահեստի Ընդհանուր Արժեք
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-800 dark:text-slate-100 mt-2">
            {formatAMD(kpis.inventoryCostValue)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-between">
            <span>Ինքնարժեքով</span>
            <span className="text-slate-700 dark:text-slate-300 font-mono font-medium">
              Վաճառքի՝ {formatAMD(kpis.inventoryRetailValue)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
