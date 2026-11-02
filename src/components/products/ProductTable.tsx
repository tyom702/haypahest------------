import React from 'react';
import { Product, Category } from '../../types';
import {
  Eye,
  Edit2,
  Scale,
  Trash2,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Barcode,
  Boxes,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatAMD } from '../../utils/formatters';

export type SortField = 'name' | 'stock' | 'sellingPrice' | 'costPrice' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

interface ProductTableProps {
  products: Product[];
  categories: Category[];
  selectedWarehouseId: string;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField) => void;
  onViewDetails: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onClearFilters: () => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  categories,
  selectedWarehouseId,
  sortField,
  sortDirection,
  onSortChange,
  onViewDetails,
  onAdjustStock,
  onEditProduct,
  onDeleteProduct,
  onClearFilters,
}) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [products.length, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProducts = React.useMemo(() => {
    return products.slice(startIndex, startIndex + pageSize);
  }, [products, startIndex, pageSize]);

  const getCategoryName = (catId: string) => {
    return categories.find((c) => c.id === catId)?.nameAm || 'Անկատեգորիա';
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
    );
  };

  if (products.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-4">
          <Boxes className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Ապրանքներ չեն գտնվել
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Ձեր նշած որոնման պարամետրերով կամ ընտրված պահեստում ապրանքներ չկան:
        </p>
        <button
          onClick={onClearFilters}
          className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
        >
          Մաքրել Բոլոր Ֆիլտրերը
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <th className="py-3.5 pl-6 pr-3">
                Ապրանք / SKU
              </th>

              <th className="py-3.5 px-3">
                Կատեգորիա
              </th>

              <th
                onClick={() => onSortChange('stock')}
                className="py-3.5 px-3 cursor-pointer group hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Մնացորդ</span>
                  {renderSortIndicator('stock')}
                </div>
              </th>

              <th
                onClick={() => onSortChange('costPrice')}
                className="py-3.5 px-3 cursor-pointer group hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Ինքնարժեք</span>
                  {renderSortIndicator('costPrice')}
                </div>
              </th>

              <th
                onClick={() => onSortChange('sellingPrice')}
                className="py-3.5 px-3 cursor-pointer group hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Վաճառքի Գին</span>
                  {renderSortIndicator('sellingPrice')}
                </div>
              </th>

              <th className="py-3.5 px-3 text-right">
                Պահեստի Արժեք
              </th>

              <th className="py-3.5 pr-6 pl-3 text-right">
                Գործողություններ
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Boxes className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <p className="font-medium text-xs text-slate-600 dark:text-slate-400">
                      Դուք դեռ ապրանքներ չեք ավելացրել կամ որոնմամբ համապատասխանություն չի գտնվել:
                    </p>
                    {onClearFilters && (
                      <button
                        type="button"
                        onClick={onClearFilters}
                        className="mt-1 text-xs text-emerald-600 hover:underline font-semibold"
                      >
                        Մաքրել որոնման ֆիլտրերը
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedProducts.map((p) => {
              const currentStock = selectedWarehouseId && selectedWarehouseId !== 'all'
                ? (p.warehouseStock[selectedWarehouseId] ?? 0)
                : Object.values(p.warehouseStock).reduce((sum, q) => sum + q, 0);

              const isOutOfStock = currentStock === 0;
              const isLowStock = currentStock > 0 && currentStock <= p.minStock;

              const totalValuation = currentStock * (p.costPrice || 0);
              const marginAMD = Math.max(0, p.sellingPrice - p.costPrice);
              const marginPercent = p.sellingPrice > 0 ? Math.round((marginAMD / p.sellingPrice) * 100) : 0;

              return (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Name, SKU, Barcode */}
                  <td className="py-3.5 pl-6 pr-3">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => onViewDetails(p)}
                        className="text-left font-semibold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-1"
                      >
                        {p.nameAm}
                      </button>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-slate-400">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">
                          {p.sku}
                        </span>
                        {p.barcode && (
                          <span className="flex items-center gap-0.5 text-slate-400">
                            <Barcode className="w-3 h-3" />
                            {p.barcode}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 font-medium">
                    <span className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {getCategoryName(p.categoryId)}
                    </span>
                  </td>

                  {/* Stock Quantity & Status Badge */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums text-sm">
                        {currentStock} {p.unit}
                      </span>

                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shrink-0">
                          <XCircle className="w-3 h-3" />
                          <span>Սպառված</span>
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Ցածր (≤{p.minStock})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Առկա</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Cost Price */}
                  <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {formatAMD(p.costPrice)}
                  </td>

                  {/* Selling Price & Margin */}
                  <td className="py-3.5 px-3 text-right">
                    <div className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                      {formatAMD(p.sellingPrice)}
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                      +{marginPercent}%
                    </div>
                  </td>

                  {/* Total Value */}
                  <td className="py-3.5 px-3 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                    {formatAMD(totalValuation)}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 pr-6 pl-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onViewDetails(p)}
                        title="Դիտել մանրամասները"
                        className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onAdjustStock(p)}
                        title="Ճշգրտել պահեստի մնացորդը"
                        className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                      >
                        <Scale className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditProduct(p)}
                        title="Խմբագրել ապրանքը"
                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteProduct(p)}
                        title="Հեռացնել ապրանքը"
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination / Count Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span>
            Ցուցադրված է <strong>{products.length === 0 ? 0 : Math.min(startIndex + 1, products.length)}</strong>–<strong>{Math.min(startIndex + pageSize, products.length)}</strong> / <strong>{products.length}</strong> ապրանք
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

        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Առկա է
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Ցածր մնացորդ
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Սպառված
          </span>
        </div>
      </div>
    </div>
  );
};
