"use client";

import { motion } from "framer-motion";
import { easeOut } from "@/lib/motion";

/**
 * App Router re-mounts `template.tsx` on every navigation, so a fresh fade
 * plays when moving between routes (e.g. the map and the beans list).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: easeOut }}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
