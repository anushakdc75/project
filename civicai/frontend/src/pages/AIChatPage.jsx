import { useState } from 'react'
import ChatBubble from '../components/ChatBubble'
import { chat } from '../services/api'

const quickPrompts = [
  'Hi',
  'No water in Rajajinagar since morning',
  'Streetlight not working near Indiranagar metro',
  'NOT SOLVED',
]

function AssistantCard({ payload }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm space-y-3 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
      <p className="text-white/95 leading-relaxed">{payload.answer || payload.reply}</p>

      {payload.solution_steps?.length > 0 && (
        <div>
          <p className="text-cyan-200 text-xs uppercase tracking-wide mb-2">Recommended steps</p>
          <ol className="list-decimal list-inside space-y-1 text-white/90">
            {payload.solution_steps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-black/25 p-2">Department: <span className="text-cyan-200">{payload.department || '—'}</span></div>
        <div className="rounded-xl bg-black/25 p-2">ETA: <span className="text-cyan-200">{payload.expected_resolution_time || '—'}</span></div>
        <div className="rounded-xl bg-black/25 p-2">Confidence: <span className="text-cyan-200">{Number(payload.confidence || 0).toFixed(3)}</span></div>
        <div className="rounded-xl bg-black/25 p-2">Live authority contact: <span className="text-cyan-200">{payload.is_live_authority_contact ? 'Yes' : 'No (demo environment)'}</span></div>
      </div>

      {payload.escalation_note && <p className="text-amber-200 text-xs">{payload.escalation_note}</p>}

      {payload.similar_cases?.length > 0 && (
        <div>
          <p className="text-cyan-200 text-xs uppercase tracking-wide mb-2">Similar cases</p>
          <div className="space-y-1">
            {payload.similar_cases.slice(0, 3).map((item) => (
              <div key={`${item.grievance_id}-${item.department}`} className="rounded-xl bg-black/25 px-2 py-1 text-xs">
                {item.department} · similarity {Number(item.similarity || 0).toFixed(3)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AIChatPage() {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')

  const send = async (prefill) => {
    const outgoing = typeof prefill === 'string' ? prefill : text
    if (!outgoing.trim()) return

    const userMessage = { role: 'user', text: outgoing }
    setMessages((m) => [...m, userMessage])
    setText('')

    try {
      const { data } = await chat({ user_id: 1, message: userMessage.text })
      setMessages((m) => [...m, { role: 'assistant', payload: data }])
    } catch (error) {
      const detail = error?.response?.data?.detail
      const fallback = error?.message || 'Error processing request.'
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          payload: {
            answer: detail || fallback,
            confidence: 0,
            department: 'System',
            expected_resolution_time: 'N/A',
            solution_steps: ['Please ensure backend server is running on http://localhost:8000.'],
            similar_cases: [],
            escalation_note: 'No escalation generated because the request failed.',
            is_live_authority_contact: false,
          },
        },
      ])
    }
  }

  return (
    <div className="glass p-6 text-white space-y-4">
      <div className="flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => send(prompt)}
            className="rounded-full border border-cyan-300/40 bg-cyan-500/10 px-3 py-1 text-xs hover:bg-cyan-500/20"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="space-y-3 min-h-80">
        {messages.map((msg, i) =>
          msg.role === 'user' ? (
            <ChatBubble key={i} role={msg.role} text={msg.text} />
          ) : (
            <AssistantCard key={i} payload={msg.payload} />
          )
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          className="flex-1 rounded-xl p-3 bg-black/30 outline-none focus:ring-2 focus:ring-cyan-400/50"
          placeholder="Describe your grievance..."
        />
        <button onClick={() => send()} className="px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 transition-colors">
          Send
        </button>
      </div>
    </div>
  )
}
