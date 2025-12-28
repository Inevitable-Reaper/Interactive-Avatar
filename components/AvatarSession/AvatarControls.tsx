import React from "react";
import { Button } from "@nextui-org/react";

// Icons (Simple SVGs for Mic)
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
);
const MicOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
);

interface AvatarControlsProps {
  isUserTalking: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export const AvatarControls: React.FC<AvatarControlsProps> = ({ 
  isUserTalking, 
  onStartRecording, 
  onStopRecording 
}) => {
  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        isIconOnly
        variant={isUserTalking ? "solid" : "bordered"}
        color={isUserTalking ? "danger" : "default"}
        size="lg"
        className="rounded-full w-16 h-16"
        onPress={isUserTalking ? onStopRecording : onStartRecording}
      >
        {isUserTalking ? <MicOffIcon /> : <MicIcon />}
      </Button>
      <span className="text-sm font-medium text-zinc-300">
        {isUserTalking ? "Listening..." : "Click to Speak"}
      </span>
    </div>
  );
};