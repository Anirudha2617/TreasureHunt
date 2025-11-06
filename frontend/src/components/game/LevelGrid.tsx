import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, CheckCircle, Gift, MapPin, Sword, Star, Trophy, Zap, Crown, ChevronRight } from 'lucide-react';
import { Level } from '@/lib/api';

interface LevelGridProps {
  levels: Level[];
  onLevelSelect: (levelId: string) => void;
}

interface FlyingIconProps {
  from: DOMRect;
  to: DOMRect;
  onComplete: () => void;
}

const FlyingIcon: React.FC<FlyingIconProps> = ({ from, to, onComplete }) => {
  const [position, setPosition] = useState({ top: from.top, left: from.left });
  
  useEffect(() => {
    const duration = 800; // ms
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out function for smooth animation
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const newTop = from.top + (to.top - from.top) * easeProgress;
      const newLeft = from.left + (to.left - from.left) * easeProgress;
      
      setPosition({ top: newTop, left: newLeft });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };
    
    requestAnimationFrame(animate);
  }, [from, to, onComplete]);
  
  return (
    <div 
      className="fixed z-50 pointer-events-none"
      style={{
        top: position.top,
        left: position.left,
        transition: 'top 0.8s ease-out, left 0.8s ease-out',
      }}
    >
      <div className="animate-ping w-4 h-4 rounded-full bg-primary/80"></div>
      <Star className="w-6 h-6 text-yellow-400 absolute top-0 left-0 -translate-x-1 -translate-y-1" fill="currentColor" />
    </div>
  );
};

