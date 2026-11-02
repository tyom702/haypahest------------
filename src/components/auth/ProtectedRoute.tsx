import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { authService } from '../../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { role, user } = useAuth();

  if (!role || !allowedRoles.includes(role)) {
    const roleMeta = role ? authService.getRoleLabel(role) : null;
    const allowedLabels = allowedRoles.map((r) => authService.getRoleLabel(r).labelAm).join(', ');

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 border border-rose-200 dark:border-rose-800">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Մուտքն Արգելված է (403 Forbidden)
        </h2>

        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
          Ձեր ընթացիկ հաշիվը (<strong>{user?.fullNameAm}</strong>) ունի{' '}
          <span className="font-semibold text-slate-900 dark:text-white">
            «{roleMeta?.labelAm}»
          </span>{' '}
          դերակատարում: Այս բաժինը հասանելի է միայն հետևյալ դերեր ունեցող աշխատակիցներին՝{' '}
          <strong>{allowedLabels}</strong>:
        </p>

        <div className="mt-6 flex items-center gap-3">
          <Link
            to="/sales"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Վերադառնալ Դրամարկղ (POS)</span>
          </Link>
          <Link
            to="/profile"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Իմ Պրոֆիլը
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
