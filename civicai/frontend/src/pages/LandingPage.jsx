import { motion } from 'framer-motion'

export default function LandingPage() {
  return (
    <div className="glass p-10 text-white">
      <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-4xl font-bold mb-4">
        Smart Grievance & Policy Intelligence
      </motion.h2>
      <p className="text-slate-200 leading-relaxed">
        CivicAI delivers real-time semantic grievance resolution, policy trend alerts, multilingual support,
        and escalation workflows for governance teams.
      </p>
    </div>
  )
}
