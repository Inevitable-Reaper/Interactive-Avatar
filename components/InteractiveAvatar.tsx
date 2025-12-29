"use client";

import {
  AvatarQuality,
  VoiceChatTransport,
  VoiceEmotion,
  StartAvatarRequest,
  STTProvider,
  ElevenLabsModel,
} from "@heygen/streaming-avatar";
import { useEffect, useRef, useState } from "react";
import { useMemoizedFn, useUnmount } from "ahooks";
import { Button, Input, Tabs, Tab } from "@nextui-org/react";

// Components
import AvatarConfig from "./AvatarConfig";
import { AvatarVideo } from "./AvatarSession/AvatarVideo";
import { MessageHistory } from "./AvatarSession/MessageHistory"; 
import { useStreamingAvatarSession } from "./logic/useStreamingAvatarSession";
import { useVoiceChat } from "./logic/useVoiceChat";
import { StreamingAvatarProvider, StreamingAvatarSessionState } from "./logic"; 
import { AVATARS } from "@/app/lib/constants";

function InteractiveAvatarContent() {
  const { startAvatar, stopAvatar, sessionState, stream, isUserTalking } =
    useStreamingAvatarSession();
  
  const { startVoiceChat, stopVoiceChat, isVoiceChatActive } = useVoiceChat();
  
  const [config, setConfig] = useState<StartAvatarRequest>({
    quality: AvatarQuality.Low,
    avatarName: AVATARS[0].avatar_id,
    knowledgeId: undefined, // Or "" if undefined throws error, but usually undefined is fine
    voice: {
      rate: 1.5,
      // emotion: VoiceEmotion.EXCITED, // <--- IS LINE KO COMMENT KAR DO YA HATA DO
      model: ElevenLabsModel.eleven_flash_v2_5,
    },
    language: "en", // Ye initial hai, jab tum Arabic select karoge to 'ar' jayega
    voiceChatTransport: VoiceChatTransport.WEBSOCKET,
    sttSettings: {
        provider: STTProvider.DEEPGRAM,
    },
});

  const [text, setText] = useState("");
  const [chatMode, setChatMode] = useState("text_mode");

  async function fetchAccessToken() {
    try {
      const response = await fetch("/api/get-access-token", { method: "POST" });
      return await response.text();
    } catch (error) {
      console.error("Error fetching token:", error);
      return "";
    }
  }

  const handleStartSession = useMemoizedFn(async () => {
    try {
      // 1. Token lao
      const token = await fetchAccessToken();
      if (!token) {
        alert("Access Token nahi mila! .env file check karo.");
        return;
      }

      // 2. Avatar start karo
      await startAvatar(config, token);
      
    } catch (error) {
      console.error("Start Session Error:", error);
      // Agar 400 error aaye, toh user ko batao
      alert("Error starting session! Console (F12) check karo details ke liye.");
    }
  });

  const handleEndSession = useMemoizedFn(async () => {
    await stopAvatar();
  });

  // Toggle Voice Chat properly
  const handleVoiceToggle = () => {
     if (isVoiceChatActive) {
         stopVoiceChat();
     } else {
         startVoiceChat(); 
     }
  };

  // --- RENDER: SETTINGS PAGE ---
  if (sessionState === StreamingAvatarSessionState.INACTIVE || !stream) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black p-4 overflow-hidden">
        <div className="w-full max-w-4xl h-[90vh] bg-zinc-900/50 rounded-2xl border border-zinc-800 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col">
           <div className="p-6 border-b border-zinc-800 shrink-0">
             <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
               Avatar Settings
             </h2>
             <p className="text-zinc-400 text-sm mt-1">Configure your session settings.</p>
           </div>
           
           {/* Scrollable Settings Area */}
           <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <AvatarConfig config={config} onConfigChange={setConfig} />
           </div>
           
           <div className="p-6 border-t border-zinc-800 bg-zinc-900/80 shrink-0">
             <Button
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-lg py-4 rounded-xl shadow-lg"
                size="lg"
                onPress={handleStartSession}
                isLoading={sessionState === StreamingAvatarSessionState.STARTING}
              >
                Start Conversation
              </Button>
           </div>
        </div>
      </div>
    );
  }

  // --- RENDER: ACTIVE SESSION (75/25 SPLIT) ---
  return (
    <div className="w-full h-screen flex flex-row bg-black overflow-hidden">
        
        {/* LEFT: Video & Controls (75%) */}
        <div className="w-3/4 h-full flex flex-col relative border-r border-zinc-800">
             <div className="flex-1 w-full bg-black relative flex items-center justify-center overflow-hidden">
                <AvatarVideo src={stream} />
             </div>

             {/* Controls Area (Fixed Height) */}
             <div className="shrink-0 bg-zinc-900/90 border-t border-zinc-800 p-4">
               <div className="max-w-4xl mx-auto flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Tabs 
                          aria-label="Chat Mode" 
                          selectedKey={chatMode} 
                          onSelectionChange={(key) => setChatMode(key as string)}
                          className="bg-zinc-800 rounded-lg p-1"
                          size="sm"
                        >
                          <Tab key="text_mode" title="Text Chat" />
                          <Tab key="voice_mode" title="Voice Chat" />
                        </Tabs>
                        <div className="w-[1px] h-6 bg-zinc-700 mx-1"></div>
                        <Button 
                           className="bg-red-500/10 text-red-500 border border-red-500/50"
                           size="sm"
                           variant="flat"
                           onPress={() => window.location.reload()}
                        >
                           Interrupt
                        </Button>
                      </div>
                      <Button 
                        className="bg-zinc-800 text-zinc-400 hover:text-white"
                        size="sm"
                        variant="flat"
                        onPress={handleEndSession}
                      >
                        End Session
                      </Button>
                  </div>

                  {/* Input / Mic Toggle */}
                  <div className="w-full mt-1 flex justify-center">
                     {chatMode === "text_mode" ? (
                        <div className="flex gap-2 w-full">
                          <Input 
                            placeholder="Type a message..." 
                            value={text} 
                            onValueChange={setText}
                            className="flex-1"
                            size="sm"
                          />
                          <Button className="bg-indigo-600 text-white" size="sm">Send</Button>
                        </div>
                     ) : (
                        // TOGGLE MIC BUTTON
                        <Button
                          color={isVoiceChatActive ? "danger" : "primary"}
                          variant={isVoiceChatActive ? "solid" : "flat"}
                          size="lg"
                          className="w-64 font-semibold shadow-lg"
                          onPress={handleVoiceToggle}
                        >
                          {isVoiceChatActive ? "Stop Listening (Mic On)" : "Start Listening (Mic Off)"}
                        </Button>
                     )}
                  </div>
               </div>
             </div>
        </div>

        {/* RIGHT: Transcript (25%) */}
        <div className="w-1/4 h-full bg-zinc-950 flex flex-col border-l border-zinc-800">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
               <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Transcript</h3>
            </div>
            {/* Transcript Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <MessageHistory />
            </div>
        </div>
    </div>
  );
}

export default function InteractiveAvatar() {
  return (
    <StreamingAvatarProvider basePath={process.env.NEXT_PUBLIC_BASE_API_URL}>
      <InteractiveAvatarContent />
    </StreamingAvatarProvider>
  );
}