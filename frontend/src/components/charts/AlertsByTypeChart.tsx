import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AlertTypeCount } from '../../types/dashboard'

export function AlertsByTypeChart({ data }: { data: AlertTypeCount[] }) {
  const chartData = data.map((item) => ({
    ...item,
    shortLabel: item.label.split(' ')[0],
  }))

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ left: 0, right: 8 }}>
          <CartesianGrid stroke="#263449" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="shortLabel"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#263449' }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#263449' }}
            width={28}
          />
          <Tooltip
            formatter={(value, _name, props) => [value, props.payload.label]}
            contentStyle={{
              background: '#151E30',
              border: '1px solid #263449',
              borderRadius: 8,
              color: '#F8FAFC',
            }}
          />
          <Bar dataKey="count" name="Ocorrências" fill="#22C55E" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
