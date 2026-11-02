import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Boxes,
  ShoppingCart,
  Users,
  Truck,
  ArrowRight,
  Command
} from 'lucide-react';
import { formatAMD } from '../../utils/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { products, customers, transactions, suppliers, selectedWarehouseId } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Keyboard shortcut listener (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();

  const matchedProducts = trimmed
    ? products
        .filter(
          (p) =>
            p.nameAm.toLowerCase().includes(trimmed) ||
            p.sku.toLowerCase().includes(trimmed) ||
            p.barcode.toLowerCase().includes(trimmed)
        )
        .slice(0, 4)
    : [];

  const matchedCustomers = trimmed
    ? customers
        .filter(
          (c) =>
            c.nameAm.toLowerCase().includes(trimmed) ||
            c.phone.includes(trimmed) ||
            (c.hvhh && c.hvhh.includes(trimmed))
        )
        .slice(0, 3)
    : [];

  const matchedTransactions = trimmed
    ? transactions
        .filter(
          (t) =>
            t.receiptNumber.toLowerCase().includes(trimmed) ||
            t.fiscalReceiptNumber.includes(trimmed) ||
            (t.customerName && t.customerName.toLowerCase().includes(trimmed))
        )
        .slice(0, 3)
    : [];

  const hasResults =
    matchedProducts.length > 0 ||
    matchedCustomers.length > 0 ||
    matchedTransactions.length > 0;

  const handleSelectProduct = (prodId: string) => {
    navigate('/products');
    onClose();
  };

  const handleSelectCustomer = (custId: string) => {
    navigate('/customers');
    onClose();
  };

  const handleSelectTransaction = (trxId: string) => {
    navigate('/reports');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Փնտրել ապրանքներ, գնորդներ, ՀԴՄ կտրոններ, կոդեր..."
            className="flex-1 text-sm bg-transparent border-0 focus:outline-hidden text-slate-900 dark:text-white placeholder:text-slate-400 font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            Esc
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!trimmed ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              <Command className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2 stroke-1" />
              <p className="font-medium">Համակարգային Գլոբալ Որոնում</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Մուտքագրեք անվանում, արտիկուլ, շտրիխ-կոդ կամ կտրոնի համար
              </p>
            </div>
          ) : !hasResults ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                «{query}» հարցումով ոչինչ չգտնվեց
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Ստուգեք տառասխալները կամ փորձեք այլ բառ
              </p>
            </div>
          ) : (
            <>
              {/* Products Category */}
              {matchedProducts.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Ապրանքներ</span>
                  </div>
                  {matchedProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProduct(p.id)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left group"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-xs text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {p.nameAm}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {p.sku} · {p.barcode} · Մնացորդ՝ {p.warehouseStock[selectedWarehouseId] || 0} {p.unit}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                          {formatAMD(p.sellingPrice)}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-2 inline group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Customers Category */}
              {matchedCustomers.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                    <Users className="w-3.5 h-3.5" />
                    <span>Հաճախորդներ</span>
                  </div>
                  {matchedCustomers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCustomer(c.id)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left group"
                    >
                      <div>
                        <p className="font-medium text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {c.nameAm}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {c.phone} {c.hvhh ? `· ՀՎՀՀ՝ ${c.hvhh}` : ''}
                        </p>
                      </div>
                      {c.balanceDebt > 0 && (
                        <span className="text-[11px] font-mono font-bold text-rose-600 dark:text-rose-400">
                          Պարտք՝ {formatAMD(c.balanceDebt)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Transactions Category */}
              {matchedTransactions.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Վաճառքներ և Կտրոններ</span>
                  </div>
                  {matchedTransactions.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTransaction(t.id)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left group"
                    >
                      <div>
                        <p className="font-mono font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {t.receiptNumber}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {t.customerName ? `Գնորդ՝ ${t.customerName}` : 'Մանրածախ վաճառք'} · ՀԴՄ՝ {t.fiscalReceiptNumber}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                        {formatAMD(t.total)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
