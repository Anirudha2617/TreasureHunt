import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';
import { Level, gameAPI, getHint } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { PresentReveal } from './PresentReveal';
import MyPuzzle from '@/components/game/image_puzzle';
import SecureImage from '@/components/game/SecureImage';
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

interface QuestionViewProps {
  parentLevel: Level;
  onAnswerSubmit: (() => Promise<void>) | (() => void);
  onBack: () => void;
}

export const QuestionView: React.FC<QuestionViewProps> = ({ parentLevel, onAnswerSubmit, onBack }) => {
  const [level, setLevel] = useState<Level | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [fileAnswer, setFileAnswer] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPresentReveal, setShowPresentReveal] = useState(false);
  const [earnedPresent, setEarnedPresent] = useState<any | null>(null);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [secureUrl, setSecureUrl] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const token = localStorage.getItem("token") || "";
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [hintSent, setHintSent] = useState(false);
  const [transitionStage, setTransitionStage] = useState<"idle" | "loading">("idle");

  // Fetch fresh level from API
  const fetchLevel = async (levelId: string) => {
    try {
      const freshLevel = await gameAPI.getLevel(levelId);
      setLevel(freshLevel);
    } catch (err) {
      console.error("Failed to refresh level:", err);
      setLevel(parentLevel); // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(!parentLevel.isCompleted || !parentLevel?.questions?.length){
      console.log("Parentlevel is incomplete!!!");
      fetchLevel(parentLevel.id);      
    }
    else {
      console.log("set loading false");
      setLoading(false);
      setLevel(parentLevel);
    }

  }, [parentLevel.id]);

  // After level loads, set correct question index or present reveal
  useEffect(() => {
    if (!level) return;
    
    if (parentLevel.isCompleted){
      console.log("current level :", parentLevel);
      setEarnedPresent(parentLevel.present);
      setShowPresentReveal(true);
      return ;
    }
    if (!parentLevel?.questions?.length){
      setEarnedPresent(parentLevel.present);
      setShowPresentReveal(true);
      return;
    } 

    const allCompleted = level.questions.every(q => q.status.completed);
    if (allCompleted) {
      if (level.present) {
        setEarnedPresent(level.present);
        setShowPresentReveal(true);
      } else {
        onAnswerSubmit?.();
      }
      return;
    }

    const firstUnansweredIndex = level.questions.findIndex(q => !q.status.completed);
    setCurrentQuestionIndex(firstUnansweredIndex === -1 ? 0 : firstUnansweredIndex);
    setShowPresentReveal(false);
  }, [level]);

  if (loading || !level) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin text-primary mb-4">
          <Sparkles size={48} />
        </div>
        <p className="text-lg text-muted-foreground">Loading level...</p>
      </div>
    );
  }

  const question = level.questions[currentQuestionIndex];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question) return;

    if (question?.type?.includes("image") && !fileAnswer) {
      toast({ title: "Image Required", description: "Please upload an image to continue.", variant: "destructive" });
      return;
    }
    if (!question?.type?.includes("image") && !answer.trim()) {
      toast({ title: "Answer Required", description: "Please provide an answer to continue.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await gameAPI.submitAnswer(
        question.id,
        question?.type?.includes("image") ? fileAnswer! : answer.trim()
      );
      console.log(result);

      if (result.correct || result.correct === null) {
        toast({
          title: result.correct === null ? "Submitted for Review" : "Correct! 🎉",
          description:
            result.message ||
            (result.correct === null
              ? "Your answer is under review by the admin."
              : "Well done!"),
        });

        setAnswer('');
        setFileAnswer(null);
        setPuzzleSolved(false);

        const nextUnansweredIndex = level.questions.findIndex(
          (q, idx) => idx > currentQuestionIndex && !q.status.completed
        );

        if (nextUnansweredIndex !== -1) {
          setCurrentQuestionIndex(nextUnansweredIndex);
        } else {
          if (result.present) {
            setEarnedPresent(result.present);
            setShowPresentReveal(true);
          } else if (level.present) {
            setEarnedPresent(level.present);
            setShowPresentReveal(true);
          } else {
            await onAnswerSubmit?.();
          }
        }
      } else {
        toast({
          title: "Incorrect Answer",
          description: result.message || "Try again!",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      if (error.message?.includes("already answered")) {
        toast({
          title: "Already Answered",
          description: "Moving to the next question...",
        });

        const nextUnansweredIndex = level.questions.findIndex(
          (q, idx) => idx > currentQuestionIndex && !q.status.completed
        );

        if (nextUnansweredIndex !== -1) {
          setCurrentQuestionIndex(nextUnansweredIndex);
        } else {
          if (level.present) {
            setEarnedPresent(level.present);
            setShowPresentReveal(true);
          } else {
            await onAnswerSubmit?.();
          }
        }
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to submit answer. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePresentRevealComplete = async () => {
    setLevel(null);
    setCurrentQuestionIndex(0);
    setAnswer('');
    setFileAnswer(null);
    setPuzzleSolved(false);
    setShowPresentReveal(false);
    setLevel(null);
    setTransitionStage("loading");
    await onAnswerSubmit?.();
    setTransitionStage("idle"); 
  };

  const handlegetHint = async () => {
    setIsHintLoading(true);
    try {
      const token = localStorage.getItem("token");
      const question = level.questions[currentQuestionIndex];

      if (!token) {
        toast({
          title: "Error",
          description: "Token not found. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      const data = await getHint.getHintt(question.id, token);

      toast({
        title: "Successful",
        description: data.detail || "Hint sent successfully!",
      });
      setHintSent(true);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsHintLoading(false);
    }
  };

  const buttonStyle = {
    backgroundColor: 'black',
    color: '#FFD700',
    border: '1px solid #FFD700',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s ease-in-out',
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#333',
    color: '#888',
    borderColor: '#555',
    cursor: 'not-allowed',
  };

  if (showPresentReveal && earnedPresent) {
    return (
      <PresentReveal
        present={earnedPresent}
        onComplete={handlePresentRevealComplete}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      <AnimatePresence>
        {transitionStage === "loading" ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center h-96"
          >
            <div className="animate-spin text-primary mb-4">
              <Sparkles size={48} />
            </div>
            <p className="text-lg text-muted-foreground">Returning to Levels...</p>
          </motion.div>
        ) : (
          <motion.div
            key="question-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between mb-6">
              <Button onClick={onBack} variant="outline">
                <ArrowLeft size={16} className="mr-2" />
                Back to Levels
              </Button>

              <Badge variant="outline" className="text-lg px-4 py-2">
                {level.name} ({currentQuestionIndex + 1}/{level.questions.length})
              </Badge>
            </div>

            <Card className="card-gradient border-border/50 max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl flex items-center justify-center gap-2 mb-4">
                  {level.name}
                </CardTitle>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span>Attempts: {question?.attempts || 0}</span>
                  <span>Max: {question?.maxAttempts || 3}</span>
                  <span>type = {question?.type}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="bg-muted/20 rounded-lg p-6 text-center">
                  <h3 className="text-xl font-semibold mb-4 text-foreground">
                    {question?.question}
                  </h3>
                </div>

                {question?.status?.pending && !question.status.completed && (
                  <div className="text-center text-yellow-600 font-medium">
                    ⏳ This answer is pending review by an admin.
                  </div>
                )}
                {question?.status?.completed && (
                  <div className="text-center text-green-600 font-medium">
                    ✅ This question has been completed and approved!
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {question?.type?.includes("image") ? (
                    <div className="space-y-2">
                      <Label htmlFor="answer_image" className="text-lg">
                        Upload Image
                      </Label>
                      <Input
                        id="answer_image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFileAnswer(e.target.files?.[0] || null)}
                        disabled={isSubmitting}
                        className="text-center py-4"
                      />
                    </div>
                  ) : question?.type === "puzzle" ? (
                    <>
                      {token ? (
                        <SecureImage
                          key={question?.id}
                          image_url={question?.questionImage}
                          token={token}
                          className="hidden"
                          onImageFetched={setSecureUrl}
                        />
                      ) : (
                        <p>Please login to load the puzzle image.</p>
                      )}

                      <div className="space-y-4 text-center">
                        {secureUrl ? (
                          <MyPuzzle
                            questionImage={secureUrl}
                            onSolved={() => {
                              setPuzzleSolved(true);
                              setAnswer("puzzleSolved");
                            }}
                          />
                        ) : (
                          <p>Loading puzzle image...</p>
                        )}

                        {puzzleSolved && (
                          <div className="text-lg font-semibold text-green-600 mt-4">
                            🎉 Puzzle solved!
                          </div>
                        )}
                      </div>
                    </>
                  ) : question?.type === "match-mail" ? (
                    <>
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={handlegetHint}
                          disabled={isHintLoading || hintSent}
                          style={isHintLoading || hintSent ? disabledButtonStyle : buttonStyle}
                        >
                          {isHintLoading
                            ? "Sending Hint..."
                            : hintSent
                            ? "✔ Hint Sent Successfully!"
                            : "Press to get hint"}
                        </button>
                      </div>
                      <div className="space-y-2">
                        <Input
                          id="answer"
                          type="text"
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          placeholder="Type your answer here..."
                          className="text-center text-lg py-6"
                          disabled={isSubmitting}
                          autoFocus
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        id="answer"
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        className="text-center text-lg py-6"
                        disabled={isSubmitting}
                        autoFocus
                      />
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={
                      isSubmitting ||
                      question?.status?.pending ||
                      (question?.type?.includes("image")? !fileAnswer : !answer.trim()) ||
                      (question?.type === "puzzle" && !puzzleSolved)
                    }
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                        Checking Answer...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle size={16} />
                        Submit Answer
                      </span>
                    )}
                  </Button>
                </form>

                <div className="text-center text-sm text-muted-foreground">
                  💡 Take your time and think carefully!
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
