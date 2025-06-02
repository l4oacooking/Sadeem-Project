import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { supabase } from '@/supabaseClient';

interface MainLayoutProps {
  children: ReactNode;
  isAdmin?: boolean;
}

export default function MainLayout({ children, isAdmin = false }: MainLayoutProps) {
  const { rtl, language } = useTranslation();
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isValidStore, setIsValidStore] = useState<boolean | null>(null);

  useEffect(() => {
  let ignore = false;

  async function validateSessionOnMount() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (ignore) return;

    if (!session) {
      setIsValidStore(false);
      setLoading(false);
      localStorage.clear();
      if (window.location.pathname !== '/login') navigate('/login', { replace: true });
      return;
    }

    let jwt: any = {};
    try { jwt = JSON.parse(atob(session.access_token.split('.')[1])); } catch {}
    const role = jwt.user_metadata?.role?.toLowerCase();
    const storeId = jwt.user_metadata?.store_id;

    if (!role || !storeId) {
      setIsValidStore(false);
      setLoading(false);
      localStorage.clear();
      if (window.location.pathname !== '/login') navigate('/login', { replace: true });
      return;
    }

    localStorage.setItem('session', JSON.stringify({ role, store_id: storeId }));
    localStorage.setItem('store_id', storeId);

    // تحقق من وجود المتجر
    const { data, error } = await supabase
      .from('stores')
      .select('id')
      .eq('id', storeId)
      .single();

    if (error || !data) {
      setIsValidStore(false);
      setLoading(false);
      localStorage.clear();
      if (window.location.pathname !== '/login') navigate('/login', { replace: true });
      return;
    }

    setIsValidStore(true);
    setLoading(false);
  }

  validateSessionOnMount();

  return () => { ignore = true; };
}, [navigate]);


  useEffect(() => {
    const storeId = localStorage.getItem('store_id');
    if (storeId) {
      supabase
        .from('stores')
        .select('avatar')
        .eq('id', storeId)
        .single()
        .then(({ data }) => {
          if (data?.avatar) setAvatar(data.avatar);
        });
    }
  }, [isAdmin, isValidStore]);

  if (loading) return <div style={{ color: "#fff" }}>Loading...</div>;
  if (isValidStore === false) {
    // أبقيه على login إذا لم يكن هناك session صالح
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return null;
  }
  return (
    <div
      className={cn(
        'min-h-screen bg-background text-foreground flex',
        rtl && 'flex-row-reverse'
      )}
      style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <Sidebar isAdmin={isAdmin} avatar={avatar} />
      <div className={cn('flex-1', rtl ? 'mr-16 md:mr-64' : 'ml-16 md:ml-64')}>
        <TopNav isAdmin={isAdmin} avatar={avatar} />
        <main className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
