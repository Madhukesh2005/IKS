# GanitaAI — Neuro-Symbolic Vedic Mathematics & Indian Knowledge Systems

![React](https://img.shields.io/badge/React-TypeScript-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Styling-06B6D4?logo=tailwindcss&logoColor=white)
![Groq AI](https://img.shields.io/badge/Groq-Fast_Inference-F55036)
![Vercel](https://img.shields.io/badge/Vercel-Serverless-000000?logo=vercel&logoColor=white)

**GanitaAI** is a responsive web application built for **Indian Knowledge Systems (IKS)** that unites multimodal AI perception with a deterministic TypeScript mathematics engine. It solves arithmetic problems, reads handwritten math photos, walks through classical *Lilavati* riddles, and lets users explore ancient Indian mathematical traditions with **zero arithmetic hallucination**.

---

## Neuro-Symbolic Architecture

Pure LLMs frequently hallucinate arithmetic, while hardcoded calculators cannot interpret handwritten photos or poetic word problems. **GanitaAI** separates perception from computation:

```text
Text Problem / Lilavati Riddle / Handwritten Photo
                       │
                       ▼
  Serverless Proxy (/api/solve.ts) — Groq-First AI
  • Text & Riddles: openai/gpt-oss-120b → openai/gpt-oss-20b → qwen/qwen3.8-27b
  • Vision OCR:     qwen/qwen3.8-27b (client-side 1024px JPEG compression)
  • Optional Backup: Gemini (gemini-3.5-flash-lite) if Groq is unavailable
  • Returns strict JSON: extracted problem, Sutra ID, numbers, intuition & history
                       │
                       ▼
  Deterministic Math Engine (src/math.ts)
  • Executes exact Vedic algorithms step-by-step in the browser
  • Validates edge cases and guarantees 100% mathematical accuracy
```

---

## Features

### 1. AI Snap & Solve
- **Multimodal Input:** Type arithmetic equations (`97 × 94`, `65²`, `37 × 99`, `∛1728`), paste poetic *Lilavati* word problems, or drag-and-drop/upload handwritten math photos (automatically compressed client-side for fast OCR).
- **Dynamic Sutra Spotlight:** Live right-hand reference panel that updates automatically from the active input, selected Sutra, or AI route—displaying guaranteed Devanagari Sanskrit verses, algebraic formulas, live worked examples, and related prompts across all 16 Sutras and IKS topics.
- **Vedic vs. Modern Comparison:** Displays step-by-step deterministic execution alongside standard school operation counts, algebraic intuition, historical notes, and one-click answer copy (`Ctrl + Enter` supported).

### 2. Vedic Sutras Lab
- **Interactive Deterministic Calculators:**
  - **Nikhilam Navatashcaramam Dashatah** — Dynamic power-of-10 base selection (`10`, `100`, `1000`, …) with exact deviation arithmetic.
  - **Ekadhikena Purvena** — Instant squaring of integers ending in `5` with input validation.
  - **Ekanyunena Purvena** — Fast multiplication by `9`, `99`, `999`, and `9999`.
  - **Urdhva-Tiryagbhyam** — Universal vertical-and-crosswise digit convolution with full column-by-column carry tracking.
- **Complete 16 Sutras & 13 Sub-Sutras Explorer:** Real-time search by Sanskrit name or English meaning, with detail cards and direct **"Try in AI Solver"** routing to the main workspace.

### 3. Ancient Scriptures Lab
- **Baudhayana *Sulba Sutra* (~800 BCE):** Interactive right-triangle SVG altar geometry visualizer with live scaling sliders and Baudhayana's rational $\sqrt{2}$ approximation ($1 + \frac{1}{3} + \frac{1}{3\cdot 4} - \frac{1}{3\cdot 4\cdot 34}$) compared against `Math.SQRT2`.
- **Madhava–Gregory $\pi$ Series (14th CE, Kerala School):** Adjustable series-term slider (`1`–`500`) visualizing live convergence toward $\pi$.
- **Vilokanam Cube Root:** Mental cube-root inspection with step-by-step breakdown and exact cube validation.
- **Kaprekar's Constant (`6174`, 1949):** Step-by-step convergence path with 4-digit and repdigit validation.
- **Katapayadi Sankhya Cipher:** Consonant-to-digit encoding showing both left-to-right digits and traditional right-to-left reversal (*Ankanam Vamato Gatih*), including classical presets (*Mayamalavagowla* $\rightarrow$ `15`).
- **Pingala's *Meru Prastara* (~300 BCE):** Interactive Pascal's Triangle combinatorics generator (`2`–`8` rows).

### 4. Dynamic Speed Quiz
- **Non-Repeating Procedural Generator:** Generates 5 fresh questions every round across 5 Vedic methods (*Nikhilam*, *Ekadhikena*, *Ekanyunena*, *Urdhva-Tiryagbhyam*, and *Vilokanam*) with smart distractors and a 20-second timer per question.
- **Browser Persistence (`localStorage`):** Tracks `iks-best-score` and `iks-quiz-seen` locally without requiring a database or user login.
- **Full Solution Review & AI Intuition:** End-of-quiz summary displaying accuracy, average speed, every deterministic Vedic walkthrough, and an on-demand **"Explain with AI"** button per question.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| **Math Core** | Deterministic TypeScript (`src/math.ts`) |
| **Serverless API** | Vercel Functions (`api/solve.ts`) + Vite Dev Middleware (`vite.config.ts`) |
| **AI Inference** | Groq API (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`) + optional Gemini (`gemini-3.5-flash-lite`) fallback |
| **State & Storage** | React Hooks + Browser `localStorage` |

---

## Project Structure

```text
├── api/
│   └── solve.ts         # Server-side Groq-first AI proxy (text + vision + cache + fallback)
├── src/
│   ├── App.tsx          # 4-tab responsive UI, Dynamic Spotlight, Scriptures Lab & Quiz
│   ├── App.css          # Design system, animations, and mobile/desktop layouts
│   ├── index.css        # CSS custom properties, typography & Tailwind entry
│   ├── math.ts          # Deterministic Vedic & Indian math calculation engine
│   └── main.tsx         # React root entry point
├── vite.config.ts       # Vite config with local /api/solve dev middleware parity
├── .env.example         # Environment variable template (safe for Git)
└── package.json         # Scripts and dependencies
```

---

## Local Setup

1. **Clone the repository and install dependencies:**
   ```bash
   git clone [https://github.com/Madhukesh2005/ganita-ai.git](https://github.com/Madhukesh2005/ganita-ai.git)
   cd ganita-ai
   npm install
   ```

2. **Create `.env.local` from the template:**
   ```bash
   cp .env.example .env.local
   ```

3. **Add your Groq API key inside `.env.local`:**
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=openai/gpt-oss-120b
   GROQ_VISION_MODEL=qwen/qwen3.8-27b

   # Optional silent fallback if Groq is unavailable
   GEMINI_API_KEY=
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   `vite.config.ts` includes a dev-only middleware plugin that runs `/api/solve.ts` locally, so both the UI and live AI routes work immediately on `npm run dev`.

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## Deploying to Vercel

1. Push this repository to GitHub (`.env.local` is ignored via `.gitignore`).
2. Import the repository in the **Vercel Dashboard**.
3. Configure **Project Settings → Environment Variables**:
   - `GROQ_API_KEY` — Your Groq Console API key
   - `GROQ_MODEL` — `openai/gpt-oss-120b`
   - `GROQ_VISION_MODEL` — `qwen/qwen3.8-27b`
   - `GEMINI_API_KEY` — *(Optional silent backup)*
4. Click **Deploy**. Vercel automatically builds the Vite frontend and deploys `api/solve.ts` as a serverless endpoint.

---

## Security & Reliability

- **Zero Client-Side Secrets:** API keys remain strictly server-side in `.env.local` (local) and Vercel Environment Variables (production). The browser only calls `/api/solve`.
- **Input & Payload Guards:** Validates image MIME types (`image/jpeg`, `image/png`, `image/webp`), enforces payload size limits, strips Base64 prefixes, and sanitizes LLM JSON output before rendering.
- **Fast Caching & Failover:** In-memory prompt caching serves repeated text queries instantaneously, while cooldown-aware failover switches smoothly across models if an upstream provider hits rate limits.

---

## Indian Knowledge Systems (IKS) Historical Grounding

- **Sulba Sutras (Baudhayana, ~800 BCE):** Geometric altar constructions and rational $\sqrt{2}$ approximation.
- **Chandas Shastra (Pingala, ~300 BCE):** *Meru Prastara* (binomial coefficients / Pascal's Triangle) and binary prosody.
- **Aryabhatiya (Aryabhata, 499 CE)** & **Brahmasphutasiddhanta (Brahmagupta, 628 CE):** Foundational Indian arithmetic, zero, and algebra traditions.
- **Lilavati (Bhaskaracharya II, 1150 CE):** Classical poetic mathematical riddles.
- **Kerala School of Mathematics (Madhava of Sangamagrama, 14th CE):** Infinite power series for $\pi$.
- **D. R. Kaprekar (1949):** Discovery of Kaprekar's Constant (`6174`).
- **Vedic Mathematics (Swami Bharati Krishna Tirthaji, published 1965):** Systematization of the 16 Sutras and 13 Sub-Sutras.
