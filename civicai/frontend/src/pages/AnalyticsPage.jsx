import { useEffect, useState } from 'react'
import { getAnalytics, getTopics } from '../services/api'

export default function AnalyticsPage() {
  const [topics, setTopics] = useState([])
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    getTopics().then(({ data }) => setTopics(data || [])).catch(() => setTopics([]))
    getAnalytics().then(({ data }) => setAnalytics(data)).catch(() => setAnalytics(null))
  }, [])

  return (
    <div className="space-y-4 text-white">
      <div className="glass p-5">
        <h2 className="text-2xl font-semibold">Policy & Trend Insights</h2>
        <p className="text-sm text-white/70 mt-1">Real-time summary of grievance volume, sentiment, and top topics.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {Object.entries(analytics?.sentiment_distribution || {}).map(([k, v]) => (
          <div key={k} className="glass p-4">
            <p className="uppercase text-xs text-white/70">{k}</p>
            <p className="text-2xl text-cyan-200 font-bold">{v}</p>
          </div>
        ))}
      </div>

      <div className="glass p-6">
        <h3 className="text-lg font-semibold mb-3">Topic modeling highlights</h3>
        <ul className="space-y-2 text-sm">
          {topics.map((t) => (
            <li key={t.topic_id} className="bg-black/25 p-3 rounded-xl">Topic #{t.topic_id} • {t.size} cases • {t.representative_text}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
