import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react'; // ✅ 1. Import the loader icon

// ✅ 2. Define the loading spinner component
interface LoadingSpinnerProps {
  text: string;
}
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text }) => (
  <div className="flex flex-col items-center justify-center space-y-4 py-16">
    <Loader2 className="h-10 w-10 animate-spin text-primary" />
    <p className="text-muted-foreground">{text}</p>
  </div>
);


interface LoginFormProps {
  onToggleMode: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    console.log(isLoading);
    e.preventDefault();
    try {
      await login(username, password);
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="animate-fade-in">
      <Card className="card-gradient border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to access your presents
          </CardDescription>
        </CardHeader>
        {/* ✅ 3. Add conditional rendering here */}
        {isLoading ? (
          <LoadingSpinner text="Signing you in..." />
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  className="transition-smooth focus:glow-effect"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="transition-smooth focus:glow-effect"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full transition-smooth hover:animate-pulse-glow"
                disabled={isLoading} // This is still useful
              >
                Sign In
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="text-primary hover:text-accent transition-smooth underline"
                >
                  Sign up
                </button>
              </p>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};