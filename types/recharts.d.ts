// Minimal ambient declarations to sidestep JSX type incompatibilities across workspaces
declare module 'recharts' {
  export const ResponsiveContainer: any
  export const LineChart: any
  export const Line: any
  export const XAxis: any
  export const YAxis: any
  export const Tooltip: any
  export const CartesianGrid: any
  export const BarChart: any
  export const Bar: any
  export const PieChart: any
  export const Pie: any
  export const Cell: any
  export const Legend: any
}
