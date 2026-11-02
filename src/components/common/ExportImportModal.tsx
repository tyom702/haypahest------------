import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Download, Upload, RotateCcw, X, FileSpreadsheet, FileJson } from 'lucide-react';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({ isOpen, onClose }) => {
  const {
    products,
    categories,
    exportDataJson,
    importDataJson,
    addToast,
  } = useApp();

  const [importJsonText, setImportJsonText] = useState('');

  if (!isOpen) return null;

  // Export full JSON file
  const handleDownloadJson = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `haypahest_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Արտահանում', 'Տվյալների ամբողջական պահուստային ֆայլը (JSON) ներբեռնվեց');
  };

  // Export Products to CSV (with UTF-8 BOM so Excel opens Armenian characters correctly!)
  const handleDownloadProductsCsv = () => {
    const headers = [
      'Արտիկուլ',
      'Շտրիխ-կոդ',
      'Անվանում',
      'Կատեգորիա',
      'Չափման միավոր',
      'Ինքնարժեք (֏)',
      'Մանրածախ գին (֏)',
      'Մեծածախ գին (֏)',
      'Ընդհանուր մնացորդ',
    ];

    const rows = products.map((p) => {
      const cat = categories.find((c) => c.id === p.categoryId)?.nameAm || '';
      const totalStock = Object.values(p.warehouseStock).reduce((acc, qty) => acc + qty, 0);
      return [
        `"${p.sku}"`,
        `"${p.barcode}"`,
        `"${p.nameAm.replace(/"/g, '""')}"`,
        `"${cat}"`,
        `"${p.unit}"`,
        p.costPrice,
        p.sellingPrice,
        p.wholesalePrice,
        totalStock,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `haypahest_products_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Արտահանում', 'Ապրանքների ցուցակը (CSV/Excel) ներբեռնվեց');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportJsonText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    if (!importJsonText.trim()) return;
    const success = importDataJson(importJsonText);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-900 text-sm">
            Տվյալների Պահուստավորում, Արտահանում և Վերականգնում
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Section 1: Export */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              1. Արտահանում (Export)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownloadJson}
                className="flex items-center gap-3 p-3.5 border border-slate-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600">
                    Ամբողջական Backup (JSON)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Բոլոր ապրանքները, վաճառքները, գործընկերները
                  </p>
                </div>
              </button>

              <button
                onClick={handleDownloadProductsCsv}
                className="flex items-center gap-3 p-3.5 border border-slate-200 rounded-lg hover:border-emerald-400 hover:bg-emerald-50/30 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 group-hover:text-emerald-600">
                    Ապրանքների Ֆայլ (Excel/CSV)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Հայերեն աղյուսակ՝ գներով և մնացորդներով
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Import */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              2. Ներմուծում (Import Backup)
            </h4>
            <div className="space-y-2">
              <label className="block text-xs text-slate-600">
                Ընտրեք նախկինում պահպանված .json ֆայլը կամ տեղադրեք JSON կոդը՝
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
              />
              <textarea
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="կամ տեղադրեք JSON կոդն այստեղ..."
                rows={3}
                className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
              {importJsonText && (
                <button
                  onClick={handleApplyImport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Հաստատել և Ներմուծել Տվյալները</span>
                </button>
              )}
            </div>
          </div>


        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Փակել
          </button>
        </div>
      </div>
    </div>
  );
};
