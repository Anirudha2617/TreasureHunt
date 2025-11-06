// src/components/game/Quotation.tsx
import React, { useState, useEffect } from 'react';

const quotations = [
    "In the end, it’s not the years in your life that count. It’s the life in your years. — Abraham Lincoln",
    "Life is what happens when you’re busy making other plans. — John Lennon",
    "Do not go where the path may lead, go instead where there is no path and leave a trail. — Ralph Waldo Emerson",
    "The purpose of life is not to be happy. It is to be useful, to be honorable, to be compassionate. — Ralph Waldo Emerson",
    "You only live once, but if you do it right, once is enough. — Mae West",
    "Sometimes you will never know the value of a moment until it becomes a memory. — Dr. Seuss",
    "Life isn’t about waiting for the storm to pass. It’s about learning to dance in the rain. — Vivian Greene",
    "Don’t let the noise of others’ opinions drown out your own inner voice. — Steve Jobs",
    "Be the reason someone believes in goodness.",
    "Collect moments, not things.",
    "Live gently, love fiercely, and leave quietly.",
    "You are not behind; you are on your own timeline."
];

export const Quotation: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % quotations.length);
    }, 5000); // Change quote every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    // Set a specific height for the container to reserve space.
    // h-24 on mobile (96px) and md:h-32 on medium screens (128px).
    <div className="mb-12 flex h-24 items-center justify-center text-center md:h-32">
      <figure className="relative h-full w-full overflow-hidden">
        {quotations.map((quote, idx) => (
          <blockquote
            key={idx}
            className={`absolute w-full transform px-4 text-lg font-semibold italic text-foreground/90 transition-all duration-&lsqb;1200ms&rsqb ease-in-out md:px-0 md:text-2xl ${
              idx === currentIndex
                ? 'animate-float scale-100 opacity-100' // Active quote
                : 'scale-95 -translate-y-4 opacity-0'   // Inactive quote
            }`}
          >
            "{quote}"
          </blockquote>
        ))}
      </figure>
    </div>
  );
};

export default Quotation;