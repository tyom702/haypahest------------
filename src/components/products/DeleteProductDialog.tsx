import React from 'react';
import { Product } from '../../types';
import {
  X,
  AlertTriangle,
  Trash2,
  Boxes
} from 'lucide-react';
import { formatAMD } from '../../utils/formatters';

interface DeleteProductDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteProductDialog: React.FC<DeleteProductDialogProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !product) return null;

  const totalStock = Object.values(product.warehouseStock).reduce((sum, qty) => sum + qty, 0);
  const totalValuation = totalStock * product.costPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Հեռացնե՞լ Ապրանքը
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Այս գործողությունն անդառնալի է
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Դուք պատրաստվում եք ամբողջությամբ հեռացնել հետևյալ ապրանքը համակարգից.
          </p>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="font-bold text-sm text-slate-900 dark:text-white">
              {product.nameAm}
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span>SKU՝ {product.sku}</span>
              {product.barcode && <span>Շտրիխ-կոդ՝ {product.barcode}</span>}
            </div>
          </div>

          {/* Active Stock Warning */}
          {totalStock > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <strong>Ուշադրություն.</strong> Այս ապրանքը ներկայումս ունի{' '}
                <span className="font-bold font-mono underline">
                  {totalStock} {product.unit}
                </span>{' '}
                ակտիվ մնացորդ պահեստներում (Ընդհանուր արժեք՝ {formatAMD(totalValuation)}): Հեռացնելու դեպքում այն կհեռացվի նաև գույքագրման ընդհանուր հաշվեկշռից:
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Չեղարկել
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Այո, Հեռացնել Ապրանքը</span>
          </button>
        </div>
      </div>
    </div>
  );
};
