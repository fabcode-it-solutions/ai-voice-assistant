import { OpenAI } from "openai";
import logger from "./logger";
import sanitizeHtml from "sanitize-html";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function getOpenAIResponse(
  text: string,
  context: Message[] = [],
): Promise<string> {
  try {
    const sanitizedText = sanitizeHtml(text, {
      allowedTags: [],
      allowedAttributes: {},
    });

    const messages = [
      {
        role: "system" as const,
        content:
          "You are a helpful voice assistant. Keep responses concise and conversational, suitable for spoken interaction. Limit responses to 2-3 sentences. Maintain context from previous messages.",
      },
      ...context.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user" as const, content: sanitizedText },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 150,
      temperature: 0.7,
    });
    return response.choices[0].message.content || "No response from AI.";
  } catch (error) {
    logger.error("OpenAI error", { error });
    return "Sorry, I encountered an error. Please try again.";
  }
}
