import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  CalendarDays,
  Target,
  ArrowUpRight,
} from 'lucide-react';
import {
  DailyTrendPoint,
  CategoryRevenueItem,
  MonthlyComparisonPoint,
} from '../../services/analyticsService';
import { formatAMD } from '../../utils/formatters';

interface AnalyticsChartsGridProps {
  dailyTrends: DailyTrendPoint[];
  categoryShare: CategoryRevenueItem[];
  monthlyComparison: MonthlyComparisonPoint[];
}

const CATEGORY_COLORS = [
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#14b8a6', // teal
  '#3b82f6', // blue
];

export const AnalyticsChartsGrid: React.FC<AnalyticsChartsGridProps> = ({
  dailyTrends,
  categoryShare,
  monthlyComparison,
}) => {
  return (
    <div className="space-y-6">
      {/* Upper Grid: Revenue & Profit Trend (2 cols) + Category Share (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Revenue & Gross Profit Dynamic Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Հասույթի և Շահույթի Դինամիկա (Revenue & Profit Trends)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Ժամանակագրական հասույթի և իրացված համախառն շահույթի միտումներ
                </p>
              </div>
            </div>
          </div>

          <div className="h-72 w-full mt-4">
            {dailyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dailyTrends}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `${(val / 1000).toLocaleString('hy-AM')}հզ.`}
                  />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      `${formatAMD(Number(val))}`,
                      name === 'հասույթ' ? 'Հասույթ' : 'Համախառն շահույթ',
                    ]}
                    contentStyle={{
                      backgroundColor: '#0b132b',
                      borderRadius: '12px',
                      border: '1px solid #1e293b',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="հասույթ"
                    name="հասույթ"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="շահույթ"
                    name="շահույթ"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Նշված ժամանակահատվածում գործարքներ չեն գտնվել
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span>Հասույթ (Revenue)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
              <span>Համախառն Շահույթ (Gross Profit)</span>
            </div>
          </div>
        </div>

        {/* 2. Product Category Share Donut Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Եկամուտներն ըստ Կատեգորիաների
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Ապրանքային խմբերի բաժնեմասը վաճառքներում
            </p>
          </div>

          <div className="h-56 w-full flex items-center justify-center relative my-2">
            {categoryShare.some((c) => c.revenue > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryShare.filter((c) => c.revenue > 0)}
                    dataKey="revenue"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categoryShare
                      .filter((c) => c.revenue > 0)
                      .map((_, index) => (
                        <Cell
                          key={`cat-cell-${index}`}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${formatAMD(Number(val))}`]}
                    contentStyle={{
                      backgroundColor: '#0b132b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">Կատեգորիաների վաճառքներ չկան</div>
            )}
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 max-h-40 overflow-y-auto">
            {categoryShare
              .filter((c) => c.revenue > 0)
              .slice(0, 5)
              .map((c, idx) => (
                <div
                  key={c.categoryId}
                  className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                      }}
                    />
                    <span className="truncate">{c.categoryName}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-slate-900 dark:text-white font-medium">
                      {formatAMD(c.revenue)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono w-7 text-right">
                      {c.percentage}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Lower Grid: Sales Volume Bar Chart + Monthly Comparison Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Sales Volume & Transactions Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Վաճառքների Ծավալ և Գործարքներ
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Օրական իրականացված գործարքների քանակ և վաճառված ապրանքների միավորներ
            </p>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyTrends}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `${val} ${name === 'գործարքներ' ? 'չեկ' : 'հատ'}`,
                    name === 'գործարքներ' ? 'Գործարքներ' : 'Վաճառված միավորներ',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0b132b',
                    borderRadius: '12px',
                    border: '1px solid #1e293b',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar
                  dataKey="գործարքներ"
                  name="գործարքներ"
                  fill="#06b6d4"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="միավորներ"
                  name="միավորներ"
                  fill="#94a3b8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-cyan-500"></span>
              <span>Գործարքների Քանակ (Կտրոններ)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-slate-400"></span>
              <span>Վաճառված Ապրանքներ (Միավորներ)</span>
            </div>
          </div>
        </div>

        {/* 4. Monthly Comparison Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Ամսական Համեմատական Դինամիկա
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Ընթացիկ ամիսների շրջանառության համեմատություն բազային ցուցանիշի և թիրախի հետ
            </p>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyComparison}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="monthName"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `${formatAMD(Number(val))}`,
                    name === 'հասույթ'
                      ? 'Փաստացի հասույթ'
                      : name === 'նախորդ_տարի'
                      ? 'Նախորդ բազա'
                      : 'Թիրախ',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0b132b',
                    borderRadius: '12px',
                    border: '1px solid #1e293b',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar
                  dataKey="հասույթ"
                  name="հասույթ"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="թիրախ"
                  name="թիրախ"
                  fill="#cbd5e1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-500"></span>
              <span>Փաստացի Հասույթ</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-700"></span>
              <span>Թիրախային Պլան</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
