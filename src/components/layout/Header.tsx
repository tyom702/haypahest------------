import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Warehouse as WarehouseIcon,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  User,
  Scan,
  ShieldCheck,
  Server,
} from 'lucide-react';
import { NotificationsPopover } from '../common/NotificationsPopover';
import { UserProfileMenu } from '../common/UserProfileMenu';
import { BackendStatusModal } from '../common/BackendStatusModal';
import { authService } from '../../services/authService';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  onOpenGlobalSearch: () => void;
  onOpenScanner: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  onOpenGlobalSearch,
  onOpenScanner,
}) => {
  const {
    warehouses,
    selectedWarehouseId,
    setSelectedWarehouseId,
    theme,
    toggleTheme,
    notifications,
  } = useApp();

  const { user, role, workspace } = useAuth();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/':
        return 'Գլխավոր Վահանակ';
      case '/products':
        return 'Ապրանքների Կատալոգ և Պահեստ';
      case '/sales':
      case '/pos':
        return 'Վաճառքներ և POS Դրամարկղ';
      case '/warehouse':
      case '/movements':
        return 'Պահեստ և Գործառնություններ';
      case '/customers':
        return 'Հաճախորդներ և Պարտքեր (CRM)';
      case '/reports':
        return 'Ֆինանսական Հաշվետվություններ';
      case '/employees':
        return 'Աշխատակիցներ և Դերեր';
      case '/profile':
        return 'Օգտատիրոջ Պրոֆիլ և Անվտանգություն';
      case '/settings':
        return 'Համակարգային Կարգավորումներ';
      default:
        return 'HayPahest';
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3 transition-colors">
      {/* Zone 1: Section Title & Mobile Toggle */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Բացել մենյուն"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate leading-tight">
            {getPageTitle(location.pathname)}
          </h1>
          <p className="hidden md:block text-[11px] text-slate-400 dark:text-slate-500 truncate">
            ՀՀ ՓՄՁ պահեստային և վաճառքի կառավարում
          </p>
        </div>
      </div>

      {/* Zone 2: Global Search Trigger Button */}
      <div className="flex-1 max-w-xs lg:max-w-md hidden sm:block">
        <button
          onClick={onOpenGlobalSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">Որոնել ապրանք, կտրոն, գնորդ...</span>
          </div>
          <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Zone 3: Warehouse Selector, Theme, Notifications, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Icon */}
        <button
          onClick={onOpenGlobalSearch}
          className="sm:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Որոնում"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Warehouse Dropdown */}
        <div className="relative flex items-center">
          <WarehouseIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="pl-8 pr-7 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl appearance-none cursor-pointer focus:outline-hidden focus:border-emerald-500 max-w-[130px] sm:max-w-[190px] truncate"
            title="Ընտրել ընթացիկ պահեստը"
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id} className="dark:bg-slate-900">
                {w.nameAm}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
        </div>


        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'light' ? 'Միացնել մութ ռեժիմը' : 'Միացնել լուսավոր ռեժիմը'}
          aria-label="Փոխել թեման"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-slate-600" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* Notifications Button & Popover */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsProfileOpen(false);
            }}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Ծանուցումներ"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
          <NotificationsPopover
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
          />
        </div>

        {/* User Profile Avatar & Menu */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotifOpen(false);
            }}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Օգտատիրոջ պրոֆիլ և անվտանգություն"
          >
            <div className="hidden xl:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate leading-tight">
                {user?.fullNameAm || 'Օգտատեր'}
              </span>
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                {role ? authService.getRoleLabel(role).labelAm.split(' ')[0] : ''}
              </span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
              {user ? user.fullNameAm.split(' ').map((n) => n[0]).join('') : 'HP'}
            </div>
          </button>
          <UserProfileMenu
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
          />
        </div>
      </div>
    </header>
  );
};
