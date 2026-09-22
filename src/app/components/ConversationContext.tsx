"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ConversationContextType {
  messages: Message[];
  addMessage: (role: "user" | "assistant", content: string) => void;
  clearMessages: () => void;
  getRecentContext: () => Message[];
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = (role: "user" | "assistant", content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const getRecentContext = () => {
    // Return last 6 messages for context (3 exchanges)
    return messages.slice(-6);
  };

  return (
    <ConversationContext.Provider value={{
      messages,
      addMessage,
      clearMessages,
      getRecentContext,
    }}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error("useConversation must be used within ConversationProvider");
  }
  return context;
}