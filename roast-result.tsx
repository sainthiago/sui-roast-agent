"use client"

import { motion } from "framer-motion"

export function RoastResult({ roast }: { roast: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-lg bg-gradient-to-br from-orange-50 to-red-50"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="prose prose-lg"
      >
        {roast.split("\n").map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * i }}
            className="mb-4 text-gray-800 last:mb-0"
          >
            {line}
          </motion.p>
        ))}
      </motion.div>
    </motion.div>
  )
}

