import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Truck,
  Plus,
  Phone,
  Mail,
  MapPin,
  Building2,
  DollarSign,
  CreditCard,
  Edit2,
  X,
  CheckCircle2
} from 'lucide-react';
import { Supplier } from '../types';

export const SuppliersPage: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, paySupplierDebt } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);

  const [formData, setFormData] = useState({
    nameAm: '',
    hvhh: '',
    contactPerson: '',
    phone: '+374 ',
    email: '',
    address: 'ք. Երևան, ',
  });

  const resetForm = () => {
    setFormData({
      nameAm: '',
      hvhh: '0' + Math.floor(1000000 + Math.random() * 8999999),
      contactPerson: '',
      phone: '+374 ',
      email: '',
      address: 'ք. Երևան, ',
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setFormData({
      nameAm: s.nameAm,
      hvhh: s.hvhh,
      contactPerson: s.contactPerson,
      phone: s.phone,
      email: s.email || '',
      address: s.address,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameAm.trim() || !formData.hvhh.trim()) return;

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, formData);
      setEditingSupplier(null);
    } else {
      addSupplier(formData);
      setIsAddModalOpen(false);
    }
  };

  const handlePayDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payingSupplier && payAmount > 0) {
      paySupplierDebt(payingSupplier.id, payAmount);
      setPayingSupplier(null);
      setPayAmount(0);
    }
  };

  const totalDebtAll = suppliers.reduce((acc, s) => acc + s.currentDebt, 0);
  const totalVolumeAll = suppliers.reduce((acc, s) => acc + s.totalPurchases, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Մատակարարների Ռեգիստր և Կրեդիտորական Պարտքեր
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Գործընկեր մատակարարների կոնտակտներ, ՀՎՀՀ, մատակարարումների ծավալներ և պարտքերի հաշվառում
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Ավելացնել Մատակարար</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Գործընկեր Մատակարարներ</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {suppliers.length} ընկերություն
          </div>
          <div className="text-[11px] text-slate-400 mt-1">ՀՀ ռեզիդենտ կազմակերպություններ</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Ընդհանուր Գնումների Ծավալ</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {totalVolumeAll.toLocaleString()} ֏
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Բոլոր ժամանակների մուտքերը</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Մեր Ընթացիկ Պարտքը (Կրեդիտորական)</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-600 mt-2">
            {totalDebtAll.toLocaleString()} ֏
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Ենթակա է վճարման մատակարարներին</div>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suppliers.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">
                    {s.nameAm}
                  </h3>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    ՀՎՀՀ՝ <strong className="text-slate-700">{s.hvhh}</strong>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEdit(s)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                  title="Խմբագրել"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Կոնտակտային անձ՝ {s.contactPerson}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{s.phone}</span>
                </div>
                {s.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{s.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{s.address}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">Մեր պարտքը՝</div>
                <div className={`text-base font-bold font-mono tabular-nums ${
                  s.currentDebt > 0 ? 'text-rose-600' : 'text-slate-800'
                }`}>
                  {s.currentDebt.toLocaleString()} ֏
                </div>
              </div>

              {s.currentDebt > 0 ? (
                <button
                  onClick={() => {
                    setPayingSupplier(s);
                    setPayAmount(s.currentDebt);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Մարել Պարտքը</span>
                </button>
              ) : (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Պարտք չկա</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Supplier Modal */}
      {(isAddModalOpen || editingSupplier) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-900 text-sm">
                {editingSupplier ? 'Խմբագրել Մատակարարի Տվյալները' : 'Ավելացնել Նոր Մատակարար'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingSupplier(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ընկերության Անվանում (Հայերեն) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nameAm}
                  onChange={(e) => setFormData({ ...formData, nameAm: e.target.value })}
                  placeholder="օր.` «Արմենիա Թրեյդինգ» ՍՊԸ"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ՀՎՀՀ (8 նիշ) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={formData.hvhh}
                    onChange={(e) => setFormData({ ...formData, hvhh: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Կոնտակտային Անձ
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Հեռախոսահամար *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Էլ. Փոստ
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Իրավաբանական / Գործունեության Հասցե
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingSupplier(null);
                  }}
                  className="px-4 py-2 text-xs text-slate-700 bg-white border border-slate-300 rounded-lg"
                >
                  Չեղարկել
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Պահպանել
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Debt Modal */}
      {payingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Մարել Պարտքը Մատակարարին
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                {payingSupplier.nameAm}
              </p>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Ընթացիկ պարտք՝ {payingSupplier.currentDebt.toLocaleString()} ֏
              </p>
            </div>

            <form onSubmit={handlePayDebtSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Վճարվող Գումարը (֏)
                </label>
                <input
                  type="number"
                  min="1"
                  max={payingSupplier.currentDebt}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-base font-bold font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPayingSupplier(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Չեղարկել
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Գրանցել Վճարումը
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
