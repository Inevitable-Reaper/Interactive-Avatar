"use client";

import type { StartAvatarResponse } from "@heygen/streaming-avatar";
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskMode,
  TaskType,
} from "@heygen/streaming-avatar";
import {
  Button,
  Spinner,
  Tooltip,
} from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import { MicIcon, MicOffIcon, CloseIcon } from "./Icons";

const PlayIcon = ({ size = 24, fill = "currentColor", ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M5 3L19 12L5 21V3Z" fill={fill} stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function InteractiveAvatar() {
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [stream, setStream] = useState<MediaStream>();
  const [data, setData] = useState<StartAvatarResponse>();
  
  const [language, setLanguage] = useState<string>("en"); 

  const [isMicOn, setIsMicOn] = useState(false);
  // FIX: Ref to track mic state immediately inside Event Listeners
  const isMicOnRef = useRef(false); 

  const [isAvatarTalking, setIsAvatarTalking] = useState(false);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>("");

  const mediaStream = useRef<HTMLVideoElement>(null);
  const avatar = useRef<StreamingAvatar | null>(null);
  const recognition = useRef<any>(null); 

  // 1. Sync Ref with State
  useEffect(() => {
    isMicOnRef.current = isMicOn;
  }, [isMicOn]);

  // 2. Initial Setup
  useEffect(() => {
    async function fetchAudioDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        setAudioDevices(audioInputs);
        if (audioInputs.length > 0) {
          setSelectedAudioDeviceId(audioInputs[0].deviceId);
        }
      } catch (error) {
        console.error("Error fetching audio devices:", error);
      }
    }
    fetchAudioDevices();
  }, []);

  // 3. Custom Brain Logic
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognition.current = new SpeechRecognition();
        recognition.current.lang = 'ar-SA'; // Arabic listening
        recognition.current.continuous = false;
        recognition.current.interimResults = false;

        recognition.current.onresult = async (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript && transcript.trim() !== "") {
             console.log("User said:", transcript);
             recognition.current.stop();
             await handleBrainProcess(transcript);
          }
        };

        recognition.current.onerror = (event: any) => {
            console.error("Speech Recognition Error:", event.error);
            // Don't turn off UI state, just stop internal engine if fatal
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                setIsMicOn(false);
            }
        };
        
        recognition.current.onend = () => {
            // We rely on Avatar events to restart, 
            // but if avatar never starts (error), we might get stuck.
            // For now, let's trust the flow.
        };
      }
    }
  }, []);

  async function handleBrainProcess(text: string) {
    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });
        
        if (!response.ok) {
            console.error("OpenAI API Error:", response.statusText);
            // If error, restart mic so user can try again
            if (isMicOnRef.current && recognition.current) {
                try { recognition.current.start(); } catch(e) {}
            }
            return;
        }

        const data = await response.json();
        const aiReply = data.reply;

        if (aiReply && avatar.current) {
            console.log("AI Reply (Arabic):", aiReply);
            await avatar.current.speak({
                text: aiReply,
                taskType: TaskType.REPEAT, 
                taskMode: TaskMode.SYNC 
            });
        } else {
             // If no reply, restart mic
             if (isMicOnRef.current && recognition.current) {
                try { recognition.current.start(); } catch(e) {}
            }
        }
    } catch (error) {
        console.error("Error connecting to OpenAI brain:", error);
        // Restart mic on error
        if (isMicOnRef.current && recognition.current) {
            try { recognition.current.start(); } catch(e) {}
        }
    }
  }

  async function fetchAccessToken() {
    try {
      const response = await fetch("/api/get-access-token", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to fetch token");
      return await response.text();
    } catch (error) {
      console.error("Error fetching access token:", error);
      return "";
    }
  }

  async function startSession() {
    setIsLoadingSession(true);
    const newToken = await fetchAccessToken();

    if (!newToken) {
        setIsLoadingSession(false);
        return;
    }

    avatar.current = new StreamingAvatar({
      token: newToken,
    });

    // --- EVENT LISTENERS (Now using Ref for Mic State) ---
    
    avatar.current.on(StreamingEvents.AVATAR_START_TALKING, () => {
      setIsAvatarTalking(true);
      // Ensure mic is stopped while avatar talks
      if (recognition.current) recognition.current.stop(); 
    });

    avatar.current.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
      setIsAvatarTalking(false);
      
      // FIX: Check isMicOnRef.current instead of isMicOn variable
      console.log("Avatar stopped. Mic state is:", isMicOnRef.current);
      
      if (isMicOnRef.current && recognition.current) {
        setTimeout(() => {
            try { 
                recognition.current.start(); 
                console.log("Mic restarted automatically.");
            } catch(e) {
                console.log("Mic already running or error:", e);
            }
        }, 200); // Small delay to avoid conflict
      }
    });

    avatar.current.on(StreamingEvents.STREAM_DISCONNECTED, endSession);
    avatar.current.on(StreamingEvents.STREAM_READY, (event) => setStream(event.detail));

    try {
      const res = await avatar.current.createStartAvatar({
        quality: AvatarQuality.Low, 
        avatarName: "Katya_Pink_Suit_public", 
        disableIdleTimeout: true,
      });

      setData(res);
      setIsLoadingSession(false);
    } catch (error) {
      console.error("Error starting avatar session:", error);
      setIsLoadingSession(false);
      alert("Failed to start avatar. Check console.");
    }
  }

  async function endSession() {
    if (recognition.current) recognition.current.stop();
    await avatar.current?.stopAvatar();
    setStream(undefined);
    setIsMicOn(false);
  }

  function toggleMic() {
    if (!recognition.current) {
        alert("Microphone not supported in this browser.");
        return;
    }

    if (isMicOn) {
      recognition.current.stop();
      setIsMicOn(false);
    } else {
      try {
        recognition.current.start();
        setIsMicOn(true);
      } catch (e) {
        console.error("Could not start recognition:", e);
      }
    }
  }

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play();
      };
    }
  }, [stream]);

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative flex flex-col items-center justify-center">
      
      <div className="absolute inset-0 w-full h-full">
        {stream ? (
          <video
            ref={mediaStream}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          >
            <track kind="captions" />
          </video>
        ) : (
          /* YAHAN CHANGE KIYA HAI: Image hata kar plain black background kar diya */
          <div className="w-full h-full bg-black flex items-center justify-center">
             <div className="text-white text-2xl font-bold">
                {isLoadingSession ? "Initializing..." : "Ready"}
             </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-10 z-50 flex flex-col items-center gap-4 w-full px-4">
        
        <div className="flex items-center justify-center gap-8 bg-black/40 backdrop-blur-md p-4 rounded-full border border-white/10 shadow-2xl">
          
          {!stream ? (
            <Button
              isIconOnly
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg hover:scale-105 transition-transform"
              onClick={startSession}
              isLoading={isLoadingSession}
            >
              {!isLoadingSession && <PlayIcon size={32} fill="white" />}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
                <Button
                    isIconOnly
                    className={`w-14 h-14 rounded-full transition-all ${
                        isMicOn ? "bg-red-500 animate-pulse text-white" : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                    onClick={toggleMic}
                    isDisabled={isAvatarTalking} 
                >
                    {isMicOn ? <MicIcon size={24} /> : <MicOffIcon size={24} />}
                </Button>
            </div>
          )}

          <Button
            isIconOnly
            className={`w-14 h-14 rounded-full border-2 ${
                stream 
                ? "bg-red-500/20 border-red-500 text-red-500 hover:bg-red-500 hover:text-white cursor-pointer" 
                : "bg-white/5 border-white/10 text-white/20 cursor-not-allowed"
            }`}
            onClick={endSession}
            disabled={!stream}
          >
            <CloseIcon size={28} />
          </Button>

        </div>
      </div>
    </div>
  );
}