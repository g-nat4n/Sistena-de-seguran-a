import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { HourlyAlertPoint } from '../../types/dashboard'

export function AlertsByHourChart({ data }: { data: HourlyAlertPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="alertFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#263449" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#263449' }}
            interval={3}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#263449' }}
            width={28}
          />
          <Tooltip
            contentStyle={{
              background: '#151E30',
              border: '1px solid #263449',
              borderRadius: 8,
              color: '#F8FAFC',
            }}
            labelStyle={{ color: '#94A3B8' }}
          />
          <Area
            type="monotone"
            dataKey="count"
            name="Alertas"
            stroke="#3B82F6"
            fill="url(#alertFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
