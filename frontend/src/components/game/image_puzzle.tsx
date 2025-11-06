import React, { useEffect, useState } from "react";
import { JigsawPuzzle } from "react-jigsaw-puzzle/lib";
import "react-jigsaw-puzzle/lib/jigsaw-puzzle.css";

interface MyPuzzleProps {
  questionImage: string;
  onSolved: () => void;
  rows?: number;
  columns?: number;
}

const MyPuzzle: React.FC<MyPuzzleProps> = ({
  questionImage,
  onSolved,
  rows = 3,
  columns = 3,
}) => {
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });

  useEffect(() => {
    const updateSize = () => {
      const containerWidth = Math.min(window.innerWidth - 40, 800); // keep some margin, cap max 800px
      const containerHeight = window.innerHeight * 0.6; // allow up to 60% of screen height

      const img = new Image();
      img.src = questionImage;
      img.onload = () => {
        const widthRatio = containerWidth / img.width;
        const heightRatio = containerHeight / img.height;
        const ratio = Math.min(widthRatio, heightRatio, 1); // never upscale

        setDimensions({
          width: img.width * ratio,
          height: img.height * ratio,
        });
      };
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [questionImage]);

  // Prevent mobile scroll while dragging
  useEffect(() => {
    const container = document.getElementById("puzzle-container");
    if (!container) return;
    const handleTouchMove = (e: TouchEvent) => e.preventDefault();
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => container.removeEventListener("touchmove", handleTouchMove);
  }, []);

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex justify-center">
        <div
          id="puzzle-container"
          className="border-4 rounded-lg shadow-md"
          style={{
            borderColor: "#FFD700",
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            touchAction: "none",
            overflow: "hidden",
          }}
        >
          <JigsawPuzzle
            imageSrc={questionImage}
            rows={rows}
            columns={columns}
            onSolved={onSolved}
          />
        </div>
      </div>
    </div>
  );
};

export default MyPuzzle;
