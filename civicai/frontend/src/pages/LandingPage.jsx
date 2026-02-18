import { motion } from 'framer-motion'

export default function LandingPage() {
  return (
    <div className="glass p-10 text-white">
      <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-200 to-violet-200 bg-clip-text text-transparent">
        Smart Civic Grievance Intelligence
      </motion.h2>
      <p className="text-slate-200 leading-relaxed max-w-3xl">
        Report issues with live location, voice input, and image evidence. CivicAI semantically routes complaints using E5 + FAISS,
        provides department-specific solutions, and tracks progress from ticket creation to closure.
      </p>
    </div>
  )
}
