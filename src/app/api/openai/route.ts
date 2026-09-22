// app/api/openai/route.ts
import { NextResponse } from "next/server";
import { getOpenAIResponse } from "@/lib/openai";

export async function POST(request: Request) {
  const { text, context = [] } = await request.json();
  if (!text)
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  const response = await getOpenAIResponse(text, context);
  return NextResponse.json({ response });
}
