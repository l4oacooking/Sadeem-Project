import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, TrendingUp, Users } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

// ثم داخل الكومبوننت:

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
// Function to check if using demo account
const isDemoAccount = () => {
  const storeId = localStorage.getItem('store_id');
  return storeId === 'new' || storeId === 'demo';
};

// Empty data for charts
const emptyChartData = [
  { day: 'Sun', accounts: 0, users: 0 },
  { day: 'Mon', accounts: 0, users: 0 },
  { day: 'Tue', accounts: 0, users: 0 },
  { day: 'Wed', accounts: 0, users: 0 },
  { day: 'Thu', accounts: 0, users: 0 },
  { day: 'Fri', accounts: 0, users: 0 },
  { day: 'Sat', accounts: 0, users: 0 },
];

// Demo data for charts
const demoChartData = [
  { day: 'Sun', accounts: 5, users: 8 },
  { day: 'Mon', accounts: 12, users: 17 },
  { day: 'Tue', accounts: 8, users: 11 },
  { day: 'Wed', accounts: 15, users: 19 },
  { day: 'Thu', accounts: 10, users: 13 },
  { day: 'Fri', accounts: 18, users: 22 },
  { day: 'Sat', accounts: 14, users: 16 },
];

// Data fetching function - will use demo data only for demo accounts
const getAnalyticsData = async (isAdmin: boolean) => {
  if (isDemoAccount()) {
    return {
      weeklyData: demoChartData,
      stats: {
        totalProducts: isAdmin ? 24 : 12,
        activeUsers: isAdmin ? 87 : 34,
      }
    };
  }

  const storeId = localStorage.getItem('store_id');

  // جلب المنتجات للمستخدم أو لكل المتاجر إذا هو سوبرأدمين
  let totalProducts = 0;
  let activeUsers = 0;
  let weeklyData = [...emptyChartData];

  // المنتجات
  if (isAdmin) {
    // سوبرأدمين: كل المنتجات في كل المتاجر
    const { count: productsCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true });

    totalProducts = productsCount || 0;
  } else {
    // صاحب متجر: المنتجات الخاصة بمتجره فقط
    const { count: productsCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId);

    totalProducts = productsCount || 0;
  }

  // المستخدمين النشطين (نحسب المستخدمين المميزين في logs آخر 7 أيام)
  let logsQuery = supabase
    .from('logs')
    .select('user_phone', { count: 'exact' });

  if (!isAdmin) {
    logsQuery = logsQuery.eq('store_id', storeId);
  }

  // Logs الأسبوع
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  logsQuery = logsQuery.gte('created_at', weekAgo.toISOString());

  const { data: logRows, error: logsError } = await logsQuery;

  // عدد المستخدمين الفريدين
  if (logRows && Array.isArray(logRows)) {
    const usersSet = new Set(logRows.map(l => l.user_phone));
    activeUsers = usersSet.size;
  }

  // **جلب احصائيات claims/accounts لكل يوم (مثال مبسط)**
  // تفترض أن لديك حقل created_at في logs
  const { data: logs } = await supabase
    .from('logs')
    .select('created_at, user_phone')
    .gte('created_at', weekAgo.toISOString());

  if (logs && Array.isArray(logs)) {
    // تجميع باليوم (Sun, Mon...)
    const daysMap = {
      0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'
    };
    let chart = { Sun: { accounts: 0, users: new Set() }, Mon: { accounts: 0, users: new Set() }, Tue: { accounts: 0, users: new Set() }, Wed: { accounts: 0, users: new Set() }, Thu: { accounts: 0, users: new Set() }, Fri: { accounts: 0, users: new Set() }, Sat: { accounts: 0, users: new Set() } };
    logs.forEach(log => {
      const day = daysMap[new Date(log.created_at).getDay()];
      chart[day].accounts += 1;
      chart[day].users.add(log.user_phone);
    });

    weeklyData = Object.entries(chart).map(([day, v]: any) => ({
      day,
      accounts: v.accounts,
      users: v.users.size,
    }));
  }

  return {
    weeklyData,
    stats: {
      totalProducts,
      activeUsers,
    }
  };
};
type AnalyticsProps = {
  isAdmin?: boolean;
};

const Analytics = ({ isAdmin = false }: AnalyticsProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

useEffect(() => {
  const storeId = localStorage.getItem('store_id');
  const isSuperadmin = localStorage.getItem('superadmin');

  if (!storeId && !isSuperadmin) {
    navigate('/login');
  }
}, [navigate]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', isAdmin],
    queryFn: () => getAnalyticsData(isAdmin),
  });

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: t("Error loading analytics"),
        description: t("Failed to load analytics data. Please try again later."),
      });
    }
  }, [error, toast, t]);

  return (
    <MainLayout isAdmin={isAdmin}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {isAdmin ? t("System Analytics") : t("Analytics Dashboard")}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? t("Monitor system-wide metrics and performance across all stores.") 
              : t("Track your store's performance and user activity.")}
          </p>
        </div>

        {/* Show demo account notice if using the demo account */}
        {isDemoAccount() && (
          <div className="rounded-md bg-yellow-500/10 p-3 text-yellow-600 border border-yellow-200 dark:border-yellow-900 dark:text-yellow-400">
            <p className="text-sm">{t("Demo Mode: The data shown is sample data. In a real environment, this would display actual analytics from your store.")}</p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="dashboard-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {isAdmin ? t("Total Stores") : t("Total Products")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{isLoading ? '...' : data?.stats.totalProducts}</div>
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {isDemoAccount() 
                  ? t("+5% from last month") 
                  : t("No change since last month")}
              </p>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("Active Users")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{isLoading ? '...' : data?.stats.activeUsers}</div>
                <div className="h-8 w-8 rounded-full bg-neon-blue/20 flex items-center justify-center text-neon-blue">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {isDemoAccount() 
                  ? t("+12% from last week") 
                  : t("No change since last week")}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card className="dashboard-card col-span-1">
            <CardHeader>
              <CardTitle>{isAdmin ? t("Global Account Claims") : t("Weekly Account Claims")}</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {isLoading ? (
                <div className="h-[350px] w-full flex items-center justify-center">
                  <div className="animate-pulse">{t("Loading chart data...")}</div>
                </div>
              ) : data?.weeklyData.every(day => day.accounts === 0 && day.users === 0) ? (
                <div className="h-[350px] w-full flex flex-col items-center justify-center text-muted-foreground">
                  <BarChart3 size={40} className="mb-2 opacity-50" />
                  <p>{t("No analytics data available")}</p>
                  <p className="text-sm">{t("Data will appear here once your account becomes active")}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart
                    data={data?.weeklyData}
                    margin={{
                      top: 5,
                      right: 10,
                      left: 10,
                      bottom: 5,
                    }}
                  >
                    <defs>
                      <linearGradient id="colorAccounts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1EAEDB" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#1EAEDB" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(26, 31, 44, 0.8)', 
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '0.5rem',
                        color: 'white'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="accounts" 
                      stroke="#1EAEDB" 
                      fillOpacity={1} 
                      fill="url(#colorAccounts)" 
                      name={t("Accounts Claimed")}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#4ade80" 
                      fillOpacity={1} 
                      fill="url(#colorUsers)" 
                      name={t("Users Interacted")}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Analytics;
