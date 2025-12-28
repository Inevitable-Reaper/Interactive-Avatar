import React, { useEffect, useRef } from "react";

interface AvatarVideoProps {
  src: MediaStream | undefined;
}

export const AvatarVideo: React.FC<AvatarVideoProps> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && src) {
      videoElement.srcObject = src;
      // AbortError fix: Catch the promise rejection silently
      videoElement.play().catch((e) => {
         // This is common when the stream changes rapidly, we can ignore it
         console.log("Video play interrupted (safe to ignore):", e);
      });
    }
  }, [src]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black rounded-lg overflow-hidden">
      {src ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain", // Ensures video fits without stretching
          }}
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-zinc-500">
             <div className="w-8 h-8 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin"></div>
             <p className="text-sm">Connecting...</p>
        </div>
      )}
    </div>
  );
};