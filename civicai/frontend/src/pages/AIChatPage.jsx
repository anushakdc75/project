import { useState } from 'react'
import ChatBubble from '../components/ChatBubble'
import { chat, submitIntake } from '../services/api'

export default function AIChatPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I am CivicAI. First, may I know your name?' },
  ])
  const [name, setName] = useState('')
  const [problem, setProblem] = useState('')
  const [location, setLocation] = useState('')
  const [coords, setCoords] = useState(null)
  const [image, setImage] = useState(null)
  const [query, setQuery] = useState('')
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(false)

  const captureLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords(null),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const submitGuidedComplaint = async () => {
    if (!name.trim() || !problem.trim()) return
    setLoading(true)
    const formData = new FormData()
    formData.append('name', name)
    formData.append('problem', problem)
    formData.append('location', location)
    formData.append('user_id', '1')
    if (coords) {
      formData.append('latitude', String(coords.lat))
      formData.append('longitude', String(coords.lng))
    }
    if (image) formData.append('image', image)

    try {
      const { data } = await submitIntake(formData)
      setTicket(data)
      setMessages((m) => [
        ...m,
        { role: 'user', text: `Name: ${name}\nProblem: ${problem}` },
        {
          role: 'assistant',
          text: `Complaint registered ✅\nTicket: ${data.ticket_id}\nDepartment: ${data.detected_department}\nDetected issue: ${data.detected_issue}\nAuthority notified: ${data.authority_notified ? 'Yes' : 'No'}`,
        },
      ])
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Could not submit complaint.'
      setMessages((m) => [...m, { role: 'assistant', text: detail }])
    } finally {
      setLoading(false)
    }
  }

  const sendChat = async () => {
    if (!query.trim()) return
    const outgoing = query
    setQuery('')
    setMessages((m) => [...m, { role: 'user', text: outgoing }])
    try {
      const { data } = await chat({ user_id: 1, message: outgoing })
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: `${data.answer}\nDepartment: ${data.department}\nETA: ${data.expected_resolution_time}\nConfidence: ${Number(data.confidence).toFixed(3)}`,
        },
      ])
    } catch (error) {
      const detail = error?.response?.data?.detail || 'Error processing request.'
      setMessages((m) => [...m, { role: 'assistant', text: detail }])
    }
  }

  return (
    <div className="glass p-6 text-white space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 space-y-3">
          <h3 className="font-semibold text-cyan-200">Guided Complaint Intake</h3>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="1) Enter your name" className="w-full rounded-xl p-3 bg-black/30" />
          <textarea value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="2) Describe your problem" className="w-full rounded-xl p-3 bg-black/30 min-h-24" />
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="3) Area / landmark" className="w-full rounded-xl p-3 bg-black/30" />
          <div className="flex flex-wrap gap-2">
            <button onClick={captureLocation} className="px-3 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400">Use Live Location</button>
            <label className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 cursor-pointer">
              Upload Issue Image
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] || null)} />
            </label>
          </div>
          {coords && <p className="text-xs text-cyan-200">Captured: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>}
          {image && <p className="text-xs text-cyan-200">Image: {image.name}</p>}
          <button disabled={loading} onClick={submitGuidedComplaint} className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60">{loading ? 'Submitting...' : 'Submit Complaint'}</button>
          {ticket && (
            <div className="text-xs rounded-xl bg-black/25 p-3">
              <p>Ticket: {ticket.ticket_id}</p>
              <p>Department: {ticket.detected_department}</p>
              <p>Authority notified: {ticket.authority_notified ? 'Yes' : 'No (configure AUTHORITY_WEBHOOK_URL)'}</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 space-y-3">
          <h3 className="font-semibold text-cyan-200">Assistant Chat</h3>
          <div className="space-y-2 max-h-[26rem] overflow-y-auto pr-1">
            {messages.map((msg, i) => <ChatBubble key={i} role={msg.role} text={msg.text} />)}
          </div>
          <div className="flex gap-2">
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChat()} placeholder="Ask follow-up (civic issues only)" className="flex-1 rounded-xl p-3 bg-black/30" />
            <button onClick={sendChat} className="px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400">Send</button>
          </div>
        </div>
      </div>
    </div>
  )
}
