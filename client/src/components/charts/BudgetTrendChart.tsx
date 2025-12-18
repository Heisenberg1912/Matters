import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { chartColors, formatCurrency, formatDate, tooltipStyle, axisStyle, gridStyle } from '@/lib/chartUtils';

interface BudgetTrendChartProps {
  data: Array<{ date: string; spent: number; allocated: number }>;
}

export function BudgetTrendChart({ data }: BudgetTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid {...gridStyle} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          {...axisStyle}
        />
        <YAxis
          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
          {...axisStyle}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number) => formatCurrency(value)}
          labelFormatter={formatDate}
        />
        <Line
          type="monotone"
          dataKey="spent"
          stroke={chartColors.primary}
          strokeWidth={3}
          dot={{ fill: chartColors.primary, r: 4 }}
          name="Spent"
        />
        <Line
          type="monotone"
          dataKey="allocated"
          stroke={chartColors.gray}
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          name="Allocated"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
