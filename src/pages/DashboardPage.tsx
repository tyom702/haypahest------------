import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Boxes,
  ShoppingCart,
  AlertTriangle,
  ArrowRight,
  Eye,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Receipt,
  Wallet,
  ArrowUpRight,
  Info
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { ReceiptModal } from '../components/common/ReceiptModal';
import { SaleTransaction } from '../types';
import { formatAMD, formatDate, formatDateTime } from '../utils/formatters';

export const DashboardPage: React.FC = () => {
  const {
    products,
    transactions,
    customers,
    selectedWarehouseId,
    warehouses,
    categories,
    companySettings,
    currentUser,
  } = useApp();
  const { user, workspace } = useAuth();

  const [selectedReceipt, setSelectedReceipt] = useState<SaleTransaction | null>(null);
  const [chartTimeframe, setChartTimeframe] = useState<'7d' | '30d' | 'year'>('7d');

  const currentWarehouse = warehouses.find((w) => w.id === selectedWarehouseId) || warehouses[0];
  const displayName = user?.fullNameAm || currentUser?.fullNameAm || 'Ադմինիստրատոր';
  const companyTitle = workspace?.nameAm || companySettings?.companyName || 'ՀայՊահեստ Բիզնես';
  const companyHvhh = workspace?.hvhh || companySettings?.hvhh || '00000000';

  // 1. Այսօրվա վաճառքներ (Today's sales)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter((t) => t.date.startsWith(todayStr));
  const todayRevenue = todayTransactions.reduce((acc, t) => acc + t.total, 0);

  // 2. Ամսական վաճառքներ (Monthly sales)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthRevenue = monthTransactions.reduce((acc, t) => acc + t.total, 0);

  // 3. Ընդհանուր ապրանքներ (Total products count & warehouse units)
  const totalProductsCount = products.length;
  let totalWarehouseUnits = 0;
  products.forEach((p) => {
    totalWarehouseUnits += p.warehouseStock[selectedWarehouseId] || 0;
  });

  // 4. Ցածր մնացորդով ապրանքներ (Low-stock items)
  const lowStockProducts = products.filter((p) => {
    const qty = p.warehouseStock[selectedWarehouseId] || 0;
    return qty <= p.minStock;
  });

  // 5. Ընդհանուր պատվերներ (Total orders)
  const totalOrdersCount = transactions.length;

  // 6. Վաճառքների դինամիկա (Sales dynamics chart data)
  const daysCount = chartTimeframe === '7d' ? 7 : chartTimeframe === '30d' ? 14 : 12;
  const dynamicsChartData = Array.from({ length: daysCount }, (_, i) => {
    const d = new Date();
    if (chartTimeframe === 'year') {
      d.setMonth(d.getMonth() - (daysCount - 1 - i));
      const monthLabel = d.toLocaleDateString('hy-AM', { month: 'short' });
      const mIdx = d.getMonth();
      const yIdx = d.getFullYear();
      const mTrx = transactions.filter((t) => {
        const dt = new Date(t.date);
        return dt.getMonth() === mIdx && dt.getFullYear() === yIdx;
      });
      const rev = mTrx.reduce((acc, t) => acc + t.total, 0);
      return { label: monthLabel, հասույթ: rev, շահույթ: Math.round(rev * 0.35) };
    } else {
      d.setDate(d.getDate() - (daysCount - 1 - i));
      const dateKey = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('hy-AM', { weekday: 'short', day: 'numeric' });
      const dayTrx = transactions.filter((t) => t.date.startsWith(dateKey));
      const rev = dayTrx.reduce((acc, t) => acc + t.total, 0);
      const cost = dayTrx.reduce(
        (acc, t) => acc + t.items.reduce((s, it) => s + (it.costPrice || 0) * it.quantity, 0),
        0
      );
      return {
        label: dayLabel,
        հասույթ: rev,
        շահույթ: Math.max(0, rev - cost),
      };
    }
  });

  // 7. Ամենաշատ վաճառվող ապրանքներ (Top selling products)
  const productSalesMap: Record<string, { product: typeof products[0]; qty: number; revenue: number }> = {};
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        const found = products.find((p) => p.id === item.productId);
        if (found) {
          productSalesMap[item.productId] = { product: found, qty: 0, revenue: 0 };
        }
      }
      if (productSalesMap[item.productId]) {
        productSalesMap[item.productId].qty += item.quantity;
        productSalesMap[item.productId].revenue += item.total;
      }
    });
  });

  const topSellingList = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const maxRevenueTop = topSellingList[0]?.revenue || 1;

  // 8. Վերջին գործարքներ (Recent transactions)
  const recentTransactions = transactions.slice(0, 6);

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome & Warehouse Status Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{companyTitle}</span>
            <span>·</span>
            <span>ՀՎՀՀ՝ {companyHvhh}</span>
            <span>·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              ՊԵԿ Էլեկտրոնային համակարգ
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            Բարի գալուստ, {displayName}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Ընթացիկ ակտիվ պահեստ՝{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
              {currentWarehouse?.nameAm || 'Գլխավոր Պահեստ'}
            </strong>{' '}
            {currentWarehouse?.address ? `(${currentWarehouse.address})` : ''}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/sales"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Նոր Վաճառք (POS)</span>
          </Link>
          <Link
            to="/warehouse"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Boxes className="w-4 h-4 text-slate-500" />
            <span>Պահեստի Շարժ</span>
          </Link>
        </div>
      </div>

      {/* Required 5 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Այսօրվա վաճառքներ */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Այսօրվա Վաճառքներ</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              {formatAMD(todayRevenue)}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{todayTransactions.length} կտրոն այսօր</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Ամսական վաճառքներ */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Ամսական Վաճառքներ</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              {formatAMD(monthRevenue)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {monthTransactions.length} գործարք ընթացիկ ամսում
            </div>
          </div>
        </div>

        {/* Metric 3: Ընդհանուր ապրանքներ */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Ընդհանուր Ապրանքներ</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              {totalProductsCount} դիրք
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Առկա է՝ <strong className="font-mono text-slate-700 dark:text-slate-300">{totalWarehouseUnits} միավոր</strong>
            </div>
          </div>
        </div>

        {/* Metric 4: Ցածր մնացորդով ապրանքներ */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Ցածր Մնացորդով</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              lowStockProducts.length > 0
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-xl font-extrabold font-mono tabular-nums ${
              lowStockProducts.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
            }`}>
              {lowStockProducts.length} ապրանք
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Նվազագույն շեմից ցածր
            </div>
          </div>
        </div>

        {/* Metric 5: Ընդհանուր պատվերներ */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Ընդհանուր Պատվերներ</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              {totalOrdersCount} պատվեր
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Գրանցված ռեգիստրում
            </div>
          </div>
        </div>
      </div>

      {/* Sales Dynamics Chart & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Dynamics Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Վաճառքների Դինամիկա
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Հասույթի և համախառն շահույթի շարժը ՀՀ դրամով (֏)
              </p>
            </div>

            {/* Timeframe switch */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setChartTimeframe('7d')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  chartTimeframe === '7d'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                7 Օր
              </button>
              <button
                onClick={() => setChartTimeframe('30d')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  chartTimeframe === '30d'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                14 Օր
              </button>
              <button
                onClick={() => setChartTimeframe('year')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  chartTimeframe === 'year'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Ամբողջ Տարի
              </button>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dynamicsChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="tealProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`${formatAMD(Number(val))}`]}
                  contentStyle={{
                    backgroundColor: '#0b132b',
                    borderRadius: '12px',
                    border: '1px solid #1e293b',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="հասույթ" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#emeraldSales)" />
                <Area type="monotone" dataKey="շահույթ" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#tealProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Հասույթ (Վաճառք)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-teal-600" />
              <span>Համախառն Շահույթ</span>
            </div>
          </div>
        </div>

        {/* Top Selling Products (1 col) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Ամենաշատ Վաճառվող Ապրանքներ
              </h3>
              <Link to="/products" className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                Բոլորը
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
              {topSellingList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <p>Վաճառված ապրանքներ դեռ չկան:</p>
                  <p className="text-[11px] text-slate-500 mt-1">Վաճառքներ գրանցելուց հետո այստեղ կցուցադրվեն առաջատար ապրանքները:</p>
                </div>
              ) : (
                topSellingList.map((item, idx) => {
                  const percent = Math.min(100, Math.round((item.revenue / maxRevenueTop) * 100));
                  return (
                    <div key={item.product.id} className="py-3 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                            {item.product.nameAm}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            {item.product.sku} · {item.qty} {item.product.unit} վաճառված
                          </p>
                        </div>
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 shrink-0">
                          {formatAMD(item.revenue)}
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Ըստ ընդհանուր վաճառքի ծավալի</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Top 5</span>
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Transactions & Urgent Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Վերջին Գործարքներ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Կատարված վաճառքներ և տրված ՀԴՄ կտրոններ
              </p>
            </div>
            <Link
              to="/reports"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Ամբողջը</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase">
                  <th className="py-3 px-4">Կտրոն / Ամսաթիվ</th>
                  <th className="py-3 px-3">Գնորդ</th>
                  <th className="py-3 px-3">Վճարում</th>
                  <th className="py-3 px-3 text-right">Գումար</th>
                  <th className="py-3 px-4 text-right">Դիտել</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      Վաճառքներ դեռ չեն գրանցվել: Առաջին վաճառքը գրանցելու համար անցեք POS դրամարկղ:
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {trx.receiptNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {formatDateTime(trx.date)}
                        </div>
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
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                          {trx.paymentMethod === 'cash'
                            ? 'Կանխիկ'
                            : trx.paymentMethod === 'arca'
                            ? 'ArCa'
                            : trx.paymentMethod === 'idram'
                            ? 'Idram'
                            : trx.paymentMethod === 'telcell'
                            ? 'Telcell'
                            : trx.paymentMethod === 'bank_transfer'
                            ? 'Փոխանցում'
                            : 'Ապառիկ'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatAMD(trx.total)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedReceipt(trx)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"
                          title="Դիտել ՀԴՄ կտրոնը"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low-Stock Quick Actions (1 col) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Ցածր Մնացորդներ
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                {lowStockProducts.length} ապրանք
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
              {lowStockProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p>Բոլոր մնացորդները նորմայի սահմաններում են</p>
                </div>
              ) : (
                lowStockProducts.slice(0, 4).map((p) => {
                  const qty = p.warehouseStock[selectedWarehouseId] || 0;
                  return (
                    <div key={p.id} className="py-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                          {p.nameAm}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Շեմ՝ {p.minStock} {p.unit}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                          {qty} {p.unit}
                        </div>
                        <Link
                          to={`/warehouse?tab=in&product=${p.id}`}
                          className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline block mt-0.5"
                        >
                          + Մուտքագրել
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <Link
            to="/products"
            className="w-full mt-4 py-2 px-3 text-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors block"
          >
            Դիտել ապրանքների ամբողջ ցանկը
          </Link>
        </div>
      </div>

      {/* Printable Armenian Receipt Modal */}
      <ReceiptModal
        transaction={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
};
