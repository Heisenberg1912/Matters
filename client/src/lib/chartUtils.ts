// Chart utilities and configurations

export const chartColors = {
  primary: '#cfe0ad',
  secondary: '#b8d4f1',
  tertiary: '#f3c5a8',
  quaternary: '#e8b3d4',
  quinary: '#d4e8b3',
  success: '#4ade80',
  warning: '#f3c5a8',
  error: '#f87171',
  gray: '#6a6a6a'
};

export const formatCurrency = (value: number): string => {
  return `₹${value.toLocaleString()}`;
};

export const formatPercent = (value: number): string => {
  return `${value}%`;
};

export const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

// Common chart configurations
export const commonChartConfig = {
  margin: { top: 5, right: 30, left: 20, bottom: 5 }
};

export const tooltipStyle = {
  backgroundColor: '#101010',
  border: '1px solid #2a2a2a',
  borderRadius: '8px',
  color: '#ffffff'
};

export const axisStyle = {
  stroke: '#8a8a8a',
  fontSize: 12
};

export const gridStyle = {
  stroke: '#1f1f1f',
  strokeDasharray: '3 3'
};
