import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SecureImage from "../game/SecureImage";
import { Mystery } from "@/lib/api";
import { on } from "events";

interface CardZoomGroupProps {
  samples: Mystery[];
  loading?: boolean;
  onSubmit?: (mystery: Mystery, pin: string) => void;
  onClick?: (mystery: Mystery) => void;
}

const CardZoomGroup: React.FC<CardZoomGroupProps> = ({
  samples,
  loading = false,
  onSubmit,
  onClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCard, setActiveCard] = useState<Mystery | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [pin, setPin] = useState("");
  const [manualJoin, setManualJoin] = useState(false);
  const [manualId, setManualId] = useState("");
  const [manualPin, setManualPin] = useState("");

  const token = localStorage.getItem("token") || "";

  const handleCardClick = (mystery: Mystery) => {
    onClick?.(mystery);
    setActiveCard(mystery);
    setTimeout(() => setIsFlipped(true), 500);
  };

  const handleClose = () => {
    setIsFlipped(false);
    setTimeout(() => setActiveCard(null), 300);
    setPin("");
  };

  const handleManualJoin = () => {
    if (manualId && manualPin)
      onSubmit?.({ id: Number(manualId), name: "", starts_at: "", ends_at: "", image: "" } as Mystery, manualPin);
  };

  return (
    <>
      {/* Cards */}
      <div ref={containerRef} className="flex flex-wrap gap-5 p-4 justify-center">
        {/* Join Hidden Mystery Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setManualJoin(true)}
          className="w-52 h-72 flex items-center justify-center rounded-2xl border-2 border-dashed border-primary cursor-pointer text-center text-primary font-semibold hover:bg-primary/10 transition"
        >
          <p>Join Hidden Mystery</p>
        </motion.div>

        {/* Mystery Cards */}
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="w-52 h-72 rounded-2xl animate-pulse bg-gradient-to-r from-muted to-card shadow"
              />
            ))
          : samples.map((mystery) => (
              <motion.div
                key={mystery.id}
                whileHover={{ scale: 1.05, rotate: -1 }}
                className="relative w-52 h-72 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition cursor-pointer"
                onClick={() => handleCardClick(mystery)}
              >
                {mystery.image ? (
                  <SecureImage
                    image_url={mystery.image}
                    token={token}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-110 hover:blur-sm"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted text-foreground text-sm">
                    No Image Available
                  </div>
                )}

                {/* Dark gradient overlay */}
                <div className="absolute bottom-0 w-full py-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-center text-white">
                  <p className="font-semibold text-base">{mystery.name}</p>
                  <p className="text-xs opacity-90">
                    Open: {new Date(mystery.starts_at).toLocaleDateString()} –{" "}
                    {new Date(mystery.ends_at).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
      </div>

      {/* Overlay */}
      <AnimatePresence>
        {(activeCard || manualJoin) && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              handleClose();
              setManualJoin(false);
            }}
          >
            {/* Join Modal */}
            <motion.div
              className="relative bg-card text-card-foreground rounded-2xl shadow-xl w-80 p-6 flex flex-col items-center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Card Image */}
              {activeCard && (
                <>
                  {activeCard.image ? (
                    <SecureImage
                      image_url={activeCard.image}
                      token={token}
                      className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-30 blur-sm"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-muted opacity-30 rounded-2xl" />
                  )}
                  <h2 className="text-lg font-bold text-center z-10 mb-2">
                    Join Mystery: {activeCard.name}
                  </h2>
                  <p className="text-sm z-10 mb-4 text-center">
                    Starts: {new Date(activeCard.starts_at).toLocaleDateString()}
                    <br />
                    Ends: {new Date(activeCard.ends_at).toLocaleDateString()}
                  </p>
                  <input
                    type="text"
                    placeholder="Enter Joining Pin"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="z-10 w-3/4 rounded-lg p-2 border border-border bg-muted text-foreground mb-3"
                  />
                  <button
                    onClick={() => {
                      onSubmit?.(activeCard, pin);
                      handleClose();
                    }}
                    className="z-10 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:scale-105 transition"
                  >
                    Join
                  </button>
                </>
              )}

              {/* Manual Join */}
              {manualJoin && (
                <>
                  <h2 className="text-lg font-bold mb-4">Join Hidden Mystery</h2>
                  <input
                    type="text"
                    placeholder="Mystery ID"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    className="w-3/4 rounded-lg p-2 border border-border bg-muted text-foreground mb-3"
                  />
                  <input
                    type="text"
                    placeholder="Joining Pin"
                    value={manualPin}
                    onChange={(e) => setManualPin(e.target.value)}
                    className="w-3/4 rounded-lg p-2 border border-border bg-muted text-foreground mb-3"
                  />
                  <button
                    onClick={handleManualJoin}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:scale-105 transition"
                  >
                    Join
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CardZoomGroup;
