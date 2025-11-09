import React, { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { QuestionView } from '@/components/game/QuestionView';
import { ProgressBar } from '@/components/game/ProgressBar';
import { PresentSlideshow } from '@/components/game/PresentSlideshow';
import { Button } from '@/components/ui/button';
import { Map, Gift, Scroll, Sparkles } from 'lucide-react';
import { Level, gameAPI, UserProgress } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";



// -----------------------------
// LEVEL CARD
// -----------------------------
const LevelCard: React.FC<{
  level: Level;
  onSingleClick: () => void;
  onDoubleClick: () => void;
  isExpanded: boolean;
}> = ({ level, onSingleClick, onDoubleClick, isExpanded }) => {
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      onDoubleClick();
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        onSingleClick();
        clickTimeoutRef.current = null;
      }, 250);
    }
  };

  const getLevelIcon = () => {
    if (!level.isUnlocked) return <span className="opacity-50">🔒</span>;

    if (
      level.name.toLowerCase().includes('boss') ||
      level.title?.toLowerCase().includes('boss')
    ) {
      return <span className="text-amber-300 animate-pulse">👑</span>;
    }

    console.log("received level to format:", level )

    // Generate stars for completed questions
    let text = '';
    level.questions.forEach((question) => {
      text += question.status.completed ? '★' : '☆';
    });

    return <span className="text-yellow-300/70">{text}</span>;
  };
  

  const getBorderClass = () => {
    if (!level.isUnlocked) return 'border-amber-200/10';
    if (level.name.toLowerCase().includes('boss') || level.title?.toLowerCase().includes('boss'))
      return 'border-amber-400 shadow-amber-400/20 shadow-lg';
    if (level.isCompleted) return 'border-amber-500';
    return 'border-yellow-400/80';
  };

  const getBackgroundClass = () => {
    if (!level.isUnlocked) return 'bg-black/30';
    if (level.name.toLowerCase().includes('boss') || level.title?.toLowerCase().includes('boss'))
      return 'bg-gradient-to-br from-amber-800/40 to-amber-600/30';
    if (level.isCompleted)
      return 'bg-gradient-to-br from-yellow-700 to-yellow-900 hover:from-yellow-800 hover:to-yellow-900/80';
    return 'bg-gradient-to-br from-yellow-900 to-yellow-900/30 hover:from-yellow-800 hover:to-yellow-800/40';
  };

  return (
    <div
      className={`relative group transition-opacity duration-300 ${
        level.isUnlocked ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-50'
      }`}
    >
      <div
        className={`relative p-6 rounded-lg border-2 transition-all duration-300 ${getBorderClass()} ${getBackgroundClass()} ${
          level.isUnlocked ? 'hover:scale-105 hover:shadow-xl' : ''
        }`}
        onClick={level.isUnlocked ? handleClick : undefined}
      >
        <div className="text-center">
          <div className="text-4xl mb-2 flex items-center justify-center h-10">{getLevelIcon()}</div>
          <h3 className="text-xl font-bold text-amber-50 mb-1">{level.name}</h3>
          {level.title && <p className="text-sm text-amber-100/60 mb-2">{level.title}</p>}
          <div className="flex justify-center items-center gap-2 text-xs">
            {level.isUnlocked ? (
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  level.isCompleted
                    ? 'bg-amber-600/80 text-amber-50'
                    : 'bg-yellow-500/80 text-yellow-50'
                }`}
              >
                {level.isCompleted ? 'Completed' : 'Available'}
              </span>
            ) : (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-600 text-gray-300">
                Locked
              </span>
            )}
          </div>
          {level.present && level.isCompleted && (
            <div className="mt-3 flex items-center justify-center gap-1 text-amber-400">
              <Gift size={14} />
              <span className="text-xs">Treasure collected!</span>
            </div>
          )}
          {level.isUnlocked && !isExpanded && (
            <div className="mt-3 text-xs text-amber-100/40">Click to view quest...</div>
          )}
          {level.isUnlocked && isExpanded && (
            <div className="mt-3 text-xs text-amber-100/40">Double-click to start...</div>
          )}
        </div>
      </div>

      {/* Quest Slide Panel */}
      {level.isUnlocked && level.quest && (
        <>
          {/* Overlay */}
          {isExpanded && (
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => onSingleClick()}
            />
          )}

          {/* Panel */}
          <div
            className={`fixed top-0 right-0 h-full z-50 transform transition-transform duration-500 ease-in-out 
              ${isExpanded ? 'translate-x-0' : 'translate-x-full'}`}
            style={{
              width: '400px',
              backgroundColor: 'rgba(255, 248, 220, 0.95)',
              boxShadow: '-4px 0 12px rgba(0,0,0,0.2)',
            }}
          >
            <button
              className="absolute top-3 right-3 text-gray-700 hover:text-black"
              onClick={() => onSingleClick()}
            >
              ✕
            </button>
            <div className="p-6 overflow-y-auto h-full">
              <h4 className="font-bold text-lg mb-4 text-amber-700 flex items-center gap-2">
                <Scroll size={20} /> Quest Details
              </h4>
              <p className="italic text-gray-800 leading-relaxed">"{level.quest}"</p>
              <div className="mt-6 border-t border-amber-300 pt-4 text-center">
                <p className="text-sm text-amber-600 font-medium">
                  Double-click the level card to begin your quest!
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// -----------------------------
// ENHANCED GRID
// -----------------------------
const EnhancedLevelGrid: React.FC<{ levels: Level[]; onLevelSelect: (levelId: string) => void }> = ({
  levels,
  onLevelSelect,
}) => {
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);

  const handleSingleClick = (levelId: string) => {
    setExpandedLevel(expandedLevel === levelId ? null : levelId);
  };

  const handleDoubleClick = (levelId: string) => {
    const level = levels.find((l) => l.id === levelId);
    if (level && level.isUnlocked) {
      setExpandedLevel(null);
      onLevelSelect(levelId);
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {levels.map((level) => (
          <LevelCard
            key={level.id}
            level={level}
            onSingleClick={() => handleSingleClick(level.id)}
            onDoubleClick={() => handleDoubleClick(level.id)}
            isExpanded={expandedLevel === level.id}
          />
        ))}
      </div>
    </div>
  );
};

// -----------------------------
// QUEST LIST
// -----------------------------


const QuestList: React.FC<{ levels: Level[] }> = ({ levels }) => {
  // Filter unlocked levels with quests
  const quests = levels.filter((level) => level.quest && level.isUnlocked);

  // Identify the present quest (first unlocked but not completed)
  const presentQuest = quests.find((level) => !level.isCompleted);

  // Refs for scrolling
  const questRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Scroll to present quest on mount
  useEffect(() => {
    if (presentQuest) {
      const element = questRefs.current[presentQuest.id];
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [presentQuest]);

  if (quests.length === 0) {
    return (
      <div className="text-center text-neutral-400 p-8 bg-black/20 rounded-lg">
        No quests are currently available. Unlock more levels to see new quests!
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[10%] overflow-y-auto overflow-hidden p-6">
      {quests.map((level) => {
        const isPresent = level.id === presentQuest?.id;

        return (
          <div
            key={level.id}
            ref={(el) => (questRefs.current[level.id] = el)}
            style={{ scrollMarginTop: 20 }}
            className={cn(
              "p-4 rounded-lg border border-neutral-700/50 transition-all duration-300 transform origin-center overflow-visible",
              {
                // Present quest: highlighted, scaled, larger
                "ring-2 ring-amber-400 bg-amber-900/20 scale-105 text-lg": isPresent,
                // Completed quests: dimmed
                "bg-black/20 text-neutral-400": level.isCompleted && !isPresent,
                // Other unlocked quests
                "bg-black/20 text-neutral-100": !level.isCompleted && !isPresent,
              }
            )}
          >
            <h3 className="font-bold text-amber-200">{level.name}</h3>
            <p
              className={cn(
                "italic",
                level.isCompleted
                  ? "text-neutral-400"
                  : "text-neutral-100 font-medium"
              )}
            >
              "{level.quest}"
            </p>
          </div>
        );
      })}
    </div>
  );
};




// -----------------------------
// MAIN GAME COMPONENT
// -----------------------------

export const Game: React.FC = () => {
  const [mainView, setMainView] = useState<'worldmap' | 'rewards' | 'quests'>('worldmap');
  const [gameView, setGameView] = useState<'levels' | 'question'>('levels');
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const mysteryId = location.state?.mystery_id || null;

  console.log("Received mystery_id:", mysteryId);

  useEffect(() => {
    loadLevelsFirst();
  }, []);

  const loadLevelsFirst = async () => {
    try {
      // Step 1: Fetch levels first
      const levelsData = await gameAPI.getLevels(mysteryId);
      setLevels(levelsData);
      setLoading(false); // ✅ allow UI to render immediately after levels load

      // Step 2: Then fetch user progress (non-blocking for UI)
      fetchUserProgress(mysteryId);
    } catch (error: any) {
      toast({
        title: 'Error loading levels',
        description: error.message || 'Please try refreshing the page.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const fetchUserProgress = async (mysteryId) => {
    try {
      const progressData = await gameAPI.getUserProgress(mysteryId);
      setUserProgress(progressData);
    } catch (error: any) {
      toast({
        title: 'Error loading progress',
        description: error.message || 'Please try again.',  
        variant: 'destructive',
      });
    }
  };

  const handleLevelSelect = async (levelId: string) => {
    try {
      const level = levels.find((l) => l.id === levelId);
      if (level && level.isUnlocked) {
        setSelectedLevel(level);
        setGameView('question');
      } else {
        toast({
          title: 'Level locked',
          description: 'Complete previous levels to unlock this one.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error loading level',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

const handlePostAnswer = async () => {
  try {
    if (!selectedLevel) return;

    const currentIndex = levels.findIndex(lvl => lvl.id === selectedLevel.id);
    let nextLevel = levels[currentIndex + 1];

    // If next level exists and unlocked, move directly without fetching levels again
    if (nextLevel && nextLevel.isUnlocked) {
      setSelectedLevel(nextLevel);
      setGameView("question");
      return;
    }

    // Optional: refresh levels if user progress may have changed
    const levelsData = await gameAPI.getLevels(mysteryId);
    setLevels(levelsData);
    nextLevel = levels[currentIndex + 1];
    console.log("Fetched next level", nextLevel);

    if (nextLevel && nextLevel.isUnlocked) {
      setSelectedLevel(nextLevel);
      setGameView("question");
      return;
    }

    setGameView("levels");
    setSelectedLevel(null);
  } catch (error: any) {
    toast({
      title: "Failed to refresh progress",
      description: error.message || "Please try again.",
      variant: "destructive",
    });
    setGameView("levels");
    setSelectedLevel(null);
  }
};

  const handleBackToLevels = () => {
    setGameView('levels');
    setSelectedLevel(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin text-primary">
            <Sparkles size={48} />
          </div>
        </div>
      </div>
    );
  }

  const completedLevels = levels.filter((level) => level.isCompleted).length;
  const totalLevels = levels.length;
  const progressPercentage = totalLevels > 0 ? (completedLevels / totalLevels) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <ProgressBar
              progress={progressPercentage}
              completedLevels={completedLevels}
              totalLevels={totalLevels}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 p-3 bg-gradient-to-r from-neutral-900/70 to-neutral-800/70 rounded-2xl border border-neutral-700/60 shadow-md">
            <Button
              onClick={() => setMainView('worldmap')}
              variant={mainView === 'worldmap' ? 'secondary' : 'ghost'}
              className="w-full h-12 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-[1.02]"
            >
              <Map size={18} className="mr-2" /> World Map
            </Button>
            <Button
              onClick={() => setMainView('rewards')}
              variant={mainView === 'rewards' ? 'secondary' : 'ghost'}
              className="w-full h-12 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-[1.02]"
            >
              <Gift size={18} className="mr-2" /> My Treasures (
              {userProgress?.collectedPresents.length || 0})
            </Button>
            <Button
              onClick={() => setMainView('quests')}
              variant={mainView === 'quests' ? 'secondary' : 'ghost'}
              className="w-full h-12 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-[1.02]"
            >
              <Scroll size={18} className="mr-2" /> Quests
            </Button>
          </div>


          {mainView === 'worldmap' &&
            (gameView === 'levels' ? (
              <EnhancedLevelGrid levels={levels} onLevelSelect={handleLevelSelect} />
            ) : gameView === 'question' ? (
              <QuestionView
                parentLevel={selectedLevel!}
                onAnswerSubmit={handlePostAnswer}
                onBack={handleBackToLevels}
              />
            ) : null)}

          {mainView === 'rewards' &&
            (userProgress && userProgress.collectedPresents.length > 0 ? (
              <PresentSlideshow levels={levels} onBack={() => navigate('/')} />
            ) : (
              <div className="text-center text-neutral-400 p-8 bg-black/20 rounded-lg">
                <h3 className="text-xl font-bold text-amber-100 mb-2">No Treasures Yet!</h3>
                <p>Complete levels on the World Map to collect treasures.</p>
              </div>
            ))}

          {mainView === 'quests' && <QuestList levels={levels} />}
        </div>
      </div>
    </div>
  );
};
