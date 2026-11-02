import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Warehouse,
  Users,
  BarChart3,
  UserCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { authService } from '../../services/authService';

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onMobileClose,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { products, selectedWarehouseId } = useApp();
  const { user, workspace, role } = useAuth();

  const lowStockCount = products.filter((p) => {
    const currentStock = p.warehouseStock[selectedWarehouseId] ?? 0;
    return currentStock <= p.minStock;
  }).length;

  const navItems = [
    {
      to: '/',
      label: 'Գլխավոր',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/products',
      label: 'Ապրանքներ',
      icon: Boxes,
      badge: lowStockCount > 0 ? String(lowStockCount) : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      to: '/sales',
      label: 'Վաճառքներ',
      icon: ShoppingCart,
      badge: 'POS',
      badgeColor: 'bg-emerald-500 text-white font-bold',
    },
    {
      to: '/warehouse',
      label: 'Պահեստ',
      icon: Warehouse,
      badge: null,
    },
    {
      to: '/customers',
      label: 'Հաճախորդներ',
      icon: Users,
      badge: null,
    },
    {
      to: '/reports',
      label: 'Հաշվետվություններ',
      icon: BarChart3,
      badge: null,
    },
    {
      to: '/employees',
      label: 'Աշխատակիցներ',
      icon: UserCheck,
      badge: null,
    },
    {
      to: '/settings',
      label: 'Կարգավորումներ',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#0B132B] text-slate-300 border-r border-slate-800/80 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Zone */}
        <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <NavLink
            to="/"
            onClick={onMobileClose}
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md font-bold text-lg shrink-0 group-hover:scale-105 transition-transform">
              ՀՊ
            </div>
            {!isCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <span className="text-base font-extrabold tracking-tight text-white block leading-tight">
                  HayPahest
                </span>
                <span className="text-[10px] text-emerald-400 font-medium block leading-none mt-0.5">
                  ՀայՊահեստ ՓՄՁ
                </span>
              </div>
            )}
          </NavLink>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title={isCollapsed ? 'Ընդլայնել' : 'Կոմպակտ դարձնել'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Համակարգի Մենյու
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl text-xs font-medium transition-all ${
                    isCollapsed ? 'p-2.5 justify-center' : 'px-3 py-2.5'
                  } ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-medium whitespace-nowrap shrink-0 ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card at bottom */}
        <div className="p-3 border-t border-slate-800/80 shrink-0">
          <NavLink
            to="/profile"
            onClick={onMobileClose}
            className="block rounded-xl hover:bg-slate-800/50 transition-colors"
          >
            {!isCollapsed ? (
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {user ? user.fullNameAm.split(' ').map((n) => n[0]).join('') : 'HP'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {user?.fullNameAm || 'Օգտատեր'}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-medium truncate">
                      {role ? authService.getRoleLabel(role).labelAm.split(' ')[0] : ''}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-1">
                <div
                  className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center"
                  title={`${user?.fullNameAm || 'Օգտատեր'} (${role || ''})`}
                >
                  {user ? user.fullNameAm.split(' ').map((n) => n[0]).join('') : 'HP'}
                </div>
              </div>
            )}
          </NavLink>
        </div>
      </aside>
    </>
  );
};
