import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Users,
  Plus,
  Phone,
  Mail,
  Shield,
  Building,
  Calendar,
  DollarSign,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  UserCheck,
  ShieldAlert,
  Power,
  UserPlus,
  Search,
  Filter,
  Check,
  AlertCircle
} from 'lucide-react';
import { UserRole, UserProfile } from '../types/auth';
import { authService } from '../services/authService';
import { formatAMD } from '../utils/formatters';

export const EmployeesPage: React.FC = () => {
  const {
    user: currentUser,
    workspace,
    role: currentRole,
    workspaceEmployees,
    inviteEmployee,
    updateEmployeeRole,
    toggleEmployeeStatus,
    hasRole,
  } = useAuth();

  const { warehouses, addToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingRoleUser, setEditingRoleUser] = useState<UserProfile | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState<UserRole>('CASHIER');

  // Form data for invitation
  const [inviteForm, setInviteForm] = useState({
    fullNameAm: '',
    email: '',
    phone: '+374 ',
    role: 'CASHIER' as UserRole,
    warehouseId: warehouses[0]?.id || 'wh-1',
    salaryAMD: 250000,
  });

  const [inviteError, setInviteError] = useState('');

  const canManageRoles = hasRole(['OWNER']);
  const canInvite = hasRole(['OWNER', 'MANAGER']);

  const handleOpenInvite = () => {
    setInviteForm({
      fullNameAm: '',
      email: '',
      phone: '+374 ',
      role: 'CASHIER',
      warehouseId: warehouses[0]?.id || 'wh-1',
      salaryAMD: 250000,
    });
    setInviteError('');
    setIsInviteModalOpen(true);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');

    if (!inviteForm.fullNameAm.trim()) {
      setInviteError('Աշխատակցի անուն ազգանունը պարտադիր է:');
      return;
    }

    if (!inviteForm.email.trim() || !inviteForm.email.includes('@')) {
      setInviteError('Խնդրում ենք նշել վավեր էլեկտրոնային հասցե:');
      return;
    }

    try {
      await inviteEmployee({
        fullNameAm: inviteForm.fullNameAm,
        email: inviteForm.email,
        phone: inviteForm.phone,
        role: inviteForm.role,
        warehouseId: inviteForm.warehouseId,
        salaryAMD: Number(inviteForm.salaryAMD) || undefined,
      });

      addToast(
        'Հրավերն ուղարկվեց',
        `Աշխատակից «${inviteForm.fullNameAm}» (${authService.getRoleLabel(inviteForm.role).labelAm}) հաջողությամբ գրանցվեց համակարգում:`
      );
      setIsInviteModalOpen(false);
    } catch (err: any) {
      setInviteError(err?.message || 'Հրավերն ուղարկելիս առաջացավ սխալ:');
    }
  };

  const handleOpenRoleEdit = (emp: UserProfile) => {
    if (!canManageRoles) {
      addToast('Մերժված է', 'Դերի փոփոխություն կարող է կատարել միայն Սեփականատերը:', 'error');
      return;
    }
    setEditingRoleUser(emp);
    setNewSelectedRole(emp.role);
  };

  const handleSaveRoleChange = async () => {
    if (!editingRoleUser) return;
    try {
      await updateEmployeeRole(editingRoleUser.id, newSelectedRole);
      addToast(
        'Դերը փոփոխվեց',
        `«${editingRoleUser.fullNameAm}»-ի նոր դերն է՝ ${authService.getRoleLabel(newSelectedRole).labelAm}`
      );
      setEditingRoleUser(null);
    } catch (err: any) {
      addToast('Սխալ', err?.message || 'Դերը փոխել չհաջողվեց:', 'error');
    }
  };

  const handleToggleStatus = async (emp: UserProfile) => {
    if (!canInvite) {
      addToast('Մերժված է', 'Իրավասու չեք կասեցնել կամ ակտիվացնել աշխատակցի մուտքը:', 'error');
      return;
    }

    if (emp.role === 'OWNER') {
      addToast('Սխալ', 'Սեփականատիրոջ հաշիվը չի կարող կասեցվել:', 'error');
      return;
    }

    await toggleEmployeeStatus(emp.id);
    addToast(
      emp.isActive ? 'Հաշիվը կասեցվեց' : 'Հաշիվն ակտիվացվեց',
      `«${emp.fullNameAm}»-ի մուտքի կարգավիճակը փոփոխվեց:`,
      'info'
    );
  };

  // Filter employees
  const filteredEmployees = workspaceEmployees.filter((emp) => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      emp.fullNameAm.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query) ||
      (emp.phone && emp.phone.includes(query));

    const matchesRole = roleFilter === 'all' || emp.role === roleFilter;

    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = emp.isActive;
    if (statusFilter === 'inactive') matchesStatus = !emp.isActive;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Աշխատակիցների և Դերերի Կառավարում
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              Workspace: {workspace?.nameAm}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Սեփականատիրոջ, Մենեջերների և Գանձապահների հաշիվների կառավարում և հրավիրում
          </p>
        </div>

        {canInvite && (
          <button
            type="button"
            onClick={handleOpenInvite}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Հրավիրել Նոր Աշխատակից</span>
          </button>
        )}
      </div>

      {/* Role Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(['OWNER', 'MANAGER', 'CASHIER'] as UserRole[]).map((r) => {
          const meta = authService.getRoleLabel(r);
          const count = workspaceEmployees.filter((e) => e.role === r).length;

          return (
            <div
              key={r}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {meta.labelAm}
                </span>
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {count}
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${meta.badgeColor}`}>
                {r}
              </span>
            </div>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Փնտրել ըստ անվանման, էլ. հասցեի կամ հեռախոսի..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
          >
            <option value="all">Բոլոր դերերը</option>
            <option value="OWNER">Սեփականատեր (Owner)</option>
            <option value="MANAGER">Մենեջեր (Manager)</option>
            <option value="CASHIER">Գանձապահ (Cashier)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
          >
            <option value="all">Բոլոր կարգավիճակները</option>
            <option value="active">Ակտիվ աշխատակիցներ</option>
            <option value="inactive">Կասեցված հաշիվներ</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-3.5 pl-6 pr-3">Աշխատակից</th>
                <th className="py-3.5 px-3">Դերակատարում (RBAC)</th>
                <th className="py-3.5 px-3">Կցված Պահեստ</th>
                <th className="py-3.5 px-3">Համակարգային Կարգավիճակ</th>
                <th className="py-3.5 px-3">Վերջին Մուտք</th>
                <th className="py-3.5 pr-6 pl-3 text-right">Գործողություններ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEmployees.map((emp) => {
                const roleMeta = authService.getRoleLabel(emp.role);
                const wh = warehouses.find((w) => w.id === emp.warehouseId);
                const isCurrent = currentUser?.id === emp.id;

                return (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Employee Name & Contact */}
                    <td className="py-3.5 pl-6 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono shadow-xs">
                          {emp.fullNameAm.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {emp.fullNameAm}
                            </span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700">
                                Դուք
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                            <span>{emp.email}</span>
                            {emp.phone && <span>· {emp.phone}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold ${roleMeta.badgeColor}`}>
                        {roleMeta.labelAm}
                      </span>
                    </td>

                    {/* Warehouse */}
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                      {wh?.nameAm || 'Գլխավոր պահեստ'}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3">
                      {emp.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Ակտիվ հաշիվ</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                          <Power className="w-3 h-3" />
                          <span>Կասեցված</span>
                        </span>
                      )}
                    </td>

                    {/* Last Login */}
                    <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400">
                      {emp.lastLoginAt}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 pr-6 pl-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canManageRoles && emp.role !== 'OWNER' && (
                          <button
                            type="button"
                            onClick={() => handleOpenRoleEdit(emp)}
                            title="Փոխել աշխատակցի դերը"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        )}

                        {canInvite && emp.role !== 'OWNER' && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(emp)}
                            title={emp.isActive ? 'Կասեցնել մուտքը' : 'Ակտիվացնել մուտքը'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              emp.isActive
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Employee Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Հրավիրել Աշխատակից
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Նոր մուտքի հաշվի ստեղծում և դերի կցում
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
              {inviteError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{inviteError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Աշխատակցի Անուն Ազգանուն *
                </label>
                <input
                  type="text"
                  required
                  value={inviteForm.fullNameAm}
                  onChange={(e) => setInviteForm({ ...inviteForm, fullNameAm: e.target.value })}
                  placeholder="օր.՝ Դավիթ Խաչատրյան"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Էլ. Հասցե (Հրավերի համար) *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="emp@business.am"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Հեռախոսահամար
                  </label>
                  <input
                    type="tel"
                    value={inviteForm.phone}
                    onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Համակարգային Դեր (RBAC) *
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as UserRole })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                >
                  <option value="CASHIER">Գանձապահ (CASHIER) — Վաճառքներ (POS) և ապրանքներ</option>
                  <option value="MANAGER">Մենեջեր (MANAGER) — Պահեստ, ապրանքներ, վաճառքներ և հաշվետվություններ</option>
                  {currentRole === 'OWNER' && (
                    <option value="OWNER">Սեփականատեր (OWNER) — Լիարժեք հասանելիություն</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Կցված Պահեստ
                  </label>
                  <select
                    value={inviteForm.warehouseId}
                    onChange={(e) => setInviteForm({ ...inviteForm, warehouseId: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
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
                    Աշխատավարձ (֏/ամիս)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={inviteForm.salaryAMD}
                    onChange={(e) => setInviteForm({ ...inviteForm, salaryAMD: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Չեղարկել
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Ուղարկել Հրավերը</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {editingRoleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Փոխել Աշխատակցի Դերը
                </h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">
                  {editingRoleUser.fullNameAm} ({editingRoleUser.email})
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ընտրել Նոր Դերը (RBAC)
              </label>
              {(['CASHIER', 'MANAGER', 'OWNER'] as UserRole[]).map((r) => {
                const meta = authService.getRoleLabel(r);
                return (
                  <div
                    key={r}
                    onClick={() => setNewSelectedRole(r)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      newSelectedRole === r
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {meta.labelAm}
                      </span>
                      {newSelectedRole === r && (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {meta.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingRoleUser(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Չեղարկել
              </button>
              <button
                type="button"
                onClick={handleSaveRoleChange}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
              >
                Պահպանել Փոփոխությունը
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
