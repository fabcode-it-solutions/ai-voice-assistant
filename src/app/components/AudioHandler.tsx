"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import logger from "@/lib/logger";
import { useConversation } from "./ConversationContext";

interface AudioContextType {
  startListening: (setTranscript: (text: string) => void) => void;
  stopListening: () => void;
  isListening: boolean;
  isSpeaking: boolean;
  useScribe: boolean;
  setLanguage: (lang: string) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [useScribe, setUseScribe] = useState(false);
  const [language, setLanguage] = useState(navigator.language || "en-US");
  const { addMessage, getRecentContext } = useConversation();
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isMountedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const errorCountRef = useRef(0);
  const lowConfidenceCountRef = useRef(0);
  const MAX_ERROR_COUNT = 3;
  const MAX_LOW_CONFIDENCE_COUNT = 3;

  useEffect(() => {
    isMountedRef.current = true;

    const AudioContextConstructor =
      typeof window !== "undefined"
        ? window.AudioContext || (window as any).webkitAudioContext
        : null;
    if (AudioContextConstructor) {
      audioContextRef.current = new AudioContextConstructor();
    } else {
      logger.error("AudioContext not supported in this browser");
    }

    const SpeechRecognitionConstructor =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;
    if (SpeechRecognitionConstructor) {
      recognitionRef.current = new SpeechRecognitionConstructor();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;
      // Check for maxAlternatives support
      if ("maxAlternatives" in recognitionRef.current) {
        recognitionRef.current.maxAlternatives = 3;
      } else {
        logger.debug("maxAlternatives not supported in this browser");
      }
    } else {
      logger.error("Web Speech API not supported in this browser");
      setIsSpeechSupported(false);
      setUseScribe(true); // Fallback to Scribe if Web Speech is unavailable
    }

    return () => {
      isMountedRef.current = false;
      if (audioContextRef.current) {
        audioContextRef.current
          .close()
          .catch((err) =>
            logger.error("Error closing AudioContext", { error: err })
          );
      }
      stopListening();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [language]);

  const startListening = useCallback(
    async (setTranscript: (text: string) => void) => {
      if (!isMountedRef.current || (!isSpeechSupported && !useScribe)) {
        logger.error("Speech recognition not available or not supported");
        setIsListening(false);
        setTranscript("Speech recognition not supported.");
        return;
      }
      try {
        if (useScribe) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: { noiseSuppression: true, echoCancellation: true },
          });
          mediaRecorderRef.current = new MediaRecorder(stream, {
            mimeType: "audio/webm",
          });
          audioChunksRef.current = [];

          mediaRecorderRef.current.ondataavailable = async (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
              if (audioChunksRef.current.length >= 2) {
                // Process every ~2 seconds
                const audioBlob = new Blob(audioChunksRef.current, {
                  type: "audio/webm",
                });
                audioChunksRef.current = [];
                try {
                  const response = await fetch("/api/elevenlabs/stt", {
                    method: "POST",
                    body: audioBlob,
                    headers: { "Content-Type": "audio/webm" },
                  });
                  const { transcript } = await response.json();
                  if (transcript.startsWith("Error")) {
                    setTranscript(transcript);
                  } else {
                    setTranscript(transcript);
                    try {
                      addMessage("user", transcript);
                      abortControllerRef.current = new AbortController();
                      const context = getRecentContext();
                      const aiResponse = await fetch("/api/openai", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text: transcript, context }),
                      })
                        .then((res) => res.json())
                        .then((data) => data.response);
                      addMessage("assistant", aiResponse);
                      await fetch("/api/elevenlabs/tts", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          text: aiResponse,
                          signal: abortControllerRef.current.signal,
                        }),
                      })
                        .then((res) => res.arrayBuffer())
                        .then((audioData) =>
                          playAudio(audioData, setTranscript)
                        );
                    } catch (error: any) {
                      logger.error("Error processing AI response", { error });
                      setTranscript("Sorry, I encountered an error.");
                    }
                  }
                } catch (error) {
                  logger.error("Scribe STT error", { error });
                  setTranscript("Error in speech-to-text conversion.");
                }
              }
            }
          };

          mediaRecorderRef.current.start(1000);
          setIsListening(true);
        } else {
          if (!recognitionRef.current) {
            throw new Error("SpeechRecognition not initialized");
          }
          recognitionRef.current.onresult = async (event) => {
            const last = event.results.length - 1;
            const result = event.results[last];
            const transcript = result[0].transcript;
            const confidence = result[0].confidence || 1.0;
            setTranscript(transcript);
            stopSpeaking();
            if (abortControllerRef.current) {
              abortControllerRef.current.abort();
              abortControllerRef.current = null;
            }
            if (confidence < 0.7) {
              lowConfidenceCountRef.current += 1;
              logger.debug("Low confidence transcript", {
                transcript,
                confidence,
              });
              if (lowConfidenceCountRef.current >= MAX_LOW_CONFIDENCE_COUNT) {
                setUseScribe(true);
                setIsListening(false);
                setTranscript(
                  "Low accuracy detected. Switching to ElevenLabs Scribe."
                );
                setTimeout(() => startListening(setTranscript), 1000);
                return;
              }
            } else {
              lowConfidenceCountRef.current = 0;
            }
            if (result.isFinal) {
              try {
                errorCountRef.current = 0;
                addMessage("user", transcript);
                abortControllerRef.current = new AbortController();
                const context = getRecentContext();
                const aiResponse = await fetch("/api/openai", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ text: transcript, context }),
                })
                  .then((res) => res.json())
                  .then((data) => data.response);
                addMessage("assistant", aiResponse);
                await fetch("/api/elevenlabs/tts", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    text: aiResponse,
                    signal: abortControllerRef.current.signal,
                  }),
                })
                  .then((res) => res.arrayBuffer())
                  .then((audioData) => playAudio(audioData, setTranscript));
              } catch (error: any) {
                logger.error("Error processing AI response", { error });
                setTranscript("Sorry, I encountered an error.");
              }
            }
          };

          recognitionRef.current.onerror = (event) => {
            logger.error("Speech recognition error", { error: event.error });
            errorCountRef.current += 1;
            setIsListening(false);
            let errorMessage = `Speech recognition error: ${event.error}`;
            if (event.error === "no-speech") {
              errorMessage =
                "No speech detected. Please speak clearly or check your microphone.";
            } else if (event.error === "audio-capture") {
              errorMessage =
                "Microphone access denied or unavailable. Please allow microphone permissions.";
            } else if (event.error === "network") {
              errorMessage =
                "Network error. Please check your internet connection.";
            }
            if (errorCountRef.current >= MAX_ERROR_COUNT) {
              errorMessage +=
                " Persistent issues detected. Switching to ElevenLabs Scribe for better accuracy.";
              setUseScribe(true);
              setIsListening(false);
              setTimeout(() => startListening(setTranscript), 1000);
            }
            setTranscript(errorMessage);
          };

          recognitionRef.current.onend = () => {
            if (
              isListening &&
              isSpeechSupported &&
              isMountedRef.current &&
              !useScribe
            ) {
              recognitionRef.current?.start();
            }
          };

          recognitionRef.current.start();
          setIsListening(true);
        }
      } catch (error) {
        logger.error("Failed to start listening", { error });
        setIsListening(false);
        setTranscript("Failed to start speech recognition. Please try again.");
      }
    },
    [isListening, isSpeaking, isSpeechSupported, useScribe, language]
  );

  const stopSpeaking = useCallback(() => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      } catch (error) {
        logger.error("Error stopping audio playback", { error });
      }
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
    setUseScribe(false);
    stopSpeaking();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [stopSpeaking]);

  const playAudio = useCallback(
    async (audioData: ArrayBuffer, setTranscript: (text: string) => void) => {
      if (!audioContextRef.current || !isMountedRef.current) {
        logger.error("AudioContext not available");
        setIsSpeaking(false);
        setTranscript("Audio playback not supported.");
        return;
      }
      try {
        setIsSpeaking(true);
        const audioBuffer = await audioContextRef.current.decodeAudioData(
          audioData
        );
        audioSourceRef.current = audioContextRef.current.createBufferSource();
        audioSourceRef.current.buffer = audioBuffer;
        audioSourceRef.current.connect(audioContextRef.current.destination);
        audioSourceRef.current.start();
        audioSourceRef.current.onended = () => {
          setIsSpeaking(false);
          audioSourceRef.current = null;
          if (
            isListening &&
            (isSpeechSupported || useScribe) &&
            isMountedRef.current
          ) {
            startListening(setTranscript);
          }
        };
      } catch (error) {
        logger.error("Audio playback error", { error });
        setIsSpeaking(false);
        setTranscript("Error playing audio response.");
      }
    },
    [isListening, startListening, isSpeechSupported, useScribe]
  );

  if (!isSpeechSupported && !useScribe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <p className="text-red-500 text-lg">
            Web Speech API is not supported in this browser. Please use a
            supported browser like Chrome.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AudioContext.Provider
      value={{
        startListening,
        stopListening,
        isListening,
        isSpeaking,
        useScribe,
        setLanguage,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context)
    throw new Error("useAudio must be used within an AudioProvider");
  return context;
}
