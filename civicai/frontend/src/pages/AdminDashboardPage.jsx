import { useEffect, useState } from 'react'
import { getAlerts, getAnalytics } from '../services/api'

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const [{ data: analyticsData }, { data: alertsData }] = await Promise.all([getAnalytics(), getAlerts()])
      setAnalytics(analyticsData)
      setAlerts(alertsData || [])
      setError('')
    } catch {
      setError('Unable to load live analytics right now.')
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-4 text-white">
      <div className="flex justify-between items-center glass p-4">
        <h2 className="text-xl font-semibold">Admin Command Center</h2>
        <button className="pill" onClick={load}>Refresh</button>
      </div>
      {error && <div className="rounded-xl bg-red-500/20 border border-red-400/30 p-3">{error}</div>}
      <div className="grid md:grid-cols-4 gap-3">
        <MetricCard label="Total complaints" value={analytics?.sla_summary?.total_complaints ?? '-'} />
        <MetricCard label="Open" value={analytics?.sla_summary?.open_cases ?? '-'} />
        <MetricCard label="Resolved" value={analytics?.sla_summary?.resolved_cases ?? '-'} />
        <MetricCard label="SLA breaches" value={analytics?.sla_summary?.sla_breaches ?? '-'} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass p-4">
          <h3 className="font-semibold mb-3">Area clusters</h3>
          <ul className="space-y-2 text-sm">
            {(analytics?.area_clusters || []).slice(0, 8).map((c) => (
              <li key={`${c.location}-${c.dominant_department}`} className="bg-black/25 rounded-xl p-3 flex justify-between gap-3">
                <span>{c.location}</span>
                <span className="text-cyan-200">{c.complaint_count} • {c.dominant_department}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass p-4">
          <h3 className="font-semibold mb-3">Emerging alerts</h3>
          <ul className="space-y-2 text-sm">
            {(alerts || []).slice(0, 8).map((a, idx) => (
              <li key={`${a.location}-${idx}`} className="bg-black/25 rounded-xl p-3">
                <div className="flex justify-between"><span>{a.location}</span><span className="text-amber-300 uppercase">{a.severity}</span></div>
                <p className="text-cyan-200">{a.department} • {a.complaint_count || a.issue_count} reports</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="glass p-4">
      <p className="text-xs uppercase text-white/70">{label}</p>
      <p className="text-2xl font-bold text-cyan-200 mt-2">{value}</p>
    </div>
  )
}
