import React, { useState, useEffect } from 'react';
import { Gift, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MysteryBoxProps {
  onOpen: () => void;
  targetDate: string;
}

export const MysteryBox: React.FC<MysteryBoxProps> = ({ onOpen, targetDate }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const checkUnlock = () => {
      const now = new Date().getTime();
      if (now >= target) {
        setIsLocked(false);
      }
    };

    checkUnlock();
    const interval = setInterval(checkUnlock, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const handleOpen = () => {
    setIsOpening(true);
    setTimeout(() => onOpen(), 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      <div 
        className={`Mystery-animation mb-8 transition-all duration-1000 ${
          isOpening ? 'scale-150 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <div className="relative">
          <Gift size={120} className={`drop-shadow-lg ${isLocked ? 'text-gray-400' : 'text-primary'}`} />
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock size={48} className="text-gray-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-xl animate-pulse-glow" />
        </div>
      </div>

      <h3 className="text-2xl font-bold mb-4 text-center">
        {isLocked ? 'Mysterys are locked 🔒' : 'Your Mysterys Await! 🎁'}
      </h3>
      
      <p className="text-muted-foreground text-center mb-8 max-w-md">
        {isLocked
          ? 'Wait until the countdown ends to unlock your magical gift!'
          : 'Click the Mystery box below to start your magical journey of puzzles and surprises!'}
      </p>

      <Button
        onClick={handleOpen}
        size="lg"
        className="Mystery-animation transition-smooth hover:scale-110 disabled:opacity-50"
        disabled={isOpening || isLocked}
      >
        {isOpening ? (
          <span className="flex items-center gap-2">
            <Gift className="animate-spin" size={20} />
            Opening...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Gift size={20} />
            Open Mystery Box
          </span>
        )}
      </Button>
    </div>
  );
};
