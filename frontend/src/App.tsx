import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Analytics } from "@vercel/analytics/react";

// --- Page Imports ---
import { Auth } from "@/pages/Auth";
import { Home } from "@/pages/Home";
import { Game } from "@/pages/Game";
// Assuming you have these pages, add them here
// import { Questions } from "@/pages/Questions";
// import { Present } from "@/pages/Present";

// --- Route Guard ---
import { ProtectedRoute  } from '@/components/ProtectedRoute';
const queryClient = new QueryClient();

// A small component to handle redirecting logged-in users away from the auth page.
const AuthRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null; // Or a loader, but null is fine to prevent flashes
  return isAuthenticated ? <Navigate to="/home" /> : <Auth />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          
          {/* --- Main Routing Logic --- */}
          <Routes>
            {/* Public Route: Authentication Page */}
            {/* If a logged-in user tries to visit /auth, they'll be redirected to /home */}
            <Route path="/auth" element={<AuthRedirect />} />

            {/* --- Protected Routes --- */}
            {/* All routes nested inside here are protected by ProtectedRoute */}
            <Route element={<ProtectedRoute />}>
              {/* Redirect root path to /home for logged-in users */}
              <Route path="/" element={<Navigate to="/home" />} />
              
              <Route path="/home" element={<Home />} />
              <Route path="/game" element={<Game />} />
              
              {/* Add your other protected routes here */}
              {/* <Route path="/questions" element={<Questions />} /> */}
              {/* <Route path="/present" element={<Present />} /> */}
            </Route>

            {/* Optional: A catch-all 404 Not Found page */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center">
                404 - Page Not Found
              </div>
            } />
          </Routes>
          
          <Analytics />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
