import { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import MainLayout from '@/components/layout/MainLayout';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { AnalyticsChart } from '@/components/dashboard/AnalyticsChart';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { Button } from '@/components/ui/button';
import { Package, Users, Store, ShoppingCart } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useNavigate } from 'react-router-dom'; 
export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stores, setStores] = useState([]);
  const navigate = useNavigate();

useEffect(() => {
  const storeId = localStorage.getItem('store_id');
  const isSuperadmin = localStorage.getItem('superadmin');

  if (!storeId && !isSuperadmin) {
    navigate('/login');
  }
}, [navigate]);
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [claimsToday, setClaimsToday] = useState(0);
  const [storesChartData, setStoresChartData] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    // Fetch stores
    const { data: storesData } = await supabase.from('stores').select('*');
    setStores(storesData || []);

    // Fetch products
    const { data: productsData } = await supabase.from('products').select('*');
    setProducts(productsData || []);

    // Fetch accounts
    const { data: accountsData } = await supabase.from('accounts').select('*');
    setAccounts(accountsData || []);

    // Fetch claims today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isoToday = today.toISOString();

    const { data: claimsData } = await supabase
      .from('claims')
      .select('*')
      .gte('claimed_at', isoToday);

    setClaimsToday(claimsData?.length || 0);

    // Build chart data
    if (storesData) {
      const monthlyData = {};

      storesData.forEach((store) => {
        const createdAt = new Date(store.created_at);
        const monthKey = `${createdAt.getFullYear()}-${createdAt.getMonth() + 1}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
      });

      const formattedChartData = Object.keys(monthlyData).map((month) => ({
        name: month,
        value: monthlyData[month],
      }));

      setStoresChartData(formattedChartData);
    }
  };

  const activeStores = stores.filter(store => store.status === 'active').length;
  const trialStores = stores.filter(store => store.subscription_status === 'trial').length;
  const monthlyStores = stores.filter(store => store.subscription_status === 'monthly').length;
  const canceledStores = stores.filter(store => store.subscription_status?.includes('canceled')).length;

  return (
    <MainLayout isAdmin={true}>
      <div className="space-y-8">

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard
            title={t('Total Stores')}
            value={stores.length.toString()}
            icon={<Store size={24} />}
            color="blue"
          />
          <StatusCard
            title={t('Total Products')}
            value={products.length.toString()}
            icon={<Package size={24} />}
            color="green"
          />
          <StatusCard
            title={t('Total Accounts')}
            value={accounts.length.toString()}
            icon={<Users size={24} />}
            color="purple"
          />
          <StatusCard
            title={t('Claims Today')}
            value={claimsToday.toString()}
            icon={<ShoppingCart size={24} />}
            color="default"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title={t('New Stores per Month')}
            description={t('The number of stores registered per month')}
          >
            <AnalyticsChart data={storesChartData} type="bar" height={250} />
          </ChartCard>

          <ChartCard
            title={t('Subscription Status')}
            description={t('Trial / Monthly / Canceled Stores')}
          >
            <div className="flex flex-col gap-2 p-4">
              <p>{t('Trial Stores')}: {trialStores}</p>
              <p>{t('Monthly Stores')}: {monthlyStores}</p>
              <p>{t('Canceled Stores')}: {canceledStores}</p>
            </div>
          </ChartCard>
        </div>
{/* Stores Table Section */}
<div className="space-y-4 mt-8">
  <h2 className="text-2xl font-bold">{t('Stores Details')}</h2>
  <div className="border rounded-lg overflow-x-auto">
    <table className="w-full text-sm text-left rtl:text-right text-muted-foreground">
      <thead className="text-xs uppercase bg-muted">
        <tr>
          <th scope="col" className="px-6 py-3">{t('Store Name')}</th>
          <th scope="col" className="px-6 py-3">{t('Owner Email')}</th>
          <th scope="col" className="px-6 py-3">{t('Subscription Status')}</th>
          <th scope="col" className="px-6 py-3">{t('Store Status')}</th>
        </tr>
      </thead>
      <tbody>
        {stores.map((store) => (
          <tr key={store.id} className="bg-background border-b">
            <td className="px-6 py-4 font-medium">{store.name || '-'}</td>
            <td className="px-6 py-4 whitespace-nowrap">{store.email || '-'}</td>
            <td className="px-6 py-4 capitalize">{store.subscription_status || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
      </div>
    </MainLayout>
  );
}
