import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { chartColors, formatCurrency, tooltipStyle } from '@/lib/chartUtils';

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface CategoryDonutChartProps {
  data: CategoryData[];
}

export function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number) => formatCurrency(value)}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(value) => <span style={{ color: '#ffffff' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
