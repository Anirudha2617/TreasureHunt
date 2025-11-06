import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Gift,
  Play,
  Pause,
  Maximize,
  Minimize,
} from "lucide-react";
import { Present , Level } from "@/lib/api";
import SecureImage from "@/components/game/SecureImage";
import { useAuth } from "@/hooks/useAuth";

interface PresentSlideshowProps {
  levels: Level[];
  onBack: () => void;
  autoPlayInterval?: number; // autoplay delay in ms
}

export const PresentSlideshow: React.FC<PresentSlideshowProps> = ({
  levels,
  onBack,
  autoPlayInterval = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const presents: Present[] = levels.filter(level => level.isCompleted && level.present !== null).map(level => level.present as Present);
  const slideshowRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const token = localStorage.getItem("token") || "";

  // ✅ Fullscreen toggle
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement && slideshowRef.current) {
      await slideshowRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Detect ESC key or manual fullscreen exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  if (presents.length === 0) {
    return (
      <div className="animate-fade-in text-center">
        <div className="mb-8">
          <Button onClick={onBack} variant="outline">
            <ArrowLeft size={16} className="mr-2" />
            Back to Levels
          </Button>
        </div>
        <Card className="card-gradient border-border/50 max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Gift size={64} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Presents Yet</h3>
            <p className="text-muted-foreground">
              Complete puzzles to collect presents!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPresent = presents[currentIndex];

  const nextPresent = () => {
    setDirection("right");
    setCurrentIndex((prev) => (prev + 1) % presents.length);
  };

  const prevPresent = () => {
    setDirection("left");
    setCurrentIndex((prev) => (prev - 1 + presents.length) % presents.length);
  };

  // 🟢 Autoplay effect
  useEffect(() => {
    if (!isAutoPlay) return;
    const timer = setInterval(() => {
      nextPresent();
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [isAutoPlay, currentIndex, autoPlayInterval]);

  const renderPresentContent = (present: Present) => {
    switch (present.type) {
      case "text":
        return (
          <div className="text-center p-6">
            <p className="text-lg text-foreground leading-relaxed">
              {present.content}
            </p>
          </div>
        );

      case "image":
        return (
          <div className="flex flex-col w-full h-full overflow-y-auto overflow-x-hidden">
            <div className="text-center p-6 flex-shrink-0">
              <p className="text-lg text-foreground leading-relaxed">
                {present.content}
              </p>
            </div>
            <div className="flex justify-center items-center flex-shrink-0">
              <SecureImage image_url={present.image} token={token} className="max-h-96 object-contain" />
            </div>
          </div>

        );

      case "audio":
        return (
          <div className="text-center p-6">
            <audio controls className="mb-4">
              <source src={present.content} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        );

      case "video":
        return (
          <div className="flex justify-center">
            <video
              controls
              className="max-w-full h-auto rounded-lg shadow-lg mx-auto mb-4"
              style={{ maxHeight: isFullscreen ? "80vh" : "400px" }}
            >
              <source src={present.content} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        );

      default:
        return (
          <div className="text-center p-6">
            <p className="text-foreground">{present.content}</p>
          </div>
        );
    }
  };

  return (
    <div
      ref={slideshowRef}
      className={`animate-fade-in transition-all ${
        isFullscreen ? "fixed inset-0 bg-background z-50 p-6" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft size={16} className="mr-2" />
          Back to Levels
        </Button>

        <Badge variant="outline" className="text-lg px-4 py-2">
          Present {currentIndex + 1} of {presents.length}
        </Badge>

        {/* Autoplay Toggle */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAutoPlay((prev) => !prev)}
            title={isAutoPlay ? "Pause Slideshow" : "Play Slideshow"}
          >
            {isAutoPlay ? (
              <Pause size={16} className="mr-1" />
            ) : (
              <Play size={16} className="mr-1" />
            )}
            {isAutoPlay ? "Pause" : "Play"}
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize size={16} className="mr-1" />
            ) : (
              <Maximize size={16} className="mr-1" />
            )}
            {isFullscreen ? "Exit" : "Fullscreen"}
          </Button>
        </div>
      </div>

      {/* Slideshow Card */}
      <Card
        className={`card-gradient border-primary/50 mx-auto overflow-hidden transition-all ${
          isFullscreen ? "w-full h-[90vh]" : "max-w-3xl"
        }`}
      >
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2 flex-wrap">
            <Gift className="text-primary" size={24} />
            {currentPresent.title}
          </CardTitle>
          <Badge variant="secondary" className="mx-auto w-fit">
            {currentPresent.type.charAt(0).toUpperCase() +
              currentPresent.type.slice(1)}
          </Badge>
        </CardHeader>

        <CardContent className="p-6 relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              initial={{ opacity: 0, x: direction === "right" ? 100 : -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction === "right" ? -100 : 100 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 w-full h-full overflow-hidden"
            >
              {renderPresentContent(currentPresent)}
            </motion.div>
          </AnimatePresence>

          {/* Keep consistent layout height */}
          <div className={`${isFullscreen ? "h-[70vh]" : "h-[420px]"}`} />
        </CardContent>

        {/* Navigation */}
        {presents.length > 1 && (
          <div className="flex items-center justify-between p-4">
            <Button
              onClick={() => {
                setIsAutoPlay(false);
                prevPresent();
              }}
              variant="outline"
              size="sm"
            >
              <ChevronLeft size={16} className="mr-1" />
              Previous
            </Button>

            <div className="flex space-x-2">
              {presents.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAutoPlay(false);
                    setCurrentIndex(index);
                  }}
                  aria-label={`Go to present ${index + 1}`}
                  className={`w-2 h-2 rounded-full transition-smooth ${
                    index === currentIndex
                      ? "bg-primary"
                      : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={() => {
                setIsAutoPlay(false);
                nextPresent();
              }}
              variant="outline"
              size="sm"
            >
              Next
              <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
