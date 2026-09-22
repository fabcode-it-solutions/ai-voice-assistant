# 🎙️ AI Voice Assistant — Real-Time Conversational AI

A production-ready, real-time voice assistant built with **Next.js**, **OpenAI**, and **ElevenLabs**. Users can hold natural, spoken conversations with an AI — including the ability to interrupt the assistant mid-response, just like talking to a real person.

This project showcases a full-stack implementation of a low-latency voice pipeline: speech-in, LLM reasoning, speech-out — wrapped in a polished, accessible UI.

---

## ✨ Highlights

- **Real-time Speech Recognition** — Web Speech API with an ElevenLabs Scribe fallback for cross-browser reliability
- **Natural Text-to-Speech** — High-quality ElevenLabs voice synthesis
- **Barge-in / Interruption Support** — Users can interrupt the AI while it's speaking, mimicking natural conversation flow
- **Contextual Conversations** — Full chat history is maintained for coherent, multi-turn dialogue
- **Multi-language / Accent Support** — English variants (US, UK, Australia, India)
- **Automatic Error Recovery** — Graceful fallback mechanisms when speech recognition or network calls fail
- **Accessible by Design** — ARIA labels, keyboard shortcuts, and visual status feedback
- **Production Monitoring** — Integrated with Sentry for error tracking

---

## 🧰 Tech Stack

| Layer              | Technology                                              |
|--------------------|----------------------------------------------------------|
| Framework          | Next.js 15 (App Router), React 19, TypeScript             |
| Styling            | Tailwind CSS 4                                            |
| AI / LLM           | OpenAI (GPT-4o-mini)                                       |
| Speech-to-Text     | Web Speech API, ElevenLabs Scribe, Azure Cognitive Speech  |
| Text-to-Speech     | ElevenLabs TTS                                             |
| Monitoring         | Sentry                                                     |
| Logging            | Winston, loglevel                                          |

---

## 🏗️ How It Works

```
🎤 User speaks
   │
   ▼
Speech Recognition (Web Speech API → ElevenLabs Scribe fallback)
   │
   ▼
/api/openai  →  GPT-4o-mini generates a contextual response
   │
   ▼
/api/elevenlabs/tts  →  Converts response to natural speech
   │
   ▼
🔊 Audio playback (interruptible mid-response)
```

**Core modules**
- `AudioHandler` — manages microphone capture, speech recognition, and audio playback
- `ConversationContext` — maintains chat history for contextual, multi-turn responses
- `VoiceVisualizer` — animated visual feedback for listening / thinking / speaking states
- `ErrorBoundary` — graceful degradation and recovery on failure

**API Routes**
- `POST /api/openai` — processes user input and generates AI responses
- `POST /api/elevenlabs/tts` — converts text responses to speech
- `POST /api/elevenlabs/stt` — speech-to-text fallback via ElevenLabs Scribe

---

## 🚀 Getting Started

**Prerequisites**
- Node.js 18+
- OpenAI API key
- ElevenLabs API key

**Setup**

```bash
git clone <repo-url>
cd voice-assistant-next
npm install
```

Create a `.env.local` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎮 Usage

| Action                     | How                                   |
|-----------------------------|----------------------------------------|
| Start / stop conversation   | Click the button, or press **Space**   |
| Stop immediately            | Press **Esc**                          |
| Change language / accent    | Use the language selector              |
| Review past exchanges       | View conversation history panel        |
| Fix a mis-heard transcript  | Edit inline                            |
| Reset the session           | Clear conversation history             |

---

## 🌐 Browser Compatibility

| Browser        | Speech Recognition Support              |
|-----------------|-------------------------------------------|
| Chrome / Edge    | ✅ Native Web Speech API                   |
| Firefox / Safari | ✅ ElevenLabs Scribe fallback              |
| Mobile browsers  | ⚠️ Limited, varies by device/browser       |

---

## 🔒 Security

- API keys are kept strictly server-side and never exposed to the client
- User input is sanitized before processing
- Requests are cancellable via abort controllers to prevent race conditions

---

## 📂 Project Structure

```
src/
├── app/
│   ├── api/           # Server-side API routes (OpenAI, ElevenLabs)
│   ├── components/    # React UI components
│   └── globals.css    # Global styles
└── lib/                # Shared utilities and configuration
```

---

## 📬 About This Project

This project was built to demonstrate expertise in real-time AI application development — combining speech interfaces, LLM integration, and responsive front-end engineering into a seamless user experience.

Interested in working together on a similar project? Feel free to reach out — happy to discuss architecture, scope, or a custom build for your use case.

---

## 📄 License

MIT License
