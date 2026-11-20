declare const process: { env: Record<string, string | undefined> };

type VercelRequest = {
  method?: string;
  body?: { prompt?: string; image?: string; mimeType?: string };
};

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const RETRYABLE_STATUSES = new Set([403, 404, 408, 429, 500, 502, 503, 504]);

const VALID_SUTRAS = new Set([
  'nikhilam',
  'ekadhikena',
  'ekanyunena',
  'urdhva',
  'vilokanam',
  'kaprekar',
  'katapayadi',
  'other',
]);

const VALID_CATEGORIES = new Set([
  'multiplication',
  'square',
  'cube_root',
  'kaprekar',
  'cipher',
  'word_problem',
  'concept',
  'other',
]);

// Active, ultra-fast Groq models (Nov 2026)
const GROQ_TEXT_MODELS = [
  'openai/gpt-oss-120b', // ~500 tok/s — highest accuracy + rich Vedic/IKS detail
  'openai/gpt-oss-20b',  // ~1000 tok/s — ultra-snappy backup
  'qwen/qwen3.8-27b',    // ~450 tok/s — strong math fallback
];

const GROQ_VISION_MODELS = [
  'qwen/qwen3.8-27b',    // ~450 tok/s — Groq native multimodal OCR & vision model
];

const STRICT_SCHEMA_MODELS = new Set(['openai/gpt-oss-120b', 'openai/gpt-oss-20b']);

let lastHealthyTextModel: string | null = null;
const cooldownUntil = new Map<string, number>();
const promptCache = new Map<string, Record<string, unknown>>();

const JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    extracted_problem: { type: 'string' },
    category: {
      type: 'string',
      enum: ['multiplication', 'square', 'cube_root', 'kaprekar', 'cipher', 'word_problem', 'concept', 'other'],
    },
    best_sutra: {
      type: 'string',
      enum: ['nikhilam', 'ekadhikena', 'ekanyunena', 'urdhva', 'vilokanam', 'kaprekar', 'katapayadi', 'other'],
    },
    sutra_display_name: { type: 'string' },
    sanskrit_verse: { type: 'string' },
    numbers: { type: 'array', items: { type: 'number' } },
    text_input: { type: 'string' },
    explanation: { type: 'string' },
    historical_note: { type: 'string' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    ai_steps: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          detail: { type: 'string' },
        },
        required: ['title', 'detail'],
      },
    },
  },
  required: [
    'extracted_problem',
    'category',
    'best_sutra',
    'sutra_display_name',
    'sanskrit_verse',
    'numbers',
    'text_input',
    'explanation',
    'historical_note',
    'confidence',
    'ai_steps',
  ],
};

const SYSTEM_PROMPT = `You are GanitaAI, an expert scholar of Vedic Mathematics and Indian Knowledge Systems (Sulba Sutras, Pingala, Aryabhata, Brahmagupta, Bhaskaracharya II's Lilavati, Kerala School).
Always return a single valid JSON object with these exact keys:
{
  "extracted_problem": string,
  "category": "multiplication"|"square"|"cube_root"|"kaprekar"|"cipher"|"word_problem"|"concept"|"other",
  "best_sutra": "nikhilam"|"ekadhikena"|"ekanyunena"|"urdhva"|"vilokanam"|"kaprekar"|"katapayadi"|"other",
  "sutra_display_name": string,
  "sanskrit_verse": string,
  "numbers": number[],
  "text_input": string,
  "explanation": string,
  "historical_note": string,
  "confidence": "high"|"medium"|"low",
  "ai_steps": [{"title": string, "detail": string}]
}

ROUTING RULES:
1. "nikhilam": Multiplying 2 integers close to a power of 10 (e.g., 97 x 94, 104 x 107, 999 x 995) -> numbers: [a, b].
2. "ekadhikena": Squaring an integer ending in 5 (e.g., 65^2, 125 x 125) -> numbers: [n] (ONLY the base integer, NEVER include 2).
3. "ekanyunena": Multiplying integer n by 9, 99, 999, or 9999 where n <= the 9s multiplier -> numbers: [n, 99...].
4. "urdhva": General multiplication of 2 non-negative integers -> numbers: [a, b].
5. "vilokanam": Cube root of an integer -> numbers: [n].
6. "kaprekar": Kaprekar 6174 routine for a 4-digit integer -> numbers: [n].
7. "katapayadi": Encoding a word into digits via Katapayadi -> text_input: "word", numbers: [].
8. "other": Lilavati riddles, Puranapuranabhyam/Chalana-Kalanabhyam quadratics, Paravartya division, Sulba geometry, or conceptual questions -> fill 3 to 5 clear, neat steps in "ai_steps" with exact final answer inside the last step.

QUALITY & ACCURACY RULES:
- For deterministic routes (1–7), DO NOT calculate or state the final numeric answer in "explanation" because local JavaScript computes it with 100% precision. Leave "ai_steps": [].
- Make "explanation" crisp, structured, and mathematically insightful (2–3 sentences explaining the algebraic proof/intuition behind why the Sutra works).
- Provide the authentic Devanagari "sanskrit_verse" (e.g., "निखिलं नवतश्चरमं दशतः") or "" if none applies.
- Provide a neat 1-sentence "historical_note" grounded in real Indian mathematical history (text, scholar, or era).
- Historical accuracy: Swami Bharati Krishna Tirthaji compiled the 16 Vedic Math Sutras in the 20th century (published 1965); Sulba Sutras (~800 BCE), Pingala (~300 BCE), Aryabhata (499 CE), Brahmagupta (628 CE), Bhaskaracharya II's Lilavati (1150 CE), Madhava / Kerala School (14th CE).
- If an image is unclear or has no math, set best_sutra to "other", confidence to "low", and explain politely what was unreadable.`;

