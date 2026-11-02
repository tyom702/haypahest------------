/**
 * HayPahest (ՀայՊահեստ) — Production API Client
 * Connects React frontend directly to the FastAPI Backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export interface BackendHealthStatus {
  isOnline: boolean;
  status?: string;
  app?: string;
  version?: string;
  environment?: string;
  message?: string;
  error?: string;
}

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('haypahest_token');
    const businessId = localStorage.getItem('haypahest_business_id');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (businessId) {
      headers['X-Business-ID'] = businessId;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      ...this.getAuthHeaders(),
      ...(options.headers || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `Հարցման սխալ (${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } catch {
        // use default message
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Health probe
  async checkHealth(): Promise<BackendHealthStatus> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        return { isOnline: true, ...data };
      }
      return { isOnline: false, error: `HTTP ${response.status}` };
    } catch (err: any) {
      return { isOnline: false, error: err.message || 'Սերվերը անհասանելի է' };
    }
  }

  // Authentication
  auth = {
    login: (credentials: { email: string; password: string }) =>
      this.request<{
        access_token: string;
        token_type: string;
        user_id: string;
        email: string;
        full_name: string;
        business_id: string;
        business_name: string;
        role: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),

    register: (data: {
      email: string;
      password: string;
      full_name: string;
      business_name: string;
      hvhh?: string;
    }) =>
      this.request<{
        access_token: string;
        token_type: string;
        user_id: string;
        email: string;
        full_name: string;
        business_id: string;
        business_name: string;
        role: string;
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getMe: () => this.request<any>('/auth/me'),
  };

  // Products
  products = {
    list: (params?: { category_id?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.category_id) query.append('category_id', params.category_id);
      if (params?.search) query.append('search', params.search);
      const qStr = query.toString();
      return this.request<any[]>(`/products${qStr ? `?${qStr}` : ''}`);
    },

    get: (id: string) => this.request<any>(`/products/${id}`),

    create: (data: any) =>
      this.request<any>('/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, updates: any) =>
      this.request<any>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),

    delete: (id: string) =>
      this.request<void>(`/products/${id}`, {
        method: 'DELETE',
      }),
  };

  // Categories
  categories = {
    list: () => this.request<any[]>('/categories'),
    create: (data: { name_am: string; description?: string }) =>
      this.request<any>('/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<void>(`/categories/${id}`, {
        method: 'DELETE',
      }),
  };

  // Inventory
  inventory = {
    listWarehouses: () => this.request<any[]>('/inventory/warehouses'),
    createWarehouse: (data: any) =>
      this.request<any>('/inventory/warehouses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    adjustStock: (data: {
      product_id: string;
      warehouse_id: string;
      new_quantity: number;
      reason: string;
      notes?: string;
    }) =>
      this.request<{ success: boolean; message: string }>('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    listMovements: (limit = 100) =>
      this.request<any[]>(`/inventory/movements?limit=${limit}`),
  };

  // Sales (POS)
  sales = {
    create: (data: {
      warehouse_id: string;
      customer_name?: string;
      payment_method: string;
      items: Array<{
        product_id: string;
        quantity: number;
        unit_price: number;
        discount_percent: number;
      }>;
      notes?: string;
    }) =>
      this.request<any>('/sales', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    list: (params?: { warehouse_id?: string; limit?: number }) => {
      const query = new URLSearchParams();
      if (params?.warehouse_id) query.append('warehouse_id', params.warehouse_id);
      if (params?.limit) query.append('limit', String(params.limit));
      const qStr = query.toString();
      return this.request<any[]>(`/sales${qStr ? `?${qStr}` : ''}`);
    },

    get: (id: string) => this.request<any>(`/sales/${id}`),
  };

  // Employees
  employees = {
    list: () => this.request<any[]>('/employees'),
    create: (data: any) =>
      this.request<any>('/employees', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, updates: any) =>
      this.request<any>(`/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
  };

  // Reports
  reports = {
    getSummary: (params?: { warehouse_id?: string }) => {
      const query = new URLSearchParams();
      if (params?.warehouse_id && params.warehouse_id !== 'all') {
        query.append('warehouse_id', params.warehouse_id);
      }
      const qStr = query.toString();
      return this.request<any>(`/reports/summary${qStr ? `?${qStr}` : ''}`);
    },
    getTrends: (days = 14) =>
      this.request<any[]>(`/reports/trends?days=${days}`),
  };
}

export const apiClient = new ApiClient();
