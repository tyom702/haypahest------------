import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Boxes,
  Building2,
  User,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register, isLoading, backendConnected } = useAuth();
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Password strength logic
  const isLengthValid = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isLengthValid) {
      setErrorMessage('Գաղտնաբառը պետք է պարունակի առնվազն 8 նիշ:');
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage('Գաղտնաբառերը չեն համընկնում:');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Գրանցվելու համար անհրաժեշտ է համաձայնել օգտագործման պայմաններին:');
      return;
    }

    try {
      await register({
        businessName,
        ownerName,
        email,
        phone,
        password,
      });
      navigate('/', { replace: true });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Գրանցման ընթացքում առաջացավ սխալ:');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
            <Boxes className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              ՀայՊահեստ
            </h1>
            <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
              HayPahest Cloud SaaS
            </span>
          </div>
        </div>

        <h2 className="mt-3 text-center text-xl font-bold text-white">
          Գրանցեք Ձեր Բիզնես Տարածքը
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Ստեղծեք առանձին մեկուսացված workspace Ձեր ընկերության համար
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-slate-800/90 backdrop-blur-md py-8 px-6 sm:px-8 shadow-2xl rounded-3xl border border-slate-700/80 space-y-6">
          {/* Tenant Isolation Banner */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Մեկուսացված Տենանտ (Multi-Tenant Isolation)</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                Առանձին Շտեմարան
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Գրանցելով Ձեր ընկերությունը՝ Դուք դառնում եք <strong>Սեփականատեր (OWNER)</strong>: Ձեր ապրանքները, գործարքները և աշխատակիցները հասանելի կլինեն միայն Ձեզ և Ձեր լիազորված թիմին:
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Business Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ընկերության / Բիզնեսի Անվանում *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="օր.՝ «Արաքս Տրեյդ» ՍՊԸ կամ «Երևան Շոփ» Ա/Ձ"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900/60 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Owner Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Սեփականատիրոջ / Տնօրենի Անուն Ազգանուն *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Արթյոմ Կուրղինյան"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900/60 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    placeholder="owner@business.am"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900/60 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Հեռախոսահամար (Ընտրովի)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+374 91 12-34-56"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900/60 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Գաղտնաբառ (առնվազն 8 նիշ) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900/60 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-hidden transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength checks */}
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                <span className={isLengthValid ? 'text-emerald-400 font-semibold' : ''}>
                  ✓ 8+ նիշ
                </span>
                <span className={hasNumber ? 'text-emerald-400 font-semibold' : ''}>
                  ✓ Թիվ
                </span>
                <span className={hasSpecial ? 'text-emerald-400 font-semibold' : ''}>
                  ✓ Հատուկ նիշ
                </span>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Կրկնել Գաղտնաբառը *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border bg-slate-900/60 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all ${
                    confirmPassword && !passwordsMatch ? 'border-rose-500' : 'border-slate-700'
                  }`}
                />
              </div>
              {confirmPassword && !passwordsMatch && (
                <span className="text-[10px] text-rose-400 mt-1 block">
                  Գաղտնաբառերը չեն համընկնում
                </span>
              )}
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start gap-2 pt-1 text-xs text-slate-400">
              <input
                type="checkbox"
                id="terms"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-900"
              />
              <label htmlFor="terms" className="cursor-pointer leading-tight">
                Համաձայն եմ ՀայՊահեստ ծառայության օգտագործման պայմաններին և գաղտնիության քաղաքականությանը:
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !passwordsMatch || !isLengthValid}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              <span>{isLoading ? 'Ստեղծվում է...' : 'Ստեղծել Բիզնես Տարածք (Workspace)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Link to login */}
          <div className="pt-2 text-center text-xs text-slate-400">
            Արդեն ունե՞ք գրանցված հաշիվ.{' '}
            <Link
              to="/login"
              className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Մուտք Գործել
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