function buildGroqOrder(hasImage: boolean): string[] {
  const now = Date.now();
  const basePool = hasImage
    ? [
        ...(process.env.GROQ_VISION_MODEL ? [process.env.GROQ_VISION_MODEL.trim()] : []),
        ...GROQ_VISION_MODELS,
      ]
    : [
        ...(lastHealthyTextModel ? [lastHealthyTextModel] : []),
        ...(process.env.GROQ_MODEL ? [process.env.GROQ_MODEL.trim()] : []),
        ...GROQ_TEXT_MODELS,
      ];

  const unique = Array.from(new Set(basePool)).filter(Boolean);
  const ready = unique.filter(m => (cooldownUntil.get(m) ?? 0) <= now);
  const cooling = unique.filter(m => (cooldownUntil.get(m) ?? 0) > now);
  return [...ready, ...cooling];
}

function extractAndNormalize(rawText: string) {
  // Strip any accidental <think> blocks or markdown fences before parsing JSON
  const cleaned = rawText
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const jsonSlice = start !== -1 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  const parsed = JSON.parse(jsonSlice);

  const bestSutra = VALID_SUTRAS.has(parsed.best_sutra) ? parsed.best_sutra : 'other';
  const category = VALID_CATEGORIES.has(parsed.category) ? parsed.category : 'other';
  const numbers = Array.isArray(parsed.numbers)
    ? parsed.numbers.map(Number).filter((n: number) => Number.isFinite(n))
    : [];
  const aiSteps = Array.isArray(parsed.ai_steps)
    ? parsed.ai_steps
        .filter((s: any) => s && typeof s.title === 'string' && typeof s.detail === 'string')
        .map((s: any) => ({ title: s.title.trim(), detail: s.detail.trim() }))
    : [];

  return {
    extracted_problem: typeof parsed.extracted_problem === 'string' ? parsed.extracted_problem.trim() : '',
    category,
    best_sutra: bestSutra,
    sutra_display_name: typeof parsed.sutra_display_name === 'string' ? parsed.sutra_display_name.trim() : bestSutra,
    sanskrit_verse: typeof parsed.sanskrit_verse === 'string' ? parsed.sanskrit_verse.trim() : '',
    numbers,
    text_input: typeof parsed.text_input === 'string' ? parsed.text_input.trim() : '',
    explanation: typeof parsed.explanation === 'string' ? parsed.explanation.trim() : '',
    historical_note: typeof parsed.historical_note === 'string' ? parsed.historical_note.trim() : '',
    confidence: parsed.confidence === 'low' || parsed.confidence === 'medium' ? parsed.confidence : 'high',
    ai_steps: aiSteps,
  };
}

