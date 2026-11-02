import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Boxes,
  Mail,
  Lock,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { requestPasswordReset, confirmPasswordReset, isLoading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<'request' | 'confirm' | 'success'>('request');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const msg = await requestPasswordReset(email);
      setStatusMessage(msg);
      setStep('confirm');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Սխալ՝ վերականգնման հարցումն ուղարկելիս:');
    }
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword.length < 8) {
      setErrorMessage('Նոր գաղտնաբառը պետք է պարունակի առնվազն 8 նիշ:');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Գաղտնաբառերը չեն համընկնում:');
      return;
    }

    try {
      const msg = await confirmPasswordReset({
        email,
        resetCode,
        newPassword,
      });
      setStatusMessage(msg);
      setStep('success');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Սխալ՝ գաղտնաբառը թարմացնելիս:');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
            <Boxes className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              ՀայՊահեստ
            </h1>
            <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
              Անվտանգ Վերականգնում
            </span>
          </div>
        </div>

        <h2 className="mt-4 text-center text-lg font-bold text-white">
          Գաղտնաբառի Վերականգնում
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Մուտքի անվտանգ վերականգնում սերվերային հաստատման կոդով
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/90 backdrop-blur-md py-8 px-6 sm:px-8 shadow-2xl rounded-3xl border border-slate-700/80 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'request' && (
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Մուտքագրեք Ձեր գրանցված էլեկտրոնային հասցեն: Համակարգը կուղարկի գաղտնաբառի վերականգնման 6-նիշ անվտանգության կոդը:
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Էլ. Հասցե *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@business.am"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900/60 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Ուղարկել Հաստատման Կոդը</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 'confirm' && (
            <form onSubmit={handleConfirmSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                {statusMessage}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  6-նիշ Հաստատման Կոդ *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono font-bold tracking-widest rounded-xl border border-slate-700 bg-slate-900/60 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Նոր Գաղտնաբառ (8+ նիշ) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900/60 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Կրկնել Նոր Գաղտնաբառը *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900/60 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Հաստատել և Փոխել Գաղտնաբառը</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">
                Գաղտնաբառը Թարմացված է
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {statusMessage}
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Մուտք Գործել Նոր Գաղտնաբառով
              </Link>
            </div>
          )}

          <div className="pt-2 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Վերադառնալ մուտքի էջ</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
