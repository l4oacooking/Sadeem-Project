
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartData = {
  name: string;
  value: number;
  [key: string]: any;
};

type ChartProps = {
  data: ChartData[];
  type?: 'line' | 'bar' | 'area';
  dataKey?: string;
  xAxisDataKey?: string;
  height?: number;
  colors?: string[];
  showGrid?: boolean;
  showTooltip?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  className?: string;
};

const defaultColors = ['#1EAEDB', '#4ade80', '#9b87f5'];

export function AnalyticsChart({
  data,
  type = 'line',
  dataKey = 'value',
  xAxisDataKey = 'name',
  height = 300,
  colors = defaultColors,
  showGrid = true,
  showTooltip = true,
  showXAxis = true,
  showYAxis = true,
  className,
}: ChartProps) {
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 10, left: 10, bottom: 10 },
    };

    switch (type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.1} />}
            {showXAxis && <XAxis dataKey={xAxisDataKey} axisLine={false} tickLine={false} />}
            {showYAxis && <YAxis allowDecimals={false} axisLine={false} tickLine={false} />}
            {showTooltip && <Tooltip contentStyle={{ backgroundColor: 'rgba(26, 31, 44, 0.8)', border: 'none', borderRadius: '8px' }} />}
            <Bar dataKey={dataKey} fill={colors[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.1} />}
            {showXAxis && <XAxis dataKey={xAxisDataKey} axisLine={false} tickLine={false} />}
            {showYAxis && <YAxis axisLine={false} tickLine={false} />}
            {showTooltip && <Tooltip contentStyle={{ backgroundColor: 'rgba(26, 31, 44, 0.8)', border: 'none', borderRadius: '8px' }} />}
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors[0]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey={dataKey} stroke={colors[0]} fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        );
      case 'line':
      default:
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.1} />}
            {showXAxis && <XAxis dataKey={xAxisDataKey} axisLine={false} tickLine={false} />}
            {showYAxis && <YAxis axisLine={false} tickLine={false} />}
            {showTooltip && <Tooltip contentStyle={{ backgroundColor: 'rgba(26, 31, 44, 0.8)', border: 'none', borderRadius: '8px' }} />}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              strokeWidth={2}
              dot={{ stroke: colors[0], strokeWidth: 2, fill: "transparent", r: 4 }}
              activeDot={{ stroke: colors[0], strokeWidth: 2, fill: colors[0], r: 6 }}
            />
          </LineChart>
        );
    }
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
