import { motion } from 'framer-motion'

export default function ChatBubble({ role, text }) {
  const isUser = role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`max-w-3xl p-3 rounded-2xl ${isUser ? 'bg-cyan-600 ml-auto' : 'bg-white/20'} text-white`}
    >
      {text}
    </motion.div>
  )
}
