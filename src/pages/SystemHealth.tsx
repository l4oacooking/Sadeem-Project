import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertCircle, Check, Database, RefreshCcw, Server, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';

// Empty system health data
const getSystemHealthData = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    systemStatus: {
      uptime: "100%",
      apiLatency: "0ms",
      serverLoad: 0,
      dbConnections: 0,
      memoryUsage: 0,
      storageUsage: 0,
    },
    incidentHistory: [],
    securityAlerts: []
  };
};

const SystemHealth = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: getSystemHealthData,
  });

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: t("Error loading system health data"),
        description: t("Failed to load system health information. Please try again later."),
      });
    }
  }, [error, toast, t]);

  const handleRefresh = () => {
    refetch();
    toast({
      title: t("Refreshing data"),
      description: t("System health data is being updated."),
    });
  };

  const getProgressColor = (value: number) => {
    if (value < 50) return "bg-neon-green";
    if (value < 80) return "bg-neon-blue";
    return "bg-destructive";
  };

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case "resolved":
        return <Badge variant="outline" className="bg-neon-green/10 text-neon-green border-neon-green">{t("Resolved")}</Badge>;
      case "investigating":
        return <Badge variant="outline" className="bg-neon-blue/10 text-neon-blue border-neon-blue">{t("Investigating")}</Badge>;
      case "upcoming":
        return <Badge variant="outline" className="bg-neon-purple/10 text-neon-purple border-neon-purple">{t("Upcoming")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAlertLevelBadge = (level: string) => {
    switch(level.toLowerCase()) {
      case "high":
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">{t("High")}</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500">{t("Medium")}</Badge>;
      case "low":
        return <Badge variant="outline" className="bg-neon-blue/10 text-neon-blue border-neon-blue">{t("Low")}</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  return (
    <MainLayout isAdmin={true}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">{t("System Health")}</h1>
            <Button onClick={handleRefresh} variant="outline" size="sm" className="flex items-center gap-2">
              <RefreshCcw size={16} />
              <span>{t("Refresh")}</span>
            </Button>
          </div>
          <p className="text-muted-foreground">{t("Monitor system performance, incidents, and security status.")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="dashboard-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Server size={18} className="text-neon-blue" />
                <span>{t("Server Status")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("Uptime")}</span>
                    <span className="text-sm font-medium">{isLoading ? '-' : data?.systemStatus.uptime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("API Latency")}</span>
                    <span className="text-sm font-medium">{isLoading ? '-' : data?.systemStatus.apiLatency}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("Server Load")}</span>
                      <span className="text-sm font-medium">{isLoading ? '-' : `${data?.systemStatus.serverLoad}%`}</span>
                    </div>
                    <Progress 
                      value={data?.systemStatus.serverLoad} 
                      className={`h-2 ${getProgressColor(data?.systemStatus.serverLoad ?? 0)}`}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Database size={18} className="text-neon-green" />
                <span>{t("Database Health")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("Active Connections")}</span>
                    <span className="text-sm font-medium">{isLoading ? '-' : data?.systemStatus.dbConnections}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("Memory Usage")}</span>
                      <span className="text-sm font-medium">{isLoading ? '-' : `${data?.systemStatus.memoryUsage}%`}</span>
                    </div>
                    <Progress 
                      value={data?.systemStatus.memoryUsage} 
                      className={`h-2 ${getProgressColor(data?.systemStatus.memoryUsage ?? 0)}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("Storage Usage")}</span>
                      <span className="text-sm font-medium">{isLoading ? '-' : `${data?.systemStatus.storageUsage}%`}</span>
                    </div>
                    <Progress 
                      value={data?.systemStatus.storageUsage} 
                      className={`h-2 ${getProgressColor(data?.systemStatus.storageUsage ?? 0)}`}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-neon-purple" />
                <span>{t("Security Status")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-neon-green" />
                    <span className="text-sm">{t("Firewall")}</span>
                  </div>
                  <Badge variant="outline" className="bg-neon-green/10 text-neon-green">{t("Secure")}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-neon-green" />
                    <span className="text-sm">{t("DDoS Protection")}</span>
                  </div>
                  <Badge variant="outline" className="bg-neon-green/10 text-neon-green">{t("Active")}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-neon-green" />
                    <span className="text-sm">{t("SSL Certificate")}</span>
                  </div>
                  <Badge variant="outline" className="bg-neon-green/10 text-neon-green">{t("Valid")}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Incidents */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity size={18} className="text-neon-blue" />
              <span>{t("Incident History")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.incidentHistory && data.incidentHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Title")}</TableHead>
                    <TableHead>{t("Date")}</TableHead>
                    <TableHead>{t("Duration")}</TableHead>
                    <TableHead>{t("Status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.incidentHistory.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell className="font-medium">{incident.title}</TableCell>
                      <TableCell>{incident.date}</TableCell>
                      <TableCell>{incident.duration}</TableCell>
                      <TableCell>{getStatusBadge(incident.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t("No incidents reported")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Alerts */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-neon-purple" />
              <span>{t("Security Alerts")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.securityAlerts && data.securityAlerts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Alert")}</TableHead>
                    <TableHead>{t("Level")}</TableHead>
                    <TableHead>{t("Source")}</TableHead>
                    <TableHead>{t("Status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.securityAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">{alert.title}</TableCell>
                      <TableCell>{getAlertLevelBadge(alert.level)}</TableCell>
                      <TableCell>{alert.source}</TableCell>
                      <TableCell>{getStatusBadge(alert.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t("No security alerts")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default SystemHealth;
