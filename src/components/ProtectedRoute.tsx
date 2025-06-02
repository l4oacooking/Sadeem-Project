import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/supabaseClient';

export default function ProtectedRoute({ children }) {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAllowed(false);
        setLoading(false); // هنا!
        navigate('/login');
        return;
      }
      setAllowed(true);
      setLoading(false); // هنا!
    }
    checkAuth();
  }, [navigate]);

  if (loading) return <div>Loading...</div>;
  if (!allowed) return null;
  return children;
}
