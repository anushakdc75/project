import { useState } from 'react'
import { getStatus } from '../services/api'

export default function StatusTrackerPage() {
  const [ticket, setTicket] = useState('')
  const [result, setResult] = useState(null)

  const check = async () => {
    try {
      const { data } = await getStatus(ticket)
      setResult(data)
    } catch {
      setResult({ error: 'Ticket not found' })
    }
  }

  return (
    <div className="glass p-6 text-white space-y-3">
      <div className="flex gap-2"><input value={ticket} onChange={(e)=>setTicket(e.target.value)} className="p-2 rounded bg-black/20" placeholder="CIV-..."/><button onClick={check} className="bg-cyan-500 px-4 rounded">Track</button></div>
      {result && <pre className="bg-black/30 p-3 rounded-xl">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  )
}
