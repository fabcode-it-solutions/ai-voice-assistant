"use client";

import { useState } from "react";
import Conversation from "@/app/components/Conversation";
import { AudioProvider } from "@/app/components/AudioHandler";
import { ConversationProvider } from "@/app/components/ConversationContext";
import ErrorBoundary from "@/app/components/ErrorBoundary";
import { validateEnv } from "@/lib/env";

// validateEnv();

export default function Home() {
  const [isConversing, setIsConversing] = useState(false);

  return (
    <ErrorBoundary>
      <ConversationProvider>
        <AudioProvider>
          <main className="min-h-screen bg-gray-100 flex items-center justify-center">
            <Conversation
              isConversing={isConversing}
              setIsConversing={setIsConversing}
            />
          </main>
        </AudioProvider>
      </ConversationProvider>
    </ErrorBoundary>
  );
}
