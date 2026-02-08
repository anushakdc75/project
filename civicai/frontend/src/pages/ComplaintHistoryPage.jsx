import { useEffect, useState } from 'react'
import { getHistory } from '../services/api'

export default function ComplaintHistoryPage() {
  const [items, setItems] = useState([])

  useEffect(() => {
    getHistory(1).then(({ data }) => setItems(data)).catch(() => setItems([]))
  }, [])

  return <div className="glass p-6 text-white space-y-2">{items.map((x, i) => <div key={i} className="p-3 bg-white/10 rounded-xl">{x.query}</div>)}</div>
}
