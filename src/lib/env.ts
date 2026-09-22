export function validateEnv() {
  const required = [
    "ELEVENLABS_API_KEY",
    "OPENAI_API_KEY",
  ];
  required.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing environment variable: ${key}`);
    }
  });
}
