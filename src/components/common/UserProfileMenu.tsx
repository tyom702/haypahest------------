import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { User, ShieldCheck, Check, LogOut, Building, UserCheck } from 'lucide-react';
import { authService } from '../../services/authService';
import { UserRole } from '../../types/auth';

interface UserProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ isOpen, onClose }) => {
  const { user, workspace, role, logout } = useAuth();
  const { warehouses, selectedWarehouseId } = useApp();

  if (!isOpen || !user || !workspace) return null;

  const currentWh = warehouses.find((w) => w.id === selectedWarehouseId);
  const roleMeta = role ? authService.getRoleLabel(role) : null;

  return (
    <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-2">
      {/* Current user card */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            {user.fullNameAm.split(' ').map((n) => n[0]).join('')}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
              {user.fullNameAm}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${roleMeta?.badgeColor}`}>
                {roleMeta?.labelAm}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
              {user.email}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 space-y-0.5">
          <div className="truncate">
            Տարածք (Workspace)՝ <strong className="text-slate-700 dark:text-slate-300">{workspace.nameAm}</strong>
          </div>
          <div className="truncate">
            Ակտիվ պահեստ՝ <strong className="text-slate-700 dark:text-slate-300">{currentWh?.nameAm || 'Գլխավոր'}</strong>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="p-2 border-b border-slate-100 dark:border-slate-800 space-y-0.5">
        <Link
          to="/profile"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Իմ Պրոֆիլը և Անվտանգությունը</span>
        </Link>
        <Link
          to="/employees"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Աշխատակիցների Կառավարում</span>
        </Link>
      </div>

      {/* Logout button */}
      <div className="p-2">
        <button
          type="button"
          onClick={() => {
            onClose();
            logout();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Ելք (Դուրս Գալ)</span>
        </button>
      </div>
    </div>
  );
};
