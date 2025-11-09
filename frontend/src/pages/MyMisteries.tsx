import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { selfMysteries , Mystery } from "@/lib/api";



const BASE_URL = "http://localhost:8000"; // change to your backend base URL

const MyMysteries: React.FC = () => {
  const [mysteries, setMysteries] = useState<Mystery[]>([]);
  const navigate = useNavigate();

  const token = localStorage.getItem("token"); // assuming JWT stored here

  useEffect(() => {
    const fetchMysteries = async () => {
      try {
        const data = await selfMysteries.getSelfMysteries(token || "");
        setMysteries(data);
      } catch (err) {
        console.error("Failed to fetch mysteries", err);
      }

    };
    fetchMysteries();
  }, [token]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Mysteries</h1>
        <Button onClick={() => navigate("/mysteries/create")}>+ Create Mystery</Button>
        
        {/* //navigate('/game', { state: { mystery_id: mystery.id } }); */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mysteries.map((mystery) => (
          <Card
            key={mystery.id}
            className="cursor-pointer hover:shadow-lg transition"
            onClick={() =>  navigate("/mysteries/edit", { state: { mystery_id: mystery.id } })}
          >
            <CardHeader>
              <CardTitle>{mystery.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/mysteries/edit", { state: { mystery_id: mystery.id } })}>Edit</Button>
              <p>{mystery.description}</p>
              {/* <p className="text-sm text-gray-500 mt-2">Difficulty: {mystery.difficulty}</p> */}
              {/* <p className="text-sm text-gray-400">Created: {new Date(mystery.created_at).toLocaleDateString()}</p> */}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MyMysteries;
