"use client";

import { Input, Select, SelectItem, Slider, Button, Tabs, Tab } from "@nextui-org/react";
import {
  AvatarQuality,
  VoiceEmotion,
  StartAvatarRequest,
  STTProvider,
  ElevenLabsModel,
} from "@heygen/streaming-avatar";
import { AVATARS, STT_LANGUAGE_LIST } from "@/app/lib/constants";
import { useState } from "react";

interface AvatarConfigProps {
  config: StartAvatarRequest;
  onConfigChange: (config: StartAvatarRequest) => void;
}

export default function AvatarConfig({ config, onConfigChange }: AvatarConfigProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Custom State for OpenAI (UI only since it's not in StartAvatarRequest by default)
  const [openAiModel, setOpenAiModel] = useState("gpt-4o");

  function updateConfig(key: string, value: any) {
    onConfigChange({ ...config, [key]: value });
  }

  function updateVoiceConfig(key: string, value: any) {
    onConfigChange({
      ...config,
      voice: { ...config.voice, [key]: value },
    });
  }

  function updateSTTConfig(key: string, value: any) {
    onConfigChange({
        ...config,
        sttSettings: { ...config.sttSettings, [key]: value }
    })
  }

  return (
    <div className="flex flex-col gap-6 w-full text-white">
      
      {/* 1. Avatar Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-400">Select Avatar</label>
        <Select
          placeholder="Choose an avatar"
          selectedKeys={config.avatarName ? [config.avatarName] : []}
          onChange={(e) => updateConfig("avatarName", e.target.value)}
          classNames={{ trigger: "bg-zinc-800 border-zinc-700 text-white", popoverContent: "bg-zinc-900 border-zinc-800 text-white" }}
        >
          {AVATARS.map((avatar) => (
            <SelectItem key={avatar.avatar_id} textValue={avatar.name}>
              {avatar.name}
            </SelectItem>
          ))}
        </Select>
      </div>

      {/* 2. OpenAI Model Selection (New Feature) */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-400">OpenAI Brain Model</label>
        <Select
          placeholder="Select Model"
          selectedKeys={[openAiModel]}
          onChange={(e) => setOpenAiModel(e.target.value)}
          classNames={{ trigger: "bg-zinc-800 border-zinc-700 text-white", popoverContent: "bg-zinc-900 border-zinc-800 text-white" }}
        >
          <SelectItem key="gpt-4o">GPT-4o</SelectItem>
          <SelectItem key="gpt-4-turbo">GPT-4 Turbo</SelectItem>
          <SelectItem key="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
        </Select>
        <p className="text-xs text-zinc-500">Model used for generating conversation.</p>
      </div>

      {/* 3. Language Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-400">Language</label>
        <Select
          placeholder="Select Language"
          selectedKeys={config.language ? [config.language] : []}
          onChange={(e) => updateConfig("language", e.target.value)}
          classNames={{ trigger: "bg-zinc-800 border-zinc-700 text-white", popoverContent: "bg-zinc-900 border-zinc-800 text-white" }}
        >
          {STT_LANGUAGE_LIST.map((lang) => (
            <SelectItem key={lang.key} textValue={lang.label}>
              {lang.label}
            </SelectItem>
          ))}
        </Select>
      </div>

      {/* Advanced Settings Toggle */}
      <div>
        <Button 
          variant="light" 
          onPress={() => setShowAdvanced(!showAdvanced)}
          className="text-indigo-400 -ml-4"
        >
          {showAdvanced ? "Hide Advanced Settings" : "Show Advanced Settings"}
        </Button>
      </div>

      {/* Advanced Settings Body */}
      {showAdvanced && (
        <div className="p-5 rounded-xl bg-zinc-800/50 border border-zinc-700/50 flex flex-col gap-5 animate-in fade-in slide-in-from-top-2">
            
            {/* Knowledge Base */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-300">Knowledge Base ID</label>
                <Input
                  placeholder="Enter HeyGen Knowledge ID"
                  value={config.knowledgeId}
                  onValueChange={(v) => updateConfig("knowledgeId", v)}
                  classNames={{ inputWrapper: "bg-zinc-900 border-zinc-700 text-white" }}
                />
            </div>

            {/* Quality */}
             <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-300">Avatar Quality</label>
                <Select
                  selectedKeys={[config.quality]}
                  onChange={(e) => updateConfig("quality", e.target.value)}
                  classNames={{ trigger: "bg-zinc-900 border-zinc-700", popoverContent: "bg-zinc-900 border-zinc-800 text-white" }}
                >
                   <SelectItem key={AvatarQuality.Low}>Low</SelectItem>
                   <SelectItem key={AvatarQuality.Medium}>Medium</SelectItem>
                   <SelectItem key={AvatarQuality.High}>High</SelectItem>
                </Select>
            </div>

            {/* Voice Emotion */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-300">Emotion</label>
              <Select
                 selectedKeys={[config.voice?.emotion || VoiceEmotion.EXCITED]}
                 onChange={(e) => updateVoiceConfig("emotion", e.target.value)}
                 classNames={{ trigger: "bg-zinc-900 border-zinc-700", popoverContent: "bg-zinc-900 border-zinc-800 text-white" }}
              >
                {Object.values(VoiceEmotion).map((emo) => (
                  <SelectItem key={emo} textValue={emo}>
                    {emo}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Voice Rate */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-300">Voice Speed ({config.voice?.rate}x)</label>
              <Slider
                size="sm"
                step={0.1}
                minValue={0.5}
                maxValue={1.5}
                defaultValue={1.5}
                value={config.voice?.rate}
                onChange={(v) => updateVoiceConfig("rate", v)}
                className="max-w-md"
              />
            </div>

             {/* ElevenLabs Model */}
             <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-300">ElevenLabs Model</label>
                <Select
                  selectedKeys={[config.voice?.elevenlabsSettings?.model_id || config.voice?.model || ElevenLabsModel.eleven_flash_v2_5]}
                  onChange={(e) => updateVoiceConfig("model", e.target.value)}
                  classNames={{ trigger: "bg-zinc-900 border-zinc-700", popoverContent: "bg-zinc-900 border-zinc-800 text-white" }}
                >
                   {Object.values(ElevenLabsModel).map((model) => (
                      <SelectItem key={model}>{model}</SelectItem>
                   ))}
                </Select>
            </div>

            {/* STT Provider */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-300">STT Provider</label>
                <Select
                  selectedKeys={[config.sttSettings?.provider || STTProvider.DEEPGRAM]}
                  onChange={(e) => updateSTTConfig("provider", e.target.value)}
                  classNames={{ trigger: "bg-zinc-900 border-zinc-700", popoverContent: "bg-zinc-900 border-zinc-800 text-white" }}
                >
                   <SelectItem key={STTProvider.DEEPGRAM}>Deepgram</SelectItem>
                   <SelectItem key={STTProvider.GLADIA}>Gladia</SelectItem>
                   <SelectItem key={STTProvider.WHISPER}>Whisper</SelectItem>
                </Select>
            </div>

        </div>
      )}
    </div>
  );
}