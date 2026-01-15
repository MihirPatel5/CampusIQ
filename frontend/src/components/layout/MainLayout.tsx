import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { useSidebarStore } from '@/stores/sidebarStore'
import { cn } from '@/lib/utils'

export function MainLayout() {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div
        className={cn(
          'min-h-screen transition-all duration-200',
          isCollapsed ? 'lg:ml-20' : 'lg:ml-[260px]'
        )}
      >
        <Navbar />
        
        <main className="p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}

