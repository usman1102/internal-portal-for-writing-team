import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const CELEBRATION_KEY = "birthday_celebration_shown";
const TL_NAME = "Fasiha"; // You can customize this name

export function BirthdayPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if celebration has already been shown
    const hasShown = localStorage.getItem(CELEBRATION_KEY);
    
    if (!hasShown) {
      // Show popup after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      // Mark as shown so it never appears again
      localStorage.setItem(CELEBRATION_KEY, "true");
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Popup */}
      <div 
        className={`relative bg-gradient-to-br from-pink-400 via-purple-500 to-yellow-400 p-8 rounded-3xl shadow-2xl max-w-lg w-full mx-4 transform transition-all duration-300 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}
        style={{
          animation: isAnimating ? 'bounceIn 0.6s ease-out' : 'none'
        }}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full h-8 w-8 p-0"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Content */}
        <div className="text-center text-white">
          {/* Animated emojis */}
          <div className="text-6xl mb-4 animate-bounce">
            🎂🎉🎈
          </div>
          
          {/* Main message */}
          <h1 className="text-3xl font-bold mb-4 drop-shadow-lg">
            Happy Birthday {TL_NAME}! 🎊
          </h1>
          
          {/* Secondary message */}
          <p className="text-lg mb-6 drop-shadow-md opacity-95">
            Wishing you a fantastic day filled with joy, success, and all your favorite things! 🌟
          </p>
          
          {/* Celebration button */}
          <Button
            onClick={handleClose}
            className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-full text-lg transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Celebrate! 🎉
          </Button>
        </div>

        {/* Floating confetti elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute text-2xl animate-pulse"
              style={{
                left: `${Math.random() * 80 + 10}%`,
                top: `${Math.random() * 80 + 10}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              {['🎈', '🎊', '✨', '🌟', '🎂', '🎉'][Math.floor(Math.random() * 6)]}
            </div>
          ))}
        </div>
      </div>
      

    </div>
  );
}