async function callGroqModel(
  model: string,
  apiKey: string,
  prompt: string,
  image: string,
  mimeType: string,
) {
  const userContent = image
    ? [
        {
          type: 'text',
          text:
            prompt ||
            'Carefully read the handwritten or printed math problem in this image, transcribe it cleanly, and return the required JSON.',
        },
        {
          type: 'image_url',
          image_url: { url: `data:${mimeType};base64,${image}` },
        },
      ]
    : prompt;

  const payload: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    temperature: 0.2,
    max_completion_tokens: 2048,
  };

  if (STRICT_SCHEMA_MODELS.has(model)) {
    // GPT-OSS 120B / 20B: strict constrained JSON + fast low reasoning
    payload.reasoning_effort = 'low';
    payload.include_reasoning = false;
    payload.response_format = {
      type: 'json_schema',
      json_schema: {
        name: 'ganita_response',
        strict: true,
        schema: JSON_SCHEMA,
      },
    };
  } else if (model.startsWith('qwen/')) {
    // Qwen 3.8 27B: hidden reasoning + reliable JSON mode (works cleanly for both Text & Vision)
    payload.reasoning_effort = image ? 'low' : 'none';
    payload.reasoning_format = 'hidden';
    payload.response_format = { type: 'json_object' };
  } else {
    payload.response_format = { type: 'json_object' };
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });

  if (response.ok) {
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { ok: false as const, status: 502, tag: `${model}:empty` };
    return { ok: true as const, data: extractAndNormalize(content) };
  }

  const errText = await response.text();
  console.error(`Groq ${model} (${response.status}):`, errText.slice(0, 300));

  if (response.status === 401) {
    return {
      ok: false as const,
      status: 401,
      fatal: 'Invalid GROQ_API_KEY. Check your key in .env.local or Vercel settings.',
      tag: `${model}:401`,
    };
  }

  if (response.status === 404 || response.status === 403) {
    cooldownUntil.set(model, Date.now() + 10 * 60_000);
  } else if (RETRYABLE_STATUSES.has(response.status)) {
    cooldownUntil.set(model, Date.now() + 45_000);
  }

  return { ok: false as const, status: response.status, tag: `${model}:${response.status}` };
}

// Optional fallback to Gemini only if GEMINI_API_KEY is also configured and Groq fails
async function callGeminiBackup(apiKey: string, prompt: string, image: string, mimeType: string) {
  const parts: unknown[] = [
    { text: prompt || 'Read the handwritten math problem in this image and return the required JSON.' },
  ];
  if (image) parts.push({ inline_data: { mime_type: mimeType, data: image } });

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: 'minimal' },
        },
      }),
      signal: AbortSignal.timeout(7_000),
    },
  );
  if (!response.ok) return null;
  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ? extractAndNormalize(text) : null;
}

export default async function handler(req: VercelRequest, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const groqKey = process.env.GROQ_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  if (!groqKey && !geminiKey) {
    res.status(503).json({ error: 'GROQ_API_KEY is not configured on the server.' });
    return;
  }

  const body = req.body ?? {};
  const prompt = (body.prompt ?? '').trim();
  const rawImage = body.image ?? '';
  const mimeType = body.mimeType ?? 'image/jpeg';

  if (!prompt && !rawImage) {
    res.status(400).json({ error: 'Enter a problem or upload an image first.' });
    return;
  }

  if (rawImage && (!ALLOWED_MIME_TYPES.includes(mimeType) || rawImage.length > 4_000_000)) {
    res.status(400).json({ error: 'Use a JPEG, PNG, or WebP image smaller than 3 MB.' });
    return;
  }

  // Instant 0ms cache for identical text prompts
  const cacheKey = !rawImage ? prompt.toLowerCase() : null;
  if (cacheKey && promptCache.has(cacheKey)) {
    res.status(200).json(promptCache.get(cacheKey));
    return;
  }

  const image = rawImage.replace(/^data:[^;]+;base64,/i, '');
  const failures: string[] = [];
  let lastStatus = 503;

  if (groqKey) {
    const models = buildGroqOrder(Boolean(image));
    for (const model of models) {
      try {
        const result = await callGroqModel(model, groqKey, prompt, image, mimeType);
        if (result.ok) {
          if (!image) lastHealthyTextModel = model;
          cooldownUntil.delete(model);

          if (cacheKey) {
            if (promptCache.size >= 80) {
              const oldest = promptCache.keys().next().value;
              if (oldest) promptCache.delete(oldest);
            }
            promptCache.set(cacheKey, result.data);
          }

          res.status(200).json(result.data);
          return;
        }

        if (result.fatal) {
          res.status(401).json({ error: result.fatal });
          return;
        }

        lastStatus = result.status;
        failures.push(result.tag);
      } catch (err) {
        const msg = err instanceof Error ? err.name : 'net';
        console.error(`Groq ${model} error:`, msg);
        failures.push(`${model}:${msg}`);
        cooldownUntil.set(model, Date.now() + 30_000);
      }
    }
  }

  // Optional Gemini backup if key is still set
  if (geminiKey) {
    try {
      const backup = await callGeminiBackup(geminiKey, prompt, image, mimeType);
      if (backup) {
        if (cacheKey) promptCache.set(cacheKey, backup);
        res.status(200).json(backup);
        return;
      }
    } catch {
      failures.push('gemini-backup:err');
    }
  }

  res.status(lastStatus === 429 ? 429 : 503).json({
    error: `AI service temporarily busy (${failures.slice(0, 3).join(', ')}). Please retry in a moment.`,
  });
}