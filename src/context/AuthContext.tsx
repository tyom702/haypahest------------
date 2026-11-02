import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  TenantWorkspace,
  AuthSession,
  UserRole,
  LoginPayload,
  RegisterBusinessPayload,
  ResetPasswordConfirmPayload,
  InviteEmployeePayload
} from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  workspace: TenantWorkspace | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  backendConnected: boolean;
  
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterBusinessPayload) => Promise<void>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<string>;
  confirmPasswordReset: (payload: ResetPasswordConfirmPayload) => Promise<string>;
  hasRole: (allowedRoles: UserRole[]) => boolean;
  canAccess: (routePath: string) => boolean;
  
  // Employee management
  workspaceEmployees: UserProfile[];
  inviteEmployee: (payload: InviteEmployeePayload) => Promise<void>;
  updateEmployeeRole: (userId: string, newRole: UserRole) => Promise<void>;
  toggleEmployeeStatus: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'hp_auth_session_v3';
const EMPLOYEES_STORAGE_KEY = 'hp_tenant_employees_v3';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      try {
      const parsed = JSON.parse(saved);

if (!parsed?.token || !parsed?.user?.id || !parsed?.workspace?.id) {
  return null;
}

return parsed;
      } catch {
        return null;
      }
    }
    // Strictly no fake demo auto-login. New sessions must login or register.
    return null;
  });

  const [workspaceEmployees, setWorkspaceEmployees] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);

  // Sync session
  useEffect(() => {
    if (session) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      localStorage.setItem('haypahest_token', session.token);
      if (session.workspace?.id) {
  localStorage.setItem('haypahest_business_id', session.workspace.id);
} else {
  localStorage.removeItem('haypahest_business_id');
}
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('haypahest_token');
      localStorage.removeItem('haypahest_business_id');
    }
  }, [session]);

  // Sync workspace employees
  useEffect(() => {
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(workspaceEmployees));
  }, [workspaceEmployees]);

  // Check backend health periodically
  useEffect(() => {
    let mounted = true;
    authService.checkBackendHealth().then((res) => {
      if (mounted) setBackendConnected(res.connected);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const newSession = await authService.login(payload);
      setSession(newSession);
      setWorkspaceEmployees([newSession.user]);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterBusinessPayload) => {
    setIsLoading(true);
    try {
      const newSession = await authService.registerBusiness(payload);
      setSession(newSession);
      // For a newly registered business: ONLY the registered owner exists (0 additional employees)
      setWorkspaceEmployees([newSession.user]);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setSession(null);
    setWorkspaceEmployees([]);
  };

  const requestPasswordReset = async (email: string) => {
    const res = await authService.requestPasswordReset({ email });
    return res.message;
  };

  const confirmPasswordReset = async (payload: ResetPasswordConfirmPayload) => {
    const res = await authService.confirmPasswordReset(payload);
    return res.message;
  };

  const hasRole = (allowedRoles: UserRole[]): boolean => {
    if (!session?.user) return false;
    return allowedRoles.includes(session.user.role);
  };

  const canAccess = (routePath: string): boolean => {
    if (!session?.user) return false;
    const role = session.user.role;
    if (role === 'OWNER') return true;
    if (role === 'MANAGER') {
      return routePath !== '/settings';
    }
    if (role === 'CASHIER') {
      return ['/', '/sales', '/pos', '/profile'].includes(routePath);
    }
    return false;
  };

  const inviteEmployee = async (payload: InviteEmployeePayload) => {
    if (!session?.workspace || !session?.user) {
      throw new Error('Ակտիվ բիզնես տարածք (Workspace) չի գտնվել:');
    }

    if (!hasRole(['OWNER', 'MANAGER'])) {
      throw new Error('Աշխատակից հրավիրելու իրավասություն ունեն միայն Սեփականատերը և Մենեջերը:');
    }

    const newEmp: UserProfile = {
      id: `usr-emp-${Date.now().toString().slice(-4)}`,
      fullNameAm: payload.fullNameAm.trim(),
      email: payload.email.toLowerCase().trim(),
      phone: payload.phone.trim(),
      role: payload.role,
      tenantId: session.workspace.id,
      tenantName: session.workspace.nameAm,
      warehouseId: payload.warehouseId || 'wh-1',
      isActive: true,
      createdAt: new Date().toLocaleDateString('hy-AM'),
      lastLoginAt: 'Դեռ չի մուտքագրվել',
    };

    setWorkspaceEmployees((prev) => [newEmp, ...prev]);
  };

  const updateEmployeeRole = async (userId: string, newRole: UserRole) => {
    if (!hasRole(['OWNER'])) {
      throw new Error('Աշխատակցի դերը փոփոխելու իրավասություն ունի միայն Սեփականատերը:');
    }

    setWorkspaceEmployees((prev) =>
      prev.map((emp) => (emp.id === userId ? { ...emp, role: newRole } : emp))
    );

    if (session?.user.id === userId) {
      setSession({
        ...session,
        user: { ...session.user, role: newRole },
      });
    }
  };

  const toggleEmployeeStatus = async (userId: string) => {
    if (!hasRole(['OWNER', 'MANAGER'])) {
      throw new Error('Աշխատակցի մուտքը կասեցնելու իրավասություն ունի միայն Սեփականատերը:');
    }

    setWorkspaceEmployees((prev) =>
      prev.map((emp) => (emp.id === userId ? { ...emp, isActive: !emp.isActive } : emp))
    );
  };
    
return (
  <AuthContext.Provider
    value={{
      user: session?.user || null,
      workspace: session?.workspace || null,
        token: session?.token || null,
        role: session?.user?.role || null,
        
        isAuthenticated: !!session?.user,
        
        isLoading,
        backendConnected,
        login,
        register,
        logout,
        requestPasswordReset,
        confirmPasswordReset,
        hasRole,
        canAccess,
        workspaceEmployees,
        inviteEmployee,
        updateEmployeeRole,
        toggleEmployeeStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
