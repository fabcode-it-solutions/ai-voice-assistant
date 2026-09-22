import axios from "axios";

export async function callCustomAI(text: string) {
  const res = await axios.post(process.env.CUSTOM_AI_API!, {
    prompt: text,
  });
  return res.data.reply;
}
