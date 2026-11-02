import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Barcode, Scan, Search, X, Check, ArrowRight } from 'lucide-react';
import { Product } from '../../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (product: Product) => void;
  title?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanResult,
  title = 'Շտրիխ-կոդի Սկաներ',
}) => {
  const { products, selectedWarehouseId, warehouses } = useApp();
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputCode('');
      setErrorMsg('');
      setScannedProduct(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentWarehouse = warehouses.find((w) => w.id === selectedWarehouseId);

  const handleLookup = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    // Search by exact barcode or SKU
    const found = products.find(
      (p) =>
        p.barcode.toLowerCase() === trimmed.toLowerCase() ||
        p.sku.toLowerCase() === trimmed.toLowerCase()
    );

    if (found) {
      setScannedProduct(found);
      setErrorMsg('');
    } else {
      setScannedProduct(null);
      setErrorMsg(`«${trimmed}» կոդով ապրանք չգտնվեց համակարգում`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookup(inputCode);
  };

  const handleConfirm = () => {
    if (scannedProduct) {
      onScanResult(scannedProduct);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Scan input field with laser simulation */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Մուտքագրեք կամ սկանավորեք շտրիխ-կոդը (EAN-13 / Արտիկուլ)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Barcode className="w-5 h-5" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Օրինակ՝ 4850001002341 կամ HP-EL-01..."
                className="w-full pl-11 pr-24 py-2.5 text-sm font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                className="absolute inset-y-1 right-1 px-3.5 bg-slate-900 text-white text-xs font-medium rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Որոնել</span>
              </button>
            </div>
            {errorMsg && (
              <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
            )}
          </form>

          {/* Scanned product card preview */}
          {scannedProduct && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-mono font-medium text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded">
                    {scannedProduct.sku}
                  </span>
                  <h4 className="font-semibold text-slate-900 text-sm mt-1">
                    {scannedProduct.nameAm}
                  </h4>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-slate-900 font-mono">
                    {scannedProduct.sellingPrice.toLocaleString()} ֏
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Մեծածախ՝ {scannedProduct.wholesalePrice.toLocaleString()} ֏
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-indigo-100 text-xs text-slate-600">
                <span>
                  Մնացորդ ({currentWarehouse?.nameAm || 'Պահեստ'})՝
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {scannedProduct.warehouseStock[selectedWarehouseId] || 0} {scannedProduct.unit}
                </span>
              </div>

              <button
                onClick={handleConfirm}
                className="w-full mt-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Ընտրել և ավելացնել</span>
              </button>
            </div>
          )}

          {/* Quick-test barcode buttons (simulate actual warehouse scanning) */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <span className="text-xs font-medium text-slate-500">
              Արագ փորձարկման համար սեղմեք առկա շտրիխ-կոդերից մեկը՝
            </span>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {products.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setInputCode(p.barcode);
                    handleLookup(p.barcode);
                  }}
                  className="text-left p-2 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 rounded-md transition-colors text-xs group"
                >
                  <p className="font-medium text-slate-800 truncate group-hover:text-indigo-600">
                    {p.nameAm}
                  </p>
                  <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                    {p.barcode}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Չեղարկել
          </button>
          {scannedProduct && (
            <button
              onClick={handleConfirm}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <span>Ավելացնել</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
