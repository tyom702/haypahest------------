import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  Plus,
  Phone,
  Mail,
  MapPin,
  Building2,
  DollarSign,
  CreditCard,
  Edit2,
  X,
  CheckCircle2,
  Award
} from 'lucide-react';
import { Customer } from '../types';
import { formatAMD } from '../utils/formatters';

export const CustomersPage: React.FC = () => {
  const { customers, transactions, addCustomer, updateCustomer, settleCustomerDebt } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [settlingCustomer, setSettlingCustomer] = useState<Customer | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'debtors' | 'wholesale'>('all');

  const [formData, setFormData] = useState({
    nameAm: '',
    customerType: 'retail' as 'retail' | 'wholesale' | 'corporate',
    hvhh: '',
    phone: '+374 ',
    email: '',
    address: 'ք. Երևան, ',
  });

  const resetForm = () => {
    setFormData({
      nameAm: '',
      customerType: 'retail',
      hvhh: '',
      phone: '+374 ',
      email: '',
      address: 'ք. Երևան, ',
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      nameAm: c.nameAm,
      customerType: c.customerType,
      hvhh: c.hvhh || '',
      phone: c.phone,
      email: c.email || '',
      address: c.address || '',
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameAm.trim() || !formData.phone.trim()) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData);
      setEditingCustomer(null);
    } else {
      addCustomer(formData);
      setIsAddModalOpen(false);
    }
  };

  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (settlingCustomer && settleAmount > 0) {
      settleCustomerDebt(settlingCustomer.id, settleAmount);
      setSettlingCustomer(null);
      setSettleAmount(0);
    }
  };

  const totalDebt = customers.reduce((acc, c) => acc + c.balanceDebt, 0);
  const totalSpentAll = customers.reduce((acc, c) => acc + c.totalSpent, 0);

  const filteredCustomers = customers.filter((c) => {
    if (activeTabFilter === 'debtors') return c.balanceDebt > 0;
    if (activeTabFilter === 'wholesale') return c.customerType === 'wholesale' || c.customerType === 'corporate';
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Հաճախորդներ և Դեբիտորական Պարտքեր (CRM)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Գնորդների տվյալներ, կորպորատիվ ՀՎՀՀ, ապառիկների և պարտքերի հաշվառում
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Ավելացնել Հաճախորդ</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Գրանցված Հաճախորդներ</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            {customers.length} գնորդ
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Մեծածախ և մանրածախ հաշվառում
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ընդհանուր Դեբիտորական Պարտք</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-2">
            {formatAMD(totalDebt)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Հետաձգված վճարումներ գնորդներից
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Գնումների Ընդհանուր Ծավալ</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {formatAMD(totalSpentAll)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Հաճախորդների բերած հասույթը
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTabFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
            activeTabFilter === 'all'
              ? 'bg-slate-900 dark:bg-slate-800 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Բոլորը ({customers.length})
        </button>
        <button
          onClick={() => setActiveTabFilter('debtors')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
            activeTabFilter === 'debtors'
              ? 'bg-rose-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Պարտք Ունեցողներ ({customers.filter((c) => c.balanceDebt > 0).length})
        </button>
        <button
          onClick={() => setActiveTabFilter('wholesale')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
            activeTabFilter === 'wholesale'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Մեծածախ / Կորպորատիվ ({customers.filter((c) => c.customerType !== 'retail').length})
        </button>
      </div>

      {/* Customers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCustomers.map((c) => {
          const typeMap = {
            retail: { text: 'Մանրածախ', color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300' },
            wholesale: { text: 'Մեծածախ', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' },
            corporate: { text: 'Կորպորատիվ', color: 'text-purple-700 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800' },
          };

          return (
            <div
              key={c.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {c.nameAm}
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold ${typeMap[c.customerType].color}`}>
                        {typeMap[c.customerType].text}
                      </span>
                    </div>
                    {c.hvhh && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        ՀՎՀՀ՝ <strong className="text-slate-700 dark:text-slate-300">{c.hvhh}</strong>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"
                    title="Խմբագրել"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{c.phone}</span>
                  </div>
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.email}</span>
                    </div>
                  )}
                  {c.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.address}</span>
                    </div>
                  )}
                  {c.loyaltyPoints !== undefined && (
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <Award className="w-3.5 h-3.5 shrink-0" />
                      <span>Բոնուսային միավորներ՝ {c.loyaltyPoints}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">Պարտքը մեզ՝</div>
                  <div className={`text-base font-bold font-mono tabular-nums ${
                    c.balanceDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {formatAMD(c.balanceDebt)}
                  </div>
                </div>

                {c.balanceDebt > 0 ? (
                  <button
                    onClick={() => {
                      setSettlingCustomer(c);
                      setSettleAmount(c.balanceDebt);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Մարել Պարտքը</span>
                  </button>
                ) : (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Պարտք չունի</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Customer Modal */}
      {(isAddModalOpen || editingCustomer) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {editingCustomer ? 'Խմբագրել Հաճախորդի Տվյալները' : 'Ավելացնել Նոր Հաճախորդ'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCustomer(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Հաճախորդի Անուն / Ընկերության Անվանում *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nameAm}
                  onChange={(e) => setFormData({ ...formData, nameAm: e.target.value })}
                  placeholder="օր.` «Նոր Տուն» ՍՊԸ կամ Արմեն Հովհաննիսյան"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Տեսակ
                  </label>
                  <select
                    value={formData.customerType}
                    onChange={(e) => setFormData({ ...formData, customerType: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="retail">Մանրածախ</option>
                    <option value="wholesale">Մեծածախ</option>
                    <option value="corporate">Կորպորատիվ (ՍՊԸ/ՓԲԸ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ՀՎՀՀ (առկայության դեպքում)
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    value={formData.hvhh}
                    onChange={(e) => setFormData({ ...formData, hvhh: e.target.value })}
                    placeholder="8 նիշ"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Հեռախոսահամար *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Էլ. Փոստ
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Հասցե
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCustomer(null);
                  }}
                  className="px-4 py-2 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  Չեղարկել
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
                >
                  Պահպանել
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Debt Modal */}
      {settlingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Գրանցել Պարտքի Մարում
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {settlingCustomer.nameAm}
              </p>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Ընթացիկ պարտք՝ {formatAMD(settlingCustomer.balanceDebt)}
              </p>
            </div>

            <form onSubmit={handleSettleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Մուտքագրվող Գումարը (֏)
                </label>
                <input
                  type="number"
                  min="1"
                  max={settlingCustomer.balanceDebt}
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-base font-bold font-mono border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSettlingCustomer(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400"
                >
                  Չեղարկել
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Գրանցել Մուտքը
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
