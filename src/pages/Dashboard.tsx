import { useNavigate } from 'react-router-dom';
import { Package, Users, Clock, ShoppingBag } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { AnalyticsChart } from '@/components/dashboard/AnalyticsChart';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';

// Empty chart data
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
  const { t, rtl } = useTranslation();

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
            value="0" 
            icon={<Package size={24} />} 
            color="blue"
          />
          <StatusCard 
            title={t("Active Users")}
            value="0" 
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
            value="0" 
            icon={<ShoppingBag size={24} />} 
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard 
            title={t("Weekly Account Claims")}
            description={t("The number of accounts claimed per day this week")}
          >
            <AnalyticsChart data={emptyChartData} type="bar" height={250} />
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

        {/* Empty States Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Empty Alerts Section */}
          <div className="dashboard-card">
            <div className={`flex justify-between items-center mb-4 ${rtl ? 'flex-row-reverse' : ''}`}>
              <h3 className="text-lg font-semibold">{t("Recent Alerts")}</h3>
              <Button variant="outline" size="sm" onClick={() => navigate('/alerts')}>
                {t("View All")}
              </Button>
            </div>
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <p>{t("No alerts to display")}</p>
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
}
