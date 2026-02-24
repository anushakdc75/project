import { useEffect, useState } from 'react'
import { getAlerts, getAnalytics } from '../services/api'

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState(null)
  const [alerts, setAlerts] = useState([])

  const load = async () => {
    const [{ data: analyticsData }, { data: alertsData }] = await Promise.all([getAnalytics(), getAlerts()])
    setAnalytics(analyticsData)
    setAlerts(alertsData || [])
  }

  useEffect(() => { load().catch(() => {}) }, [])

  return (
    <div className="space-y-4 text-white">
      <div className="gov-card p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Government Operations Dashboard</h2>
          <p className="text-sm text-slate-200">SLA health, area burden, and emerging civic alerts.</p>
        </div>
        <button className="pill" onClick={load}>Refresh</button>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <MetricCard label="Total" value={analytics?.sla_summary?.total_complaints ?? '-'} />
        <MetricCard label="Open" value={analytics?.sla_summary?.open_cases ?? '-'} />
        <MetricCard label="Resolved" value={analytics?.sla_summary?.resolved_cases ?? '-'} />
        <MetricCard label="SLA Breaches" value={analytics?.sla_summary?.sla_breaches ?? '-'} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="gov-card p-4">
          <h3 className="font-semibold mb-2">Area Workload</h3>
          <ul className="space-y-2 text-sm">
            {(analytics?.area_clusters || []).slice(0, 10).map((c) => (
              <li key={`${c.location}-${c.dominant_department}`} className="rounded-lg bg-slate-800/50 p-3 flex justify-between">
                <span>{c.location}</span>
                <span className="text-cyan-300">{c.complaint_count} • {c.dominant_department}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="gov-card p-4">
          <h3 className="font-semibold mb-2">Emerging Alerts</h3>
          <ul className="space-y-2 text-sm">
            {alerts.slice(0, 10).map((a, idx) => (
              <li key={`${a.location}-${idx}`} className="rounded-lg bg-slate-800/50 p-3">
                <div className="flex justify-between"><span>{a.location}</span><span className="text-amber-300 uppercase">{a.severity}</span></div>
                <p className="text-cyan-300">{a.department} • {a.complaint_count || a.issue_count} reports</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="gov-card p-4">
      <p className="text-xs uppercase text-slate-300">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  )
}
