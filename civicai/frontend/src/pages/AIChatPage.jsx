import { useEffect, useMemo, useRef, useState } from 'react'
import ChatBubble from '../components/ChatBubble'
import { chat, submitIntake } from '../services/api'

const quickPrompts = [
  'No water supply in Rajajinagar since yesterday',
  'Streetlight not working near bus stand',
  'Garbage not collected for 3 days',
  'Frequent power outage in Indiranagar',
]

export default function AIChatPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! 👋 I am CivicAI. Please enter your name and issue below. I will capture location, classify evidence, and route to the right department.' },
  ])
  const [name, setName] = useState('')
  const [problem, setProblem] = useState('')
  const [location, setLocation] = useState('')
  const [coords, setCoords] = useState(null)
  const [image, setImage] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [query, setQuery] = useState('')
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords(null),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  const voiceSupported = useMemo(() => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition), [])

  const startVoice = (target = 'query') => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition()
      recognition.lang = 'en-IN'
      recognition.interimResults = false
      recognition.maxAlternatives = 1
      recognition.onresult = (event) => {
        const text = event.results?.[0]?.[0]?.transcript || ''
        if (target === 'problem') setProblem((prev) => `${prev} ${text}`.trim())
        else setQuery((prev) => `${prev} ${text}`.trim())
      }
      recognitionRef.current = recognition
    }
    recognitionRef.current.start()
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
    attachments.forEach((file) => formData.append('attachments', file))

    try {
      const { data } = await submitIntake(formData)
      setTicket(data)
      setMessages((m) => [
        ...m,
        { role: 'user', text: `Name: ${name}\nProblem: ${problem}` },
        {
          role: 'assistant',
          text: `✅ Complaint registered\nTicket: ${data.ticket_id}\nDepartment: ${data.detected_department}\nDetected issue: ${data.detected_issue}\nConfidence: ${Number(data.confidence).toFixed(3)}\nAuthority notified: ${data.authority_notified ? 'Yes' : 'No (set AUTHORITY_WEBHOOK_URL)'}`,
        },
      ])
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Could not submit complaint.'
      setMessages((m) => [...m, { role: 'assistant', text: detail }])
    } finally {
      setLoading(false)
    }
  }

  const sendChat = async (text = query) => {
    if (!text.trim()) return
    const outgoing = text.trim()
    setQuery('')
    setMessages((m) => [...m, { role: 'user', text: outgoing }])
    try {
      const { data } = await chat({ user_id: 1, message: outgoing })
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: `${data.answer}\n\nDepartment: ${data.department}\nETA: ${data.expected_resolution_time}\nConfidence: ${Number(data.confidence).toFixed(3)}\n\nSteps:\n${(data.solution_steps || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
        },
      ])
    } catch (error) {
      const detail = error?.response?.data?.detail || error?.message || 'Error processing request.'
      setMessages((m) => [...m, { role: 'assistant', text: detail }])
    }
  }

  return (
    <div className="grid lg:grid-cols-[1.1fr_1.3fr] gap-5 text-white">
      <div className="glass p-5 space-y-3">
        <h3 className="text-lg font-semibold text-cyan-200">Guided Intake</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="1) Your name" className="w-full rounded-xl p-3 bg-black/30" />
        <textarea value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="2) Describe the issue" className="w-full rounded-xl p-3 bg-black/30 min-h-24" />
        <div className="flex gap-2 flex-wrap">
          {voiceSupported && <button onClick={() => startVoice('problem')} className="pill">🎙️ Voice for issue</button>}
          <button onClick={() => navigator.geolocation?.getCurrentPosition((p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }))} className="pill">📍 Refresh live location</button>
        </div>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="3) Area / landmark" className="w-full rounded-xl p-3 bg-black/30" />
        <label className="block rounded-xl border border-white/20 p-3 bg-black/20 cursor-pointer">
          📷 Upload/capture issue image
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setImage(e.target.files?.[0] || null)} />
        </label>
        <label className="block rounded-xl border border-white/20 p-3 bg-black/20 cursor-pointer">
          📎 Attach supporting files (PDF, docs, images)
          <input type="file" multiple className="hidden" onChange={(e) => setAttachments(Array.from(e.target.files || []))} />
        </label>
        <div className="text-xs text-cyan-100/90 space-y-1">
          {coords ? <p>Live location: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p> : <p>Live location unavailable (permission denied or unsupported).</p>}
          {image && <p>Image: {image.name}</p>}
          {!!attachments.length && <p>Attachments: {attachments.map((f) => f.name).join(', ')}</p>}
        </div>
        <button disabled={loading} onClick={submitGuidedComplaint} className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 font-semibold">{loading ? 'Submitting...' : 'Submit complaint'}</button>
        {ticket && <div className="rounded-xl bg-emerald-500/15 border border-emerald-300/30 p-3 text-sm">Ticket {ticket.ticket_id} created and routed to <b>{ticket.detected_department}</b>.</div>}
      </div>

      <div className="glass p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-cyan-200">Civic Assistant</h3>
          {voiceSupported && <button onClick={() => startVoice('query')} className="pill">🎤 Voice query</button>}
        </div>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button key={prompt} className="pill" onClick={() => sendChat(prompt)}>{prompt}</button>
          ))}
        </div>
        <div className="space-y-2 max-h-[30rem] overflow-y-auto pr-1">
          {messages.map((msg, i) => <ChatBubble key={i} role={msg.role} text={msg.text} />)}
        </div>
        <div className="flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChat()} placeholder="Ask a civic grievance question" className="flex-1 rounded-xl p-3 bg-black/30" />
          <button onClick={() => sendChat()} className="px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400">Send</button>
        </div>
      </div>
    </div>
  )
}
