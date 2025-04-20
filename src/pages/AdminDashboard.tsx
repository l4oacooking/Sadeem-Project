import { Store, Users, AlertTriangle, BarChart3, Activity, Shield } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { AnalyticsChart } from '@/components/dashboard/AnalyticsChart';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
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

export default function AdminDashboard() {
  const { t, rtl } = useTranslation();

  return (
    <MainLayout isAdmin={true}>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t('System Administration')}</h1>
          <p className="text-muted-foreground">
            {t('System management and monitoring')}
          </p>
        </div>

        {/* System Status */}
        <div className="dashboard-card p-6">
          <div className={`flex flex-col md:flex-row md:justify-between md:items-center gap-4 ${rtl ? 'md:flex-row-reverse' : ''}`}>
            <div>
              <h2 className="text-xl font-semibold">{t('System Status')}: <span className="text-neon-green">{t('Live')}</span></h2>
              <div className={`flex items-center gap-6 mt-2 ${rtl ? 'flex-row-reverse' : ''}`}>
                <div>
                  <div className="text-sm text-muted-foreground">{t('Total Stores')}</div>
                  <div className="text-2xl font-bold stats-value">0</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('Issues Reported')}</div>
                  <div className="text-2xl font-bold stats-value">0</div>
                </div>
              </div>
            </div>
            <div className={`flex gap-2 ${rtl ? 'flex-row-reverse' : ''}`}>
              <Button variant="outline">{t('View System Logs')}</Button>
              <Button>{t('Send Announcement')}</Button>
            </div>
          </div>
        </div>

        {/* Global Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard 
            title={t("Total Products")}
            value="0" 
            icon={<Store size={24} />} 
            color="blue"
          />
          <StatusCard 
            title={t("Total Users")}
            value="0" 
            icon={<Users size={24} />} 
            color="green"
          />
          <StatusCard 
            title={t("Expiring Soon")}
            value="0" 
            icon={<AlertTriangle size={24} />} 
            color="purple"
          />
          <StatusCard 
            title={t("Claims Today")}
            value="0" 
            icon={<Activity size={24} />} 
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard 
            title={t("System Activity")}
            description={t("Claims across all stores this week")}
          >
            <AnalyticsChart data={emptyChartData} type="area" height={250} />
          </ChartCard>
          
          <ChartCard 
            title={t("System Health & Alerts")}
            description={t("System performance and alerts")}
          >
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <p>{t("No alerts to display")}</p>
            </div>
          </ChartCard>
        </div>

        {/* Store Management */}
        <div className="dashboard-card p-0 overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className={`flex justify-between items-center ${rtl ? 'flex-row-reverse' : ''}`}>
              <h3 className="text-lg font-semibold">{t('Store Management')}</h3>
              <div className={`flex gap-2 ${rtl ? 'flex-row-reverse' : ''}`}>
                <Button variant="outline" size="sm">{t('View All')}</Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={rtl ? 'text-right' : ''}>{t('Store Name')}</TableHead>
                  <TableHead className={rtl ? 'text-right' : ''}>{t('Store ID')}</TableHead>
                  <TableHead className={rtl ? 'text-right' : ''}>{t('Claims Today')}</TableHead>
                  <TableHead className={rtl ? 'text-right' : ''}>{t('Status')}</TableHead>
                  <TableHead className={rtl ? 'text-right' : ''}>{t('Last Activity')}</TableHead>
                  <TableHead className={rtl ? 'text-left' : 'text-right'}>{t('Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t('No stores found')}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Admin Tools */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold mb-4">{t('Admin Tools')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button variant="outline" className={`justify-start ${rtl ? 'text-right' : 'text-left'}`}>{t('System Settings')}</Button>
            <Button variant="outline" className={`justify-start ${rtl ? 'text-right' : 'text-left'}`}>{t('User Management')}</Button>
            <Button variant="outline" className={`justify-start ${rtl ? 'text-right' : 'text-left'}`}>{t('Send Notification')}</Button>
            <Button variant="outline" className={`justify-start ${rtl ? 'text-right' : 'text-left'}`}>{t('System Backup')}</Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
