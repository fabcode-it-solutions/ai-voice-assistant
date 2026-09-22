export interface AudioContextType {
  startListening: () => void;
  stopListening: () => void;
  isListening: boolean;
  isSpeaking: boolean;
}
