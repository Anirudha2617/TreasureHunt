import React, { useState } from 'react';
import { Countdown } from '@/components/home/Countdown';
import { Header } from '@/components/layout/Header';
import { Navigate, Route } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Quotation from '@/components/home/Quotation';
import MysteryGrid from '@/components/home/MysteryGrid';
import CardZoomGroup from '@/components/home/CardZoomGroup';
import { imageAPI, mysteryAPI ,Mystery} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface HomeProps {
}

// const sampleMysteries = [
//   {
//     id: 1,
//     name: "The Vanishing Cipher",
//     starts_at: "2025-11-01T10:00:00Z",
//     ends_at: "2025-11-10T18:00:00Z",
//     image: "https://cdn-icons-png.flaticon.com/512/476/476863.png",
//   },
//   {
//     id: 2,
//     name: "Echoes of the Forgotten City",
//     starts_at: "2025-12-05T09:00:00Z",
//     ends_at: "2025-12-15T21:00:00Z",
//     image: "https://cdn-icons-png.flaticon.com/512/2910/2910768.png",
//   },
//   {
//     id: 3,
//     name: "The Final Enigma",
//     starts_at: "2026-01-02T12:00:00Z",
//     ends_at: "2026-01-20T23:59:00Z",
//     image: "https://cdn-icons-png.flaticon.com/512/6062/6062644.png",
//   },
//   {
//     id: 1,
//     name: "The Vanishing Cipher",
//     starts_at: "2025-11-01T10:00:00Z",
//     ends_at: "2025-11-10T18:00:00Z",
//     image: "https://cdn-icons-png.flaticon.com/512/476/476863.png",
//   },
//   {
//     id: 2,
//     name: "Echoes of the Forgotten City",
//     starts_at: "2025-12-05T09:00:00Z",
//     ends_at: "2025-12-15T21:00:00Z",
//     image: "https://cdn-icons-png.flaticon.com/512/2910/2910768.png",
//   },
//   {
//     id: 3,
//     name: "The Final Enigma",
//     starts_at: "2026-01-02T12:00:00Z",
//     ends_at: "2026-01-20T23:59:00Z",
//     image: "https://cdn-icons-png.flaticon.com/512/6062/6062644.png",
//   },
//   {
//     id: 1,
//     name: "The Vanishing Cipher",
//     starts_at: "2025-11-01T10:00:00Z",
//     ends_at: "2025-11-10T18:00:00Z",
//     image: "https://cdn-icons-png.flaticon.com/512/476/476863.png",
//   },
//   {
//     id: 2,
//     name: "Echoes of the Forgotten City",
//     starts_at: "2025-12-05T09:00:00Z",
//     ends_at: "2025-12-15T21:00:00Z",
//     image: "https://cdn-icons-png.flaticon.com/512/2910/2910768.png",
//   },
//   {
//     id: 3,
//     name: "The Final Enigma",
//     starts_at: "2026-01-02T12:00:00Z",
//     ends_at: "2026-01-20T23:59:00Z",
//     image: "https://cdn-icons-png.flaticon.com/512/6062/6062644.png",
//   },
//   {
//     id: 1,
//     name: "The Vanishing Cipher",
//     starts_at: "2025-11-01T10:00:00Z",
//     ends_at: "2025-11-10T18:00:00Z",
//     image: "https://cdn-icons-png.flaticon.com/512/476/476863.png",
//   },
//   {
//     id: 2,
//     name: "Echoes of the Forgotten City",
//     starts_at: "2025-12-05T09:00:00Z",
//     ends_at: "2025-12-15T21:00:00Z",
//     image: "https://cdn-icons-png.flaticon.com/512/2910/2910768.png",
//   },
//   {
//     id: 3,
//     name: "The Final Enigma",
//     starts_at: "2026-01-02T12:00:00Z",
//     ends_at: "2026-01-20T23:59:00Z",
//     image: "https://cdn-icons-png.flaticon.com/512/6062/6062644.png",
//   },
//   {
//     id: 1,
//     name: "The Vanishing Cipher",
//     starts_at: "2025-11-01T10:00:00Z",
//     ends_at: "2025-11-10T18:00:00Z",
//     image: "https://cdn-icons-png.flaticon.com/512/476/476863.png",
//   },
//   {
//     id: 2,
//     name: "Echoes of the Forgotten City",
//     starts_at: "2025-12-05T09:00:00Z",
//     ends_at: "2025-12-15T21:00:00Z",
//     image: "https://cdn-icons-png.flaticon.com/512/2910/2910768.png",
//   },
//   {
//     id: 3,
//     name: "The Final Enigma",
//     starts_at: "2026-01-02T12:00:00Z",
//     ends_at: "2026-01-20T23:59:00Z",
//     image: "https://cdn-icons-png.flaticon.com/512/6062/6062644.png",
//   },
//   {
//     id: 1,
//     name: "The Vanishing Cipher",
//     starts_at: "2025-11-01T10:00:00Z",
//     ends_at: "2025-11-10T18:00:00Z",
//     image: "https://cdn-icons-png.flaticon.com/512/476/476863.png",
//   },

// ]

declare global {
  interface Window {
    imageAPI: typeof imageAPI;
    mysteryAPI: typeof mysteryAPI;
  }
}

export const Home: React.FC<HomeProps> = () => {
  const [isComplete, setIsComplete] = useState(false);
  const navigate = useNavigate();
  const [mysteries,setmysteries] = useState<Mystery[]>([]);
  const {user} = useAuth();
  const { toast } = useToast();


  window.imageAPI = imageAPI;
  window.mysteryAPI = mysteryAPI;
  const token = localStorage.getItem("token") || "";

  const join_mystery = async (mystery: Mystery, pin: string) => {
    try {
      // Send request
      const response = await mysteryAPI.joinMystery(mystery.id, pin, token);

      // Show success toast with backend message
      toast({
        title: "✅ Joined Successfully",
        description: response.message || "You have successfully joined the mystery.",
        variant: "default", // optional
      });

      console.log("Joined mystery successfully");
    } catch (error: any) {
      console.error("Error joining mystery:", error);

      // Handle failed join attempt
      toast({
        title: "❌ Joining Failed",
        description:
          error instanceof Error
            ? error.message
            : "Please check your PIN and try again.",
        variant: "destructive",
      });
    }
  };


  React.useEffect(() => {
    const get_mysteries = async () => {
      try {
        const mysteries = await mysteryAPI.getMysteries(token);
        console.log("Fetched mysteries:", mysteries);
        setmysteries(mysteries);
      } catch (error) {
        console.error("Error fetching mysteries:", error);
      } 
    };

    get_mysteries();
  }, []);

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
          <CardZoomGroup samples={mysteries}  loading={false} onSubmit={join_mystery}/>
        </div>
        
        <div className="bottom">
        </div>
      </main>
    </div>
  );
};
