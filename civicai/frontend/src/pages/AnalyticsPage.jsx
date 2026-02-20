import { useEffect, useState } from 'react'
import { getTopics } from '../services/api'

export default function AnalyticsPage() {
  const [topics, setTopics] = useState([])

  useEffect(() => {
    getTopics().then(({ data }) => setTopics(data)).catch(() => setTopics([]))
  }, [])

  return (
    <div className="glass p-6 text-white">
      <h2 className="text-2xl font-semibold mb-3">Topic Insights</h2>
      <ul className="space-y-2">
        {topics.map((t) => <li key={t.topic_id} className="bg-white/10 p-3 rounded-xl">#{t.topic_id} ({t.size}) - {t.representative_text}</li>)}
      </ul>
    </div>
  )
}
