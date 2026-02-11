import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import AIChatPage from './pages/AIChatPage'
import ComplaintHistoryPage from './pages/ComplaintHistoryPage'
import StatusTrackerPage from './pages/StatusTrackerPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AnalyticsPage from './pages/AnalyticsPage'

export default function App() {
  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<AIChatPage />} />
        <Route path="/history" element={<ComplaintHistoryPage />} />
        <Route path="/tracker" element={<StatusTrackerPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </div>
  )
}
