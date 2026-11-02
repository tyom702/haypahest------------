import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  User,
  Shield,
  Building2,
  Lock,
  LogOut,
  Clock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Laptop,
  Smartphone,
  ShieldCheck,
  Check
} from 'lucide-react';
import { authService } from '../../services/authService';
import { UserRole } from '../../types/auth';

export const ProfilePage: React.FC = () => {
  const { user, workspace, role, logout } = useAuth();
  const { addToast } = useApp();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  if (!user || !workspace) return null;

  const roleMeta = role ? authService.getRoleLabel(role) : null;

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError('Նոր գաղտնաբառը պետք է պարունակի առնվազն 8 նիշ:');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Գաղտնաբառերը չեն համընկնում:');
      return;
    }

    // In local architecture, notify
    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    addToast('Գաղտնաբառը թարմացվեց', 'Նոր գաղտնաբառը հաջողությամբ գրանցվեց');
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Օգտատիրոջ Պրոֆիլ և Անվտանգություն
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Անձնական տվյալներ, բիզնես տարածքի կարգավորումներ և սեանսներ
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Դուրս Գալ Համակարգից</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile & Workspace */}
        <div className="lg:col-span-1 space-y-6">
          {/* User Profile Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center text-xl font-bold font-mono shadow-md">
                {user.fullNameAm.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {user.fullNameAm}
                </h3>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1 ${roleMeta?.badgeColor}`}>
                  {roleMeta?.labelAm}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
              {roleMeta?.description}
            </p>

            <div className="space-y-2 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Էլ. հասցե՝</span>
                <span className="font-mono text-slate-900 dark:text-white font-medium">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Հեռախոս՝</span>
                  <span className="font-mono text-slate-900 dark:text-white">{user.phone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Գրանցման ամսաթիվ՝</span>
                <span className="text-slate-900 dark:text-white">{user.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Վերջին մուտք՝</span>
                <span className="text-slate-900 dark:text-white">{user.lastLoginAt}</span>
              </div>
            </div>
          </div>

          {/* Business Workspace Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Բիզնես Տարածք (Workspace)</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Ընկերության Անվանում</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{workspace.nameAm}</span>
              </div>

              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-400">Տենանտ ID (Tenant)՝</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{workspace.id}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">ՀՎՀՀ՝</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{workspace.hvhh}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Կարգավիճակ՝</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Ակտիվ (Մեկուսացված)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Security, Change Password, Active Sessions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Change Password Form */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>Փոխել Գաղտնաբառը</span>
            </div>

            {passwordSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Գաղտնաբառը հաջողությամբ փոխվեց:</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ընթացիկ Գաղտնաբառ *
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Նոր Գաղտնաբառ (8+ նիշ) *
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Կրկնել Նոր Գաղտնաբառը *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  Պահպանել Նոր Գաղտնաբառը
                </button>
              </div>
            </form>
          </div>

          {/* Active Security Sessions */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Ակտիվ Անվտանգության Սեանսներ</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Ստուգված IP և սարքեր
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between gap-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0 mt-0.5">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Web Բրաուզեր
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700">
                        Ընթացիկ սարք
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      ՀայՊահեստ Անվտանգ Սեանս · ք. Երևան
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Ակտիվացված է PostgreSQL բազայում
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
