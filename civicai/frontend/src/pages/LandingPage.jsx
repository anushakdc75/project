import { motion } from 'framer-motion'

export default function LandingPage() {
  return (
    <div className="space-y-5 text-white">
      <div className="gov-card p-8">
        <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-5xl font-bold bg-gradient-to-r from-cyan-200 via-indigo-200 to-purple-200 bg-clip-text text-transparent">
          CivicAI Command Workspace
        </motion.h2>
        <p className="text-slate-200 mt-4 max-w-3xl text-lg">
          Premium desktop control center for citizen grievance resolution, multilingual call intake, AI guidance,
          and government escalation workflows.
        </p>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="AI Chat Workspace" desc="Department-specific E5+FAISS solutions with confidence and escalation path." />
        <Card title="Gov Operations Panel" desc="SLA, area burden, emerging alert monitoring for administrators." />
        <Card title="Multilingual Intake" desc="Voice transcript + location + evidence intake for citizen support desks." />
      </div>
    </div>
  )
}

function Card({ title, desc }) {
  return (
    <div className="gov-card p-5 hover:-translate-y-1 transition-transform duration-200">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-slate-200 mt-2">{desc}</p>
    </div>
  )
}
