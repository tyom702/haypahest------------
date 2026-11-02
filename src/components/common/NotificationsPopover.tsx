import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Check, AlertTriangle, ShoppingCart, CreditCard, Info, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleItemClick = (notif: typeof notifications[0]) => {
    markNotificationRead(notif.id);
    if (notif.link) {
      navigate(notif.link);
      onClose();
    }
  };

  return (
    <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-2">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h4 className="font-bold text-xs text-slate-900 dark:text-white">
            Ծանուցումներ
          </h4>
          {unreadCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsRead}
              className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              Բոլորը կարդացված
            </button>
          )}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Ծանուցումներ չկան
          </div>
        ) : (
          notifications.map((n) => {
            const icons = {
              stock: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
              order: <ShoppingCart className="w-4 h-4 text-emerald-500 shrink-0" />,
              debt: <CreditCard className="w-4 h-4 text-rose-500 shrink-0" />,
              system: <Info className="w-4 h-4 text-indigo-500 shrink-0" />,
            };

            return (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                  !n.isRead
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="mt-0.5">{icons[n.type]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {n.title}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {n.timestamp.split(',')[1] || n.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                    {n.message}
                  </p>
                </div>
                {!n.isRead && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
