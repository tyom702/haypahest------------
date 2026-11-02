/**
 * HayPahest (ՀայՊահեստ) — Sales & POS Data Service
 * Decoupled domain service separating sales operations and history from storage.
 * Designed for future FastAPI backend integration (/api/v1/sales/*).
 */

import { SaleTransaction, SaleItem, PaymentMethod } from '../types';

export interface SalesHistoryFilters {
  searchTerm?: string;
  timeframe?: 'all' | 'today' | 'yesterday' | '7days' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
  paymentMethod?: 'all' | PaymentMethod;
  warehouseId?: 'all' | string;
  cashierName?: 'all' | string;
}

export interface SalesMetricsSummary {
  totalRevenue: number;
  totalTransactionsCount: number;
  averageCheck: number;
  cashRevenue: number;
  cardRevenue: number;
  bankTransferRevenue: number;
  totalDiscountGiven: number;
  totalItemsSold: number;
}

export const salesService = {
  /**
   * Filter and search transactions based on criteria
   */
  filterTransactions(transactions: SaleTransaction[], filters: SalesHistoryFilters): SaleTransaction[] {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return transactions.filter((t) => {
      // 1. Search Query
      if (filters.searchTerm && filters.searchTerm.trim()) {
        const query = filters.searchTerm.toLowerCase().trim();
        const matchesReceipt = t.receiptNumber.toLowerCase().includes(query);
        const matchesCustomer = t.customerName ? t.customerName.toLowerCase().includes(query) : false;
        const matchesCashier = t.cashierName.toLowerCase().includes(query);
        const matchesProduct = t.items.some((it) => it.productName.toLowerCase().includes(query) || it.sku.toLowerCase().includes(query));

        if (!matchesReceipt && !matchesCustomer && !matchesCashier && !matchesProduct) {
          return false;
        }
      }

      // 2. Warehouse Filter
      if (filters.warehouseId && filters.warehouseId !== 'all') {
        if (t.warehouseId !== filters.warehouseId) {
          return false;
        }
      }

      // 3. Payment Method Filter
      if (filters.paymentMethod && filters.paymentMethod !== 'all') {
        if (filters.paymentMethod === 'card') {
          if (t.paymentMethod !== 'card' && t.paymentMethod !== 'arca') {
            return false;
          }
        } else if (t.paymentMethod !== filters.paymentMethod) {
          return false;
        }
      }

      // 4. Cashier Filter
      if (filters.cashierName && filters.cashierName !== 'all') {
        if (t.cashierName !== filters.cashierName) {
          return false;
        }
      }

      // 5. Timeframe Filter
      if (filters.timeframe && filters.timeframe !== 'all') {
        const tDate = new Date(t.date);
        const tDateStr = t.date.split('T')[0];

        if (filters.timeframe === 'today') {
          if (tDateStr !== todayStr) return false;
        } else if (filters.timeframe === 'yesterday') {
          if (tDateStr !== yesterdayStr) return false;
        } else if (filters.timeframe === '7days') {
          if (tDate < sevenDaysAgo) return false;
        } else if (filters.timeframe === 'month') {
          if (tDate < firstDayOfMonth) return false;
        } else if (filters.timeframe === 'custom') {
          if (filters.startDate && tDateStr < filters.startDate) return false;
          if (filters.endDate && tDateStr > filters.endDate) return false;
        }
      }

      return true;
    });
  },

  /**
   * Calculate summary metrics from transactions
   */
  calculateMetrics(transactions: SaleTransaction[]): SalesMetricsSummary {
    let totalRevenue = 0;
    let cashRevenue = 0;
    let cardRevenue = 0;
    let bankTransferRevenue = 0;
    let totalDiscountGiven = 0;
    let totalItemsSold = 0;

    transactions.forEach((t) => {
      totalRevenue += t.total;
      totalDiscountGiven += t.discountTotal || 0;

      if (t.paymentMethod === 'cash') {
        cashRevenue += t.total;
      } else if (t.paymentMethod === 'card' || t.paymentMethod === 'arca') {
        cardRevenue += t.total;
      } else if (t.paymentMethod === 'bank_transfer') {
        bankTransferRevenue += t.total;
      }

      t.items.forEach((it) => {
        totalItemsSold += it.quantity;
      });
    });

    const totalTransactionsCount = transactions.length;
    const averageCheck = totalTransactionsCount > 0 ? Math.round(totalRevenue / totalTransactionsCount) : 0;

    return {
      totalRevenue,
      totalTransactionsCount,
      averageCheck,
      cashRevenue,
      cardRevenue,
      bankTransferRevenue,
      totalDiscountGiven,
      totalItemsSold,
    };
  },

  /**
   * Translates payment method code to clean Armenian display label
   */
  getPaymentMethodLabel(method: PaymentMethod | string): string {
    switch (method) {
      case 'cash':
        return 'Կանխիկ';
      case 'card':
      case 'arca':
        return 'Քարտով (Անկանխիկ)';
      case 'bank_transfer':
        return 'Բանկային փոխանցում';
      case 'idram':
        return 'Idram QR';
      case 'telcell':
        return 'Telcell';
      case 'credit':
        return 'Ապառիկ / Պարտքով';
      default:
        return 'Կանխիկ';
    }
  },
};
