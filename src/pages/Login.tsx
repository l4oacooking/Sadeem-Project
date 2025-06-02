import { useState } from 'react';
import sadeemLogo from '@/assets/logo.png';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  // تسجيل الدخول
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert('Login failed: ' + error.message);
    setLoading(false);
    return;
  }

  // انتظر السيشن من Supabase
  let tries = 0;
  let session = null;
  while (tries < 5 && !session) {
    const { data: s } = await supabase.auth.getSession();
    session = s.session;
    if (!session) await new Promise((res) => setTimeout(res, 200));
    tries++;
  }
  if (!session) {
    alert("Couldn't establish session. Please refresh and try again.");
    setLoading(false);
    return;
  }

  // استخرج المعلومات وضعها بالـ localStorage
  let jwt: any = {};
  try { jwt = JSON.parse(atob(session.access_token.split('.')[1])); } catch {}
  const role = jwt.user_metadata?.role;
  const store_id = jwt.user_metadata?.store_id;
  if (role && store_id) {
    localStorage.setItem('session', JSON.stringify({ role, store_id }));
    localStorage.setItem('store_id', store_id);
  } else {
    alert("No role or store_id found!");
    setLoading(false);
    return;
  }

  setLoading(false);
  // استخدم replace في النفيجيت!
  navigate('/dashboard', { replace: true });
};

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#081235] via-[#142850] to-[#19233e]">
      <div className="w-full max-w-md mx-auto bg-[#111827] bg-opacity-90 shadow-2xl rounded-3xl p-8 flex flex-col items-center">
        <img src={sadeemLogo} alt="Sadeem Logo" className="w-20 h-20 mb-2 drop-shadow" />
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          سديم <span className="text-blue-400">خيار التاجر الأول</span> <span>⭐</span>
        </h1>
        <p className="text-white/80 mb-7 text-center text-base">
          منصة سديم - بوت واتساب لإدارة وتسليم المنتجات الرقمية بسهولة وأمان
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
              Email
            </label>
            <input
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              required
              className="w-full px-3 py-2 rounded-lg bg-[#22273b] text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-[#22273b] text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition pr-10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-2 text-white/60 hover:text-white transition"
                onClick={() => setShowPass((v) => !v)}
              >
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="w-full flex items-center mt-5 mb-1">
          <div className="flex-grow border-t border-white/20" />
          <span className="mx-3 text-xs text-white/40">أو</span>
          <div className="flex-grow border-t border-white/20" />
        </div>

        <button
          type="button"
          className="text-blue-400 text-sm hover:underline transition"
          onClick={() => window.location.href = '/support'}
        >
          الدعم الفني
        </button>
      </div>
    </div>
  );
}
