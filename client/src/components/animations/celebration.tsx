import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CelebrationProps {
  isVisible: boolean;
  onComplete: () => void;
}

export function CelebrationAnimation({ isVisible, onComplete }: CelebrationProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number }>>([]);

  useEffect(() => {
    if (isVisible) {
      // Generate confetti particles
      const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 6)],
        delay: Math.random() * 0.5,
      }));
      setConfetti(particles);

      // Auto-hide after animation
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
        >
          {/* Background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          />

          {/* Main celebration message */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="relative z-10 text-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 0.6,
                repeat: 3,
                ease: "easeInOut"
              }}
              className="text-8xl mb-4"
            >
              🎉
            </motion.div>
            
            <motion.h1
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold text-white mb-2 drop-shadow-lg"
            >
              Task Completed!
            </motion.h1>
            
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xl text-white/90 drop-shadow-lg"
            >
              Great job! 🚀
            </motion.p>
          </motion.div>

          {/* Confetti particles */}
          {confetti.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ 
                x: "50vw", 
                y: "50vh", 
                scale: 0,
                rotate: 0
              }}
              animate={{ 
                x: `${particle.x}vw`, 
                y: `${particle.y}vh`, 
                scale: [0, 1, 0],
                rotate: 360
              }}
              transition={{ 
                duration: 2,
                delay: particle.delay,
                ease: "easeOut"
              }}
              className="absolute w-3 h-3 rounded-full"
              style={{ backgroundColor: particle.color }}
            />
          ))}

          {/* Floating emojis */}
          {['🎊', '✨', '🌟', '🎈', '🏆'].map((emoji, index) => (
            <motion.div
              key={index}
              initial={{ 
                x: "50%", 
                y: "100vh", 
                scale: 0,
                rotate: 0
              }}
              animate={{ 
                x: `${20 + index * 20}%`, 
                y: "-20vh", 
                scale: [0, 1.5, 1, 0],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 3,
                delay: index * 0.2,
                ease: "easeOut"
              }}
              className="absolute text-4xl"
            >
              {emoji}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}