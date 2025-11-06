import React, { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-card to-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Present Hunt
          </h1>
          <p className="text-muted-foreground">
            Unlock magical presents through puzzles and challenges
          </p>
        </div>
        
        {/* Toggle between LoginForm and SignupForm based on isLogin state */}
        {isLogin ? (
          <LoginForm onToggleMode={() => setIsLogin(false)} />
        ) : (
          <LoginForm onToggleMode={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
};