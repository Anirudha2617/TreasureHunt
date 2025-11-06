import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Target } from 'lucide-react';

interface ProgressBarProps {
  progress: number;
  completedLevels: number;
  totalLevels: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  completedLevels, 
  totalLevels 
}) => {
  return (
    <Card className="card-gradient border-border/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="text-primary" size={20} />
            <h3 className="font-semibold text-lg">Your Progress</h3>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Trophy size={16} />
            <span>{completedLevels} / {totalLevels} Completed</span>
          </div>
        </div>

        <div className="space-y-2">
          <Progress 
            value={progress} 
            className="h-3 transition-all duration-500 ease-out"
          />
          
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>0%</span>
            <span className="font-medium text-primary">
              {Math.round(progress)}%
            </span>
            <span>100%</span>
          </div>
        </div>

        {progress === 100 && (
          <div className="mt-4 text-center">
            <p className="text-primary font-semibold animate-pulse-glow">
              🎉 Congratulations! All levels completed! 🎉
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};