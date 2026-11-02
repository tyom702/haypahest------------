import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  Warehouse,
  Receipt,
  Save,
  RotateCcw,
  Download,
  Plus,
  Edit2,
  Check,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { CompanySettings } from '../types';

export const SettingsPage: React.FC = () => {
  const {
    companySettings,
    warehouses,
    updateCompanySettings,
    addWarehouse,
    updateWarehouse,
    exportDataJson,
    addToast,
  } = useApp();

  const [settingsForm, setSettingsForm] = useState<CompanySettings>(companySettings);
  const [isAddWarehouseOpen, setIsAddWarehouseOpen] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({
    nameAm: '',
    code: '',
    address: 'ք. Երևան, ',
    phone: '+374 ',
    manager: '',
    isDefault: false,
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings(settingsForm);
  };

  const handleAddWarehouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarehouse.nameAm.trim()) return;
    addWarehouse(newWarehouse);
    setIsAddWarehouseOpen(false);
    setNewWarehouse({
      nameAm: '',
      code: '',
      address: 'ք. Երևան, ',
      phone: '+374 ',
      manager: '',
      isDefault: false,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Համակարգային Կարգավորումներ
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Ընկերության իրավաբանական տվյալներ, ՀՎՀՀ, հարկային ռեժիմ, բանկային ռեկվիզիտներ և պահեստներ
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Company & Fiscal Settings (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Կազմակերպության Իրավաբանական Տվյալներ
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Կազմակերպության Անվանում *
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.companyName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, companyName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ամբողջական Իրավաբանական Անվանում
                </label>
                <input
                  type="text"
                  value={settingsForm.legalName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, legalName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ՀՎՀՀ (8 նիշ) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={settingsForm.hvhh}
                  onChange={(e) => setSettingsForm({ ...settingsForm, hvhh: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Հարկային Համակարգ (Ռեժիմ)
                </label>
                <select
                  value={settingsForm.taxSystem}
                  onChange={(e) => setSettingsForm({ ...settingsForm, taxSystem: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="vat">ԱԱՀ վճարող (20%)</option>
                  <option value="turnover">Շրջանառության հարկ (5%)</option>
                  <option value="micro">Միկրոձեռնարկատիրություն (0%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Հեռախոսահամար
                </label>
                <input
                  type="text"
                  value={settingsForm.phone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Էլ. Փոստ
                </label>
                <input
                  type="email"
                  value={settingsForm.email}
                  onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Իրավաբանական Հասցե
                </label>
                <input
                  type="text"
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Սպասարկող Բանկ
                </label>
                <input
                  type="text"
                  value={settingsForm.bankName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bankName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Բանկային Հաշվեհամար (16 նիշ)
                </label>
                <input
                  type="text"
                  value={settingsForm.bankAccount}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bankAccount: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ընթացիկ Ակտիվ Գանձապահ / Օպերատոր
                </label>
                <input
                  type="text"
                  value={settingsForm.activeCashier}
                  onChange={(e) => setSettingsForm({ ...settingsForm, activeCashier: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ՀԴՄ Կտրոնի Վերջաբանի Տեքստ
                </label>
                <textarea
                  rows={2}
                  value={settingsForm.receiptFooterText}
                  onChange={(e) => setSettingsForm({ ...settingsForm, receiptFooterText: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Պահպանել Կարգավորումները</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Warehouses & System Tools (1 col) */}
        <div className="space-y-6">
          {/* Warehouses management */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wide">
                  Պահեստներ և Մասնաճյուղեր ({warehouses.length})
                </h4>
              </div>
              <button
                onClick={() => setIsAddWarehouseOpen(true)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ավելացնել</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {warehouses.map((w) => (
                <div key={w.id} className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{w.nameAm}</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">
                      {w.code}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{w.address}</div>
                  <div className="text-[10px] text-slate-400">
                    Պատասխանատու՝ {w.manager} · {w.phone}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add warehouse modal */}
          {isAddWarehouseOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 w-full max-w-sm space-y-4">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Ավելացնել Նոր Պահեստ կամ Մասնաճյուղ
                </h4>
                <form onSubmit={handleAddWarehouseSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Պահեստի Անվանում *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="օր.` Վանաձորի Մասնաճյուղ"
                      value={newWarehouse.nameAm}
                      onChange={(e) => setNewWarehouse({ ...newWarehouse, nameAm: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Կոդ (e.g. VAN-04)
                    </label>
                    <input
                      type="text"
                      placeholder="VAN-04"
                      value={newWarehouse.code}
                      onChange={(e) => setNewWarehouse({ ...newWarehouse, code: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Հասցե
                    </label>
                    <input
                      type="text"
                      value={newWarehouse.address}
                      onChange={(e) => setNewWarehouse({ ...newWarehouse, address: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Պատասխանատու
                    </label>
                    <input
                      type="text"
                      value={newWarehouse.manager}
                      onChange={(e) => setNewWarehouse({ ...newWarehouse, manager: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsAddWarehouseOpen(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400"
                    >
                      Չեղարկել
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                    >
                      Ավելացնել
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* System maintenance */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-3">
            <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wide pb-2 border-b border-slate-200 dark:border-slate-800">
              Անվտանգություն և Պահուստավորում
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Բոլոր գործարքներն ու մնացորդները պահպանվում են իրական բազայում: Դուք կարող եք արտահանել ամբողջական JSON backup ցանկացած պահի:
            </p>
            <button
              onClick={() => {
                const json = exportDataJson();
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `haypahest_backup_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                addToast('Պահուստավորում', 'Արտահանումը հաջողությամբ կատարվեց', 'success');
              }}
              className="w-full py-2.5 px-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Արտահանել Պահուստային Ֆայլ (Backup)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
