"use client";

import { useEffect, useState } from "react";

interface VoiceVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
}

export default function VoiceVisualizer({ isListening, isSpeaking }: VoiceVisualizerProps) {
  const [animationClass, setAnimationClass] = useState("");

  useEffect(() => {
    if (isListening) {
      setAnimationClass("animate-pulse");
    } else if (isSpeaking) {
      setAnimationClass("animate-bounce");
    } else {
      setAnimationClass("");
    }
  }, [isListening, isSpeaking]);

  const getStatusColor = () => {
    if (isSpeaking) return "bg-green-500";
    if (isListening) return "bg-blue-500";
    return "bg-gray-400";
  };

  const getStatusText = () => {
    if (isSpeaking) return "AI Speaking";
    if (isListening) return "Listening";
    return "Idle";
  };

  return (
    <div className="flex flex-col items-center mb-4">
      <div className={`w-16 h-16 rounded-full ${getStatusColor()} ${animationClass} flex items-center justify-center mb-2`}>
        {isSpeaking ? (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.846l3.537-2.816a1 1 0 011.617.816zM16 10a6 6 0 01-1.71 4.24l-1.42-1.42A4 4 0 0015 10a4 4 0 00-2.13-3.82l1.42-1.42A6 6 0 0116 10z" clipRule="evenodd" />
            <path d="M18 10a8 8 0 01-2.93 5.66l-1.42-1.42A6 6 0 0018 10a6 6 0 00-3.35-5.24l1.42-1.42A8 8 0 0118 10z" />
          </svg>
        ) : isListening ? (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      <span className="text-sm font-medium text-gray-600">{getStatusText()}</span>
    </div>
  );
}