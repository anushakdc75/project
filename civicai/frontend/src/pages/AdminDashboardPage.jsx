import { useEffect, useState } from 'react'
import { getAlerts, getAnalytics } from '../services/api'

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState({ sla_summary: {}, complaint_volume: {}, area_clusters: [], emerging_alerts: [] })
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    getAnalytics().then(({ data }) => setAnalytics(data)).catch(() => setAnalytics({ error: 'Failed to load analytics' }))
    getAlerts().then(({ data }) => setAlerts(data)).catch(() => setAlerts([{ error: 'Failed to load alerts' }]))
  }, [])

  return (
    <div className="grid md:grid-cols-2 gap-4 text-white">
      <div className="glass p-4"><h3 className="font-semibold">SLA & Volume</h3><pre>{JSON.stringify(analytics, null, 2)}</pre></div>
      <div className="glass p-4"><h3 className="font-semibold">Emerging Alerts</h3><pre>{JSON.stringify(alerts, null, 2)}</pre></div>
    </div>
  )
}
