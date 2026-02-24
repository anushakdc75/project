import { useEffect, useMemo, useRef, useState } from 'react'
import ChatBubble from '../components/ChatBubble'
import { callAssistance, chat, submitIntake } from '../services/api'

const quickPrompts = [
  'No water supply in Rajajinagar since yesterday',
  'Streetlight not working near bus stand',
  'Garbage not collected for 3 days',
  'Frequent power outage in Indiranagar',
]

const supportedLangs = [
  ['en', 'English'],
  ['hi', 'Hindi'],
  ['kn', 'Kannada'],
  ['ta', 'Tamil'],
  ['te', 'Telugu'],
  ['mr', 'Marathi'],
  ['bn', 'Bengali'],
]

export default function AIChatPage() {
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Welcome to CivicAI. Register grievance, use multilingual call assistance, or ask AI for direct solution.' }])
  const [name, setName] = useState('')
  const [problem, setProblem] = useState('')
  const [location, setLocation] = useState('')
  const [coords, setCoords] = useState(null)
  const [image, setImage] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [query, setQuery] = useState('')
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sendingChat, setSendingChat] = useState(false)

  const [callName, setCallName] = useState('')
  const [callPhone, setCallPhone] = useState('')
  const [callLanguage, setCallLanguage] = useState('en')
  const [callTranscript, setCallTranscript] = useState('')
  const [callResult, setCallResult] = useState(null)

  const recognitionRef = useRef(null)
  const chatInputRef = useRef(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords(null),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        chatInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const voiceSupported = useMemo(() => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition), [])

  const startVoice = (target = 'query') => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.interimResults = false
      recognitionRef.current.maxAlternatives = 1
    }
    recognitionRef.current.lang = target === 'call' ? `${callLanguage}-IN` : 'en-IN'
    recognitionRef.current.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript || ''
      if (target === 'problem') setProblem((prev) => `${prev} ${text}`.trim())
      else if (target === 'call') setCallTranscript((prev) => `${prev} ${text}`.trim())
      else setQuery((prev) => `${prev} ${text}`.trim())
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
      localStorage.setItem('last_ticket_id', data.ticket_id)
      setMessages((m) => [...m, { role: 'assistant', text: `Complaint ${data.ticket_id} registered under ${data.detected_department}.` }])
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Could not submit complaint.'
      setMessages((m) => [...m, { role: 'assistant', text: detail }])
    } finally {
      setLoading(false)
    }
  }

  const submitCallAssistance = async () => {
    if (!callName.trim() || !callPhone.trim() || !callTranscript.trim()) return
    try {
      const { data } = await callAssistance({ user_id: 1, citizen_name: callName, phone_number: callPhone, transcript: callTranscript, language: callLanguage, location })
      setCallResult(data)
      if (data.ticket_id) localStorage.setItem('last_ticket_id', data.ticket_id)
      setMessages((m) => [...m, { role: 'assistant', text: `Call assistance: ${data.solution}\nDepartment: ${data.department}\nStatus: ${data.status}${data.ticket_id ? `\nTicket: ${data.ticket_id}` : ''}` }])
    } catch (error) {
      const detail = error?.response?.data?.detail || 'Call assistance failed.'
      setMessages((m) => [...m, { role: 'assistant', text: detail }])
    }
  }

  const sendChat = async (text = query) => {
    const outgoing = text.trim()
    if (!outgoing || sendingChat) return
    setSendingChat(true)
    setQuery('')
    setMessages((m) => [...m, { role: 'user', text: outgoing }])
    try {
      const { data } = await chat({ user_id: 1, message: outgoing })
      setMessages((m) => [...m, { role: 'assistant', text: `${data.answer}\nDepartment: ${data.department}\nSteps:\n${(data.solution_steps || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}` }])
    } catch (error) {
      const detail = error?.response?.data?.detail || error?.message || 'Error processing request.'
      setMessages((m) => [...m, { role: 'assistant', text: detail }])
    } finally {
      setSendingChat(false)
    }
  }

  return (
    <div className="space-y-5 text-white">
      <div className="grid xl:grid-cols-3 gap-4">
        <div className="gov-card p-4 space-y-3">
          <h3 className="font-semibold text-slate-100">Citizen Guided Intake</h3>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="field" />
          <textarea value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="Problem" className="field min-h-20" />
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Area / landmark" className="field" />
          <div className="flex gap-2 flex-wrap">
            {voiceSupported && <button onClick={() => startVoice('problem')} className="pill">Voice issue</button>}
            <button onClick={() => navigator.geolocation?.getCurrentPosition((p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }))} className="pill">Use location</button>
          </div>
          <label className="pill block text-center cursor-pointer">Upload Image<input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setImage(e.target.files?.[0] || null)} /></label>
          <label className="pill block text-center cursor-pointer">Upload Files<input type="file" multiple className="hidden" onChange={(e) => setAttachments(Array.from(e.target.files || []))} /></label>
          {coords && <p className="text-xs text-slate-200">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>}
          <button disabled={loading} onClick={submitGuidedComplaint} className="gov-btn">{loading ? 'Submitting...' : 'Register grievance'}</button>
          {ticket && <p className="text-xs">Ticket {ticket.ticket_id} • {ticket.detected_department}</p>}
        </div>

        <div className="gov-card p-4 space-y-3">
          <h3 className="font-semibold text-slate-100">Multilingual Call Assistance</h3>
          <input value={callName} onChange={(e) => setCallName(e.target.value)} placeholder="Citizen name" className="field" />
          <input value={callPhone} onChange={(e) => setCallPhone(e.target.value)} placeholder="Phone number" className="field" />
          <select value={callLanguage} onChange={(e) => setCallLanguage(e.target.value)} className="field">
            {supportedLangs.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
          <textarea value={callTranscript} onChange={(e) => setCallTranscript(e.target.value)} placeholder="Call transcript / citizen voice summary" className="field min-h-20" />
          {voiceSupported && <button onClick={() => startVoice('call')} className="pill">Voice transcript</button>}
          <button onClick={submitCallAssistance} className="gov-btn">Process call</button>
          {callResult && <div className="rounded-xl bg-slate-800/60 p-3 text-sm"><p><b>Department:</b> {callResult.department}</p><p><b>Status:</b> {callResult.status}</p>{callResult.ticket_id && <p><b>Ticket:</b> {callResult.ticket_id}</p>}</div>}
        </div>

        <div className="gov-card p-4 space-y-3 min-h-[640px] flex flex-col">
          <h3 className="font-semibold text-slate-100">AI Civic Chat</h3>
          <div className="flex flex-wrap gap-2">{quickPrompts.map((prompt) => <button key={prompt} className="pill" onClick={() => sendChat(prompt)}>{prompt}</button>)}</div>
          <div className="space-y-2 max-h-[26rem] overflow-y-auto flex-1">{messages.map((msg, i) => <ChatBubble key={i} role={msg.role} text={msg.text} />)}</div>
          <div className="flex gap-2">
            <input ref={chatInputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChat()} placeholder="Ask civic issue" className="field flex-1" />
            {voiceSupported && <button onClick={() => startVoice('query')} className="pill">Voice</button>}
            <button disabled={sendingChat} onClick={() => sendChat()} className="gov-btn px-4">{sendingChat ? 'Sending...' : 'Send'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
