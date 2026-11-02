import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeftRight,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileText,
  AlertOctagon,
  ClipboardList,
  Check,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { Product, StockMovement, InventoryAuditItem } from '../types';
import { formatAMD, formatDate, formatDateTime } from '../utils/formatters';

export const MovementsPage: React.FC = () => {
  const {
    products,
    warehouses,
    suppliers,
    movements,
    audits,
    selectedWarehouseId,
    addStockMovement,
    createAudit,
    applyAuditAdjustments,
    addToast,
  } = useApp();

  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'history' | 'in' | 'transfer' | 'write_off' | 'audit') || 'history';
  const initialProductParam = searchParams.get('product');

  const [activeTab, setActiveTab] = useState<'history' | 'in' | 'transfer' | 'write_off' | 'audit'>(initialTab);

  // Form states for In
  const [inSupplierId, setInSupplierId] = useState(suppliers[0]?.id || '');
  const [inWarehouseId, setInWarehouseId] = useState(selectedWarehouseId);
  const [inRefDoc, setInRefDoc] = useState(`ՀԱ-2026/${Math.floor(1000 + Math.random() * 9000)}`);
  const [inItems, setInItems] = useState<{ productId: string; quantity: number; unitCost: number }[]>([
    {
      productId: initialProductParam || products[0]?.id || '',
      quantity: 10,
      unitCost: products[0]?.costPrice || 1000,
    },
  ]);

  // Form states for Transfer
  const [transferSourceWh, setTransferSourceWh] = useState(warehouses[0]?.id || '');
  const [transferTargetWh, setTransferTargetWh] = useState(warehouses[1]?.id || warehouses[0]?.id || '');
  const [transferReason, setTransferReason] = useState('Մասնաճյուղի պահանջարկի համալրում');
  const [transferItems, setTransferItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: products[0]?.id || '', quantity: 5 },
  ]);

  // Form states for Write-off
  const [writeOffWh, setWriteOffWh] = useState(selectedWarehouseId);
  const [writeOffReason, setWriteOffReason] = useState('Ժամկետանց / Վնասված տարա');
  const [writeOffItems, setWriteOffItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: products[0]?.id || '', quantity: 1 },
  ]);

  // Form states for Stocktake
  const [auditWh, setAuditWh] = useState(selectedWarehouseId);
  const [auditCounts, setAuditCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    products.forEach((p) => {
      initial[p.id] = p.warehouseStock[selectedWarehouseId] || 0;
    });
    return initial;
  });

  const handleAddInItem = () => {
    setInItems([...inItems, { productId: products[0]?.id || '', quantity: 10, unitCost: products[0]?.costPrice || 1000 }]);
  };

  const handleRemoveInItem = (index: number) => {
    setInItems(inItems.filter((_, i) => i !== index));
  };

  const handleSubmitIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (inItems.length === 0) return;

    const formattedItems = inItems
      .map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod) return null;
        return {
          productId: prod.id,
          productName: prod.nameAm,
          sku: prod.sku,
          unit: prod.unit,
          quantity: Number(item.quantity) || 1,
          unitCost: Number(item.unitCost) || prod.costPrice,
          totalCost: (Number(item.quantity) || 1) * (Number(item.unitCost) || prod.costPrice),
        };
      })
      .filter((it): it is NonNullable<typeof it> => it !== null);

    if (formattedItems.length === 0) {
      addToast('Սխալ', 'Ընտրեք առնվազն մեկ վավեր ապրանք մուտքագրելու համար:', 'warning');
      return;
    }

    const totalCost = formattedItems.reduce((acc, it) => acc + it.totalCost, 0);

    addStockMovement({
      type: 'in',
      targetWarehouseId: inWarehouseId,
      supplierId: inSupplierId,
      items: formattedItems,
      totalCost,
      referenceDoc: inRefDoc,
      reason: 'Մատակարարում ըստ հաշիվ-ապրանքագրի',
    });

    addToast('Մուտքագրումը կատարվեց', `Գրանցվեց ${formattedItems.length} ապրանքի մուտք:`, 'success');
    setActiveTab('history');
  };

  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferSourceWh === transferTargetWh) {
      addToast('Տեղաշարժի սխալ', 'Ելքային և մուտքային պահեստները չեն կարող համընկնել:', 'warning');
      return;
    }

    const formattedItems = transferItems
      .map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod) return null;
        return {
          productId: prod.id,
          productName: prod.nameAm,
          sku: prod.sku,
          unit: prod.unit,
          quantity: Number(item.quantity) || 1,
          unitCost: prod.costPrice,
          totalCost: (Number(item.quantity) || 1) * prod.costPrice,
        };
      })
      .filter((it): it is NonNullable<typeof it> => it !== null);

    if (formattedItems.length === 0) {
      addToast('Սխալ', 'Ընտրեք առնվազն մեկ ապրանք տեղափոխման համար:', 'warning');
      return;
    }

    const totalCost = formattedItems.reduce((acc, it) => acc + it.totalCost, 0);

    addStockMovement({
      type: 'transfer',
      sourceWarehouseId: transferSourceWh,
      targetWarehouseId: transferTargetWh,
      items: formattedItems,
      totalCost,
      referenceDoc: `Տ-${Math.floor(100 + Math.random() * 900)}`,
      reason: transferReason,
    });

    addToast('Տեղաշարժը հաստատվեց', 'Ապրանքները հաջողությամբ տեղափոխվեցին նշված պահեստ:', 'success');
    setActiveTab('history');
  };

  const handleSubmitWriteOff = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedItems = writeOffItems
      .map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod) return null;
        return {
          productId: prod.id,
          productName: prod.nameAm,
          sku: prod.sku,
          unit: prod.unit,
          quantity: Number(item.quantity) || 1,
          unitCost: prod.costPrice,
          totalCost: (Number(item.quantity) || 1) * prod.costPrice,
        };
      })
      .filter((it): it is NonNullable<typeof it> => it !== null);

    if (formattedItems.length === 0) {
      addToast('Սխալ', 'Ընտրեք առնվազն մեկ ապրանք դուրսգրման համար:', 'warning');
      return;
    }

    const totalCost = formattedItems.reduce((acc, it) => acc + it.totalCost, 0);

    addStockMovement({
      type: 'write_off',
      sourceWarehouseId: writeOffWh,
      items: formattedItems,
      totalCost,
      referenceDoc: `ԱԿՏ-Դ/${Math.floor(10 + Math.random() * 90)}`,
      reason: writeOffReason,
    });

    addToast('Դուրսգրումը գրանցվեց', 'Ապրանքները դուրս գրվեցին պահեստային հաշվեկշռից:', 'info');
    setActiveTab('history');
  };

  const handleSaveAudit = () => {
    const auditItems: InventoryAuditItem[] = products.map((prod) => {
      const sysQty = prod.warehouseStock[auditWh] || 0;
      const actualQty = auditCounts[prod.id] !== undefined ? auditCounts[prod.id] : sysQty;
      const diff = actualQty - sysQty;
      return {
        productId: prod.id,
        productName: prod.nameAm,
        sku: prod.sku,
        unit: prod.unit,
        systemQty: sysQty,
        actualQty,
        difference: diff,
        unitCost: prod.costPrice,
        discrepancyValue: diff * prod.costPrice,
      };
    });

    const audit = createAudit(auditWh, auditItems, 'Պլանային գույքագրման ակտ');
    applyAuditAdjustments(audit.id);
    setActiveTab('history');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Պահեստ, Ապրանքների Շարժ և Գույքագրում
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Մատակարարումների մուտքագրում, միջպահեստային տեղաշարժեր, խոտանների դուրսգրում և գույքագրման հաշտեցում
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-xs">
        {[
          { id: 'history', label: 'Գործառնությունների Պատմություն', icon: FileText },
          { id: 'in', label: '+ Ապրանքի Մուտքագրում', icon: ArrowDownToLine },
          { id: 'transfer', label: 'Տեղաշարժ Պահեստների Միջև', icon: ArrowLeftRight },
          { id: 'write_off', label: 'Դուրսգրում (Խոտան)', icon: AlertOctagon },
          { id: 'audit', label: 'Գույքագրում (Stocktaking)', icon: ClipboardList },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wide">
              Գրանցված Շարժերի Ռեգիստր ({movements.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase">
                  <th className="py-3 px-4">Համար / Ամսաթիվ</th>
                  <th className="py-3 px-3">Տեսակ</th>
                  <th className="py-3 px-3">Ելքային / Մուտքային Պահեստ</th>
                  <th className="py-3 px-3">Ապրանքներ</th>
                  <th className="py-3 px-3 text-right">Ընդհանուր Արժեք</th>
                  <th className="py-3 px-4">Հիմք / Նշումներ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {movements.map((m) => {
                  const srcWh = warehouses.find((w) => w.id === m.sourceWarehouseId);
                  const tgtWh = warehouses.find((w) => w.id === m.targetWarehouseId);
                  const sup = suppliers.find((s) => s.id === m.supplierId);

                  const typeLabels = {
                    in: { text: 'Մուտքագրում', bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
                    out: { text: 'Ելքագրում', bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
                    transfer: { text: 'Տեղաշարժ', bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
                    write_off: { text: 'Դուրսգրում', bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
                    adjustment: { text: 'Ճշգրտում', bg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
                  };

                  const badge = typeLabels[m.type] || typeLabels.in;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">{m.movementNumber}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          {formatDateTime(m.date)}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${badge.bg}`}>
                          {badge.text}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {m.type === 'in' && (
                          <div className="text-[11px]">
                            <span className="text-slate-400">Մատակարար՝</span> <strong className="text-slate-800 dark:text-slate-200">{sup?.nameAm || '—'}</strong>
                            <div className="text-slate-500">Դեպի՝ {tgtWh?.nameAm}</div>
                          </div>
                        )}
                        {m.type === 'transfer' && (
                          <div className="text-[11px]">
                            <span>{srcWh?.nameAm}</span> → <strong className="text-slate-800 dark:text-slate-200">{tgtWh?.nameAm}</strong>
                          </div>
                        )}
                        {m.type === 'write_off' && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-400">
                            Պահեստ՝ {srcWh?.nameAm}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                          {m.items.map((it) => `${it.productName} (${it.quantity} ${it.unit})`).join(', ')}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {m.items.length} ապրանքային դիրք
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatAMD(m.totalCost)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold">{m.referenceDoc || '—'}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{m.reason || ''}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GOODS RECEIPT (IN) */}
      {activeTab === 'in' && (
        <form onSubmit={handleSubmitIn} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Ապրանքների Մուտքագրում Մատակարարից
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Գրանցում է պահեստային մնացորդի համալրումը և թարմացնում մատակարարի պարտքը
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Մատակարար Ընկերություն *
              </label>
              <select
                value={inSupplierId}
                onChange={(e) => setInSupplierId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nameAm} (ՀՎՀՀ՝ {s.hvhh})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ընդունող Պահեստ *
              </label>
              <select
                value={inWarehouseId}
                onChange={(e) => setInWarehouseId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nameAm}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Հիմք Փաստաթուղթ (Հաշիվ-Ապրանքագիր) *
              </label>
              <input
                type="text"
                required
                value={inRefDoc}
                onChange={(e) => setInRefDoc(e.target.value)}
                placeholder="օր.` ՀԱ-2026/8912"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Մուտքագրվող Ապրանքների Ցանկ
              </label>
              <button
                type="button"
                onClick={handleAddInItem}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ավելացնել տող</span>
              </button>
            </div>

            <div className="space-y-2">
              {inItems.map((item, idx) => {
                const prod = products.find((p) => p.id === item.productId);
                return (
                  <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <select
                      value={item.productId}
                      onChange={(e) => {
                        const newProdId = e.target.value;
                        const p = products.find((pr) => pr.id === newProdId);
                        const updated = [...inItems];
                        updated[idx].productId = newProdId;
                        if (p) updated[idx].unitCost = p.costPrice;
                        setInItems(updated);
                      }}
                      className="flex-1 w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nameAm} ({p.sku})
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          placeholder="Քանակ"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...inItems];
                            updated[idx].quantity = Number(e.target.value);
                            setInItems(updated);
                          }}
                          className="w-full text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-right"
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-10">{prod?.unit}</span>

                      <div className="w-32">
                        <input
                          type="number"
                          min="0"
                          placeholder="Գնման գին"
                          value={item.unitCost}
                          onChange={(e) => {
                            const updated = [...inItems];
                            updated[idx].unitCost = Number(e.target.value);
                            setInItems(updated);
                          }}
                          className="w-full text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-right"
                        />
                      </div>
                      <span className="text-xs text-slate-500">֏</span>

                      {inItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveInItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">
              Ընդհանուր գումար՝{' '}
              <strong className="text-sm font-bold text-slate-900 dark:text-white">
                {formatAMD(inItems.reduce((acc, it) => acc + it.quantity * it.unitCost, 0))}
              </strong>
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              Հաստատել Մուտքագրումը
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: TRANSFER */}
      {activeTab === 'transfer' && (
        <form onSubmit={handleSubmitTransfer} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Տեղաշարժ Պահեստների Միջև
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ապրանքների փոխանցում գլխավոր պահեստից դեպի մասնաճյուղ կամ խանութ-սրահ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ելքային Պահեստ (Որտեղից) *
              </label>
              <select
                value={transferSourceWh}
                onChange={(e) => setTransferSourceWh(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nameAm}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Մուտքային Պահեստ (Ուր) *
              </label>
              <select
                value={transferTargetWh}
                onChange={(e) => setTransferTargetWh(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nameAm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Տեղափոխվող Ապրանքներ
            </label>
            {transferItems.map((item, idx) => {
              const prod = products.find((p) => p.id === item.productId);
              const availableInSource = prod?.warehouseStock[transferSourceWh] || 0;

              return (
                <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <select
                    value={item.productId}
                    onChange={(e) => {
                      const updated = [...transferItems];
                      updated[idx].productId = e.target.value;
                      setTransferItems(updated);
                    }}
                    className="flex-1 w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nameAm} ({p.sku}) — Առկա՝ {p.warehouseStock[transferSourceWh] || 0} {p.unit}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="number"
                      min="1"
                      max={availableInSource}
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...transferItems];
                        updated[idx].quantity = Number(e.target.value);
                        setTransferItems(updated);
                      }}
                      className="w-24 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-right"
                    />
                    <span className="text-xs text-slate-500 w-10">{prod?.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Տեղաշարժի Նպատակ / Պատճառ
            </label>
            <input
              type="text"
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              Կատարել Տեղաշարժը
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: WRITE OFF */}
      {activeTab === 'write_off' && (
        <form onSubmit={handleSubmitWriteOff} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Ապրանքների Դուրսգրում (Խոտան / Ժամկետանց)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Դուրս է գրում վնասված կամ իրացման ոչ ենթակա ապրանքները պահեստային հաշվառումից
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Պահեստ *
              </label>
              <select
                value={writeOffWh}
                onChange={(e) => setWriteOffWh(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nameAm}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Դուրսգրման Հիմք / Պատճառ *
              </label>
              <input
                type="text"
                required
                value={writeOffReason}
                onChange={(e) => setWriteOffReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Դուրսգրվող Ապրանք
            </label>
            {writeOffItems.map((item, idx) => {
              const prod = products.find((p) => p.id === item.productId);
              return (
                <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <select
                    value={item.productId}
                    onChange={(e) => {
                      const updated = [...writeOffItems];
                      updated[idx].productId = e.target.value;
                      setWriteOffItems(updated);
                    }}
                    className="flex-1 w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nameAm} ({p.sku})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...writeOffItems];
                        updated[idx].quantity = Number(e.target.value);
                        setWriteOffItems(updated);
                      }}
                      className="w-24 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-right"
                    />
                    <span className="text-xs text-slate-500 w-10">{prod?.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              Կատարել Դուրսգրումը
            </button>
          </div>
        </form>
      )}

      {/* TAB 5: STOCKTAKE / AUDIT */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Գույքագրման և Հաշտեցման Թերթիկ (Stocktake)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Համեմատեք համակարգային մնացորդը փաստացի հաշվարկված քանակի հետ և կատարեք ավտոմատ հաշտեցում
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Պահեստ՝</span>
              <select
                value={auditWh}
                onChange={(e) => setAuditWh(e.target.value)}
                className="text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nameAm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase">
                  <th className="py-2.5 px-3">Ապրանք</th>
                  <th className="py-2.5 px-3 text-right">Համակարգային Քանակ</th>
                  <th className="py-2.5 px-3 text-right">Փաստացի Քանակ</th>
                  <th className="py-2.5 px-3 text-right">Տարբերություն</th>
                  <th className="py-2.5 px-3 text-right">Գումարային Տարբերություն</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {products.map((prod) => {
                  const sysQty = prod.warehouseStock[auditWh] || 0;
                  const actualQty = auditCounts[prod.id] !== undefined ? auditCounts[prod.id] : sysQty;
                  const diff = actualQty - sysQty;
                  const diffVal = diff * prod.costPrice;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{prod.nameAm}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{prod.sku}</div>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        {sysQty} {prod.unit}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={actualQty}
                          onChange={(e) => {
                            setAuditCounts({
                              ...auditCounts,
                              [prod.id]: Number(e.target.value),
                            });
                          }}
                          className="w-20 px-2 py-1 text-xs font-mono font-bold text-right border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </td>

                      <td className={`py-2.5 px-3 text-right font-mono font-bold tabular-nums ${
                        diff < 0 ? 'text-rose-600 dark:text-rose-400' : diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                      }`}>
                        {diff > 0 ? `+${diff}` : diff} {prod.unit}
                      </td>

                      <td className={`py-2.5 px-3 text-right font-mono tabular-nums font-semibold ${
                        diffVal < 0 ? 'text-rose-600 dark:text-rose-400' : diffVal > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                      }`}>
                        {diffVal > 0 ? `+${formatAMD(diffVal)}` : formatAMD(diffVal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              * Հաշտեցումը հաստատելիս պահեստի մնացորդները ավտոմատ կերպով կհամապատասխանեցվեն փաստացի քանակներին:
            </div>
            <button
              onClick={handleSaveAudit}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              Հաստատել Գույքագրումը և Կատարել Հաշտեցում
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
