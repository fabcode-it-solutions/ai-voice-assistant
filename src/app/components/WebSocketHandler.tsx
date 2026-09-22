"use client";

import { useEffect, useRef, useCallback } from "react";
import logger from "@/lib/logger";

export default function WebSocketHandler() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const voiceId = "Xb7hH8MSUJpSbSDYk0k2"; // Replace with your ElevenLabs voice ID
  const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?api_key=${process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY}`;

  const reconnect = useCallback(() => {
    const reconnectInterval = Math.min(
      1000 * 2 ** reconnectAttempts.current,
      30000
    );
    if (reconnectAttempts.current < maxReconnectAttempts) {
      logger.info(
        `Attempting WebSocket reconnect (${
          reconnectAttempts.current + 1
        }/${maxReconnectAttempts})`
      );
      setTimeout(() => {
        reconnectAttempts.current++;
        connectWebSocket();
      }, reconnectInterval);
    } else {
      logger.error("Max WebSocket reconnect attempts reached");
      if (typeof window !== "undefined") {
        (window as any).setTranscript(
          "Unable to connect to text-to-speech service."
        );
      }
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      logger.info("WebSocket connected");
      reconnectAttempts.current = 0;
    };

    wsRef.current.onmessage = async (event) => {
      try {
        if (event.data instanceof Blob) {
          const audioData = await event.data.arrayBuffer();
          if (typeof window !== "undefined") {
            (window as any).playAudio(audioData, (text: string) => {
              (window as any).setTranscript(text);
            });
          }
        } else {
          const data = JSON.parse(event.data);
          if (data.error) {
            logger.error("WebSocket error message", { error: data.error });
            if (typeof window !== "undefined") {
              (window as any).setTranscript(`WebSocket error: ${data.error}`);
            }
          }
        }
      } catch (error) {
        logger.error("WebSocket message processing error", { error });
      }
    };

    wsRef.current.onerror = (error) => {
      logger.error("WebSocket error", { error });
      reconnect();
    };

    wsRef.current.onclose = () => {
      logger.info("WebSocket closed");
      reconnect();
    };
  }, [reconnect, wsUrl]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connectWebSocket]);

  return null;
}
