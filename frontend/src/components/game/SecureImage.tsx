import React, { useEffect, useState, useRef } from "react";
import { imageAPI } from "@/lib/api";

interface SecureImageProps {
  image_url?: string | null; // updated to allow null
  token: string;
  className?: string;
  onImageFetched?: (url: string) => void;
}

// In-memory blob cache
const blobCache: Record<string, Blob> = {};

const SecureImage: React.FC<SecureImageProps> = ({
  image_url,
  token,
  className,
  onImageFetched,
}) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isMounted = useRef(true);

  // Early return if no image_url
  if (!image_url) {
    return <div className="text-center text-red-500">❌ No image provided</div>;
  }

  // Extract image ID (Google Drive or normal)
  const imageId =
    image_url.includes("google")
      ? image_url.match(/id=([^&]+)/)?.[1] || image_url
      : image_url;

  useEffect(() => {
    isMounted.current = true;
    setLoading(true);
    setError("");

    let objectUrl: string | null = null;

    const fetchImage = async () => {
      try {
        let blob: Blob;

        if (blobCache[imageId]) {
          blob = blobCache[imageId]; // reuse cached blob
        } else {
          blob = await imageAPI.getSecureImage(imageId, token); // fetch blob
          blobCache[imageId] = blob; // cache it
        }

        objectUrl = URL.createObjectURL(blob); // create URL here

        if (isMounted.current) {
          setImageUrl(objectUrl);
          onImageFetched?.(objectUrl);
        }
      } catch (err: any) {
        console.error("❌ Error fetching secure image:", err);
        if (isMounted.current) setError(err.message || "Failed to load image");
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    fetchImage();

    return () => {
      isMounted.current = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl); // cleanup
    };
  }, [imageId, token, onImageFetched]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
      </div>
    );

  if (error)
    return (
      <div className="text-center text-red-500">❌ Error: {error}</div>
    );

  return (
    <img
      src={imageUrl}
      alt="Present"
      className={`max-w-full h-auto rounded-lg shadow-lg mx-auto ${className || ""}`}
      style={{ maxHeight: "800px" }}
      onError={() => setError("Failed to display image")}
    />
  );
};

export default SecureImage;
