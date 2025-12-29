import StreamingAvatar, {
  ConnectionQuality,
  StartAvatarRequest,
  StreamingEvents,
} from "@heygen/streaming-avatar";
import { useCallback } from "react";

import {
  StreamingAvatarSessionState,
  useStreamingAvatarContext,
} from "./context";
import { useVoiceChat } from "./useVoiceChat";
import { useMessageHistory } from "./useMessageHistory";

export const useStreamingAvatarSession = () => {
  const {
    avatarRef,
    basePath,
    sessionState,
    setSessionState,
    stream,
    setStream,
    setIsListening,
    setIsUserTalking,
    setIsAvatarTalking,
    setConnectionQuality,
    handleUserTalkingMessage,
    handleStreamingTalkingMessage,
    handleEndMessage,
    clearMessages,
  } = useStreamingAvatarContext();
  const { stopVoiceChat } = useVoiceChat();

  useMessageHistory();

  const init = useCallback(
    (token: string) => {
      avatarRef.current = new StreamingAvatar({
        token,
        basePath: basePath,
      });

      return avatarRef.current;
    },
    [basePath, avatarRef],
  );

  const handleStream = useCallback(
    ({ detail }: { detail: MediaStream }) => {
      setStream(detail);
      setSessionState(StreamingAvatarSessionState.CONNECTED);
    },
    [setSessionState, setStream],
  );

  const stop = useCallback(async () => {
    avatarRef.current?.off(StreamingEvents.STREAM_READY, handleStream);
    avatarRef.current?.off(StreamingEvents.STREAM_DISCONNECTED, stop);
    clearMessages();
    stopVoiceChat();
    setIsListening(false);
    setIsUserTalking(false);
    setIsAvatarTalking(false);
    setStream(null);
    await avatarRef.current?.stopAvatar();
    setSessionState(StreamingAvatarSessionState.INACTIVE);
  }, [
    handleStream,
    setSessionState,
    setStream,
    avatarRef,
    setIsListening,
    stopVoiceChat,
    clearMessages,
    setIsUserTalking,
    setIsAvatarTalking,
  ]);

  const start = useCallback(
    async (config: StartAvatarRequest, token?: string) => {
      // FIX: Agar session pehle se active hai, toh error mat do, bas stop karke naya start karo
      if (sessionState !== StreamingAvatarSessionState.INACTIVE) {
        await stop();
      }

      if (!avatarRef.current) {
        if (!token) {
          throw new Error("Token is required");
        }
        init(token);
      }

      // Double check initialization
      if (!avatarRef.current) {
        init(token!); // Force init if missing
      }

      setSessionState(StreamingAvatarSessionState.CONNECTING);
      avatarRef.current.on(StreamingEvents.STREAM_READY, handleStream);
      avatarRef.current.on(StreamingEvents.STREAM_DISCONNECTED, stop);
      avatarRef.current.on(
        StreamingEvents.CONNECTION_QUALITY_CHANGED,
        ({ detail }: { detail: ConnectionQuality }) =>
          setConnectionQuality(detail),
      );
      avatarRef.current.on(StreamingEvents.USER_START, () => {
        setIsUserTalking(true);
      });
      avatarRef.current.on(StreamingEvents.USER_STOP, () => {
        setIsUserTalking(false);
      });
      avatarRef.current.on(StreamingEvents.AVATAR_START_TALKING, () => {
        setIsAvatarTalking(true);
      });
      avatarRef.current.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        setIsAvatarTalking(false);
      });
      avatarRef.current.on(
        StreamingEvents.USER_TALKING_MESSAGE,
        handleUserTalkingMessage,
      );
      avatarRef.current.on(
        StreamingEvents.AVATAR_TALKING_MESSAGE,
        handleStreamingTalkingMessage,
      );
      avatarRef.current.on(StreamingEvents.USER_END_MESSAGE, handleEndMessage);
      avatarRef.current.on(
        StreamingEvents.AVATAR_END_MESSAGE,
        handleEndMessage,
      );

      await avatarRef.current.createStartAvatar(config);

      return avatarRef.current;
    },
    [
      init,
      handleStream,
      stop,
      setSessionState,
      avatarRef,
      sessionState,
      setConnectionQuality,
      setIsUserTalking,
      handleUserTalkingMessage,
      handleStreamingTalkingMessage,
      handleEndMessage,
      setIsAvatarTalking,
    ],
  );

  return {
    avatarRef,
    sessionState,
    stream,
    initAvatar: init,
    startAvatar: start,
    stopAvatar: stop,
  };
};