import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/stores/sidebarStore'
import { useAuthStore } from '@/stores/authStore'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  ClipboardCheck,
  FileText,
  CreditCard,
  Calendar,
  Bell,
  Library,
  Bus,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Sidebar() {
  const location = useLocation()
  const { isCollapsed, toggleCollapse, isMobileOpen, setMobileOpen } = useSidebarStore()
  const user = useAuthStore((state) => state.user)

  const menuItems = [
    {
      title: 'Main',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        ...(user?.role === 'super_admin' ? [
          { label: 'Schools', icon: Building2, path: '/schools' }
        ] : []),
      ],
    },
    {
      title: 'Academic',
      items: [
        { label: 'Students', icon: Users, path: '/students' },
        ...(['admin', 'super_admin'].includes(user?.role || '') ? [
          { label: 'Teachers', icon: GraduationCap, path: '/teachers' }
        ] : []),
        { label: 'Classes', icon: Layers, path: '/classes' },
        { label: 'Subjects', icon: BookOpen, path: '/subjects' },
      ],
    },
    {
      title: 'Management',
      items: [
        { label: 'Attendance', icon: ClipboardCheck, path: '/attendance' },
        { label: 'Exams', icon: FileText, path: '/exams' },
        ...(['admin', 'super_admin'].includes(user?.role || '') ? [
          { label: 'Fees', icon: CreditCard, path: '/fees' }
        ] : []),
        { label: 'Timetable', icon: Calendar, path: '/timetable' },
      ],
    },
    {
      title: 'Others',
      items: [
        { label: 'Notices', icon: Bell, path: '/notices' },
        { label: 'Library', icon: Library, path: '/library' },
        { label: 'Transport', icon: Bus, path: '/transport' },
        { label: 'Settings', icon: Settings, path: '/settings' },
      ],
    },
  ]

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-display font-bold text-lg text-sidebar-foreground whitespace-nowrap overflow-hidden"
              >
                School ERP
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-6 px-3">
          {menuItems.map((section, sectionIndex) => (
            <div key={section.title}>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2"
                  >
                    {section.title}
                  </motion.h3>
                )}
              </AnimatePresence>

              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path
                  const Icon = item.icon

                  const linkContent = (
                    <Link
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                      )}
                    >
                      <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-sidebar-primary-foreground')} />
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="whitespace-nowrap overflow-hidden"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                  )

                  return (
                    <li key={item.path}>
                      {isCollapsed ? (
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                            <TooltipContent side="right" className="font-medium">
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        linkContent
                      )}
                    </li>
                  )
                })}
              </ul>

              {sectionIndex < menuItems.length - 1 && !isCollapsed && (
                <Separator className="mt-4 bg-sidebar-border" />
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* User Info */}
      <div className="border-t border-sidebar-border p-4">
        <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-semibold">
            {user?.first_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-sidebar-foreground/50 capitalize">{user?.role}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse Toggle - Desktop only */}
      <div className="hidden lg:block border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          className="w-full justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!isCollapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 260 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border fixed left-0 top-0 h-screen z-40"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed left-0 top-0 w-[280px] h-screen bg-sidebar z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

