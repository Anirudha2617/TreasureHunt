import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleBack = () => {
    navigate(-1); // Go to previous page
  };

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* 🔙 Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center space-x-1"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back</span>
            </Button>

            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Present Hunt
            </h1>

            <ThemeToggle />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={user?.profilePic} alt={user?.username} />
                <AvatarFallback>
                  <User size={20} />
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="transition-smooth hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut size={16} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
