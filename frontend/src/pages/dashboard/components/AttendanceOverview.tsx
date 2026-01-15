import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const data = [
  { name: 'Present', value: 2392, color: 'hsl(var(--success))' },
  { name: 'Absent', value: 98, color: 'hsl(var(--destructive))' },
  { name: 'Late', value: 45, color: 'hsl(var(--warning))' },
  { name: 'Excused', value: 12, color: 'hsl(var(--info))' },
]

const classWiseData = [
  { class: 'Class 10', percentage: 96 },
  { class: 'Class 9', percentage: 94 },
  { class: 'Class 8', percentage: 92 },
  { class: 'Class 7', percentage: 95 },
  { class: 'Class 6', percentage: 91 },
]

export function AttendanceOverview() {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const presentPercentage = ((data[0].value / total) * 100).toFixed(1)

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Attendance Overview</CardTitle>
        <p className="text-sm text-muted-foreground">Today's attendance summary</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pie Chart */}
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => (
                  <span className="text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Overall Percentage */}
        <div className="text-center py-2 rounded-lg bg-muted/50">
          <p className="text-3xl font-bold text-foreground">{presentPercentage}%</p>
          <p className="text-sm text-muted-foreground">Overall Attendance</p>
        </div>

        {/* Class-wise Breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Class-wise Attendance</p>
          {classWiseData.map((item) => (
            <div key={item.class} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.class}</span>
                <span className="font-medium text-foreground">{item.percentage}%</span>
              </div>
              <Progress value={item.percentage} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