export const LevelGrid: React.FC<LevelGridProps> = ({ levels, onLevelSelect }) => {
  const [flyingIcon, setFlyingIcon] = useState<{from: DOMRect; to: DOMRect} | null>(null);
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<string[]>([]);
  
  // Group levels by their main level number
  const groupedLevels = levels.reduce((acc, level) => {
    // Extract the main level number (e.g., "1" from "1a" or "1")
    const mainLevel = level.name.replace(/[^0-9]/g, '');
    if (!acc[mainLevel]) {
      acc[mainLevel] = [];
    }
    acc[mainLevel].push(level);
    return acc;
  }, {} as Record<string, Level[]>);
  
  // Handle level completion animation
  const handleLevelComplete = (levelId: string, nextLevelId: string | undefined) => {
    if (!nextLevelId) return;
    
    const fromElem = document.getElementById(`level-${levelId}`);
    const toElem = document.getElementById(`level-${nextLevelId}`);
    
    if (fromElem && toElem) {
      const fromRect = fromElem.getBoundingClientRect();
      const toRect = toElem.getBoundingClientRect();
      
      setFlyingIcon({ from: fromRect, to: toRect });
      
      // Add to recently unlocked to highlight it
      setRecentlyUnlocked(prev => [...prev, nextLevelId]);
      
      // Remove highlight after animation
      setTimeout(() => {
        setRecentlyUnlocked(prev => prev.filter(id => id !== nextLevelId));
      }, 3000);
    }
  };
  
  // Get next level in sequence
  const getNextLevel = (levelId: string) => {
    const currentIndex = levels.findIndex(level => level.id === levelId);
    if (currentIndex < levels.length - 1) {
      return levels[currentIndex + 1].id;
    }
    return undefined;
  };

  // Check if level is a boss level (every 5th main level)
  const isBossLevel = (levelName: string) => {
    const mainLevel = parseInt(levelName.replace(/[^0-9]/g, ''));
    return mainLevel % 5 === 0 && !levelName.includes('a') && !levelName.includes('b');
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-bold text-center mb-8 flex items-center justify-center">
        <MapPin className="mr-2 text-amber-600" size={32} />
        Treasure Hunt Adventure 🗺️
        <Trophy className="ml-2 text-amber-500" size={32} />
      </h2>
      
      {flyingIcon && (
        <FlyingIcon
          from={flyingIcon.from}
          to={flyingIcon.to}
          onComplete={() => setFlyingIcon(null)}
        />
      )}
      
      <div className="space-y-12">
        {Object.entries(groupedLevels).map(([mainLevel, branchLevels]) => {
          const isBossGroup = parseInt(mainLevel) % 5 === 0;
          
          return (
            <div key={mainLevel} className="relative">
              {/* Main path line */}
              <div className="absolute left-16 top-1/2 h-1 w-[calc(100%-8rem)] bg-gradient-to-r from-amber-400/30 to-amber-600/30 -translate-y-1/2 z-0 rounded-full"></div>
              
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {branchLevels.map((level, index) => {
                  const nextLevelId = getNextLevel(level.id);
                  const isUnlocked = level.isUnlocked || recentlyUnlocked.includes(level.id);
                  const isBoss = isBossLevel(level.name);
                  const showConnector = index < branchLevels.length - 1;
                  const isSubLevel = level.name.includes('a') || level.name.includes('b');
                  
                  return (
                    <div key={level.id} className="relative flex items-center">
                      <Card
                        id={`level-${level.id}`}
                        className={`card-gradient transition-smooth cursor-pointer hover:scale-105 border-border/50 flex-1 ${
                          isUnlocked 
                            ? 'hover:glow-effect' 
                            : 'opacity-60 cursor-not-allowed'
                        } ${level.isCompleted ? 'border-primary/50' : ''} ${
                          recentlyUnlocked.includes(level.id) ? 'ring-2 ring-amber-400 ring-opacity-70' : ''
                        } ${isBoss ? 'border-2 border-amber-500 shadow-lg' : ''} ${
                          isSubLevel ? 'ml-6 border-l-4 border-l-blue-400' : ''
                        }`}
                        onClick={() => {
                          if (isUnlocked) {
                            onLevelSelect(level.id);
                            if (level.isCompleted && nextLevelId) {
                              handleLevelComplete(level.id, nextLevelId);
                            }
                          }
                        }}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-center mb-2">
                            {!isUnlocked ? (
                              <Lock size={isBoss ? 40 : 32} className="text-muted-foreground" />
                            ) : level.isCompleted ? (
                              <CheckCircle size={isBoss ? 40 : 32} className="text-primary" />
                            ) : isBoss ? (
                              <Sword size={40} className="text-red-500 animate-pulse" />
                            ) : (
                              <Gift size={32} className="text-accent animate-pulse" />
                            )}
                          </div>
                          
                          <h3 className="text-lg font-semibold mb-1">
                            {isBoss ? <Crown size={18} className="inline mr-1 text-amber-500" /> : null}
                            {level.name}
                            {isBoss ? <Zap size={18} className="inline ml-1 text-amber-500" /> : null}
                          </h3>
                          
                          <div className="flex items-center justify-center gap-1 mb-2">
                            <Badge variant={level.isCompleted ? 'default' : 'secondary'} className="text-xs">
                              {isSubLevel ? 'Sub-Level' : 'Level'} {level.name}
                            </Badge>
                            
                            {isBoss && (
                              <Badge variant="outline" className="border-red-500 text-red-500 text-xs">
                                Boss
                              </Badge>
                            )}
                            
                            {level.isCompleted && (
                              <Badge variant="outline" className="border-primary text-primary text-xs">
                                Completed
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground">
                            {!isUnlocked 
                              ? 'Complete previous levels to unlock'
                              : level.isCompleted 
                                ? 'Treasure collected! 🎁'
                                : `${level.questions.length} challenge${level.questions.length > 1 ? 's' : ''} await`
                            }
                          </p>
                        </CardContent>
                      </Card>
                      
                      {/* Connector for sub-levels */}
                      {showConnector && isSubLevel && (
                        <div className="hidden md:flex items-center mx-2 text-blue-400">
                          <ChevronRight size={20} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Level group label */}
              <div className={`absolute -left-4 top-1/2 transform -translate-y-1/2 px-3 py-1 rounded-r-full text-sm font-medium shadow-sm ${
                isBossGroup ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {isBossGroup ? 'Boss Level ' : 'Level '}{mainLevel}
              </div>
              
              {/* Down arrow to next group */}
              {parseInt(mainLevel) < Object.keys(groupedLevels).length && (
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-amber-500">
                  <ChevronRight size={20} className="rotate-90" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-12 p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
        <p className="text-amber-700 text-sm">
          <strong>How it works:</strong> Complete levels to progress. Main levels unlock sub-levels. Every 5th level is a <Sword className="inline h-4 w-4 text-red-500" /> boss level with greater challenges!
        </p>
      </div>
    </div>
  );
};