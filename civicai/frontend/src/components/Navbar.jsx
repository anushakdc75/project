import { Link } from 'react-router-dom'

const links = [
  ['/', 'Home'],
  ['/chat', 'Chat'],
  ['/history', 'History'],
  ['/tracker', 'Tracker'],
  ['/admin', 'Admin'],
  ['/analytics', 'Analytics']
]

export default function Navbar() {
  return (
    <nav className="glass p-4 mb-6 flex flex-wrap gap-4 text-white justify-between items-center">
      <h1 className="font-extrabold tracking-wide">CivicAI</h1>
      <div className="flex gap-2 flex-wrap text-sm">
        {links.map(([to, label]) => (
          <Link key={to} to={to} className="pill">{label}</Link>
        ))}
      </div>
    </nav>
  )
}
