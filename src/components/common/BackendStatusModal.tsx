import React, { useState, useEffect } from 'react';
import {
  Server,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Terminal,
  Database,
  ShieldCheck,
  Cpu,
  Copy,
  Check,
} from 'lucide-react';
import { apiClient, BackendHealthStatus } from '../../services/apiClient';

interface BackendStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendStatusModal: React.FC<BackendStatusModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [health, setHealth] = useState<BackendHealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.checkHealth();
      setHealth(res);
    } catch {
      setHealth({ isOnline: false, error: 'Սերվերը անհասանելի է' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                FastAPI Բեքենդի Կարգավիճակ (Backend Status)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                Python 3 • FastAPI • SQLAlchemy 2 • PostgreSQL • Alembic
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* Connection Status Card */}
          <div
            className={`p-4 rounded-xl border flex items-start justify-between ${
              health?.isOnline
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
            }`}
          >
            <div className="flex items-start gap-3">
              {health?.isOnline ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {health?.isOnline
                    ? 'FastAPI Բեքենդը Միացված է (Connected)'
                    : 'Բեքենդը Տեղայնացված է (Local Ready / Standby)'}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {health?.isOnline
                    ? health.message || 'Սերվերը պատասխանում է /api/v1 հարցումներին:'
                    : 'Բեքենդի ամբողջական Python կոդը պատրաստ է backend/ պանակում: Ֆրոնթենդն աշխատում է անխափան ռեժիմով:'}
                </p>
                {health?.isOnline && (
                  <div className="mt-2 font-mono text-[11px] text-emerald-700 dark:text-emerald-300">
                    Տարբերակ՝ {health.version} • Միջավայր՝ {health.environment}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={checkStatus}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition-colors shrink-0"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
              />
              <span>{isLoading ? 'Ստուգում...' : 'Ստուգել Կապը'}</span>
            </button>
          </div>

          {/* Architecture Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-1">
                <Database className="w-3.5 h-3.5 text-blue-500" />
                <span>Zero-Float Money</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Բոլոր գումարները ՀՀ Դրամով են (Integer AMD), բացառելով տասնորդական սխալները:
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-1">
                <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                <span>Race-Condition Lock</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Տրանզակցիոն SELECT ... FOR UPDATE ապահովագրություն գերվաճառքից:
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span>Multi-Tenant RBAC</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Լիակատար մեկուսացում ընկերությունների միջև և դերային հասանելիություն:
              </p>
            </div>
          </div>

          {/* Quick Launch Guide */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-400" />
              Տեղական Գործարկման Հրահանգներ (Quick Run Commands)
            </h4>

            {/* Step 1: Install */}
            <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] relative">
              <div className="text-slate-400 text-[10px] mb-1 font-sans">
                1. Տեղադրել կախվածությունները (Virtualenv + Requirements)
              </div>
              <code>cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt</code>
              <button
                onClick={() =>
                  copyToClipboard(
                    'cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt',
                    'install'
                  )
                }
                className="absolute right-2 top-2 p-1 text-slate-400 hover:text-white"
                title="Պատճենել"
              >
                {copiedCmd === 'install' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Step 2: Migrate */}
            <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] relative">
              <div className="text-slate-400 text-[10px] mb-1 font-sans">
                2. Կիրառել բազայի միգրացիաները (Alembic)
              </div>
              <code>alembic upgrade head</code>
              <button
                onClick={() => copyToClipboard('alembic upgrade head', 'migrate')}
                className="absolute right-2 top-2 p-1 text-slate-400 hover:text-white"
                title="Պատճենել"
              >
                {copiedCmd === 'migrate' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Step 3: Run Uvicorn */}
            <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] relative">
              <div className="text-slate-400 text-[10px] mb-1 font-sans">
                3. Գործարկել FastAPI Uvicorn սերվերը
              </div>
              <code>uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload</code>
              <button
                onClick={() =>
                  copyToClipboard(
                    'uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload',
                    'run'
                  )
                }
                className="absolute right-2 top-2 p-1 text-slate-400 hover:text-white"
                title="Պատճենել"
              >
                {copiedCmd === 'run' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Step 4: Run Tests */}
            <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] relative">
              <div className="text-slate-400 text-[10px] mb-1 font-sans">
                4. Գործարկել ավտոմատացված թեստերը (Pytest)
              </div>
              <code>pytest -v</code>
              <button
                onClick={() => copyToClipboard('pytest -v', 'test')}
                className="absolute right-2 top-2 p-1 text-slate-400 hover:text-white"
                title="Պատճենել"
              >
                {copiedCmd === 'test' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            API Docs: http://localhost:8000/docs
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:opacity-90 transition-opacity"
          >
            Փակել
          </button>
        </div>
      </div>
    </div>
  );
};
