import React, { useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";

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

  // 🔍 Track parent width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 💡 Calculate skeleton count based on width
  const skeletonCount = Math.max(1, Math.floor(containerWidth / 220));

  return (
    <Wrapper ref={containerRef}>
      {loading
        ? Array.from({ length: skeletonCount }).map((_, i) => (
            <SkeletonCard key={i} />
          ))
        : samples.map((mystery) => (
            <Card key={mystery.id} onClick={() => onClick?.(mystery)}>
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
  );
};

/* ---------- Styled Components ---------- */

const Wrapper = styled.div`
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  padding: 1%;
`;

/* ✅ Card — now theme aware via Tailwind CSS variables */
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

  .textBox > .text {
    font-weight: bold;
    color: hsl(var(--foreground));
  }

  .textBox > .head {
    font-size: 18px;
  }

  .textBox > .price {
    font-size: 15px;
    color: hsl(var(--muted-foreground));
  }

  .textBox > span {
    font-size: 13px;
    color: hsl(var(--muted-foreground));
  }

  &:hover > .textBox {
    opacity: 1;
  }

  &:hover > .img {
    height: 65%;
    filter: blur(6px);
    animation: floatAnim 3s infinite;
  }

  &:active {
    transform: scale(1.02);
    filter: brightness(0.9);
  }

  @keyframes floatAnim {
    0% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-15px);
    }
    100% {
      transform: translateY(0);
    }
  }
`;

/* 💫 Skeleton Loading */
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
