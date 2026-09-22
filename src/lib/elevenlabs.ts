import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import logger from "./logger";

const client = new ElevenLabsClient({
  apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
});

export async function convertTextToSpeech(
  text: string,
  playAudio: (
    audio: ArrayBuffer,
    setTranscript: (text: string) => void
  ) => Promise<void>,
  setIsSpeaking: (value: boolean) => void,
  signal: AbortSignal
) {
  try {
    const response = await client.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
      text,
      modelId: "eleven_multilingual_v2",
      outputFormat: "mp3_44100_128",
    });

    const reader = response.getReader();
    console.log(JSON.stringify(reader, null, 2));

    const chunks: Uint8Array[] = [];
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      if (value) {
        chunks.push(value);
      }
      done = readerDone;
    }

    const arrayBuffer = new Uint8Array(
      chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    );
    let offset = 0;
    for (const chunk of chunks) {
      arrayBuffer.set(chunk, offset);
      offset += chunk.length;
    }
    await playAudio(arrayBuffer.buffer, (text) =>
      (window as any).setTranscript(text)
    );
    setIsSpeaking(false);
  } catch (error: any) {
    if (error.name === "AbortError") {
      logger.info("TTS request aborted due to interruption");
    } else {
      logger.error("ElevenLabs TTS error", { error });
      if (typeof window !== "undefined") {
        (window as any).setTranscript("Error in text-to-speech conversion.");
      }
    }
    setIsSpeaking(false);
  }
}

export async function convertSpeechToText(audioBlob: Blob): Promise<string> {
  try {
    const response = await client.speechToText.convert({
      file: audioBlob,
      modelId: "scribe_v1",
      tagAudioEvents: true,
      languageCode: "eng",
      diarize: true,
    });
    return response.text || "";
  } catch (error) {
    logger.error("ElevenLabs Scribe STT error", { error });
    return "Error in speech-to-text conversion.";
  }
}
