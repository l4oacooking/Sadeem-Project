import { useNavigate } from 'react-router-dom';
import { Package, Users, Clock, ShoppingBag } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { AnalyticsChart } from '@/components/dashboard/AnalyticsChart';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { format, isToday, isThisWeek, parseISO } from 'date-fns';


// ثم داخل الكومبوننت:



const emptyChartData = [
  { name: 'Mon', value: 0 },
  { name: 'Tue', value: 0 },
  { name: 'Wed', value: 0 },
  { name: 'Thu', value: 0 },
  { name: 'Fri', value: 0 },
  { name: 'Sat', value: 0 },
  { name: 'Sun', value: 0 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  console.log("🚩 Dashboard mounted");
useEffect(() => {
  const storeId = localStorage.getItem('store_id');
  const isSuperadmin = localStorage.getItem('superadmin');

  if (!storeId && !isSuperadmin) {
    navigate('/login');
  }
}, [navigate]);

  const { t, rtl } = useTranslation();

  const [accountClaimsToday, setAccountClaimsToday] = useState(0);
  const [weeklyClaims, setWeeklyClaims] = useState(emptyChartData);
  const [totalProducts, setTotalProducts] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const storeId = localStorage.getItem('store_id');
      if (!storeId) return;

      // Fetch claims
      const { data: claims, error } = await supabase
        .from('claims')
        .select('*')
        .eq('store_id', storeId);

      if (error) {
        console.error('Error fetching claims:', error);
        return;
      }

      if (!claims) return;

      // حساب عدد المطالبات اليوم
      const todayClaims = claims.filter(c => isToday(parseISO(c.timestamp)));
      setAccountClaimsToday(todayClaims.length);

      // حساب عدد المطالبات بالأسبوع
      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const weeklyCounts = weekDays.map(day => ({
  name: day,
  value: claims.filter(c => {
    const date = parseISO(c.timestamp);
    return isThisWeek(date) && format(date, 'EEE') === day;
  }).length
}));
      // Fetch total products (optional - if you want to fill "Total Products")
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('store_id', storeId);

      if (products) {
        setTotalProducts(products.length);
      }

      // حساب عدد المستخدمين الفريدين بناءً على الجوال
      const uniqueUsers = new Set(claims.map(c => c.phone));
      setActiveUsers(uniqueUsers.size);
    };

    fetchAnalytics();
  }, []);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t('Welcome to your dashboard')}</h1>
          <p className="text-muted-foreground">
            {t('Here\'s an overview of your store activity')}
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard 
            title={t("Total Products")}
            value={totalProducts.toString()} 
            icon={<Package size={24} />} 
            color="blue"
          />
          <StatusCard 
            title={t("Active Users")}
            value={activeUsers.toString()} 
            icon={<Users size={24} />} 
            color="green"
          />
          <StatusCard 
            title={t("Expiring Soon")}
            value="0" 
            icon={<Clock size={24} />} 
            color="purple"
          />
          <StatusCard 
            title={t("Account Claims Today")}
            value={accountClaimsToday.toString()} 
            icon={<ShoppingBag size={24} />} 
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard 
            title={t("Weekly Account Claims")}
            description={t("The number of accounts claimed per day this week")}
          >
            <AnalyticsChart data={weeklyClaims} type="bar" height={250} />
          </ChartCard>
          
          <ChartCard 
            title={t("Active Products Status")}
            description={t("Distribution of active products by category")}
          >
            <div className="h-[250px] flex items-center justify-center">
              <p className="text-muted-foreground">{t("No product data available")}</p>
            </div>
          </ChartCard>
        </div>
      </div>
    </MainLayout>
  );
}
