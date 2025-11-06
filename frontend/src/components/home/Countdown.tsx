import React, { useState, useEffect } from 'react';

interface CountdownProps {
  targetDate: string;
  onComplete?: () => void;
}

export const Countdown: React.FC<CountdownProps> = ({ onComplete, targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      // console.log("Current Time:", new Date().toISOString(), "Target Time:", new Date(target).toISOString());
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (!isComplete) {
          setIsComplete(true);
          onComplete?.();
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [isComplete, onComplete]);

  return (
    <div className="text-center animate-fade-in">
      <h2 className="text-3xl md:text-4xl font-bold mb-8 text-foreground">
        🎁 Present Hunt Countdown 🎁
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Object.entries(timeLeft).map(([unit, value]) => (
          <div key={unit} className="card-gradient rounded-lg p-6 animate-scale-in">
            <div className="countdown-digit text-4xl md:text-6xl font-bold mb-2">
              {value.toString().padStart(2, '0')}
            </div>
            <div className="text-sm md:text-base text-muted-foreground capitalize font-medium">
              {unit}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};