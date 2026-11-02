import React from 'react';
import { Printer, X, Download, FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatAMD, formatDate, formatDateTime } from '../../utils/formatters';

export type ReportType = 'sales' | 'inventory' | 'products' | 'employees' | 'profit';

interface PrintableReportModalProps {
  reportType: ReportType;
  reportTitle: string;
  timeframeLabel: string;
  data: any;
  onClose: () => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
}

export const PrintableReportModal: React.FC<PrintableReportModalProps> = ({
  reportType,
  reportTitle,
  timeframeLabel,
  data,
  onClose,
  onExportExcel,
  onExportCSV,
}) => {
  const { companySettings } = useApp();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{reportTitle}</h3>
              <p className="text-[11px] text-slate-500 font-sans">
                Տպագրական ձևաչափ և PDF պահպանում
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
              title="Արտահանել Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel (.xlsx)</span>
            </button>
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
              title="Արտահանել CSV (.csv)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Տպել / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Container */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div
            id="printable-report"
            className="bg-white p-8 border border-slate-200 rounded-xl shadow-xs text-slate-900 text-xs space-y-6"
          >
            {/* Header section with business registration details */}
            <div className="border-b-2 border-slate-800 pb-5">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase">
                    {companySettings.companyName}
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">{companySettings.legalName}</p>
                  <p className="text-xs text-slate-700 mt-1 font-mono">
                    ՀՎՀՀ՝ <span className="font-bold">{companySettings.hvhh}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Հասցե՝ {companySettings.address} | Հեռ․՝ {companySettings.phone}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded bg-slate-900 text-white font-mono text-[11px] font-bold">
                    ՀԱՇՎԵՏՎՈՒԹՅՈՒՆ
                  </span>
                  <div className="mt-2 text-xs font-mono text-slate-500">
                    Կազմման ամսաթիվ՝ {formatDate(new Date().toISOString())}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Ժամանակահատված՝ <span className="font-semibold text-slate-800">{timeframeLabel}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Արժույթ՝ <span className="font-bold text-slate-800">ՀՀ Դրամ (֏)</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                  {reportTitle}
                </h2>
                <span className="text-[11px] text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                  ՀայՊահեստ Ֆինանսական Մոդուլ
                </span>
              </div>
            </div>

            {/* Render dynamic tables depending on reportType */}
            {reportType === 'sales' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg text-xs border border-slate-200">
                  <div>
                    <span className="text-slate-500 block">Ընդհանուր Հասույթ՝</span>
                    <span className="font-bold font-mono text-sm text-slate-950">
                      {formatAMD(data.summary?.periodRevenue || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Գործարքների Քանակ՝</span>
                    <span className="font-bold font-mono text-sm text-slate-950">
                      {data.summary?.periodTransactionsCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Միջին Գործարքի Արժեք՝</span>
                    <span className="font-bold font-mono text-sm text-slate-950">
                      {formatAMD(data.summary?.averageTransactionValue || 0)}
                    </span>
                  </div>
                </div>

                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                      <th className="py-2 px-2.5">Կտրոն / Ամսաթիվ</th>
                      <th className="py-2 px-2">Գանձապահ</th>
                      <th className="py-2 px-2">Հաճախորդ</th>
                      <th className="py-2 px-2">Եղանակ</th>
                      <th className="py-2 px-2 text-right">Միավորներ</th>
                      <th className="py-2 px-2 text-right">ԱԱՀ (֏)</th>
                      <th className="py-2 px-2.5 text-right">Ընդամենը (֏)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.transactions?.map((t: any) => (
                      <tr key={t.id}>
                        <td className="py-1.5 px-2.5 font-mono">
                          <div className="font-bold">{t.receiptNumber}</div>
                          <div className="text-[10px] text-slate-500">{formatDate(t.date)}</div>
                        </td>
                        <td className="py-1.5 px-2">{t.cashierName}</td>
                        <td className="py-1.5 px-2">{t.customerName || 'Մանրածախ'}</td>
                        <td className="py-1.5 px-2">{t.paymentMethod}</td>
                        <td className="py-1.5 px-2 text-right font-mono">
                          {t.items.reduce((s: number, i: any) => s + i.quantity, 0)}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono">{formatAMD(t.taxTotal)}</td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold">
                          {formatAMD(t.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === 'inventory' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg text-xs border border-slate-200">
                  <div>
                    <span className="text-slate-500 block">Ընդհանուր Ինքնարժեքային Ծավալ՝</span>
                    <span className="font-bold font-mono text-sm text-slate-950">
                      {formatAMD(data.summary?.inventoryCostValue || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Պահեստի Իրացման (Մանրածախ) Արժեք՝</span>
                    <span className="font-bold font-mono text-sm text-slate-950">
                      {formatAMD(data.summary?.inventoryRetailValue || 0)}
                    </span>
                  </div>
                </div>

                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                      <th className="py-2 px-2.5">Ապրանք</th>
                      <th className="py-2 px-2">Արտիկուլ</th>
                      <th className="py-2 px-2 text-right">Մնացորդ</th>
                      <th className="py-2 px-2 text-right">Ինքնարժեք</th>
                      <th className="py-2 px-2 text-right">Վաճառքի Գին</th>
                      <th className="py-2 px-2 text-right">Ընդհանուր Ինքնարժեք</th>
                      <th className="py-2 px-2.5 text-right">Ընդհանուր Իրացում</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.products?.map((p: any) => {
                      const stock = Object.values(p.warehouseStock || {}).reduce(
                        (a: number, b: any) => a + Number(b),
                        0
                      );
                      const costTotal = stock * p.costPrice;
                      const retailTotal = stock * p.sellingPrice;
                      return (
                        <tr key={p.id}>
                          <td className="py-1.5 px-2.5 font-medium">{p.nameAm}</td>
                          <td className="py-1.5 px-2 font-mono text-slate-600">{p.sku}</td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold">
                            {stock} {p.unit}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono">{formatAMD(p.costPrice)}</td>
                          <td className="py-1.5 px-2 text-right font-mono">
                            {formatAMD(p.sellingPrice)}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-semibold">
                            {formatAMD(costTotal)}
                          </td>
                          <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-950">
                            {formatAMD(retailTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === 'products' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600">
                  Ապրանքների դասակարգումն ըստ գեներացված հասույթի, վաճառված քանակի և շահութաբերության
                </p>
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                      <th className="py-2 px-2.5">Ապրանք</th>
                      <th className="py-2 px-2">Կատեգորիա</th>
                      <th className="py-2 px-2 text-right">Վաճառված Քանակ</th>
                      <th className="py-2 px-2 text-right">Հասույթ</th>
                      <th className="py-2 px-2 text-right">Ինքնարժեք</th>
                      <th className="py-2 px-2 text-right">Շահույթ</th>
                      <th className="py-2 px-2.5 text-right">Մարժա</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.productsPerformance?.map((p: any) => (
                      <tr key={p.productId}>
                        <td className="py-1.5 px-2.5 font-medium">
                          <div>{p.nameAm}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{p.sku}</div>
                        </td>
                        <td className="py-1.5 px-2 text-slate-600">{p.categoryName}</td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold">
                          {p.unitsSold} հատ
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono font-semibold">
                          {formatAMD(p.revenue)}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-slate-600">
                          {formatAMD(p.cogs)}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-950">
                          {formatAMD(p.grossProfit)}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold">
                          {p.profitMarginPercent}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === 'employees' && (
              <div className="space-y-4">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                      <th className="py-2 px-2.5">Աշխատակից</th>
                      <th className="py-2 px-2">Պաշտոն</th>
                      <th className="py-2 px-2 text-right">Գործարքների Քանակ</th>
                      <th className="py-2 px-2 text-right">Ընդհանուր Հասույթ</th>
                      <th className="py-2 px-2 text-right">Միջին Կտրոն</th>
                      <th className="py-2 px-2.5 text-right">Մասնաբաժին %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.employeesPerformance?.map((e: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-2 px-2.5 font-semibold text-slate-900">
                          {e.employeeName}
                        </td>
                        <td className="py-2 px-2 text-slate-600">{e.role}</td>
                        <td className="py-2 px-2 text-right font-mono font-bold">
                          {e.transactionsCount}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-slate-950">
                          {formatAMD(e.totalRevenue)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono">
                          {formatAMD(e.averageTicket)}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold">
                          {e.shareOfSalesPercent}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === 'profit' && (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-lg text-xs border border-slate-200">
                  <div>
                    <span className="text-slate-500 block">Ընդհանուր Հասույթ (Revenue)՝</span>
                    <span className="font-bold font-mono text-base text-slate-950">
                      {formatAMD(data.summary?.periodRevenue || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Ինքնարժեք (COGS)՝</span>
                    <span className="font-bold font-mono text-base text-slate-700">
                      {formatAMD(data.summary?.periodCogs || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Համախառն Շահույթ (Gross Profit)՝</span>
                    <span className="font-bold font-mono text-base text-emerald-700">
                      +{formatAMD(data.summary?.estimatedGrossProfit || 0)} ({data.summary?.profitMarginPercent || 0}%)
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-relaxed">
                  <span className="font-bold">Հաշվառման Ծանուցում և Սահմանափակումներ․ </span>
                  Համախառն շահույթը հաշվարկված է ապրանքների գրանցված գնման ինքնարժեքների հիման վրա
                  (Հասույթ - Ինքնարժեք): Հաշվետվությունը չի ներառում գործառնական լրացուցիչ ծախսերը
                  (վարձակալություն, աշխատավարձեր, կոմունալ վճարներ և շահութահարկ):
                </div>

                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                      <th className="py-2 px-2.5">Կատեգորիա</th>
                      <th className="py-2 px-2 text-right">Հասույթ</th>
                      <th className="py-2 px-2 text-right">Վաճառված Քանակ</th>
                      <th className="py-2 px-2.5 text-right">Մասնաբաժին Հասույթում</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.categoryShare?.map((c: any) => (
                      <tr key={c.categoryId}>
                        <td className="py-1.5 px-2.5 font-medium">{c.categoryName}</td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold">
                          {formatAMD(c.revenue)}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono">{c.unitsSold} հատ</td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold">
                          {c.percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Official Signature and Stamp Blocks */}
            <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-[11px] text-slate-700">
              <div>
                <p className="font-semibold text-slate-900">Տնօրեն՝ ____________________</p>
                <p className="text-[10px] text-slate-500 mt-0.5">ստորագրություն և ազգանուն</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">Գլխավոր Հաշվապահ՝ ____________________</p>
                <p className="text-[10px] text-slate-500 mt-0.5">ստորագրություն և ազգանուն / Կ․Տ․</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
