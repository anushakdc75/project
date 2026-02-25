import { useEffect, useState } from 'react'
import { getAnalytics, getTopics } from '../services/api'

export default function AnalyticsPage() {
  const [topics, setTopics] = useState([])
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    Promise.all([getTopics(), getAnalytics()])
      .then(([topicsRes, analyticsRes]) => {
        setTopics(topicsRes.data || [])
        setAnalytics(analyticsRes.data || null)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-4 text-white">
      <div className="gov-card p-5">
        <h2 className="text-2xl font-semibold">Citizen Policy Analytics</h2>
        <p className="text-slate-200">Public-friendly insight view for grievance trends and service pressure.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {Object.entries(analytics?.sentiment_distribution || {}).map(([k, v]) => (
          <div key={k} className="gov-card p-4">
            <p className="uppercase text-xs text-slate-300">{k}</p>
            <p className="text-2xl font-bold">{v}</p>
          </div>
        ))}
      </div>

      <div className="gov-card p-5">
        <h3 className="text-lg font-semibold mb-3">Topic Highlights</h3>
        <ul className="space-y-2 text-sm">
          {topics.map((t) => (
            <li key={t.topic_id} className="rounded-lg bg-slate-800/50 p-3">Topic #{t.topic_id} • {t.size} cases • {t.representative_text}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
