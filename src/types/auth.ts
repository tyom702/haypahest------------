/**
 * HayPahest (ՀայՊահեստ) — Authentication & Multi-Tenant Domain Types
 * Strict role-based access control (RBAC) and tenant workspace models.
 */

export type UserRole = 'OWNER' | 'MANAGER' | 'CASHIER';

export interface UserProfile {
  id: string;
  fullNameAm: string;
  email: string;
  phone?: string;
  role: UserRole;
  tenantId: string;
  tenantName: string;
  warehouseId: string;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface TenantWorkspace {
  id: string; // Tenant UUID, e.g. "ws-araks-01"
  nameAm: string; // e.g. «Արաքս Տրեյդ» ՍՊԸ
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  hvhh: string; // Tax ID
  plan: 'free_trial' | 'business' | 'enterprise';
  createdAt: string;
  status: 'active' | 'suspended';
  maxEmployees: number;
}

export interface AuthSession {
  token: string;
  expiresAt: string;
  user: UserProfile;
  workspace: TenantWorkspace;
}

export interface RegisterBusinessPayload {
  businessName: string;
  ownerName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface InviteEmployeePayload {
  fullNameAm: string;
  email: string;
  phone: string;
  role: UserRole;
  warehouseId: string;
  salaryAMD?: number;
}

export interface ResetPasswordRequestPayload {
  email: string;
}

export interface ResetPasswordConfirmPayload {
  email: string;
  resetCode: string;
  newPassword: string;
}

export interface SecuritySessionLog {
  id: string;
  ipAddress: string;
  browser: string;
  device: string;
  location: string;
  timestamp: string;
  isCurrent: boolean;
}
