import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import {
  Search,
  Plus,
  Filter,
  FolderTree,
  Download,
  Boxes,
  Warehouse as WarehouseIcon,
  Database,
  ArrowUpDown
} from 'lucide-react';
import { productService, InventoryValuation } from '../services/productService';
import { ProductStatsCards } from '../components/products/ProductStatsCards';
import { ProductTable, SortField, SortDirection } from '../components/products/ProductTable';
import { ProductDetailsDrawer } from '../components/products/ProductDetailsDrawer';
import { StockAdjustmentModal } from '../components/products/StockAdjustmentModal';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { DeleteProductDialog } from '../components/products/DeleteProductDialog';
import { CategoryManagementModal } from '../components/products/CategoryManagementModal';

export const ProductsPage: React.FC = () => {
  const {
    products,
    categories,
    warehouses,
    selectedWarehouseId,
    deleteProduct,
    addToast,
  } = useApp();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [viewScope, setViewScope] = useState<'warehouse' | 'all'>('warehouse');

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Modals & Drawers State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const activeWarehouse = warehouses.find((w) => w.id === selectedWarehouseId);
  const effectiveWarehouseId = viewScope === 'warehouse' ? selectedWarehouseId : 'all';

  // 1. Calculate Valuation for the current scope
  const valuation: InventoryValuation = useMemo(() => {
    return productService.calculateValuation(products, effectiveWarehouseId);
  }, [products, effectiveWarehouseId]);

  // 2. Filter Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search check
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        p.nameAm.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        (p.barcode && p.barcode.toLowerCase().includes(query));

      // Category check
      const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;

      // Stock status check
      const stock = effectiveWarehouseId === 'all'
        ? Object.values(p.warehouseStock).reduce((sum, q) => sum + q, 0)
        : (p.warehouseStock[selectedWarehouseId] ?? 0);

      let matchesStock = true;
      if (stockStatusFilter === 'in_stock') {
        matchesStock = stock > p.minStock;
      } else if (stockStatusFilter === 'low_stock') {
        matchesStock = stock > 0 && stock <= p.minStock;
      } else if (stockStatusFilter === 'out_of_stock') {
        matchesStock = stock === 0;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, selectedCategory, stockStatusFilter, effectiveWarehouseId, selectedWarehouseId]);

  // 3. Sort Products
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.nameAm.localeCompare(b.nameAm, 'hy');
      } else if (sortField === 'stock') {
        const stockA = effectiveWarehouseId === 'all'
          ? Object.values(a.warehouseStock).reduce((sum, q) => sum + q, 0)
          : (a.warehouseStock[selectedWarehouseId] ?? 0);
        const stockB = effectiveWarehouseId === 'all'
          ? Object.values(b.warehouseStock).reduce((sum, q) => sum + q, 0)
          : (b.warehouseStock[selectedWarehouseId] ?? 0);
        comparison = stockA - stockB;
      } else if (sortField === 'sellingPrice') {
        comparison = a.sellingPrice - b.sellingPrice;
      } else if (sortField === 'costPrice') {
        comparison = a.costPrice - b.costPrice;
      } else if (sortField === 'createdAt') {
        comparison = (a.createdAt || '').localeCompare(b.createdAt || '');
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return list;
  }, [filteredProducts, sortField, sortDirection, effectiveWarehouseId, selectedWarehouseId]);

  // Handle Sort Change
  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Actions
  const handleOpenAddModal = () => {
    setProductToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setProductToEdit(p);
    setIsFormModalOpen(true);
  };

  const handleOpenAdjustModal = (p: Product) => {
    setAdjustingProduct(p);
  };

  const handleOpenDeleteModal = (p: Product) => {
    setDeletingProduct(p);
  };

  const handleConfirmDelete = () => {
    if (deletingProduct) {
      deleteProduct(deletingProduct.id);
      if (detailsProduct?.id === deletingProduct.id) {
        setDetailsProduct(null);
      }
      setDeletingProduct(null);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setStockStatusFilter('all');
  };

  // CSV Export with UTF-8 BOM
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Արտիկուլ (SKU)',
      'Շտրիխ-կոդ',
      'Ապրանքի Անվանում',
      'Կատեգորիա',
      'Չափման Միավոր',
      'Մնացորդ',
      'Նվազագույն Շեմ',
      'Ինքնարժեք (֏)',
      'Վաճառքի Գին (֏)',
      'Մեծածախ Գին (֏)',
      'Պահեստի Ընդհանուր Արժեք (֏)',
    ];

    const rows = sortedProducts.map((p) => {
      const cat = categories.find((c) => c.id === p.categoryId)?.nameAm || '';
      const stock = effectiveWarehouseId === 'all'
        ? Object.values(p.warehouseStock).reduce((sum, q) => sum + q, 0)
        : (p.warehouseStock[selectedWarehouseId] ?? 0);
      const totalVal = stock * p.costPrice;

      return [
        `"${p.id}"`,
        `"${p.sku}"`,
        `"${p.barcode || ''}"`,
        `"${p.nameAm.replace(/"/g, '""')}"`,
        `"${cat}"`,
        `"${p.unit}"`,
        stock,
        p.minStock,
        p.costPrice,
        p.sellingPrice,
        p.wholesalePrice,
        totalVal,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `HayPahest_Products_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Արտահանված է', 'Ապրանքների ցուցակը ներբեռնվեց CSV ձևաչափով');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Ապրանքների և Պահեստի Կառավարում
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <Database className="w-3 h-3" />
              <span>LocalStorage • FastAPI-ready</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ակտիվ պահեստ՝ <strong className="text-emerald-600 dark:text-emerald-400">{activeWarehouse?.nameAm}</strong> · Համակարգում ընդհանուր՝ {products.length} ապրանքային դիրք
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <FolderTree className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Կատեգորիաներ ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Արտահանել Excel (CSV)</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Ավելացնել Նոր Ապրանք</span>
          </button>
        </div>
      </div>

      {/* Scope Selector (Active Warehouse vs All Warehouses) */}
      <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewScope('warehouse')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              viewScope === 'warehouse'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {activeWarehouse?.nameAm || 'Ակտիվ Պահեստ'}
          </button>
          <button
            type="button"
            onClick={() => setViewScope('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              viewScope === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Բոլոր Պահեստները Միասին ({warehouses.length})
          </button>
        </div>

        <span className="text-[11px] text-slate-500 dark:text-slate-400 pr-3 hidden sm:inline">
          {viewScope === 'warehouse'
            ? `Ցուցադրվում են միայն ${activeWarehouse?.nameAm} պահեստի տվյալները`
            : 'Համախմբված տվյալներ բոլոր պահեստային հանգույցներից'}
        </span>
      </div>

      {/* 5 Inventory Valuation Statistics Cards */}
      <ProductStatsCards
        valuation={valuation}
        selectedFilter={stockStatusFilter}
        onFilterChange={setStockStatusFilter}
        warehouseName={viewScope === 'warehouse' ? activeWarehouse?.nameAm : 'Բոլոր Պահեստները'}
      />

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Որոնել ըստ անվանման, արտիկուլի (SKU) կամ շտրիխ-կոդի..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
          />
        </div>

        {/* Category & Status Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Dropdown */}
          <div className="relative shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
            >
              <option value="all">Բոլոր կատեգորիաները</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameAm}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setStockStatusFilter('all')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                stockStatusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Բոլորը
            </button>
            <button
              type="button"
              onClick={() => setStockStatusFilter('in_stock')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                stockStatusFilter === 'in_stock'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Առկա
            </button>
            <button
              type="button"
              onClick={() => setStockStatusFilter('low_stock')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                stockStatusFilter === 'low_stock'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Ցածր
            </button>
            <button
              type="button"
              onClick={() => setStockStatusFilter('out_of_stock')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                stockStatusFilter === 'out_of_stock'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Սպառված
            </button>
          </div>

          {/* Reset Filters */}
          {(searchTerm || selectedCategory !== 'all' || stockStatusFilter !== 'all') && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Մաքրել
            </button>
          )}
        </div>
      </div>

      {/* Main Professional Product Table */}
      <ProductTable
        products={sortedProducts}
        categories={categories}
        selectedWarehouseId={effectiveWarehouseId}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        onViewDetails={(p) => setDetailsProduct(p)}
        onAdjustStock={(p) => handleOpenAdjustModal(p)}
        onEditProduct={(p) => handleOpenEditModal(p)}
        onDeleteProduct={(p) => handleOpenDeleteModal(p)}
        onClearFilters={handleClearFilters}
      />

      {/* Product Details Drawer */}
      <ProductDetailsDrawer
        product={detailsProduct}
        isOpen={!!detailsProduct}
        onClose={() => setDetailsProduct(null)}
        onEdit={(p) => {
          setDetailsProduct(null);
          handleOpenEditModal(p);
        }}
        onAdjust={(p) => {
          setDetailsProduct(null);
          handleOpenAdjustModal(p);
        }}
        onDelete={(p) => {
          setDetailsProduct(null);
          handleOpenDeleteModal(p);
        }}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        product={adjustingProduct}
        isOpen={!!adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
      />

      {/* Add / Edit Product Modal */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        productToEdit={productToEdit}
        onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteProductDialog
        product={deletingProduct}
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Category Management Modal */}
      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </div>
  );
};
