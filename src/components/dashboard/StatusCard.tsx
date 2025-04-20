import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

type StatusCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  color?: 'blue' | 'green' | 'purple' | 'default';
};

export function StatusCard({ title, value, icon, trend, className, color = 'default' }: StatusCardProps) {
  const { rtl } = useTranslation();
  
  const colorStyles = {
    blue: "border-neon-blue/20 bg-neon-blue/5",
    green: "border-neon-green/20 bg-neon-green/5",
    purple: "border-neon-purple/20 bg-neon-purple/5",
    default: "border-border"
  };

  const iconStyles = {
    blue: "text-neon-blue",
    green: "text-neon-green",
    purple: "text-neon-purple",
    default: "text-foreground"
  };

  return (
    <div className={cn(
      "dashboard-card flex flex-col space-y-3", 
      colorStyles[color], 
      className
    )}>
      <div className={`flex justify-between items-start ${rtl ? 'flex-row-reverse' : ''}`}>
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className={cn("p-2 rounded-full", iconStyles[color])}>
          {icon}
        </div>
      </div>
      <div className={`flex items-baseline ${rtl ? 'flex-row-reverse space-x-reverse' : ''} space-x-2`}>
        <h2 className="text-2xl font-bold stats-value">{value}</h2>
        {trend && (
          <span className={cn(
            "text-xs font-medium",
            trend.isPositive ? "text-neon-green" : "text-destructive"
          )}>
            {trend.isPositive ? "+" : "-"}{trend.value}%
          </span>
        )}
      </div>
    </div>
  );
}
