import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import LandingPage from './pages/LandingPage'
import AIChatPage from './pages/AIChatPage'
import ComplaintHistoryPage from './pages/ComplaintHistoryPage'
import StatusTrackerPage from './pages/StatusTrackerPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AnalyticsPage from './pages/AnalyticsPage'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '◈' },
  { to: '/chat', label: 'AI Workspace', icon: '◎' },
  { to: '/history', label: 'History', icon: '▦' },
  { to: '/tracker', label: 'Tracker', icon: '◉' },
  { to: '/admin', label: 'Admin', icon: '⌘' },
  { to: '/analytics', label: 'Analytics', icon: '◍' },
]

export default function App() {
  const location = useLocation()

  return (
    <div className="desktop-shell min-h-screen text-white p-5 lg:p-7">
      <div className="pointer-events-none aurora-bg" />
      <div className="grid grid-cols-[260px_1fr] gap-5 h-[calc(100vh-3rem)] relative z-10">
        <aside className="glass-panel p-4 flex flex-col">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">CivicAI</p>
            <h1 className="text-xl font-semibold mt-1">Governance OS</h1>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
              return (
                <Link key={item.to} to={item.to} className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`}>
                  <span className="text-cyan-200">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
          <div className="mt-auto text-xs text-slate-300">Desktop-first control center • 1366px+</div>
        </aside>

        <section className="flex flex-col gap-4 min-w-0">
          <header className="glass-panel px-5 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-300 uppercase tracking-widest">Real-time civic intelligence</p>
              <h2 className="font-semibold">{navItems.find((x) => location.pathname === x.to)?.label || 'Workspace'}</h2>
            </div>
            <div className="text-xs text-slate-300">Shortcut: <kbd className="kbd">Enter</kbd> send • <kbd className="kbd">Ctrl+K</kbd> focus chat</div>
          </header>

          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="glass-panel flex-1 p-5 overflow-auto"
          >
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/chat" element={<AIChatPage />} />
              <Route path="/history" element={<ComplaintHistoryPage />} />
              <Route path="/tracker" element={<StatusTrackerPage />} />
              <Route path="/status" element={<StatusTrackerPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Routes>
          </motion.main>
        </section>
      </div>
    </div>
  )
}
