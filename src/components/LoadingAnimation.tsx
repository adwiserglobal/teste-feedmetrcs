import { motion } from "framer-motion";

export function LoadingAnimation({ title, subtitle }: { title?: string, subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 w-full">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: [0.95, 1.05, 0.95], opacity: 1 }}
        transition={{
          scale: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          },
          opacity: {
            duration: 0.8,
            ease: "easeOut"
          }
        }}
        className="relative mb-6"
      >
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <svg className="w-24 h-24 relative" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <motion.rect 
            animate={{ height: [10, 22, 10], y: [30, 18, 30] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            x="2" width="10" rx="5" fill="url(#p0_load)" 
          />
          <motion.rect 
            animate={{ height: [14, 36, 14], y: [26, 4, 26] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            x="15" width="10" rx="5" fill="#1e1b4b" 
          />
          <motion.rect 
            animate={{ height: [12, 30, 12], y: [28, 10, 28] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            x="28" width="10" rx="5" fill="url(#p1_load)" 
          />
          <defs>
            <linearGradient id="p0_load" x1="7" y1="18" x2="7" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366f1" />
              <stop offset="1" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="p1_load" x1="33" y1="10" x2="33" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f59e0b" />
              <stop offset="1" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
      
      {(title || subtitle) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-4 space-y-2 text-center"
        >
          {title && <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>}
          {subtitle && (
            <p className="text-muted-foreground text-sm md:text-base font-medium flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              {subtitle}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
