import React from 'react';
import { SaleTransaction } from '../../types';
import { useApp } from '../../context/AppContext';
import { Printer, X, Check, FileText } from 'lucide-react';
import { salesService } from '../../services/salesService';

interface ReceiptModalProps {
  transaction: SaleTransaction | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  const { companySettings, warehouses } = useApp();

  if (!transaction) return null;

  const warehouse = warehouses.find((w) => w.id === transaction.warehouseId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Վաճառքի Տեղեկանք (Ոչ ֆիսկալ)
              </h3>
              <p className="text-[11px] text-slate-500 font-sans">
                Ներքին հաշվառման փաստաթուղթ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Body (Printable area) */}
        <div id="printable-receipt" className="flex-1 overflow-y-auto p-6 font-mono text-xs text-slate-800 space-y-4 bg-white">
          {/* Header section with Store info */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
            <p className="font-bold text-sm tracking-wide text-slate-900 uppercase font-sans">
              {companySettings.companyName}
            </p>
            <p className="text-[11px] text-slate-600">{companySettings.legalName}</p>
            <p className="text-[11px] text-slate-700">
              ՀՎՀՀ՝ <span className="font-bold font-mono">{companySettings.hvhh}</span>
            </p>
            <p className="text-[11px] text-slate-600">
              {warehouse ? warehouse.address : companySettings.address}
            </p>
            <p className="text-[11px] text-slate-500 font-sans">
              Հեռախոս՝ {warehouse?.phone || companySettings.phone}
            </p>

            {/* Non-fiscal disclaimer banner */}
            <div className="mt-2.5 px-2 py-1 rounded bg-slate-100 border border-slate-300 text-[10px] text-slate-600 font-sans font-semibold tracking-wide">
              ՎԱՃԱՌՔԻ ՏԵՂԵԿԱՆՔ · ՈՉ ՖԻՍԿԱԼ
              <div className="text-[9px] font-normal text-slate-500 mt-0.5">
                Չի հանդիսանում ՀՀ ՊԵԿ պաշտոնական ՀԴՄ կտրոն
              </div>
            </div>
          </div>

          {/* Transaction Metadata */}
          <div className="space-y-1 py-1 text-[11px] border-b border-dashed border-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Տեղեկանքի / Կտրոնի №՝</span>
              <span className="font-bold text-slate-900">{transaction.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Գործարքի ID՝</span>
              <span className="font-mono text-slate-700">{transaction.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Ամսաթիվ / Ժամ՝</span>
              <span>{new Date(transaction.date).toLocaleString('hy-AM', { hour12: false })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Աշխատակից / Գանձապահ՝</span>
              <span>{transaction.cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Պահեստ / Սրահ՝</span>
              <span>{warehouse?.nameAm || 'Գլխավոր'}</span>
            </div>
            {transaction.customerName && (
              <div className="flex justify-between pt-1 border-t border-slate-100">
                <span className="text-slate-500 font-sans">Հաճախորդ՝</span>
                <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                  {transaction.customerName}
                </span>
              </div>
            )}
          </div>

          {/* Purchased Products Table */}
          <div className="space-y-2 py-2 border-b border-dashed border-slate-300">
            <div className="grid grid-cols-12 gap-1 font-semibold text-[11px] text-slate-500 border-b border-slate-200 pb-1 font-sans">
              <span className="col-span-6">Ապրանք</span>
              <span className="col-span-2 text-right">Քնկ</span>
              <span className="col-span-4 text-right">Գումար</span>
            </div>
            {transaction.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5 text-[11px]">
                <div className="font-sans font-medium text-slate-900 truncate">
                  {item.productName}
                </div>
                <div className="grid grid-cols-12 gap-1 text-slate-600">
                  <span className="col-span-6 text-[10px] text-slate-400 font-mono">
                    {item.sku}
                  </span>
                  <span className="col-span-2 text-right font-mono">
                    {item.quantity} {item.unit}
                  </span>
                  <span className="col-span-4 text-right font-mono font-semibold text-slate-900">
                    {item.total.toLocaleString()} ֏
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Financial Totals */}
          <div className="space-y-1.5 py-2 text-[11px] border-b border-dashed border-slate-300">
            <div className="flex justify-between text-slate-600 font-sans">
              <span>Ենթահանրագումար՝</span>
              <span className="font-mono">{transaction.subtotal.toLocaleString()} ֏</span>
            </div>
            {transaction.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-700 font-sans font-medium">
                <span>Զեղչ՝</span>
                <span className="font-mono">-{transaction.discountTotal.toLocaleString()} ֏</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500 font-sans">
              <span>Հաշվարկված ԱԱՀ ({(companySettings.vatRate ? Math.round(companySettings.vatRate * 100) : (companySettings.vatPercent || 20))}%)՝</span>
              <span className="font-mono">{transaction.taxTotal.toLocaleString()} ֏</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200 font-sans">
              <span>ԸՆԴԱՄԵՆԸ՝</span>
              <span className="font-mono text-base text-emerald-700">
                {transaction.total.toLocaleString()} ֏
              </span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-1 py-1 text-[11px] border-b border-dashed border-slate-300 font-sans">
            <div className="flex justify-between">
              <span className="text-slate-500">Վճարման եղանակ՝</span>
              <span className="font-semibold text-slate-900">
                {salesService.getPaymentMethodLabel(transaction.paymentMethod)}
              </span>
            </div>
            {transaction.amountTendered !== undefined && transaction.amountTendered > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500">Տրված կանխիկ՝</span>
                  <span className="font-mono">{transaction.amountTendered.toLocaleString()} ֏</span>
                </div>
                <div className="flex justify-between font-semibold text-emerald-700">
                  <span>Մանր՝</span>
                  <span className="font-mono">{(transaction.changeDue || 0).toLocaleString()} ֏</span>
                </div>
              </>
            )}
          </div>

          {/* Footer message */}
          <div className="pt-2 text-center space-y-1">
            <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
              {companySettings.receiptFooterText || 'Շնորհակալություն գնումների համար:'}
            </p>
            <p className="text-[9px] text-slate-400 font-sans">
              ՀայՊահեստ (HayPahest) · Ներքին Հաշվառման Համակարգ
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-slate-50 border-t border-slate-200 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <Check className="w-4 h-4" />
            <span>Գործարքը գրանցված է</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Փակել
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Տպել Տեղեկանքը</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
