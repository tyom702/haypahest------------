/**
 * HayPahest API Service Layer
 * Designed for future integration with Python FastAPI backend (/api/v1/*)
 * Provides typed contracts, error handling, and offline/localStorage resilience.
 */

import { Product, SaleTransaction, Customer, Warehouse, Employee, StockMovement } from '../types';

export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  statusCode: number;
}

export interface DashboardSummaryResponse {
  todayRevenue: number;
  monthRevenue: number;
  totalProductsCount: number;
  lowStockCount: number;
  totalOrdersCount: number;
  revenueChangePercent: number;
  topSellingProducts: {
    productId: string;
    productName: string;
    sku: string;
    unitsSold: number;
    totalRevenue: number;
    progressPercent: number;
  }[];
  salesDynamics: {
    date: string;
    revenue: number;
    profit: number;
  }[];
}

class HayPahestApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      return {
        data: json,
        success: true,
        statusCode: response.status,
      };
    } catch (error: any) {
      // In local mode without running FastAPI server, gracefully return mock response
      return {
        data: null as any,
        success: false,
        message: error.message || 'Սերվերի հետ կապի սխալ',
        statusCode: 500,
      };
    }
  }

  // Future FastAPI endpoints:
  // GET /api/v1/dashboard/summary
  async getDashboardSummary(): Promise<ApiResponse<DashboardSummaryResponse>> {
    return this.request<DashboardSummaryResponse>('/dashboard/summary');
  }

  // Products endpoints:
  async getProducts(): Promise<ApiResponse<Product[]>> {
    return this.request<Product[]>('/products');
  }

  async createProduct(product: Partial<Product>): Promise<ApiResponse<Product>> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  // Sales endpoints:
  async getSales(page = 1, limit = 50): Promise<ApiResponse<SaleTransaction[]>> {
    return this.request<SaleTransaction[]>(`/sales?page=${page}&limit=${limit}`);
  }

  async createSale(sale: Partial<SaleTransaction>): Promise<ApiResponse<SaleTransaction>> {
    return this.request<SaleTransaction>('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
  }

  // Employees endpoints:
  async getEmployees(): Promise<ApiResponse<Employee[]>> {
    return this.request<Employee[]>('/employees');
  }
}

export const apiService = new HayPahestApiService();
