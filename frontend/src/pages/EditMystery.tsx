import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { selfMysteries, MysteryDetail } from "@/lib/api";
import { Loader2, Calendar, Layers, Gift, HelpCircle } from "lucide-react";
import SecureImage from "@/components/game/SecureImage";

const EditMystery: React.FC = () => {
  const location = useLocation();
  const mysteryId = location.state?.mystery_id || null;
  const token = localStorage.getItem("token") || "";

  const [mystery, setMystery] = useState<MysteryDetail | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMystery = async () => {
      try {
        setLoading(true);
        const data = await selfMysteries.getMysteryById(mysteryId, token);
        setMystery(data);
        if (data.levels.length > 0) setSelectedLevel(data.levels[0].id);
      } catch (err: any) {
        setError(err.message || "Failed to load mystery details");
      } finally {
        setLoading(false);
      }
    };
    if (mysteryId) fetchMystery();
  }, [mysteryId, token]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        <Loader2 className="animate-spin w-6 h-6 mr-2" /> Loading mystery details...
      </div>
    );

  if (error)
    return (
      <div className="text-red-500 text-center mt-20 font-semibold">
        {error}
      </div>
    );

  if (!mystery) return null;

  const currentLevel = mystery.levels.find((lvl) => lvl.id === selectedLevel);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* ===== HEADER ===== */}
      <header className="bg-white shadow-sm border-b border-gray-200 p-6 flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">{mystery.name}</h1>
          <p className="text-gray-600 max-w-2xl">{mystery.description}</p>
          <div className="flex items-center text-sm text-gray-500 mt-2">
            <Calendar className="w-4 h-4 mr-1" />
            {new Date(mystery.starts_at).toLocaleString()} →{" "}
            {new Date(mystery.ends_at).toLocaleString()}
          </div>
        </div>
        {mystery.image && (
          <div className="w-28 h-28 rounded-xl overflow-hidden border">
            <SecureImage image_url={mystery.image} token={token} />
          </div>
        )}
      </header>

      {/* ===== MAIN BODY ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* === Sidebar for Levels === */}
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50">
            <Layers className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-800">Levels</h2>
          </div>

          <ul className="divide-y divide-gray-100">
            {mystery.levels.map((level) => (
              <li
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                className={`cursor-pointer px-4 py-3 hover:bg-gray-100 transition-all ${
                  selectedLevel === level.id
                    ? "bg-indigo-50 text-indigo-700 font-semibold border-l-4 border-indigo-600"
                    : "text-gray-700"
                }`}
              >
                {level.name}
              </li>
            ))}
          </ul>
        </aside>

        {/* === Level Content === */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8">
          {currentLevel ? (
            <>
              {/* 🎁 Present Section */}
              {currentLevel.present && (
                <div className="bg-white shadow-sm rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Gift className="w-5 h-5 text-pink-500" />
                    <h3 className="text-xl font-semibold">
                      Present: {currentLevel.present.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-3">
                    {currentLevel.present.content}
                  </p>
                  {currentLevel.present.image && (
                    <div className="mt-3 w-48 rounded-lg overflow-hidden border">
                      <SecureImage
                        image_url={currentLevel.present.image}
                        token={token}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 🧩 Questions Section */}
              <div className="bg-white shadow-sm rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-xl font-semibold">Questions</h3>
                </div>

                {currentLevel.questions.length > 0 ? (
                  <div className="space-y-5">
                    {currentLevel.questions.map((q) => (
                      <div
                        key={q.id}
                        className="border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-all"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold text-gray-800">
                            {q.question}
                          </h4>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md uppercase">
                            {q.type}
                          </span>
                        </div>

                        {q.questionImage && (
                          <div className="mt-3 w-64 rounded-lg overflow-hidden border">
                            <SecureImage
                              image_url={q.questionImage}
                              token={token}
                            />
                          </div>
                        )}

                        {q.answers && q.answers.length > 0 ? (
                          <div className="mt-4">
                            <p className="font-medium text-gray-700">
                              Possible Answers:
                            </p>
                            <ul className="list-disc ml-6 text-sm text-gray-600 space-y-1 mt-1">
                              {q.answers.map((ans) => (
                                <li key={ans.id}>{ans.text}</li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p className="text-gray-400 italic text-sm mt-3">
                            No answers yet.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    No questions added for this level yet.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Layers className="w-8 h-8 mb-3 text-gray-400" />
              <p>Select a level to view its content.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default EditMystery;
