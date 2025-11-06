import React, { useState } from 'react';
import { Countdown } from '@/components/home/Countdown';
import { Header } from '@/components/layout/Header';
import { Navigate, Route } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Quotation from '@/components/home/Quotation';
import MysteryGrid from '@/components/home/MysteryGrid';
import CardZoomGroup from '@/components/home/CardZoomGroup';

interface HomeProps {
}

const sampleMysteries = [
  {
    id: 1,
    name: "The Vanishing Cipher",
    starts_at: "2025-11-01T10:00:00Z",
    ends_at: "2025-11-10T18:00:00Z",
    logo: "https://cdn-icons-png.flaticon.com/512/476/476863.png",
  },
  {
    id: 2,
    name: "Echoes of the Forgotten City",
    starts_at: "2025-12-05T09:00:00Z",
    ends_at: "2025-12-15T21:00:00Z",
    logo: "https://cdn-icons-png.flaticon.com/512/2910/2910768.png",
  },
  {
    id: 3,
    name: "The Final Enigma",
    starts_at: "2026-01-02T12:00:00Z",
    ends_at: "2026-01-20T23:59:00Z",
    logo: "https://cdn-icons-png.flaticon.com/512/6062/6062644.png",
  },
  {
    id: 1,
    name: "The Vanishing Cipher",
    starts_at: "2025-11-01T10:00:00Z",
    ends_at: "2025-11-10T18:00:00Z",
    logo: "https://cdn-icons-png.flaticon.com/512/476/476863.png",
  },
  {
    id: 2,
    name: "Echoes of the Forgotten City",
    starts_at: "2025-12-05T09:00:00Z",
    ends_at: "2025-12-15T21:00:00Z",
    logo: "https://cdn-icons-png.flaticon.com/512/2910/2910768.png",
  },
  {
    id: 3,
    name: "The Final Enigma",
    starts_at: "2026-01-02T12:00:00Z",
    ends_at: "2026-01-20T23:59:00Z",
    logo: "https://cdn-icons-png.flaticon.com/512/6062/6062644.png",
  },
  {
    id: 1,
    name: "The Vanishing Cipher",
    starts_at: "2025-11-01T10:00:00Z",
    ends_at: "2025-11-10T18:00:00Z",
    logo: "https://cdn-icons-png.flaticon.com/512/476/476863.png",
  },
  {
    id: 2,
    name: "Echoes of the Forgotten City",
    starts_at: "2025-12-05T09:00:00Z",
    ends_at: "2025-12-15T21:00:00Z",
    logo: "https://cdn-icons-png.flaticon.com/512/2910/2910768.png",
  },
  {
    id: 3,
    name: "The Final Enigma",
    starts_at: "2026-01-02T12:00:00Z",
    ends_at: "2026-01-20T23:59:00Z",
    logo: "https://cdn-icons-png.flaticon.com/512/6062/6062644.png",
  },
  {
    id: 1,
    name: "The Vanishing Cipher",
    starts_at: "2025-11-01T10:00:00Z",
    ends_at: "2025-11-10T18:00:00Z",
    logo: "https://cdn-icons-png.flaticon.com/512/476/476863.png",
  },
  {
    id: 2,
    name: "Echoes of the Forgotten City",
    starts_at: "2025-12-05T09:00:00Z",
    ends_at: "2025-12-15T21:00:00Z",
    logo: "https://cdn-icons-png.flaticon.com/512/2910/2910768.png",
  },
  {
    id: 3,
    name: "The Final Enigma",
    starts_at: "2026-01-02T12:00:00Z",
    ends_at: "2026-01-20T23:59:00Z",
    logo: "https://cdn-icons-png.flaticon.com/512/6062/6062644.png",
  },
  {
    id: 1,
    name: "The Vanishing Cipher",
    starts_at: "2025-11-01T10:00:00Z",
    ends_at: "2025-11-10T18:00:00Z",
    logo: "https://cdn-icons-png.flaticon.com/512/476/476863.png",
  },
  {
    id: 2,
    name: "Echoes of the Forgotten City",
    starts_at: "2025-12-05T09:00:00Z",
    ends_at: "2025-12-15T21:00:00Z",
    logo: "https://cdn-icons-png.flaticon.com/512/2910/2910768.png",
  },
  {
    id: 3,
    name: "The Final Enigma",
    starts_at: "2026-01-02T12:00:00Z",
    ends_at: "2026-01-20T23:59:00Z",
    logo: "https://cdn-icons-png.flaticon.com/512/6062/6062644.png",
  },
  {
    id: 1,
    name: "The Vanishing Cipher",
    starts_at: "2025-11-01T10:00:00Z",
    ends_at: "2025-11-10T18:00:00Z",
    logo: "https://cdn-icons-png.flaticon.com/512/476/476863.png",
  },

]


export const Home: React.FC<HomeProps> = () => {
  const [isComplete, setIsComplete] = useState(false);
  const navigate = useNavigate();
  const {user} = useAuth();


  const handleOpenMystery = () => {
    console.log("navigating to games ..");
    navigate("/game");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className=" mx-auto">          
          <div className="container mx-auto px-4 py-8">          
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                GET ALL MISTRIES
              </h1>
          </div>
          <CardZoomGroup samples={sampleMysteries}  loading={false} onClick={(mystery)=>{console.log("Mystery_id:",mystery.id);}}/>
        </div>
        
        <div className="bottom">
        </div>
      </main>
    </div>
  );
};
