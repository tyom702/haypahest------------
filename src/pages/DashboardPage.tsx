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
  Receipt,
  Wallet,
  ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ReceiptModal } from '../components/common/ReceiptModal';
import { SaleTransaction } from '../types';
import { formatAMD, formatDateTime } from '../utils/formatters';

export const DashboardPage: React.FC = () => {
  const {
    products,
    transactions,
    selectedWarehouseId,
    warehouses,
    companySettings,
    currentUser,
  } = useApp();

  const { user, workspace } = useAuth();

  const [selectedReceipt, setSelectedReceipt] =
    useState<SaleTransaction | null>(null);

  const [chartTimeframe, setChartTimeframe] =
    useState<'7d' | '30d' | 'year'>('7d');

  const currentWarehouse =
    warehouses.find((w) => w.id === selectedWarehouseId) || warehouses[0];

  const displayName =
    user?.fullNameAm || currentUser?.fullNameAm || 'Ադմինիստրատոր';

  const companyTitle =
    workspace?.nameAm || companySettings?.companyName || 'ՀայՊահեստ Բիզնես';

  const companyHvhh =
    workspace?.hvhh || companySettings?.hvhh || '00000000';

  // Today's sales
  const todayStr = new Date().toISOString().split('T')[0];

  const todayTransactions = transactions.filter((t) =>
    t.date.startsWith(todayStr)
  );

  const todayRevenue = todayTransactions.reduce(
    (acc, t) => acc + t.total,
    0
  );

  // Monthly sales
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      d.getMonth() === currentMonth &&
      d.getFullYear() === currentYear
    );
  });

  const monthRevenue = monthTransactions.reduce(
    (acc, t) => acc + t.total,
    0
  );

  // Products
  const totalProductsCount = products.length;

  let totalWarehouseUnits = 0;

  products.forEach((p) => {
    totalWarehouseUnits += p.warehouseStock[selectedWarehouseId] || 0;
  });

  // Low stock
  const lowStockProducts = products.filter((p) => {
    const qty = p.warehouseStock[selectedWarehouseId] || 0;
    return qty <= p.minStock;
  });

  // Orders
  const totalOrdersCount = transactions.length;

  // Chart
  const daysCount =
    chartTimeframe === '7d' ? 7 : chartTimeframe === '30d' ? 14 : 12;

  const dynamicsChartData = Array.from(
    { length: daysCount },
    (_, i) => {
      const d = new Date();

      if (chartTimeframe === 'year') {
        d.setMonth(d.getMonth() - (daysCount - 1 - i));

        const monthLabel = d.toLocaleDateString('hy-AM', {
          month: 'short',
        });

        const mIdx = d.getMonth();
        const yIdx = d.getFullYear();

        const mTrx = transactions.filter((t) => {
          const dt = new Date(t.date);
          return (
            dt.getMonth() === mIdx &&
            dt.getFullYear() === yIdx
          );
        });

        const rev = mTrx.reduce((acc, t) => acc + t.total, 0);

        return {
          label: monthLabel,
          հասույթ: rev,
          շահույթ: Math.round(rev * 0.35),
        };
      }

      d.setDate(d.getDate() - (daysCount - 1 - i));

      const dateKey = d.toISOString().split('T')[0];

      const dayLabel = d.toLocaleDateString('hy-AM', {
        weekday: 'short',
        day: 'numeric',
      });

      const dayTrx = transactions.filter((t) =>
        t.date.startsWith(dateKey)
      );

      const rev = dayTrx.reduce((acc, t) => acc + t.total, 0);

      const cost = dayTrx.reduce(
        (acc, t) =>
          acc +
          t.items.reduce(
            (s, it) => s + (it.costPrice || 0) * it.quantity,
            0
          ),
        0
      );

      return {
        label: dayLabel,
        հասույթ: rev,
        շահույթ: Math.max(0, rev - cost),
      };
    }
  );

  // Top selling products
  const productSalesMap: Record<
    string,
    {
      product: (typeof products)[0];
      qty: number;
      revenue: number;
    }
  > = {};

  transactions.forEach((t) => {
    t.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        const found = products.find(
          (p) => p.id === item.productId
        );

        if (found) {
          productSalesMap[item.productId] = {
            product: found,
            qty: 0,
            revenue: 0,
          };
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

  // Recent transactions
  const recentTransactions = transactions.slice(0, 6);

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Կանխիկ';
      case 'arca':
        return 'ArCa';
      case 'idram':
        return 'Idram';
      case 'telcell':
        return 'Telcell';
      case 'bank_transfer':
        return 'Փոխանցում';
      default:
        return 'Ապառիկ';
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6 pb-8 sm:pb-12">

      {/* Welcome Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {companyTitle}
            </span>

            <span>·</span>

            <span>ՀՎՀՀ՝ {companyHvhh}</span>

            <span>·</span>

            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              ՊԵԿ Էլեկտրոնային համակարգ
            </span>
          </div>

          <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white break-words">
            Բարի գալուստ, {displayName}
          </h2>

          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
            Ընթացիկ ակտիվ պահեստ՝{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
              {currentWarehouse?.nameAm || 'Գլխավոր Պահեստ'}
            </strong>{' '}
            {currentWarehouse?.address
              ? `(${currentWarehouse.address})`
              : ''}
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2.5 w-full md:w-auto">

          <Link
            to="/sales"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Նոր Վաճառք (POS)</span>
          </Link>

          <Link
            to="/warehouse"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 w-full sm:w-auto bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Boxes className="w-4 h-4 text-slate-500" />
            <span>Պահեստի Շարժ</span>
          </Link>

        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">

        {/* Today's Sales */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-medium">
            <span>Այսօրվա վաճառքներ</span>

            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 min-w-0">
            <div className="text-base sm:text-xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white break-words">
              {formatAMD(todayRevenue)}
            </div>

            <div className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
              <span>{todayTransactions.length} կտրոն այսօր</span>
            </div>
          </div>
        </div>

        {/* Monthly Sales */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-medium">
            <span>Ամսական վաճառքներ</span>

            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 min-w-0">
            <div className="text-base sm:text-xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white break-words">
              {formatAMD(monthRevenue)}
            </div>

            <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {monthTransactions.length} գործարք ընթացիկ ամսում
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-medium">
            <span>Ընդհանուր ապրանքներ</span>

            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Boxes className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 min-w-0">
            <div className="text-base sm:text-xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              {totalProductsCount} դիրք
            </div>

            <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Առկա է՝{' '}
              <strong className="font-mono text-slate-700 dark:text-slate-300">
                {totalWarehouseUnits} միավոր
              </strong>
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-medium">
            <span>Ցածր մնացորդով</span>

            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                lowStockProducts.length > 0
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 min-w-0">
            <div
              className={`text-base sm:text-xl font-extrabold font-mono tabular-nums ${
                lowStockProducts.length > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {lowStockProducts.length} ապրանք
            </div>

            <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Նվազագույն շեմից ցածր
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-medium">
            <span>Ընդհանուր պատվերներ</span>

            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 min-w-0">
            <div className="text-base sm:text-xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              {totalOrdersCount} պատվեր
            </div>

            <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Գրանցված ռեգիստրում
            </div>
          </div>
        </div>
      </div>

      {/* Chart and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col min-w-0">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">

            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Վաճառքների դինամիկա
              </h3>

              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
                Հասույթի և համախառն շահույթի շարժը ՀՀ դրամով (֏)
              </p>
            </div>

            <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">

              <button
                onClick={() => setChartTimeframe('7d')}
                className={`px-2 sm:px-3 py-2 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-lg transition-colors ${
                  chartTimeframe === '7d'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                7 Օր
              </button>

              <button
                onClick={() => setChartTimeframe('30d')}
                className={`px-2 sm:px-3 py-2 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-lg transition-colors ${
                  chartTimeframe === '30d'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                14 Օր
              </button>

              <button
                onClick={() => setChartTimeframe('year')}
                className={`px-2 sm:px-3 py-2 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-lg transition-colors ${
                  chartTimeframe === 'year'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Տարի
              </button>

            </div>
          </div>

          <div className="h-56 sm:h-72 w-full pt-4 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dynamicsChartData}
                margin={{
                  top: 10,
                  right: 5,
                  left: -20,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="emeraldSales"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#10b981"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor="#10b981"
                      stopOpacity={0}
                    />
                  </linearGradient>

                  <linearGradient
                    id="tealProfit"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#0d9488"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor="#0d9488"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: 10,
                    fill: '#64748b',
                  }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />

                <YAxis
                  width={45}
                  tick={{
                    fontSize: 10,
                    fill: '#64748b',
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) =>
                    `${(val / 1000).toFixed(0)}k`
                  }
                />

                <Tooltip
                  formatter={(val: any) => [
                    formatAMD(Number(val)),
                  ]}
                  contentStyle={{
                    backgroundColor: '#0b132b',
                    borderRadius: '12px',
                    border: '1px solid #1e293b',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="հասույթ"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#emeraldSales)"
                />

                <Area
                  type="monotone"
                  dataKey="շահույթ"
                  stroke="#0d9488"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#tealProfit)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Հասույթ (Վաճառք)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
              <span>Համախառն շահույթ</span>
            </div>

          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between min-w-0">

          <div>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">

              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Ամենաշատ վաճառվող ապրանքներ
              </h3>

              <Link
                to="/products"
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline shrink-0"
              >
                Բոլորը
              </Link>

            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">

              {topSellingList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <p>Վաճառված ապրանքներ դեռ չկան:</p>

                  <p className="text-[11px] text-slate-500 mt-1">
                    Վաճառքներ գրանցելուց հետո այստեղ կցուցադրվեն առաջատար ապրանքները:
                  </p>
                </div>
              ) : (
                topSellingList.map((item) => {
                  const percent = Math.min(
                    100,
                    Math.round(
                      (item.revenue / maxRevenueTop) * 100
                    )
                  );

                  return (
                    <div
                      key={item.product.id}
                      className="py-3 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">

                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-slate-900 dark:text-white break-words">
                            {item.product.nameAm}
                          </p>

                          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                            {item.product.sku} · {item.qty}{' '}
                            {item.product.unit} վաճառված
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

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] sm:text-[11px] text-slate-400 flex items-center justify-between gap-2">
            <span>Ըստ ընդհանուր վաճառքի ծավալի</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Top 5
            </span>
          </div>
        </div>
      </div>

      {/* Recent Transactions and Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden min-w-0">

          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">

            <div className="min-w-0">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Վերջին գործարքներ
              </h3>

              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
                Կատարված վաճառքներ և տրված ՀԴՄ կտրոններ
              </p>
            </div>

            <Link
              to="/reports"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Ամբողջը</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
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
                    <td
                      colSpan={5}
                      className="py-8 text-center text-xs text-slate-400"
                    >
                      Վաճառքներ դեռ չեն գրանցվել: Առաջին վաճառքը գրանցելու համար անցեք POS դրամարկղ:
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((trx) => (
                    <tr
                      key={trx.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
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
                          <span className="text-slate-400">
                            Մանրածախ
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-block text-[10px] font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {getPaymentLabel(trx.paymentMethod)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatAMD(trx.total)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedReceipt(trx)}
                          className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"
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

          {/* Mobile Transactions Cards */}
          <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">

            {recentTransactions.length === 0 ? (
              <div className="py-8 px-4 text-center text-xs text-slate-400">
                Վաճառքներ դեռ չեն գրանցվել: Առաջին վաճառքը գրանցելու համար անցեք POS դրամարկղ:
              </div>
            ) : (
              recentTransactions.map((trx) => (
                <div
                  key={trx.id}
                  className="p-4 space-y-3"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 dark:text-white break-all">
                        {trx.receiptNumber}
                      </p>

                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatDateTime(trx.date)}
                      </p>
                    </div>

                    <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
                      {formatAMD(trx.total)}
                    </span>

                  </div>

                  <div className="flex items-center justify-between gap-2">

                    <div className="min-w-0 space-y-1">
                      <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                        {trx.customerName || 'Մանրածախ'}
                      </p>

                      <span className="inline-block text-[10px] font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {getPaymentLabel(trx.paymentMethod)}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedReceipt(trx)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold shrink-0"
                    >
                      <Eye className="w-4 h-4" />
                      Դիտել
                    </button>

                  </div>
                </div>
              ))
            )}

          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-6 flex flex-col justify-between min-w-0">

          <div>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">

              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />

                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Ցածր մնացորդներ
                </h3>
              </div>

              <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 shrink-0">
                {lowStockProducts.length} ապրանք
              </span>

            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">

              {lowStockProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p>
                    Բոլոր մնացորդները նորմայի սահմաններում են
                  </p>
                </div>
              ) : (
                lowStockProducts.slice(0, 4).map((p) => {
                  const qty =
                    p.warehouseStock[selectedWarehouseId] || 0;

                  return (
                    <div
                      key={p.id}
                      className="py-3 flex items-center justify-between gap-2"
                    >

                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-slate-900 dark:text-white break-words">
                          {p.nameAm}
                        </p>

                        <p className="text-[10px] text-slate-400 font-mono mt-1">
                          Շեմ՝ {p.minStock} {p.unit}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                          {qty} {p.unit}
                        </div>

                        <Link
                          to={`/warehouse?tab=in&product=${p.id}`}
                          className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline block mt-1"
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
            className="w-full mt-4 py-3 sm:py-2 px-3 text-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors block"
          >
            Դիտել ապրանքների ամբողջ ցանկը
          </Link>

        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        transaction={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />

    </div>
  );
};
