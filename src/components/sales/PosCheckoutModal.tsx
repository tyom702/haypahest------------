import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod, SaleItem, Customer } from '../../types';
import {
  X,
  CreditCard,
  Banknote,
  Building2,
  Check,
  AlertTriangle,
  User,
  Loader2,
  Receipt,
  Sparkles
} from 'lucide-react';
import { formatAMD } from '../../utils/formatters';

interface PosCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: SaleItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
  onConfirmSale: (data: {
    paymentMethod: PaymentMethod;
    amountTendered?: number;
    changeDue?: number;
    notes?: string;
  }) => Promise<void>;
}

export const PosCheckoutModal: React.FC<PosCheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  subtotal,
  discountTotal,
  taxTotal,
  total,
  selectedCustomerId,
  onSelectCustomer,
  onConfirmSale,
}) => {
  const { customers, companySettings } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountTendered, setAmountTendered] = useState<number>(total);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmountTendered(total);
      setIsSubmitting(false);
      setErrorMsg('');
      setNotes('');
    }
  }, [isOpen, total]);

  if (!isOpen) return null;

  const tenderedNum = Number(amountTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - total);
  const isInsufficientCash = paymentMethod === 'cash' && tenderedNum < total;

  const quickCashOptions = [
    { label: 'Ճշգրիտ', value: total },
    { label: '5,000 ֏', value: 5000 },
    { label: '10,000 ֏', value: 10000 },
    { label: '20,000 ֏', value: 20000 },
    { label: '50,000 ֏', value: 50000 },
  ].filter((opt) => opt.value >= total || opt.label === 'Ճշգրիտ');

  const handleSelectQuickCash = (val: number) => {
    setAmountTendered(val);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return; // Prevent duplicate submission

    if (isInsufficientCash) {
      setErrorMsg('Տրված կանխիկ գումարը չի կարող պակաս լինել վճարման ենթակա գումարից:');
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirmSale({
        paymentMethod,
        amountTendered: paymentMethod === 'cash' ? tenderedNum : undefined,
        changeDue: paymentMethod === 'cash' ? changeDue : undefined,
        notes: notes.trim() || undefined,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Գործարքը ձևակերպելիս առաջացավ սխալ:');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Վաճառքի Ձևակերպում և Վճարում
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Զամբյուղում առկա է {cart.length} ապրանքային դիրք
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Big Total Payable Banner */}
          <div className="p-5 rounded-2xl bg-emerald-600 text-white flex items-center justify-between shadow-xs">
            <div>
              <span className="text-xs text-emerald-100 font-medium uppercase tracking-wider block">
                Վճարման ենթակա գումար
              </span>
              <div className="text-3xl font-extrabold font-mono tracking-tight mt-1">
                {formatAMD(total)}
              </div>
            </div>
            <div className="text-right text-xs text-emerald-100 space-y-0.5">
              <div>Ենթահանրագումար՝ {formatAMD(subtotal)}</div>
              {discountTotal > 0 && <div className="text-emerald-200 font-bold">Զեղչ՝ -{formatAMD(discountTotal)}</div>}
              <div className="text-[11px] opacity-80">Ներառյալ ԱԱՀ՝ {formatAMD(taxTotal)}</div>
            </div>
          </div>

          {/* Customer Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Գնորդ / Հաճախորդ</span>
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => onSelectCustomer(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
            >
              <option value="">-- Մանրածախ (Անհատ գնորդ) --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameAm} {c.hvhh ? `(ՀՎՀՀ՝ ${c.hvhh})` : ''} · Պարտք՝ {formatAMD(c.balanceDebt)}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Selection (3 Required options: Կանխիկ, Քարտով, Բանկային փոխանցում) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Վճարման Եղանակ *
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Cash */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('cash');
                  setAmountTendered(total);
                  setErrorMsg('');
                }}
                className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span className="text-xs">Կանխիկ</span>
              </button>

              {/* Card */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('card');
                  setAmountTendered(total);
                  setErrorMsg('');
                }}
                className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">Քարտով</span>
              </button>

              {/* Bank Transfer */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('bank_transfer');
                  setAmountTendered(total);
                  setErrorMsg('');
                }}
                className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'bank_transfer'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span className="text-xs">Փոխանցում</span>
              </button>
            </div>
          </div>

          {/* Cash Details with Change Calculator */}
          {paymentMethod === 'cash' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Տրված Կանխիկ Գումար (֏)
                </label>
                <span className="text-[11px] text-slate-500">
                  Վճարման ենթակա՝ {formatAMD(total)}
                </span>
              </div>

              <input
                type="number"
                min={0}
                step="any"
                value={amountTendered || ''}
                onChange={(e) => {
                  setAmountTendered(parseFloat(e.target.value) || 0);
                  setErrorMsg('');
                }}
                className="w-full px-3.5 py-2.5 text-base font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />

              {/* Quick Cash Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {quickCashOptions.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleSelectQuickCash(opt.value)}
                    className="px-2.5 py-1 text-xs font-semibold font-mono bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors text-slate-800 dark:text-slate-200"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Change due line */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Վերադարձվող Մանր.
                </span>
                <span className={`text-base font-bold font-mono ${
                  isInsufficientCash
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {isInsufficientCash ? `Պակասում է ${formatAMD(total - tenderedNum)}` : formatAMD(changeDue)}
                </span>
              </div>
            </div>
          )}

          {/* Card Info Note */}
          {paymentMethod === 'card' && (
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 shrink-0 text-blue-600" />
              <span>
                Գանձումը կատարվում է բանկային POS տերմինալով (ArCa, Visa, Mastercard): Հաստատեք գործարքը տերմինալում:
              </span>
            </div>
          )}

          {/* Bank Transfer Info Note */}
          {paymentMethod === 'bank_transfer' && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="font-semibold text-slate-900 dark:text-white">
                Բանկային ռեկվիզիտներ փոխանցման համար.
              </div>
              <div className="text-slate-600 dark:text-slate-400 font-mono">
                {companySettings.bankName} · Հ/Հ՝ {companySettings.bankAccount}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Լրացուցիչ Նշումներ (Ընտրովի)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="օր.՝ Զեղչի պատճառ, առաքման հասցե կամ պատվերի №..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          {/* Non-fiscal note reminder */}
          <div className="text-[11px] text-slate-400 text-center">
            Վաճառքը կգրանցվի համակարգում, ապրանքները կելքագրվեն պահեստից և կստեղծվի վաճառքի տեղեկանք:
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
            >
              Չեղարկել
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isInsufficientCash}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition-colors ${
                isSubmitting || isInsufficientCash
                  ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Գրանցվում է...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Հաստատել Վաճառքը ({formatAMD(total)})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
