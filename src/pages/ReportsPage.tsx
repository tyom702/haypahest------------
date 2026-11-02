import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Eye,
  Calendar,
  Filter,
  Download,
  Building2,
  PieChart as PieIcon,
  Percent,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  ArrowUpDown,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  AlertTriangle,
  Users,
  Package,
  Layers,
  ArrowUpRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import {
  analyticsService,
  AnalyticsTimeframe,
  AnalyticsFilterParams,
  ProductPerformanceItem,
  EmployeePerformanceItem,
} from '../services/analyticsService';
import { AnalyticsSummaryCards } from '../components/reports/AnalyticsSummaryCards';
import { AnalyticsChartsGrid } from '../components/reports/AnalyticsChartsGrid';
import {
  PrintableReportModal,
  ReportType,
} from '../components/reports/PrintableReportModal';
import { ReceiptModal } from '../components/common/ReceiptModal';
import { SaleTransaction } from '../types';
import { formatAMD, formatDate, formatDateTime } from '../utils/formatters';

type ActiveTab = 'overview' | 'sales' | 'inventory' | 'products' | 'employees' | 'profit';

export const ReportsPage: React.FC = () => {
  const {
    transactions,
    products,
    warehouses,
    categories,
    employees,
    companySettings,
  } = useApp();

  // Tab & Filters state
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('month');
  const [warehouseId, setWarehouseId] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 14)).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Sub-filters inside tables
  const [searchQuery, setSearchQuery] = useState('');
  const [productFilterType, setProductFilterType] = useState<'all' | 'best' | 'low'>('all');

  // Modals state
  const [selectedReceipt, setSelectedReceipt] = useState<SaleTransaction | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printReportType, setPrintReportType] = useState<ReportType>('sales');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Timeframe labels
  const timeframeLabels: Record<AnalyticsTimeframe, string> = {
    today: 'Այսօր',
    yesterday: 'Երեկ',
    '7days': 'Վերջին 7 օր',
    '30days': 'Վերջին 30 օր',
    month: 'Ընթացիկ Ամիս',
    custom: 'Կամայական',
  };

  const timeframeLabel = useMemo(() => {
    if (timeframe === 'custom') {
      return `${formatDate(customStartDate)} — ${formatDate(customEndDate)}`;
    }
    return timeframeLabels[timeframe];
  }, [timeframe, customStartDate, customEndDate]);

  // Filter transactions
  const filterParams: AnalyticsFilterParams = useMemo(
    () => ({
      timeframe,
      startDate: customStartDate,
      endDate: customEndDate,
      warehouseId,
    }),
    [timeframe, customStartDate, customEndDate, warehouseId]
  );

  const filteredTransactions = useMemo(() => {
    return analyticsService.filterTransactions(transactions, filterParams);
  }, [transactions, filterParams]);

  // KPIs
  const kpis = useMemo(() => {
    return analyticsService.calculateKpis(
      transactions,
      filteredTransactions,
      products,
      warehouseId
    );
  }, [transactions, filteredTransactions, products, warehouseId]);

  // Chart datasets
  const dailyTrends = useMemo(() => {
    return analyticsService.generateDailyTrends(filteredTransactions);
  }, [filteredTransactions]);

  const categoryShare = useMemo(() => {
    return analyticsService.generateCategoryShare(
      filteredTransactions,
      products,
      categories
    );
  }, [filteredTransactions, products, categories]);

  const monthlyComparison = useMemo(() => {
    return analyticsService.generateMonthlyComparison(transactions, 6);
  }, [transactions]);

  // Product performance datasets
  const { bestSelling, lowPerforming, all: allProductPerformance } = useMemo(() => {
    return analyticsService.calculateProductPerformance(
      filteredTransactions,
      products,
      categories,
      warehouseId
    );
  }, [filteredTransactions, products, categories, warehouseId]);

  // Employee performance dataset
  const employeePerformance = useMemo(() => {
    return analyticsService.calculateEmployeePerformance(
      filteredTransactions,
      employees
    );
  }, [filteredTransactions, employees]);

  // Current report title for export & print
  const getReportTitle = (tab: ActiveTab): string => {
    switch (tab) {
      case 'sales':
        return 'Վաճառքների Պաշտոնական Հաշվետվություն';
      case 'inventory':
        return 'Պահեստային Մնացորդների և Գնահատման Հաշվետվություն';
      case 'products':
        return 'Ապրանքների Արդյունավետության և Իրացվելիության Հաշվետվություն';
      case 'employees':
        return 'Աշխատակիցների Վաճառքների և Մասնաբաժնի Հաշվետվություն';
      case 'profit':
        return 'Համախառն Շահույթի և Ինքնարժեքի (COGS) Գնահատման Հաշվետվություն';
      default:
        return 'Համախառն Ֆինանսական և Գործառնական Վերլուծություն';
    }
  };

  // Export to Excel handler
  const handleExportExcel = () => {
    setShowExportMenu(false);
    const dateStamp = new Date().toISOString().split('T')[0];

    if (activeTab === 'sales' || activeTab === 'overview') {
      const data = filteredTransactions.map((t) => ({
        'Կտրոնի N': t.receiptNumber,
        'Ֆիսկալ N': t.fiscalReceiptNumber,
        'Ամսաթիվ': formatDateTime(t.date),
        'Գանձապահ': t.cashierName,
        'Հաճախորդ': t.customerName || 'Մանրածախ',
        'Վճարման Եղանակ': t.paymentMethod,
        'Ենթագումար (֏)': t.subtotal,
        'Զեղչ (֏)': t.discountTotal,
        'ԱԱՀ (֏)': t.taxTotal,
        'Ընդհանուր Գումար (֏)': t.total,
      }));
      analyticsService.exportToExcel(data, 'Վաճառքներ', `HayPahest_Sales_${dateStamp}`);
    } else if (activeTab === 'inventory') {
      const data = products.map((p) => {
        const stock =
          warehouseId === 'all'
            ? Object.values(p.warehouseStock).reduce((a, b) => a + b, 0)
            : p.warehouseStock[warehouseId] || 0;
        return {
          'Արտիկուլ': p.sku,
          'Ապրանքի Անվանում': p.nameAm,
          'Շտրիխ-կոդ': p.barcode || '—',
          'Մնացորդ': stock,
          'Միավոր': p.unit,
          'Գնման Գին (֏)': p.costPrice,
          'Վաճառքի Գին (֏)': p.sellingPrice,
          'Ընդհանուր Ինքնարժեք (֏)': stock * p.costPrice,
          'Ընդհանուր Իրացում (֏)': stock * p.sellingPrice,
        };
      });
      analyticsService.exportToExcel(data, 'Պահեստ', `HayPahest_Inventory_${dateStamp}`);
    } else if (activeTab === 'products') {
      const data = allProductPerformance.map((p) => ({
        'Արտիկուլ': p.sku,
        'Ապրանքի Անվանում': p.nameAm,
        'Կատեգորիա': p.categoryName,
        'Վաճառված Քանակ': p.unitsSold,
        'Գեներացված Հասույթ (֏)': p.revenue,
        'Ինքնարժեք/COGS (֏)': p.cogs,
        'Համախառն Շահույթ (֏)': p.grossProfit,
        'Մարժա (%)': `${p.profitMarginPercent}%`,
        'Ընթացիկ Մնացորդ': p.currentStock,
        'Կարգավիճակ':
          p.turnoverRank === 'best'
            ? 'Լավագույն'
            : p.turnoverRank === 'low'
            ? 'Դանդաղաշարժ'
            : 'Միջին',
      }));
      analyticsService.exportToExcel(data, 'Ապրանքներ', `HayPahest_Products_${dateStamp}`);
    } else if (activeTab === 'employees') {
      const data = employeePerformance.map((e) => ({
        'Աշխատակից': e.employeeName,
        'Պաշտոն': e.role,
        'Գործարքների Քանակ': e.transactionsCount,
        'Ընդհանուր Հասույթ (֏)': e.totalRevenue,
        'Միջին Կտրոն (֏)': e.averageTicket,
        'Մասնաբաժին (%)': `${e.shareOfSalesPercent}%`,
      }));
      analyticsService.exportToExcel(data, 'Աշխատակիցներ', `HayPahest_Staff_${dateStamp}`);
    } else if (activeTab === 'profit') {
      const data = categoryShare.map((c) => ({
        'Կատեգորիա': c.categoryName,
        'Վաճառված Միավորներ': c.unitsSold,
        'Հասույթ (֏)': c.revenue,
        'Մասնաբաժին (%)': `${c.percentage}%`,
      }));
      analyticsService.exportToExcel(data, 'Շահույթ', `HayPahest_Profit_${dateStamp}`);
    }
  };

  // Export to CSV handler
  const handleExportCSV = () => {
    setShowExportMenu(false);
    const dateStamp = new Date().toISOString().split('T')[0];

    if (activeTab === 'sales' || activeTab === 'overview') {
      const headers = ['Կտրոն', 'Ամսաթիվ', 'Գանձապահ', 'Եղանակ', 'Գումար_AMD'];
      const rows = filteredTransactions.map((t) => [
        `"${t.receiptNumber}"`,
        `"${formatDate(t.date)}"`,
        `"${t.cashierName}"`,
        `"${t.paymentMethod}"`,
        t.total,
      ]);
      analyticsService.exportToCSV(headers, rows, `HayPahest_Sales_${dateStamp}`);
    } else if (activeTab === 'inventory') {
      const headers = ['Արտիկուլ', 'Անվանում', 'Մնացորդ', 'Ինքնարժեք_AMD', 'Վաճառքի_Գին_AMD'];
      const rows = products.map((p) => {
        const stock =
          warehouseId === 'all'
            ? Object.values(p.warehouseStock).reduce((a, b) => a + b, 0)
            : p.warehouseStock[warehouseId] || 0;
        return [`"${p.sku}"`, `"${p.nameAm}"`, stock, p.costPrice, p.sellingPrice];
      });
      analyticsService.exportToCSV(headers, rows, `HayPahest_Inventory_${dateStamp}`);
    } else if (activeTab === 'products') {
      const headers = ['Արտիկուլ', 'Անվանում', 'Վաճառված', 'Հասույթ_AMD', 'Շահույթ_AMD', 'Մարժա_Տոկոս'];
      const rows = allProductPerformance.map((p) => [
        `"${p.sku}"`,
        `"${p.nameAm}"`,
        p.unitsSold,
        p.revenue,
        p.grossProfit,
        `"${p.profitMarginPercent}%"`,
      ]);
      analyticsService.exportToCSV(headers, rows, `HayPahest_Products_${dateStamp}`);
    } else if (activeTab === 'employees') {
      const headers = ['Աշխատակից', 'Պաշտոն', 'Գործարքներ', 'Հասույթ_AMD', 'Միջին_Չեկ_AMD'];
      const rows = employeePerformance.map((e) => [
        `"${e.employeeName}"`,
        `"${e.role}"`,
        e.transactionsCount,
        e.totalRevenue,
        e.averageTicket,
      ]);
      analyticsService.exportToCSV(headers, rows, `HayPahest_Staff_${dateStamp}`);
    } else if (activeTab === 'profit') {
      const headers = ['Կատեգորիա', 'Հասույթ_AMD', 'Վաճառված_Քանակ', 'Մասնաբաժին'];
      const rows = categoryShare.map((c) => [
        `"${c.categoryName}"`,
        c.revenue,
        c.unitsSold,
        `"${c.percentage}%"`,
      ]);
      analyticsService.exportToCSV(headers, rows, `HayPahest_Profit_${dateStamp}`);
    }
  };

  // Open Printable PDF Modal
  const handleOpenPrintModal = () => {
    setShowExportMenu(false);
    const mappedType: ReportType =
      activeTab === 'overview' ? 'sales' : (activeTab as ReportType);
    setPrintReportType(mappedType);
    setShowPrintModal(true);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Բիզնես Վերլուծություն և Հաշվետվություններ
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              ՓՄՁ
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Շրջանառության, համախառն շահույթի (COGS), պահեստի գնահատման և աշխատակիցների ավտոմատացված հաշվետվողականություն
          </p>
        </div>

        {/* Global Export Button with Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Արտահանել / Տպել</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 p-1.5 space-y-1">
                  <button
                    onClick={handleExportExcel}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="font-semibold">Excel ֆայլ (.xlsx)</div>
                      <div className="text-[10px] text-slate-400">SheetJS ֆորմատով աղյուսակ</div>
                    </div>
                  </button>

                  <button
                    onClick={handleOpenPrintModal}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
                  >
                    <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <div>
                      <div className="font-semibold">PDF / Տպելու Ձևաչափ</div>
                      <div className="text-[10px] text-slate-400">Պաշտոնական հաշվետվություն</div>
                    </div>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
                  >
                    <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <div className="font-semibold">CSV ֆայլ (UTF-8 BOM)</div>
                      <div className="text-[10px] text-slate-400">Հայերեն ճշգրիտ կոդավորմամբ</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Primary Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Timeframe Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl">
          {(
            [
              { id: 'today', label: 'Այսօր' },
              { id: 'yesterday', label: 'Երեկ' },
              { id: '7days', label: 'Վերջին 7 օր' },
              { id: '30days', label: 'Վերջին 30 օր' },
              { id: 'month', label: 'Ընթացիկ Ամիս' },
              { id: 'custom', label: 'Կամայական' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setTimeframe(item.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                timeframe === item.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers (if 'custom' selected) */}
        {timeframe === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px]">Սկիզբ՝</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono text-xs focus:outline-emerald-500"
            />
            <span className="text-slate-400 text-[11px]">Ավարտ՝</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono text-xs focus:outline-emerald-500"
            />
          </div>
        )}

        {/* Warehouse Selector */}
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-emerald-500"
          >
            <option value="all">Բոլոր Պահեստները (Համախառն)</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.nameAm}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Tabs for the 6 Reports / Views */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex space-x-2 overflow-x-auto pb-px">
          {[
            { id: 'overview', label: 'Ընդհանուր Վերլուծություն', icon: TrendingUp },
            { id: 'sales', label: 'Վաճառքների Հաշվետվություն', icon: Receipt },
            { id: 'inventory', label: 'Պահեստի Գնահատում', icon: Package },
            { id: 'products', label: 'Ապրանքների Արդյունավետություն', icon: Layers },
            { id: 'employees', label: 'Աշխատակիցների Վաճառքներ', icon: Users },
            { id: 'profit', label: 'Շահույթի Գնահատում (COGS)', icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <AnalyticsSummaryCards kpis={kpis} timeframeLabel={timeframeLabel} />

          {/* Recharts Analytics Grid */}
          <AnalyticsChartsGrid
            dailyTrends={dailyTrends}
            categoryShare={categoryShare}
            monthlyComparison={monthlyComparison}
          />

          {/* Dual Panels: Top Best-Selling Products & Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 Best-Selling Products */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-xs uppercase tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Ամենաշատ Վաճառված Ապրանքներ (Top 5)
                </h3>
                <button
                  onClick={() => setActiveTab('products')}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  Դիտել բոլորը
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
                {bestSelling.slice(0, 5).map((item, idx) => (
                  <div key={item.productId} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{item.nameAm}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.sku} • {item.unitsSold} հատ
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-mono text-slate-900 dark:text-white">
                        {formatAMD(item.revenue)}
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                        +{formatAMD(item.grossProfit)} ({item.profitMarginPercent}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent 5 Transactions */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-xs uppercase tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Վերջին Գործարքներ
                </h3>
                <button
                  onClick={() => setActiveTab('sales')}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  Ամբողջ գրանցամատյանը
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
                {filteredTransactions.slice(0, 5).map((trx) => (
                  <div key={trx.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{trx.receiptNumber}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-sans font-normal">
                          {trx.paymentMethod}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {formatDateTime(trx.date)} • {trx.cashierName}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatAMD(trx.total)}
                      </div>
                      <button
                        onClick={() => setSelectedReceipt(trx)}
                        className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors"
                        title="Դիտել կտրոնը"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALES REPORT (Վաճառքների Հաշվետվություն) */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Sales Summary Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-slate-500 text-xs">Ընդհանուր Հասույթ</div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                {formatAMD(kpis.periodRevenue)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-slate-500 text-xs">Կատարված Գործարքներ</div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                {kpis.periodTransactionsCount} կտրոն
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-slate-500 text-xs">Միջին Կտրոնի Արժեք</div>
              <div className="text-xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-1">
                {formatAMD(kpis.averageTransactionValue)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-slate-500 text-xs">Համախառն Շահույթ (Gross Profit)</div>
              <div className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                +{formatAMD(kpis.estimatedGrossProfit)}
              </div>
            </div>
          </div>

          {/* Sales Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wide">
                Գործարքների Ռեգիստր ({filteredTransactions.length})
              </h3>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Փնտրել կտրոն, գանձապահ, գնորդ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-emerald-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase">
                    <th className="py-2.5 px-4">Կտրոն / Ամսաթիվ</th>
                    <th className="py-2.5 px-3">Ֆիսկալ Համար</th>
                    <th className="py-2.5 px-3">Գանձապահ / Պահեստ</th>
                    <th className="py-2.5 px-3">Գնորդ</th>
                    <th className="py-2.5 px-3">Վճարման Եղանակ</th>
                    <th className="py-2.5 px-3 text-right">Ապրանքներ</th>
                    <th className="py-2.5 px-3 text-right">Գումար</th>
                    <th className="py-2.5 px-4 text-right">Գործողություն</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredTransactions
                    .filter((t) => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        t.receiptNumber.toLowerCase().includes(q) ||
                        t.cashierName.toLowerCase().includes(q) ||
                        (t.customerName && t.customerName.toLowerCase().includes(q))
                      );
                    })
                    .map((trx) => {
                      const wh = warehouses.find((w) => w.id === trx.warehouseId);
                      return (
                        <tr key={trx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-slate-900 dark:text-white">
                              {trx.receiptNumber}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {formatDateTime(trx.date)}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">
                            {trx.fiscalReceiptNumber}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {trx.cashierName}
                            </div>
                            <div className="text-[11px] text-slate-400">{wh?.nameAm}</div>
                          </td>
                          <td className="py-3 px-3">
                            {trx.customerName ? (
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {trx.customerName}
                              </span>
                            ) : (
                              <span className="text-slate-400">Մանրածախ</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {trx.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums">
                            {trx.items.reduce((s, it) => s + it.quantity, 0)} հատ
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                            {formatAMD(trx.total)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedReceipt(trx)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"
                              title="Բացել կտրոնը"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INVENTORY REPORT (Պահեստի Գնահատում) */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Inventory Valuation Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Պահեստի Ընդհանուր Ինքնարժեքային Գումար
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
                {formatAMD(kpis.inventoryCostValue)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Կապիտալիզացված ապրանքային մնացորդներ
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Պահեստի Մանրածախ (Վաճառքի) Արժեք
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-2">
                {formatAMD(kpis.inventoryRetailValue)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Ակնկալվող համախառն հասույթ
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Պոտենցիալ Համախառն Մարժա Պահեստում
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-2">
                +{formatAMD(Math.max(0, kpis.inventoryRetailValue - kpis.inventoryCostValue))}
              </div>
              <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                Միջին հավելագին՝{' '}
                {kpis.inventoryCostValue > 0
                  ? Math.round(
                      ((kpis.inventoryRetailValue - kpis.inventoryCostValue) /
                        kpis.inventoryCostValue) *
                        100
                    )
                  : 0}
                %
              </div>
            </div>
          </div>

          {/* Product Inventory Stock Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wide">
                Ապրանքների Մնացորդների և Արժեքի Մանրամասն Աղյուսակ ({products.length} ապրանք)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase">
                    <th className="py-2.5 px-4">Ապրանք / Արտիկուլ</th>
                    <th className="py-2.5 px-3">Շտրիխ-կոդ</th>
                    <th className="py-2.5 px-3 text-right">Մնացորդ</th>
                    <th className="py-2.5 px-3 text-right">Ինքնարժեք</th>
                    <th className="py-2.5 px-3 text-right">Վաճառքի Գին</th>
                    <th className="py-2.5 px-3 text-right">Ընդհանուր Ինքնարժեք</th>
                    <th className="py-2.5 px-4 text-right">Ընդհանուր Վաճառքի Արժեք</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {products.map((p) => {
                    const stock =
                      warehouseId === 'all'
                        ? Object.values(p.warehouseStock).reduce((a, b) => a + b, 0)
                        : p.warehouseStock[warehouseId] || 0;
                    const totalCostVal = stock * p.costPrice;
                    const totalRetailVal = stock * p.sellingPrice;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{p.nameAm}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">{p.barcode || '—'}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                          <span
                            className={
                              stock <= p.minStock
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-900 dark:text-white'
                            }
                          >
                            {stock} {p.unit}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          {formatAMD(p.costPrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          {formatAMD(p.sellingPrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                          {formatAMD(totalCostVal)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatAMD(totalRetailVal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PRODUCT PERFORMANCE REPORT (Ապրանքների Արդյունավետություն) */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Subfilter for Best vs Low */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setProductFilterType('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  productFilterType === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Բոլոր Ապրանքները ({allProductPerformance.length})
              </button>
              <button
                onClick={() => setProductFilterType('best')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  productFilterType === 'best'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Ամենաշատ Վաճառվող ({bestSelling.length})</span>
              </button>
              <button
                onClick={() => setProductFilterType('low')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  productFilterType === 'low'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Ցածր Իրացվելիությամբ ({lowPerforming.length})</span>
              </button>
            </div>
          </div>

          {/* Product Performance Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase">
                    <th className="py-2.5 px-4">Ապրանք</th>
                    <th className="py-2.5 px-3">Կատեգորիա</th>
                    <th className="py-2.5 px-3 text-right">Վաճառված Քանակ</th>
                    <th className="py-2.5 px-3 text-right">Գեներացված Հասույթ</th>
                    <th className="py-2.5 px-3 text-right">Ինքնարժեք (COGS)</th>
                    <th className="py-2.5 px-3 text-right">Համախառն Շահույթ</th>
                    <th className="py-2.5 px-3 text-right">Մարժա %</th>
                    <th className="py-2.5 px-4 text-center">Կարգավիճակ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {(productFilterType === 'best'
                    ? bestSelling
                    : productFilterType === 'low'
                    ? lowPerforming
                    : allProductPerformance
                  ).map((item) => (
                    <tr key={item.productId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{item.nameAm}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.sku}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {item.categoryName}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                        {item.unitsSold} հատ
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                        {formatAMD(item.revenue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        {formatAMD(item.cogs)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        +{formatAMD(item.grossProfit)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {item.profitMarginPercent}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.turnoverRank === 'best' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                            <Award className="w-3 h-3" />
                            Լավագույն
                          </span>
                        ) : item.turnoverRank === 'low' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                            <AlertTriangle className="w-3 h-3" />
                            Դանդաղաշարժ
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            Միջին
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: EMPLOYEE SALES REPORT (Աշխատակիցների Վաճառքներ) */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {employeePerformance.map((emp, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {emp.employeeName}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">{emp.role}</span>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-xs">
                    {emp.shareOfSalesPercent}% մասնաբաժին
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-slate-400 text-[11px]">Հասույթ</div>
                    <div className="font-bold font-mono text-slate-900 dark:text-white text-sm">
                      {formatAMD(emp.totalRevenue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]">Գործարքներ</div>
                    <div className="font-bold font-mono text-slate-900 dark:text-white text-sm">
                      {emp.transactionsCount} կտրոն
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-slate-400 text-[11px]">Միջին կտրոնի մեծություն</div>
                    <div className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                      {formatAMD(emp.averageTicket)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wide">
                Աշխատակիցների Վաճառքների Համեմատական Աղյուսակ
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase">
                    <th className="py-2.5 px-4">Աշխատակից</th>
                    <th className="py-2.5 px-3">Պաշտոն</th>
                    <th className="py-2.5 px-3 text-right">Գործարքների Քանակ</th>
                    <th className="py-2.5 px-3 text-right">Գեներացված Հասույթ</th>
                    <th className="py-2.5 px-3 text-right">Միջին Կտրոն</th>
                    <th className="py-2.5 px-4 text-right">Մասնաբաժին Վաճառքներում</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {employeePerformance.map((emp, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {emp.employeeName}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{emp.role}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                        {emp.transactionsCount}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                        {formatAMD(emp.totalRevenue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                        {formatAMD(emp.averageTicket)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {emp.shareOfSalesPercent}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PROFIT ESTIMATION REPORT (Շահույթի Գնահատում) */}
      {activeTab === 'profit' && (
        <div className="space-y-6">
          {/* Profit & Margin Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Շրջանառություն (Հասույթ)
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
                {formatAMD(kpis.periodRevenue)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Կատարված բոլոր վաճառքների հանրագումար
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Իրացված Ապրանքի Ինքնարժեք (COGS)
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-700 dark:text-slate-300 mt-2">
                {formatAMD(kpis.periodCogs)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Փաստացի ապրանքային գնման ծախսեր
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Համախառն Շահույթ (Gross Profit)
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-2">
                +{formatAMD(kpis.estimatedGrossProfit)}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                Համախառն մարժա՝ {kpis.profitMarginPercent}%
              </div>
            </div>
          </div>

          {/* Strict Accounting Methodological Notice / Limitations */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed space-y-1">
              <div className="font-bold">
                Հաշվապահական Մեթոդաբանություն և Սահմանափակումների Ծանուցում․
              </div>
              <p>
                Համախառն շահույթը (Gross Profit) հաշվարկվում է որպես{' '}
                <span className="font-mono font-semibold">Հասույթ - Իրացված Ապրանքի Ինքնարժեք (COGS)</span>
                ՝ հիմնվելով ապրանքների քարտերում մուտքագրված գնման գների վրա։
              </p>
              <p className="text-[11px] opacity-90">
                ⚠️ Ուշադրություն. Տվյալ ցուցանիշը չի հանդիսանում զուտ շահույթ (Net Profit), քանի որ այն
                չի նվազեցնում ընկերության ընդհանուր գործառնական ծախսերը (աշխատավարձեր, պահեստի վարձակալություն,
                լոգիստիկա, էլեկտրաէներգիա և շահութահարկ)։
              </p>
            </div>
          </div>

          {/* Category Profit Share Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wide">
                Կատեգորիաների Ներդրումը Ընդհանուր Հասույթում
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase">
                    <th className="py-2.5 px-4">Ապրանքային Խումբ (Կատեգորիա)</th>
                    <th className="py-2.5 px-3 text-right">Վաճառված Քանակ</th>
                    <th className="py-2.5 px-3 text-right">Գեներացված Հասույթ</th>
                    <th className="py-2.5 px-4 text-right">Մասնաբաժին Հասույթում</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {categoryShare.map((cat) => (
                    <tr key={cat.categoryId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {cat.categoryName}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {cat.unitsSold} հատ
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                        {formatAMD(cat.revenue)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {cat.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Printable Report Modal (For PDF and Official Printouts) */}
      {showPrintModal && (
        <PrintableReportModal
          reportType={printReportType}
          reportTitle={getReportTitle(printReportType)}
          timeframeLabel={timeframeLabel}
          data={{
            summary: kpis,
            transactions: filteredTransactions,
            products,
            productsPerformance: allProductPerformance,
            employeesPerformance: employeePerformance,
            categoryShare,
          }}
          onClose={() => setShowPrintModal(false)}
          onExportExcel={handleExportExcel}
          onExportCSV={handleExportCSV}
        />
      )}

      {/* Receipt View Modal */}
      <ReceiptModal
        transaction={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
};
