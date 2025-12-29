import React, { useEffect, useRef } from "react";
import { useStreamingAvatarContext } from "../logic/context"; // Context import kiya

export const MessageHistory: React.FC = () => {
  // FIX: messages ko context se nikala instead of props
  const { messages } = useStreamingAvatarContext(); 
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  // Safe check for undefined messages
  if (!messages || messages.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 opacity-50">
              <p>No messages yet.</p>
          </div>
      )
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-4 w-full h-full overflow-y-auto"
    >
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex flex-col max-w-[85%] ${
            msg.sender === "user" ? "self-end items-end" : "self-start items-start"
          }`}
        >
          <span className="text-xs text-zinc-500 mb-1 capitalize">{msg.sender}</span>
          <div
            className={`px-4 py-2 rounded-2xl text-sm ${
              msg.sender === "user"
                ? "bg-indigo-600 text-white rounded-br-none"
                : "bg-zinc-800 text-zinc-200 rounded-bl-none border border-zinc-700"
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}
    </div>
  );
};