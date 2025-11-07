import React, { useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";

/* ---------- Types ---------- */
interface Mystery {
  id: number;
  name: string;
  starts_at: string;
  ends_at: string;
  logo: string;
}

interface CardZoomGroupProps {
  samples: Mystery[];
  loading?: boolean;
  onClick?: (mystery: Mystery) => void;
}

/* ---------- Component ---------- */
const CardZoomGroup: React.FC<CardZoomGroupProps> = ({
  samples,
  loading = false,
  onClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeCard, setActiveCard] = useState<Mystery | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const skeletonCount = Math.max(1, Math.floor(containerWidth / 220));

  const handleCardClick = (mystery: Mystery) => {
    setActiveCard(mystery);
    setTimeout(() => setIsFlipped(true), 300);
  };

  const handleClose = () => {
    setIsFlipped(false);
    setTimeout(() => setActiveCard(null), 400);
    setPin("");
  };

  return (
    <>
      <Wrapper ref={containerRef}>
        {loading
          ? Array.from({ length: skeletonCount }).map((_, i) => (
              <SkeletonCard key={i} />
            ))
          : samples.map((mystery) => (
              <Card key={mystery.id} onClick={() => handleCardClick(mystery)}>
                <img src={mystery.logo} alt={mystery.name} className="img" />
                <div className="textBox">
                  <p className="text head">{mystery.name}</p>
                  <span>
                    Starts: {new Date(mystery.starts_at).toLocaleDateString()}
                  </span>
                  <p className="text price">
                    Ends: {new Date(mystery.ends_at).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))}
      </Wrapper>

      <AnimatePresence>
        {activeCard && (
          <Overlay
            as={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3 } }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            onClick={handleClose}
          >
            <ZoomedCardWrapper
              as={motion.div}
              initial={{ scale: 0.4, opacity: 0, rotateX: -10 }}
              animate={{
                scale: 1,
                opacity: 1,
                rotateX: 0,
                transition: {
                  type: "spring",
                  stiffness: 120,
                  damping: 14,
                },
              }}
              exit={{
                scale: 0.5,
                opacity: 0,
                rotateX: 10,
                transition: { duration: 0.35, ease: "easeInOut" },
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <ZoomedCard className={isFlipped ? "flipped" : ""}>
                {/* Front */}
                <div className="card-face front">
                  <img src={activeCard.logo} alt={activeCard.name} />
                  <h2>{activeCard.name}</h2>
                </div>

                {/* Back */}
                <div className="card-face back">
                  <h3>Join Mystery: {activeCard.name}</h3>
                  <p>
                    Starts:{" "}
                    {new Date(activeCard.starts_at).toLocaleDateString()} <br />
                    Ends: {new Date(activeCard.ends_at).toLocaleDateString()}
                  </p>
                  <input
                    type="text"
                    placeholder="Enter Joining Pin"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      onClick?.(activeCard);
                      console.log("Joining with pin:", pin);
                      handleClose();
                    }}
                  >
                    Join
                  </button>
                </div>
              </ZoomedCard>
            </ZoomedCardWrapper>
          </Overlay>
        )}
      </AnimatePresence>
    </>
  );
};

/* ---------- Styled Components ---------- */

const Wrapper = styled.div`
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  // justify-content: center;
  align-items: center;
  padding: 1%;
`;

const Card = styled.div`
  overflow: hidden;
  position: relative;
  width: 200px;
  height: 290px;
  background: hsl(var(--card));
  color: hsl(var(--card-foreground));
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: 0.25s ease-in-out;
  cursor: pointer;
  box-shadow: 0 0 12px hsl(var(--border) / 0.2);

  &:hover {
    transform: scale(1.05) rotate(-1deg);
    box-shadow: 0 0 20px hsl(var(--primary) / 0.3);
  }

  .img {
    height: 30%;
    width: auto;
    object-fit: contain;
    position: absolute;
    transition: 0.3s ease-in-out;
    z-index: 1;
    pointer-events: none;
  }

  .textBox {
    opacity: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: opacity 0.3s ease-in-out;
    z-index: 2;
    text-align: center;
  }

  &:hover > .textBox {
    opacity: 1;
  }

  &:hover > .img {
    height: 65%;
    filter: blur(6px);
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: hsl(var(--background) / 0.7);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
`;

const ZoomedCardWrapper = styled.div`
  perspective: 1200px;
`;

const ZoomedCard = styled.div`
  position: relative;
  width: 300px;
  height: 420px;
  transform-style: preserve-3d;
  transition: transform 0.8s ease;
  border-radius: 20px;

  &.flipped {
    transform: rotateY(180deg);
  }

  .card-face {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    border-radius: 20px;
    background: hsl(var(--card));
    color: hsl(var(--card-foreground));
    box-shadow: 0 0 25px hsl(var(--border) / 0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 15px;
    padding: 20px;
  }

  .front img {
    width: 60%;
    height: auto;
  }

  .back {
    transform: rotateY(180deg);
  }

  .back input {
    padding: 8px 12px;
    border-radius: 10px;
    border: 1px solid hsl(var(--border));
    background: hsl(var(--muted));
    color: hsl(var(--foreground));
    width: 80%;
  }

  .back button {
    margin-top: 10px;
    background: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    padding: 8px 16px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    transition: 0.2s ease;
  }

  .back button:hover {
    opacity: 0.9;
    transform: scale(1.05);
  }
`;

/* ---------- Skeleton ---------- */
const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`;

const SkeletonCard = styled.div`
  width: 200px;
  height: 290px;
  border-radius: 20px;
  background: linear-gradient(
    90deg,
    hsl(var(--muted)) 25%,
    hsl(var(--card)) 50%,
    hsl(var(--muted)) 75%
  );
  background-size: 400% 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;
  box-shadow: 0 0 12px hsl(var(--border) / 0.2);
`;

export default CardZoomGroup;
