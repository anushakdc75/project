import { useEffect, useMemo, useState } from 'react'
import { getStatus } from '../services/api'

const statusToStep = {
  open: 1,
  escalated: 2,
  in_progress: 2,
  assigned: 2,
  resolved: 3,
  closed: 3,
}

const timeline = [
  { id: 1, title: 'Ticket Created', subtitle: 'Grievance registered and queued.' },
  { id: 2, title: 'Department Assigned', subtitle: 'Assigned to the responsible civic authority.' },
  { id: 3, title: 'Resolution Update', subtitle: 'Resolved / closed with final status update.' },
]

export default function StatusTrackerPage() {
  const [ticket, setTicket] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('last_ticket_id')
    if (saved) setTicket(saved)
  }, [])

  const check = async () => {
    const ticketId = ticket.trim()
    if (!ticketId) {
      setResult({ error: 'Enter a valid ticket ID (example: CIV-XXXXXXXXXX).' })
      return
    }
    setLoading(true)
    try {
      const { data } = await getStatus(ticketId)
      setResult(data)
      localStorage.setItem('last_ticket_id', ticketId)
    } catch (error) {
      const detail = error?.response?.data?.detail || 'Ticket not found. Please verify and try again.'
      setResult({ error: detail })
    } finally {
      setLoading(false)
    }
  }

  const activeStep = useMemo(() => {
    if (!result?.status) return 0
    return statusToStep[String(result.status).toLowerCase()] || 1
  }, [result])

  return (
    <div className="gov-card p-6 text-white space-y-4 max-w-5xl">
      <h2 className="text-xl font-semibold">Ticket Status Tracking</h2>
      <div className="flex gap-2">
        <input
          value={ticket}
          onChange={(e) => setTicket(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && check()}
          className="field flex-1"
          placeholder="Enter ticket ID (e.g., CIV-AB12CD34EF)"
        />
        <button onClick={check} className="gov-btn min-w-28">{loading ? 'Checking...' : 'Track'}</button>
      </div>

      {result?.error && <div className="rounded-xl bg-red-500/20 border border-red-300/30 p-3 text-sm">{result.error}</div>}

      {result && !result.error && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-800/60 p-3">Ticket: <span className="text-cyan-200">{result.ticket_id}</span></div>
            <div className="rounded-xl bg-slate-800/60 p-3">Department: <span className="text-cyan-200">{result.department}</span></div>
            <div className="rounded-xl bg-slate-800/60 p-3">Current status: <span className="text-cyan-200 uppercase">{result.status}</span></div>
            <div className="rounded-xl bg-slate-800/60 p-3">SLA: <span className="text-cyan-200">{result.sla_hours} hours</span></div>
          </div>

          <div className="rounded-2xl border border-slate-200/20 bg-slate-900/50 p-4">
            <p className="text-cyan-200 text-xs uppercase tracking-wide mb-3">Ticket Journey</p>
            <div className="space-y-4">
              {timeline.map((step) => {
                const done = step.id <= activeStep
                return (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className={`h-7 w-7 rounded-full grid place-items-center text-xs font-bold ${done ? 'bg-emerald-400 text-black' : 'bg-white/20 text-white/70'}`}>
                      {done ? '✓' : step.id}
                    </div>
                    <div>
                      <p className={`font-semibold ${done ? 'text-white' : 'text-white/60'}`}>{step.title}</p>
                      <p className="text-xs text-white/70">{step.subtitle}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
