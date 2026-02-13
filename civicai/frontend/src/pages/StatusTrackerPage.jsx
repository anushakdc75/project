import { useMemo, useState } from 'react'
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
  { id: 1, title: 'Ticket Created', subtitle: 'We registered your grievance and generated a ticket.' },
  { id: 2, title: 'Department Assigned', subtitle: 'Case routed to the department and officer queue.' },
  { id: 3, title: 'Resolution Update', subtitle: 'Issue resolved/closed. Feedback can be shared.' },
]

export default function StatusTrackerPage() {
  const [ticket, setTicket] = useState('')
  const [result, setResult] = useState(null)

  const check = async () => {
    if (!ticket.trim()) return
    try {
      const { data } = await getStatus(ticket.trim())
      setResult(data)
    } catch {
      setResult({ error: 'Ticket not found. Please verify the ticket ID.' })
    }
  }

  const activeStep = useMemo(() => {
    if (!result?.status) return 0
    return statusToStep[String(result.status).toLowerCase()] || 1
  }, [result])

  return (
    <div className="glass p-6 text-white space-y-4">
      <div className="flex gap-2">
        <input
          value={ticket}
          onChange={(e) => setTicket(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && check()}
          className="flex-1 p-3 rounded-xl bg-black/20 outline-none focus:ring-2 focus:ring-cyan-400/50"
          placeholder="Enter ticket ID (e.g., CIV-AB12CD34EF)"
        />
        <button onClick={check} className="bg-cyan-500 px-4 rounded-xl hover:bg-cyan-400 transition-colors">
          Track
        </button>
      </div>

      {result?.error && <div className="rounded-xl bg-red-500/20 border border-red-300/30 p-3 text-sm">{result.error}</div>}

      {result && !result.error && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-black/25 p-3">Ticket: <span className="text-cyan-200">{result.ticket_id}</span></div>
            <div className="rounded-xl bg-black/25 p-3">Department: <span className="text-cyan-200">{result.department}</span></div>
            <div className="rounded-xl bg-black/25 p-3">Current status: <span className="text-cyan-200 uppercase">{result.status}</span></div>
            <div className="rounded-xl bg-black/25 p-3">SLA: <span className="text-cyan-200">{result.sla_hours} hours</span></div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
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
