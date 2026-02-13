import { Link } from 'react-router-dom'

const links = [
  ['/', 'Home'],
  ['/chat', 'AI Chat'],
  ['/history', 'History'],
  ['/tracker', 'Tracker'],
  ['/admin', 'Admin'],
  ['/analytics', 'Analytics']
]

export default function Navbar() {
  return (
    <nav className="glass p-4 mb-6 flex flex-wrap gap-4 text-white justify-between">
      <h1 className="font-bold">CivicAI</h1>
      <div className="flex gap-4 text-sm">
        {links.map(([to, label]) => (
          <Link key={to} to={to} className="hover:text-cyan-300 transition">{label}</Link>
        ))}
      </div>
    </nav>
  )
}
