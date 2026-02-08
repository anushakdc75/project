import { useState } from 'react'
import ChatBubble from '../components/ChatBubble'
import { chat } from '../services/api'

export default function AIChatPage() {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')

  const send = async () => {
    if (!text.trim()) return
    const userMessage = { role: 'user', text }
    setMessages((m) => [...m, userMessage])
    setText('')
    try {
      const { data } = await chat({ user_id: 1, message: userMessage.text })
      setMessages((m) => [...m, { role: 'assistant', text: `${data.answer}\nConfidence: ${data.confidence}` }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: 'Error processing request.' }])
    }
  }

  return (
    <div className="glass p-6 text-white space-y-4">
      <div className="space-y-3 min-h-80">
        {messages.map((msg, i) => <ChatBubble key={i} role={msg.role} text={msg.text} />)}
      </div>
      <div className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 rounded-xl p-3 bg-black/30" placeholder="Describe your grievance..." />
        <button onClick={send} className="px-5 rounded-xl bg-cyan-500">Send</button>
      </div>
    </div>
  )
}
