import { motion } from 'framer-motion'
import { StatsCards } from './components/StatsCards'
import { AdmissionsChart } from './components/AdmissionsChart'
import { FeesChart } from './components/FeesChart'
import { AttendanceOverview } from './components/AttendanceOverview'
import { RecentActivities } from './components/RecentActivities'
import { QuickActions } from './components/QuickActions'
import { UpcomingEvents } from './components/UpcomingEvents'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

export default function DashboardPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome to your school management dashboard
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants}>
        <StatsCards />
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <QuickActions />
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <AdmissionsChart />
        </motion.div>
        <motion.div variants={itemVariants}>
          <FeesChart />
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants}>
          <AttendanceOverview />
        </motion.div>
        <motion.div variants={itemVariants}>
          <RecentActivities />
        </motion.div>
        <motion.div variants={itemVariants}>
          <UpcomingEvents />
        </motion.div>
      </div>
    </motion.div>
  )
}

