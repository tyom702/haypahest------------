import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SaleTransaction, PaymentMethod } from '../../types';
import {
  Search,
  Calendar,
  Filter,
  Download,
  Receipt,
  Eye,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  Building2,
  User,
  Boxes,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { salesService, SalesHistoryFilters } from '../../services/salesService';
import { formatAMD, formatDateTime } from '../../utils/formatters';

interface SalesHistoryViewProps {
  onViewReceipt: (transaction: SaleTransaction) => void;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({ onViewReceipt }) => {
  const { transactions, warehouses, employees, addToast } = useApp();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [timeframe, setTimeframe] = useState<SalesHistoryFilters['timeframe']>('today');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'all' | PaymentMethod>('all');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [selectedCashier, setSelectedCashier] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return salesService.filterTransactions(transactions, {
      searchTerm,
      timeframe,
      paymentMethod: selectedPaymentMethod,
      warehouseId: selectedWarehouseId,
      cashierName: selectedCashier,
      startDate,
      endDate,
    });
  }, [
    transactions,
    searchTerm,
    timeframe,
    selectedPaymentMethod,
    selectedWarehouseId,
    selectedCashier,
    startDate,
    endDate,
  ]);

  // 2. Metrics for the filtered results
  const metrics = useMemo(() => {
    return salesService.calculateMetrics(filteredTransactions);
  }, [filteredTransactions]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    timeframe,
    selectedPaymentMethod,
    selectedWarehouseId,
    selectedCashier,
    startDate,
    endDate,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(startIndex, startIndex + pageSize);
  }, [filteredTransactions, startIndex, pageSize]);

  const handleExportCSV = () => {
    const headers = [
      'Կտրոնի №',
      'Գործարքի ID',
      'Ամսաթիվ և Ժամ',
      'Պահեստ/Սրահ',
      'Գանձապահ',
      'Գնորդ',
      'Ապրանքների Քանակ',
      'Վճարման Եղանակ',
      'Ենթահանրագումար (֏)',
      'Զեղչ (֏)',
      'ԱԱՀ (֏)',
      'Ընդամենը (֏)',
    ];

    const rows = filteredTransactions.map((t) => {
      const wh = warehouses.find((w) => w.id === t.warehouseId);
      const itemsCount = t.items.reduce((s, it) => s + it.quantity, 0);

      return [
        `"${t.receiptNumber}"`,
        `"${t.id}"`,
        `"${formatDateTime(t.date)}"`,
        `"${wh?.nameAm || t.warehouseId}"`,
        `"${t.cashierName}"`,
        `"${t.customerName || 'Մանրածախ'}"`,
        itemsCount,
        `"${salesService.getPaymentMethodLabel(t.paymentMethod)}"`,
        t.subtotal,
        t.discountTotal,
        t.taxTotal,
        t.total,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `HayPahest_Sales_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Արտահանված է', 'Վաճառքների պատմությունը ներբեռնվեց CSV ձևաչափով');
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setTimeframe('all');
    setSelectedPaymentMethod('all');
    setSelectedWarehouseId('all');
    setSelectedCashier('all');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Ընդհանուր Հասույթ
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {formatAMD(metrics.totalRevenue)}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              {metrics.totalItemsSold} վաճառված միավոր
            </div>
          </div>
        </div>

        {/* Transactions Count */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Գործարքների Քանակ
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {metrics.totalTransactionsCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Կատարված վաճառքներ
            </div>
          </div>
        </div>

        {/* Average Check */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Միջին Չեկ
            </span>
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {formatAMD(metrics.averageCheck)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Մեկ գնման միջին արժեք
            </div>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Կանխիկ / Անկանխիկ
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1 text-xs">
            <div className="flex justify-between font-mono">
              <span className="text-slate-500">Կանխիկ՝</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatAMD(metrics.cashRevenue)}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-500">Քարտ / Փոխանցում՝</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatAMD(metrics.cardRevenue + metrics.bankTransferRevenue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        {/* Top search & export line */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Փնտրել ըստ կտրոնի №, գնորդի, գանձապահի կամ ապրանքի..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Արտահանել Excel (CSV)</span>
          </button>
        </div>

        {/* Filter controls row */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Timeframe buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setTimeframe('today')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                timeframe === 'today'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Այսօր
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('yesterday')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                timeframe === 'yesterday'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Երեկ
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('7days')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                timeframe === '7days'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Վերջին 7 օր
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                timeframe === 'month'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Այս ամիս
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                timeframe === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Բոլորը
            </button>
          </div>

          {/* Payment Method Selector */}
          <select
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
          >
            <option value="all">Բոլոր վճարման եղանակները</option>
            <option value="cash">Կանխիկ</option>
            <option value="card">Քարտով (Անկանխիկ)</option>
            <option value="bank_transfer">Բանկային փոխանցում</option>
          </select>

          {/* Warehouse Selector */}
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
          >
            <option value="all">Բոլոր պահեստները</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.nameAm}
              </option>
            ))}
          </select>

          {/* Cashier Selector */}
          <select
            value={selectedCashier}
            onChange={(e) => setSelectedCashier(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
          >
            <option value="all">Բոլոր գանձապահները</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.fullNameAm}>
                {emp.fullNameAm}
              </option>
            ))}
          </select>

          {/* Reset Filters button */}
          {(searchTerm || timeframe !== 'all' || selectedPaymentMethod !== 'all' || selectedWarehouseId !== 'all' || selectedCashier !== 'all') && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 font-semibold"
            >
              Մաքրել
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <Receipt className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Վաճառքների գործարքներ չեն գտնվել
            </h4>
            <p className="text-xs mt-1">
              Փորձեք փոխել ժամանակահատվածը կամ մաքրել որոնման զտիչները:
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="py-3.5 pl-6 pr-3">Կտրոնի № / ID</th>
                  <th className="py-3.5 px-3">Ամսաթիվ և Ժամ</th>
                  <th className="py-3.5 px-3">Ապրանքներ</th>
                  <th className="py-3.5 px-3">Գնորդ / Գանձապահ</th>
                  <th className="py-3.5 px-3">Վճարման Եղանակ</th>
                  <th className="py-3.5 px-3">Կարգավիճակ</th>
                  <th className="py-3.5 px-3 text-right">Գումար (֏)</th>
                  <th className="py-3.5 pr-6 pl-3 text-right">Տեղեկանք</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedTransactions.map((trx) => {
                  const wh = warehouses.find((w) => w.id === trx.warehouseId);
                  const totalItems = trx.items.reduce((s, it) => s + it.quantity, 0);

                  return (
                    <tr
                      key={trx.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Receipt number & ID */}
                      <td className="py-3.5 pl-6 pr-3">
                        <div className="font-bold text-slate-900 dark:text-white font-mono">
                          {trx.receiptNumber}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {trx.id}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {formatDateTime(trx.date)}
                      </td>

                      {/* Products Summary */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col max-w-xs">
                          <span className="font-semibold text-slate-900 dark:text-white truncate">
                            {trx.items.map((it) => it.productName).join(', ')}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {totalItems} միավոր ({trx.items.length} դիրք)
                          </span>
                        </div>
                      </td>

                      {/* Customer & Cashier */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {trx.customerName || 'Մանրածախ հաճախորդ'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Գանձապահ՝ {trx.cashierName} · {wh?.nameAm || ''}
                          </span>
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {trx.paymentMethod === 'cash' ? (
                            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                          ) : trx.paymentMethod === 'card' || trx.paymentMethod === 'arca' ? (
                            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <Building2 className="w-3.5 h-3.5 text-violet-600" />
                          )}
                          <span>{salesService.getPaymentMethodLabel(trx.paymentMethod)}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Հաստատված</span>
                        </span>
                      </td>

                      {/* Total Amount in AMD */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="font-mono font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                          {formatAMD(trx.total)}
                        </div>
                        {trx.discountTotal > 0 && (
                          <div className="text-[10px] text-emerald-600 font-mono">
                            Զեղչ՝ -{formatAMD(trx.discountTotal)}
                          </div>
                        )}
                      </td>

                      {/* View Receipt Action */}
                      <td className="py-3.5 pr-6 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => onViewReceipt(trx)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                          title="Դիտել վաճառքի տեղեկանքը"
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Տեղեկանք</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table count & pagination footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              Ցուցադրված է <strong>{Math.min(startIndex + 1, filteredTransactions.length)}</strong>–<strong>{Math.min(startIndex + pageSize, filteredTransactions.length)}</strong> / <strong>{filteredTransactions.length}</strong> գործարք
            </span>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-[11px]">Էջում՝</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="py-1 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Page Switcher */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors"
                title="Նախորդ էջ"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                Էջ {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors"
                title="Հաջորդ էջ"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div>
            Ընդհանուր գումար՝{' '}
            <strong className="font-mono text-slate-900 dark:text-white">
              {formatAMD(metrics.totalRevenue)}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
