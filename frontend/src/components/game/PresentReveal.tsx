import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles } from 'lucide-react';
import { Present } from '@/lib/api';
import { useAuth } from "@/hooks/useAuth";
import SecureImage from '@/components/game/SecureImage';


interface PresentRevealProps {
  present: Present;
  onComplete: () => void;
}

export const PresentReveal: React.FC<PresentRevealProps> = ({ present, onComplete }) => {
  const [showPresent, setShowPresent] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const token = localStorage.getItem("token") || "";

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPresent(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const renderPresentContent = () => {
    switch (present.type) {
      case 'text':
        {console.log("Text src:", present.content)}
        return (
          <div className="text-center p-6">
            <p className="text-lg text-foreground leading-relaxed">
              {present.content}
            </p>
          </div>
        );
      case 'image':
        {console.log("Image src:", present.content)}
        return (
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{present.content}</p>
            <SecureImage image_url={present.image} token={token} />
          </div>
        );
      case 'audio':
        {console.log("Audio src:", present.content)}
        return (
          <div className="text-center p-6">
            <audio controls className="mb-4">
              <source src={present.audio} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
            <p className="text-muted-foreground">{present.title}</p>
          </div>
        );
      case 'video':
        return (
          <div className="text-center">
            <video controls className="max-w-full h-auto rounded-lg shadow-lg mx-auto mb-4" style={{ maxHeight: '300px' }}>
              <source src={present.video} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <p className="text-muted-foreground">{present.title}</p>
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
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="relative inline-block">
          {!showPresent ? (
            <div className="present-animation">
              <Gift size={120} className="text-primary mx-auto mb-4" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-xl animate-pulse-glow" />
            </div>
          ) : (
            <div className="animate-scale-in">
              <Sparkles size={80} className="text-accent mx-auto mb-4 animate-pulse" />
            </div>
          )}
        </div>
        
        <h2 className="text-3xl font-bold mb-2">
          {!showPresent ? "Opening your present..." : "🎉 Present Unlocked! 🎉"}
        </h2>
        
        {!showPresent && (
          <p className="text-muted-foreground">
            Get ready for your surprise!
          </p>
        )}
      </div>

      {showPresent && (
        <div className="animate-fade-in">
          <Card className="card-gradient border-primary/50 max-w-2xl mx-auto mb-6">
            <CardContent className="p-6">
              <h3 className="text-2xl font-bold text-center mb-6 text-primary">
                {present.title}
              </h3>
              {renderPresentContent()}
            </CardContent>
          </Card>

          <div className="text-center">
            <Button
              onClick={onComplete}
              size="lg"
              className="transition-smooth hover:animate-pulse-glow"
            >
              <Sparkles size={16} className="mr-2" />
              Continue Adventure
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};