# IKS Lab

A responsive Vedic mathematics learning web app built with React, Tailwind CSS, and one Vercel serverless Gemini proxy.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Gemini API

Copy `.env.example` to `.env.local` and add a key from Google AI Studio:

```bash
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-3.5-flash
```

For Vercel deployment, add `GEMINI_API_KEY` and optional `GEMINI_MODEL` in Project Settings > Environment Variables.

The browser only sends requests to `/api/solve`; the Gemini API key is never exposed to the frontend.
