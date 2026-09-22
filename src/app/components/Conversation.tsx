"use client";

import { useState, useCallback, useEffect } from "react";
import { useAudio } from "./AudioHandler";
import { useConversation } from "./ConversationContext";
import VoiceVisualizer from "./VoiceVisualizer";
import clsx from "clsx";

interface ConversationProps {
  isConversing: boolean;
  setIsConversing: (value: boolean) => void;
}

export default function Conversation({
  isConversing,
  setIsConversing,
}: ConversationProps) {
  const [transcript, setTranscript] = useState("");
  const [confirmedTranscript, setConfirmedTranscript] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const { messages, clearMessages } = useConversation();
  const {
    startListening,
    stopListening,
    isListening,
    isSpeaking,
    useScribe,
    setLanguage,
  } = useAudio();

  const handleToggleConversation = useCallback(() => {
    if (isConversing) {
      stopListening();
      setIsConversing(false);
      setTranscript("");
      setConfirmedTranscript("");
    } else {
      startListening((text) => {
        setTranscript(text);
        setConfirmedTranscript(text);
      });
      setIsConversing(true);
    }
  }, [isConversing, startListening, stopListening, setIsConversing]);

  const handleClearHistory = useCallback(() => {
    clearMessages();
    setTranscript("");
    setConfirmedTranscript("");
  }, [clearMessages]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (
        event.code === "Space" &&
        !isEditing &&
        event.target === document.body
      ) {
        event.preventDefault();
        handleToggleConversation();
      }
      if (event.code === "Escape" && isConversing) {
        event.preventDefault();
        handleToggleConversation();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [isConversing, isEditing, handleToggleConversation]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

  const handleConfirmTranscript = () => {
    setIsEditing(false);
    setConfirmedTranscript(transcript);
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto mt-10 p-8 backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-lg text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          AI Voice Assistant
        </h1>
        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="text-sm text-red-300 hover:text-red-500 transition"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Voice Visualization */}
      <div className="flex justify-center items-center mb-6">
        <VoiceVisualizer isListening={isListening} isSpeaking={isSpeaking} />
      </div>

      {/* Language Selector */}
      <select
        onChange={handleLanguageChange}
        defaultValue={navigator.language || "en-US"}
        className="mb-4 p-2 rounded-lg w-full bg-gray-900 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <option value="en-US">English (US)</option>
        <option value="en-GB">English (UK)</option>
        <option value="en-AU">English (Australia)</option>
        <option value="en-IN">English (India)</option>
      </select>

      {/* Conversation Button */}
      <button
        onClick={handleToggleConversation}
        aria-label={isConversing ? "Stop conversation" : "Start conversation"}
        disabled={!isListening && isConversing}
        className={clsx(
          "w-full py-4 px-6 font-semibold rounded-xl transition-all duration-300",
          {
            "bg-gradient-to-r from-pink-500 to-red-500 text-white hover:opacity-90":
              isConversing,
            "bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:opacity-90":
              !isConversing,
            "opacity-50 cursor-not-allowed": !isListening && isConversing,
          }
        )}
      >
        {isConversing ? "🛑 Stop Listening (Esc)" : "🎤 Start Talking (Space)"}
      </button>

      <p className="text-xs text-center text-gray-300 mt-2">
        ⌨️ Space = Start, Esc = Stop, Speak to interrupt
      </p>

      {/* History */}
      {messages.length > 0 && (
        <div className="mt-6 max-h-60 overflow-y-auto border border-white/20 rounded-lg p-4 bg-white/5">
          <h3 className="font-semibold mb-2 text-white/80">🗣️ Conversation:</h3>
          {messages.map((message) => (
            <div
              key={message.id}
              className={clsx(
                "mb-3 px-4 py-2 rounded-lg max-w-[80%]",
                message.role === "user"
                  ? "bg-blue-500/20 self-end ml-auto"
                  : "bg-green-500/20"
              )}
            >
              <span className="block text-sm font-semibold mb-1 text-white/70">
                {message.role === "user" ? "You" : "AI"}
              </span>
              <p className="text-white">{message.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Status */}
      <div className="mt-6">
        <p className="text-md font-medium">
          <span className="text-white/70">Status:</span>{" "}
          <span>
            {isConversing
              ? isSpeaking
                ? "🗣️ AI Speaking"
                : isListening
                ? `🎧 Listening (${useScribe ? "Scribe" : "Web Speech"})`
                : "❌ Not supported"
              : "💤 Idle"}
          </span>
        </p>

        <p className="text-md mt-2">
          <span className="text-white/70 font-medium">Transcript:</span>{" "}
          {isEditing ? (
            <input
              type="text"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full p-2 mt-1 rounded-lg bg-gray-800 border border-gray-700 text-white"
              placeholder="Edit your message..."
            />
          ) : (
            <span className="text-white">
              {transcript || "No speech detected"}
            </span>
          )}
        </p>

        {transcript && (
          <div className="mt-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-sm text-blue-400 hover:underline mr-2"
            >
              {isEditing ? "Cancel" : "Edit"}
            </button>
            {isEditing && (
              <button
                onClick={handleConfirmTranscript}
                className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm"
              >
                Confirm
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
