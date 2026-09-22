import { NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export async function POST(request: Request) {
  try {
    const audioBlob = await request.blob();
    const response = await client.speechToText.convert({
      file: audioBlob,
      modelId: "scribe_v1",
      tagAudioEvents: true,
      languageCode: "eng",
      diarize: true,
    });
    return NextResponse.json({ transcript: response.text || "" });
  } catch (error: any) {
    return NextResponse.json(
      { transcript: `Error in speech-to-text conversion: ${error.message}` },
      { status: 500 }
    );
  }
}
