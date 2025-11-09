import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import CardZoomGroup from '@/components/home/CardZoomGroup';
import { imageAPI, mysteryAPI, Mystery } from '@/lib/api';

interface HomeProps {}

declare global {
  interface Window {
    imageAPI: typeof imageAPI;
    mysteryAPI: typeof mysteryAPI;
  }
}

export const Home: React.FC<HomeProps> = () => {
  const [Mysteries, setMysteries] = useState<Mystery[]>([]);
  const [JoinedMysteries, setJoinedMysteries] = useState<Mystery[]>([]);
  const [showJoined, setShowJoined] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const token = localStorage.getItem('token') || '';

  // Expose API for debugging (optional)
  window.imageAPI = imageAPI;
  window.mysteryAPI = mysteryAPI;

  const handleNavigate = (mystery: Mystery) => {
    if (mystery.join_status === true) {
      navigate('/game', { state: { mystery_id: mystery.id } });
    }
  };

  const join_mystery = async (mystery: Mystery, pin: string) => {
    try {
      const response = await mysteryAPI.joinMystery(mystery.id, pin, token);

      toast({
        title: '✅ Joined Successfully',
        description: response.message || 'You have successfully joined the mystery.',
        variant: 'default',
      });

      // Refresh joined mysteries
      fetchJoinedMysteries();

      navigate('/game', { state: { mystery_id: mystery.id } });
    } catch (error: any) {
      toast({
        title: '❌ Joining Failed',
        description: error instanceof Error ? error.message : 'Please check your PIN and try again.',
        variant: 'destructive',
      });
    }
  };

  // Fetch all visible mysteries
  const fetchMysteries = async () => {
    try {
      const mysteries = await mysteryAPI.getMysteries(token, 'false'); // visible only
      setMysteries(mysteries);
    } catch (error) {
      console.error('Error fetching mysteries:', error);
    }
  };

  // Fetch joined mysteries
  const fetchJoinedMysteries = async () => {
    try {
      const joined = await mysteryAPI.getMysteries(token, 'true'); // joined=true
      setJoinedMysteries(joined);
      console.log("Joined Mysteries:", joined);
    } catch (error) {
      console.error('Error fetching joined mysteries:', error);
    }
  };

  useEffect(() => {
    fetchMysteries();
    fetchJoinedMysteries();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* All Mysteries Header + Toggle Button */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            All Mysteries
          </h1>
          <button
            className="px-4 py-2 bg-primary text-white rounded hover:bg-accent transition"
            onClick={() => setShowJoined(!showJoined)}
          >
            {showJoined ? 'Hide Joined Mysteries' : 'Show Joined Mysteries'}
          </button>
        </div>

        {/* All Mysteries Grid */}
        <CardZoomGroup
          samples={Mysteries}
          loading={false}
          onSubmit={join_mystery}
          onClick={handleNavigate}
        />

        {/* Joined Mysteries Section */}
        {showJoined && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Joined Mysteries</h2>
            {JoinedMysteries.length > 0 ? (
              <CardZoomGroup
                samples={JoinedMysteries}
                loading={false}
                onSubmit={join_mystery}
                onClick={handleNavigate}
              />
            ) : (
              <p>No joined mysteries yet.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
