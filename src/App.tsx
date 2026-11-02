/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, RoleGuard } from './components/auth/ProtectedRoute';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { NotificationToast } from './components/common/NotificationToast';
import { BarcodeScannerModal } from './components/common/BarcodeScannerModal';
import { ExportImportModal } from './components/common/ExportImportModal';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ProfilePage } from './pages/auth/ProfilePage';

// Business Module Pages
import { DashboardPage } from './pages/DashboardPage';
import { PosPage } from './pages/PosPage';
import { ProductsPage } from './pages/ProductsPage';
import { MovementsPage } from './pages/MovementsPage';
import { CustomersPage } from './pages/CustomersPage';
import { ReportsPage } from './pages/ReportsPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { SettingsPage } from './pages/SettingsPage';

const AppLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const { addToast } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Header
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
          onOpenScanner={() => setIsScannerOpen(true)}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/sales" element={<PosPage />} />
            <Route path="/pos" element={<Navigate to="/sales" replace />} />

            {/* Warehouse Management: OWNER & MANAGER only */}
            <Route
              path="/warehouse"
              element={
                <RoleGuard allowedRoles={['OWNER', 'MANAGER']}>
                  <MovementsPage />
                </RoleGuard>
              }
            />
            <Route path="/movements" element={<Navigate to="/warehouse" replace />} />

            {/* Customers CRM: Accessible to all authenticated users */}
            <Route path="/customers" element={<CustomersPage />} />

            {/* Reports: OWNER & MANAGER only */}
            <Route
              path="/reports"
              element={
                <RoleGuard allowedRoles={['OWNER', 'MANAGER']}>
                  <ReportsPage />
                </RoleGuard>
              }
            />

            {/* Employees: OWNER & MANAGER only */}
            <Route
              path="/employees"
              element={
                <RoleGuard allowedRoles={['OWNER', 'MANAGER']}>
                  <EmployeesPage />
                </RoleGuard>
              }
            />

            {/* Account Profile & Security: Accessible to all roles */}
            <Route path="/profile" element={<ProfilePage />} />

            {/* Settings: OWNER only */}
            <Route
              path="/settings"
              element={
                <RoleGuard allowedRoles={['OWNER']}>
                  <SettingsPage />
                </RoleGuard>
              }
            />

            <Route path="/subscription" element={<Navigate to="/" replace />} />
            <Route path="/pricing" element={<Navigate to="/" replace />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <NotificationToast />

      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
      />

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanResult={(product) => {
          addToast(
            'Ապրանքը գտնվեց',
            `«${product.nameAm}» (Մնացորդ՝ ${Object.values(product.warehouseStock).reduce((a, b) => a + b, 0)} ${product.unit})`,
            'info'
          );
        }}
        title="Շտրիխ-կոդերի Համակարգային Որոնում"
      />

      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <Routes>
              {/* Public Authentication Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Protected Workspace Application Routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
