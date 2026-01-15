import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

// Mock data - replace with API
const data = [
  { month: 'Jan', collected: 320000, pending: 80000 },
  { month: 'Feb', collected: 380000, pending: 70000 },
  { month: 'Mar', collected: 420000, pending: 95000 },
  { month: 'Apr', collected: 350000, pending: 120000 },
  { month: 'May', collected: 480000, pending: 60000 },
  { month: 'Jun', collected: 520000, pending: 45000 },
]

export function FeesChart() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Fee Collection</CardTitle>
        <p className="text-sm text-muted-foreground">
          Monthly fee collection status
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickMargin={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickMargin={8}
                tickFormatter={(value) => `₹${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`₹${(value / 1000).toFixed(0)}k`, '']}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => (
                  <span className="text-sm text-muted-foreground capitalize">
                    {value}
                  </span>
                )}
              />
              <Bar
                dataKey="collected"
                fill="hsl(var(--success))"
                radius={[4, 4, 0, 0]}
                name="Collected"
              />
              <Bar
                dataKey="pending"
                fill="hsl(var(--warning))"
                radius={[4, 4, 0, 0]}
                name="Pending"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

