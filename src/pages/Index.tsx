
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const storeId = localStorage.getItem('store_id');
    const isSuperadmin = localStorage.getItem('superadmin');
  
    if (!storeId && !isSuperadmin) {
      navigate('/login');
    }
  }, [navigate]);
};

export default Index;
