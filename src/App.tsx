import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Calculator,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Copy,
  FileImage,
  FlaskConical,
  ImagePlus,
  Landmark,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import './App.css';
import {
  cubeRoot,
  ekadhikenaSquare,
  ekanyunena,
  kaprekar,
  katapayadi,
  nikhilam,
  pickBase,
  urdhva,
  type Step,
} from './math';

type Tab = 'snap' | 'sutras' | 'scriptures' | 'quiz';

type AIResponse = {
  extracted_problem?: string;
  category?: string;
  best_sutra?: string;
  sutra_display_name?: string;
  sanskrit_verse?: string;
  numbers?: number[];
  text_input?: string;
  explanation?: string;
  historical_note?: string;
  confidence?: 'high' | 'medium' | 'low';
  ai_steps?: Step[];
};

type UnifiedResult = {
  answer: number | string | null;
  steps: Step[];
  error?: string;
};

type UploadedImage = {
  name: string;
  data: string;
  mime: string;
  preview: string;
  sizeKB: number;
};

type SpotlightEntry = {
  id: string;
  badge: string;
  sanskrit: string;
  name: string;
  meaning: string;
  formula: string;
  exampleProblem: string;
  exampleSteps: string[];
  exampleAnswer: string;
  quickExamples: string[];
  aliases: string[];
};

const SUTRAS: [string, string, string][] = [
  ['Ekadhikena Purvena', 'By one more than the previous', '65²'],
  ['Nikhilam Navatashcaramam Dashatah', 'All from 9 and the last from 10', '97 × 94'],
  ['Urdhva-Tiryagbhyam', 'Vertically and crosswise', '23 × 41'],
  ['Paraavartya Yojayet', 'Transpose and adjust', 'Explain Paraavartya Yojayet with an example (13799 ÷ 113)'],
  ['Shunyam Saamyasamuccaye', 'If the sum is the same, sum is zero', 'Solve (x + 2) + (x + 3) = 0 using Shunyam Saamyasamuccaye'],
  ['Anurupye Shunyamanyat', 'If one is in ratio, the other is zero', 'Solve 5x + 6y = 3 and 10x + 18y = 6 using Anurupye Shunyamanyat'],
  ['Sankalana-Vyavakalanabhyam', 'By addition and subtraction', 'Solve 45x - 23y = 113 and 23x - 45y = 91'],
  ['Puranapuranabhyam', 'By the completion or non-completion', 'Explain Puranapuranabhyam with a quadratic example'],
  ['Chalana-Kalanabhyam', 'Differences and similarities', 'Explain Chalana-Kalanabhyam in quadratic roots'],
  ['Yaavadunam', 'Whatever the extent of its deficiency', 'Square 98 using Yaavadunam'],
  ['Vyashtisamashtih', 'Part and whole', 'Explain Vyashtisamashtih with an average example'],
  ['Shesanyankena Charamena', 'The remainders by the last digit', 'Convert 1/7 to a decimal using Shesanyankena Charamena'],
  ['Sopantyadvayamantyam', 'The ultimate and twice the penultimate', 'Explain Sopantyadvayamantyam with a rational equation'],
  ['Ekanyunena Purvena', 'By one less than the previous', '37 × 99'],
  ['Gunitasamuccayah', 'The product of the sum is the sum', 'Verify (x + 2)(x + 3) = x² + 5x + 6 using Gunitasamuccayah'],
  ['Gunakasamuccayah', 'The factors of the sum equal the sum of factors', 'Factorize x² + 5x + 6 and verify with Gunakasamuccayah'],
];

const SUB_SUTRAS = [
  'Anurupyena',
  'Shishyate Sheshasanjnah',
  'Adyamadyenantyamantyena',
  'Kevalaih Saptakam Gunyat',
  'Veshtanam',
  'Yavadunam Tavadunam',
  'Yavadunam Tavadunikritya Vargancha Yojayet',
  'Antyayordashake’pi',
  'Antyayoreva',
  'Samuccayagunitah',
  'Lopanasthapanabhyam',
  'Vilokanam',
  'Gunitasamuccayah Samuccayagunitah',
];

const SPOTLIGHT_ENTRIES: SpotlightEntry[] = [
  {
    id: 'ekadhikena',
    badge: '01',
    sanskrit: 'एकाधिकेन पूर्वेण',
    name: 'Ekadhikena Purvena',
    meaning: '“By one more than the previous one.”',
    formula: '(10p + 5)² = p(p + 1) | 25',
    exampleProblem: '65²',
    exampleSteps: [
      'Prefix before 5 is p = 6',
      'Multiply p × (p + 1) = 6 × 7 = 42',
      'Append 25 to the right → 42 | 25',
    ],
    exampleAnswer: '65² = 4225',
    quickExamples: ['65²', '35²', '125²', '95²', '97 × 94'],
    aliases: ['ekadhikena', 'ekadhikena purvena'],
  },
  {
    id: 'nikhilam',
    badge: '02',
    sanskrit: 'निखिलं नवतश्चरमं दशतः',
    name: 'Nikhilam Navatashcaramam Dashatah',
    meaning: '“All from 9 and the last from 10.”',
    formula: '(a + d₂) × Base + (d₁ × d₂)',
    exampleProblem: '97 × 94',
    exampleSteps: [
      'Nearest base = 100 → d₁ = −3, d₂ = −6',
      'Cross-subtract: 97 − 6 = 91 (or 94 − 3)',
      'Multiply deviations: (−3) × (−6) = 18',
    ],
    exampleAnswer: '97 × 94 = 9118',
    quickExamples: ['97 × 94', '999 × 995', '104 × 107', '65²', '37 × 99'],
    aliases: ['nikhilam', 'nikhilam navatascaramam dasatah', 'nikhilam navatashcaramam dashatah'],
  },
  {
    id: 'urdhva',
    badge: '03',
    sanskrit: 'ऊर्ध्वतिर्यग्भ्याम्',
    name: 'Urdhva-Tiryagbhyam',
    meaning: '“Vertically and crosswise.”',
    formula: '(10a + b)(10c + d) = ac | (ad + bc) | bd',
    exampleProblem: '23 × 41',
    exampleSteps: [
      'Right vertical (units): 3 × 1 = 3',
      'Crosswise (tens): (2 × 1) + (3 × 4) = 14 → write 4, carry 1',
      'Left vertical (hundreds): (2 × 4) + 1 = 9',
    ],
    exampleAnswer: '23 × 41 = 943',
    quickExamples: ['23 × 41', '34 × 52', '124 × 235', '97 × 94', '65²'],
    aliases: ['urdhva', 'urdhva-tiryagbhyam', 'urdhva tiryagbhyam'],
  },
  {
    id: 'paravartya',
    badge: '04',
    sanskrit: 'परावर्त्य योजयेत्',
    name: 'Paravartya Yojayet',
    meaning: '“Transpose and adjust (Synthetic Division).”',
    formula: 'Divisor 100 + d  ⇒  Transpose to −d',
    exampleProblem: '13799 ÷ 113',
    exampleSteps: [
      'Base = 100, excess = +13 → transposed digits = −1, −3',
      'Bring down 1; multiply & shift across columns',
      'Quotient digits = 122, Remainder = 13',
    ],
    exampleAnswer: 'Q = 122, R = 13',
    quickExamples: [
      'Explain Paraavartya Yojayet with an example (13799 ÷ 113)',
      'Divide 1234 by 112 using Paravartya Yojayet',
      '97 × 94',
      '65²',
    ],
    aliases: ['paravartya', 'paraavartya', 'paravartya yojayet', 'paraavartya yojayet'],
  },
  {
    id: 'shunyam',
    badge: '05',
    sanskrit: 'शून्यं साम्यसमुच्चये',
    name: 'Shunyam Saamyasamuccaye',
    meaning: '“When the sum (or common factor) is the same, equate it to zero.”',
    formula: 'a·f(x) = b·f(x) (a ≠ b)  ⇒  f(x) = 0',
    exampleProblem: '9(x + 1) = 5(x + 1)',
    exampleSteps: [
      'Spot identical factor (x + 1) on both sides',
      'Since 9 ≠ 5, set common Samuccaya to 0',
      'x + 1 = 0  ⇒  x = −1 in one line',
    ],
    exampleAnswer: 'x = −1',
    quickExamples: [
      'Solve (x + 2) + (x + 3) = 0 using Shunyam Saamyasamuccaye',
      'Solve 9(x + 1) = 5(x + 1) using Shunyam Saamyasamuccaye',
      '97 × 94',
    ],
    aliases: ['shunyam', 'saamyasamuccaye', 'shunyam saamyasamuccaye'],
  },
  {
    id: 'anurupye',
    badge: '06',
    sanskrit: 'आनुरूप्ये शून्यमन्यत्',
    name: 'Anurupye Shunyamanyat',
    meaning: '“If one variable is in ratio with constants, the other is zero.”',
    formula: 'a₁/a₂ = c₁/c₂  ⇒  y = 0, x = c₁/a₁',
    exampleProblem: '5x + 6y = 3,  10x + 18y = 6',
    exampleSteps: [
      'Check x-coefficients ratio: 5 : 10 = 1 : 2',
      'Check constants ratio: 3 : 6 = 1 : 2 (exact match!)',
      'Immediately set y = 0  ⇒  5x = 3  ⇒  x = 3/5',
    ],
    exampleAnswer: 'x = 3/5, y = 0',
    quickExamples: [
      'Solve 5x + 6y = 3 and 10x + 18y = 6 using Anurupye Shunyamanyat',
      'Solve 45x - 23y = 113 and 23x - 45y = 91',
      '97 × 94',
    ],
    aliases: ['anurupye', 'shunyamanyat', 'anurupye shunyamanyat'],
  },
  {
    id: 'sankalana',
    badge: '07',
    sanskrit: 'सङ्कलनव्यवकलनाभ्याम्',
    name: 'Sankalana-Vyavakalanabhyam',
    meaning: '“By addition and by subtraction.”',
    formula: 'ax + by = c₁, bx + ay = c₂ ⇒ Add & Subtract',
    exampleProblem: '45x − 23y = 113,  23x − 45y = 91',
    exampleSteps: [
      'Coefficients (45, −23) are swapped across equations',
      'Add equations: 68(x − y) = 204  ⇒  x − y = 3',
      'Subtract equations: 22(x + y) = 22  ⇒  x + y = 1',
    ],
    exampleAnswer: 'x = 2, y = −1',
    quickExamples: [
      'Solve 45x - 23y = 113 and 23x - 45y = 91',
      'Solve 17x + 13y = 47 and 13x + 17y = 43',
      '97 × 94',
    ],
    aliases: ['sankalana', 'vyavakalanabhyam', 'sankalana-vyavakalanabhyam'],
  },
  {
    id: 'puranapuranabhyam',
    badge: '08',
    sanskrit: 'पूरणापूरणाभ्याम्',
    name: 'Puranapuranabhyam',
    meaning: '“By the completion or non-completion.”',
    formula: 'x² + bx = c  ⇒  (x + b/2)² = c + (b/2)²',
    exampleProblem: 'x² + 2x − 8 = 0',
    exampleSteps: [
      'Complete the square by adding & subtracting (2/2)² = 1',
      '(x² + 2x + 1) − 9 = 0  ⇒  (x + 1)² = 9',
      'Take roots: x + 1 = ±3  ⇒  x = 2 or −4',
    ],
    exampleAnswer: 'x = 2, −4',
    quickExamples: [
      'Explain Puranapuranabhyam with a quadratic example',
      'Solve x² + 6x - 16 = 0 by completing the square',
      'Explain Chalana-Kalanabhyam in quadratic roots',
    ],
    aliases: ['puranapuranabhyam', 'purana', 'completing the square'],
  },
  {
    id: 'chalana',
    badge: '09',
    sanskrit: 'चलनकलनाभ्याम्',
    name: 'Chalana-Kalanabhyam',
    meaning: '“Differences and similarities (Differential Calculus).”',
    formula: "f'(x) = 2ax + b = ±√(b² − 4ac)",
    exampleProblem: 'x² − 5x + 6 = 0',
    exampleSteps: [
      'Compute first derivative: f′(x) = 2x − 5',
      'Find discriminant root: ±√(25 − 24) = ±1',
      'Equate: 2x − 5 = ±1  ⇒  2x = 6 or 4',
    ],
    exampleAnswer: 'x = 3, 2',
    quickExamples: [
      'Explain Chalana-Kalanabhyam in quadratic roots',
      'Find roots of 2x² - 7x + 3 = 0 using Chalana-Kalanabhyam',
      'Explain Puranapuranabhyam with a quadratic example',
    ],
    aliases: ['chalana', 'kalanabhyam', 'chalana-kalanabhyam', 'chalana-kalanabyham'],
  },
  {
    id: 'yaavadunam',
    badge: '10',
    sanskrit: 'यावदूनम्',
    name: 'Yaavadunam',
    meaning: '“Whatever the extent of its deficiency, lessen it further.”',
    formula: 'n² = (n + d) × Base + d²  (d = n − Base)',
    exampleProblem: '98²',
    exampleSteps: [
      'Nearest base = 100; deficiency d = 98 − 100 = −2',
      'Lessen further by deficiency: 98 − 2 = 96',
      'Append d² = (−2)² = 04 → 96 | 04',
    ],
    exampleAnswer: '98² = 9604',
    quickExamples: ['Square 98 using Yaavadunam', 'Square 104 using Yaavadunam', '97 × 94', '65²'],
    aliases: ['yaavadunam', 'yavadunam'],
  },
  {
    id: 'vyashtisamashtih',
    badge: '11',
    sanskrit: 'व्यष्टिसमष्टिः',
    name: 'Vyashtisamashtih',
    meaning: '“Part and whole (Assumed Mean / Symmetry).”',
    formula: 'Mean = Assumed Mean + (Σ deviations) / N',
    exampleProblem: 'Average of 68, 72, 75, 65, 70',
    exampleSteps: [
      'Pick convenient whole-reference mean = 70',
      'Part deviations: −2, +2, +5, −5, 0 (sum = 0)',
      'Average = 70 + (0 / 5) = 70',
    ],
    exampleAnswer: 'Mean = 70',
    quickExamples: [
      'Explain Vyashtisamashtih with an average example',
      'Find average of 96, 102, 104, 98 using Vyashtisamashtih',
      '97 × 94',
    ],
    aliases: ['vyashtisamashtih', 'vyastisamastih', 'vyashti'],
  },
  {
    id: 'shesanyankena',
    badge: '12',
    sanskrit: 'शेषाण्यङ्केन चरमेण',
    name: 'Shesanyankena Charamena',
    meaning: '“The remainders by the last digit.”',
    formula: '1/p → Multiply remainder by Ekadhika multiplier',
    exampleProblem: '1 / 7 as recurring decimal',
    exampleSteps: [
      'For denominator 7 (7 × 7 = 49 → 50), multiplier = 5',
      'Start from right digit 1: 1×5=5, 5×5=25, etc.',
      'Generates full 6-digit cycle without long division',
    ],
    exampleAnswer: '1/7 = 0.142857142857…',
    quickExamples: [
      'Convert 1/7 to a decimal using Shesanyankena Charamena',
      'Convert 1/19 using Shesanyankena Charamena',
      '97 × 94',
    ],
    aliases: ['shesanyankena', 'charamena', 'shesanyankena charamena'],
  },
  {
    id: 'sopantyadvayamantyam',
    badge: '13',
    sanskrit: 'सोपान्त्यद्वयमन्त्यम्',
    name: 'Sopantyadvayamantyam',
    meaning: '“The ultimate and twice the penultimate.”',
    formula: '1/(AB) + 1/(AC) = 1/(AD) + 1/(BC) ⇒ 2C + D = 0',
    exampleProblem: '1/(x+2)(x+3) + 1/(x+2)(x+4) = 1/(x+2)(x+5) + 1/(x+3)(x+4)',
    exampleSteps: [
      'Denominators follow AP terms: A=x+2, B=x+3, C=x+4, D=x+5',
      'Apply ultimate (D) + twice penultimate (2C) = 0',
      '2(x + 4) + (x + 5) = 0  ⇒  3x + 13 = 0',
    ],
    exampleAnswer: 'x = −13/3',
    quickExamples: [
      'Explain Sopantyadvayamantyam with a rational equation',
      'Solve (x + 2) + (x + 3) = 0 using Shunyam Saamyasamuccaye',
      '97 × 94',
    ],
    aliases: ['sopantyadvayamantyam', 'sopaantyadvayamantyam', 'sopantya'],
  },
  {
    id: 'ekanyunena',
    badge: '14',
    sanskrit: 'एकन्यूनेन पूर्वेण',
    name: 'Ekanyunena Purvena',
    meaning: '“By one less than the previous one.”',
    formula: 'n × (10ᵏ − 1) = (n − 1) | (9…9 − (n − 1))',
    exampleProblem: '37 × 99',
    exampleSteps: [
      'Reduce multiplicand by 1: 37 − 1 = 36',
      'Subtract 36 from 99: 99 − 36 = 63',
      'Join left and right parts → 36 | 63',
    ],
    exampleAnswer: '37 × 99 = 3663',
    quickExamples: ['37 × 99', '458 × 999', '8 × 9', '97 × 94', '65²'],
    aliases: ['ekanyunena', 'ekanyunena purvena'],
  },
  {
    id: 'gunitasamuccayah',
    badge: '15',
    sanskrit: 'गुणितसमुच्चयः',
    name: 'Gunitasamuccayah',
    meaning: '“The product of the sum equals the sum of the product.”',
    formula: 'S_c(P₁) × S_c(P₂) = S_c(P₁ · P₂)  [at x = 1]',
    exampleProblem: '(x + 2)(x + 3) = x² + 5x + 6',
    exampleSteps: [
      'Sum of coefficients of factors: (1 + 2) × (1 + 3) = 3 × 4 = 12',
      'Sum of coefficients of product: 1 + 5 + 6 = 12',
      '12 = 12 → Algebraic expansion verified instantly',
    ],
    exampleAnswer: 'Verified: 12 = 12',
    quickExamples: [
      'Verify (x + 2)(x + 3) = x² + 5x + 6 using Gunitasamuccayah',
      'Factorize x² + 5x + 6 and verify with Gunakasamuccayah',
      '97 × 94',
    ],
    aliases: ['gunitasamuccayah', 'gunita'],
  },
  {
    id: 'gunakasamuccayah',
    badge: '16',
    sanskrit: 'गुणकसमुच्चयः',
    name: 'Gunakasamuccayah',
    meaning: '“The factors of the sum equal the sum of the factors.”',
    formula: 'S_c(P) = ∏ S_c(Factor_i)',
    exampleProblem: 'Factorize x² + 5x + 6',
    exampleSteps: [
      'Sum of polynomial coefficients: 1 + 5 + 6 = 12',
      'Split 12 into factors (1 + 2)(1 + 3) = 3 × 4 = 12',
      'Matches linear factors (x + 2)(x + 3)',
    ],
    exampleAnswer: '(x + 2)(x + 3)',
    quickExamples: [
      'Factorize x² + 5x + 6 and verify with Gunakasamuccayah',
      'Verify (x + 2)(x + 3) = x² + 5x + 6 using Gunitasamuccayah',
      '97 × 94',
    ],
    aliases: ['gunakasamuccayah', 'gunaka'],
  },
  {
    id: 'vilokanam',
    badge: 'UP',
    sanskrit: 'विलोकनम्',
    name: 'Vilokanam (Upasutra)',
    meaning: '“By mere observation (Cube Root Inspection).”',
    formula: '∛(Prefix | Last 3 digits) → Tens | Unit Digit',
    exampleProblem: '∛1728',
    exampleSteps: [
      'Last digit 8 maps uniquely to cube unit digit 2',
      'Prefix before last 3 digits is 1 (1³ ≤ 1 < 2³)',
      'Combine tens 1 and unit 2 → 12',
    ],
    exampleAnswer: '∛1728 = 12',
    quickExamples: ['Cube root of 1728', 'Cube root of 3375', 'Cube root of 8000', '97 × 94'],
    aliases: ['vilokanam', 'cube root', '∛'],
  },
  {
    id: 'kaprekar',
    badge: 'IKS',
    sanskrit: 'कापरेकर स्थिराङ्कः (६१७४)',
    name: 'Kaprekar’s Routine',
    meaning: '“4-digit descending minus ascending converges to 6174.”',
    formula: 'K(n) = desc(n) − asc(n)  →  6174 in ≤ 7 steps',
    exampleProblem: '3524 → 6174',
    exampleSteps: [
      'Step 1: 5432 − 2345 = 3087',
      'Step 2: 8730 − 0378 = 8352',
      'Step 3: 8532 − 2358 = 6174 (Fixed Point)',
    ],
    exampleAnswer: 'Converges to 6174',
    quickExamples: ['Kaprekar routine for 3524', 'Kaprekar routine for 1949', '97 × 94'],
    aliases: ['kaprekar', '6174'],
  },
  {
    id: 'katapayadi',
    badge: 'IKS',
    sanskrit: 'कटपयादि सङ्ख्या',
    name: 'Katapayadi Sankhya',
    meaning: '“Consonant-to-digit encoding read right-to-left.”',
    formula: 'ka,ta,pa,ya=1 … jha,dha=9, nya,na=0 (Reversed)',
    exampleProblem: 'Mayamalavagowla → 15',
    exampleSteps: [
      'First two syllables: Ma = 5, Ya = 1 → forward 51',
      'Apply Ankanam Vamato Gatih (digits move right-to-left)',
      'Reverse 51 → 15 (15th Melakarta Raga)',
    ],
    exampleAnswer: 'Encoded = 15',
    quickExamples: ['Encode Mayamalavagowla in Katapayadi', 'Encode Rama in Katapayadi', '97 × 94'],
    aliases: ['katapayadi', 'bhutasankhya'],
  },
  {
    id: 'lilavati',
    badge: 'IKS',
    sanskrit: 'लीलावती (भास्कराचार्यः)',
    name: 'Bhaskaracharya’s Lilavati',
    meaning: '“Classical Indian algebraic & fractional word riddles.”',
    formula: 'Translate poetic verse → Linear / Quadratic equation',
    exampleProblem: 'Swarm of Bees Riddle (1150 CE)',
    exampleSteps: [
      'Let total bees = x: x/5 + x/3 + 3(x/3 − x/5) + 1 = x',
      'Combine fractions: (3x + 5x + 6x)/15 + 1 = x',
      '14x/15 + 1 = x  ⇒  x/15 = 1',
    ],
    exampleAnswer: 'x = 15 bees',
    quickExamples: [
      'One-fifth of a swarm of bees went to a lotus, one-third to a kadamba flower, three times the difference went to a kutaja, and 1 bee stayed hovering. How many bees were there?',
      '97 × 94',
      '65²',
    ],
    aliases: ['lilavati', 'bees', 'lotus', 'kadamba', 'bhaskaracharya'],
  },
];

const SPOTLIGHT_BY_ID = new Map(SPOTLIGHT_ENTRIES.map(entry => [entry.id, entry]));

function buildDynamicSpotlight(
  base: SpotlightEntry,
  inferred: { sutra: string; numbers: number[] } | null,
): SpotlightEntry {
  if (!inferred || inferred.sutra !== base.id) return base;

  if (base.id === 'ekadhikena' && inferred.numbers.length >= 1) {
    const n = Math.abs(inferred.numbers[0]);
    if (Number.isInteger(n) && n % 10 === 5) {
      const p = Math.floor(n / 10);
      const ans = p * (p + 1) * 100 + 25;
      return {
        ...base,
        exampleProblem: `${n}²`,
        exampleSteps: [
          `Prefix before 5 is p = ${p}`,
          `Multiply p × (p + 1) = ${p} × ${p + 1} = ${p * (p + 1)}`,
          `Append 25 to the right → ${p * (p + 1)} | 25`,
        ],
        exampleAnswer: `${n}² = ${ans}`,
      };
    }
  }

  if (base.id === 'nikhilam' && inferred.numbers.length >= 2) {
    const [a, b] = inferred.numbers;
    const max = Math.max(a, b, 1);
    const nearest = 10 ** Math.round(Math.log10(max));
    const close = nearest >= 10 && Math.abs(a - nearest) <= nearest * 0.2 && Math.abs(b - nearest) <= nearest * 0.2;
    if (close) {
      const baseNum = pickBase(a, b);
      const da = a - baseNum;
      const db = b - baseNum;
      const left = a + db;
      const right = da * db;
      return {
        ...base,
        exampleProblem: `${a} × ${b}`,
        exampleSteps: [
          `Nearest base = ${baseNum} → d₁ = ${da >= 0 ? `+${da}` : da}, d₂ = ${db >= 0 ? `+${db}` : db}`,
          `Cross-combine: ${a} ${db >= 0 ? '+' : '−'} ${Math.abs(db)} = ${left}`,
          `Multiply deviations: (${da}) × (${db}) = ${right}`,
        ],
        exampleAnswer: `${a} × ${b} = ${left * baseNum + right}`,
      };
    }
  }

  if (base.id === 'ekanyunena' && inferred.numbers.length >= 2) {
    const [x, y] = inferred.numbers;
    const nine = /^9+$/.test(String(y)) ? y : /^9+$/.test(String(x)) ? x : null;
    const n = nine === y ? x : nine === x ? y : null;
    if (nine !== null && n !== null && n >= 1 && n <= nine) {
      const digits = String(nine).length;
      const left = n - 1;
      const right = nine - left;
      return {
        ...base,
        exampleProblem: `${n} × ${nine}`,
        exampleSteps: [
          `Reduce multiplicand by 1: ${n} − 1 = ${left}`,
          `Complement from ${nine}: ${nine} − ${left} = ${String(right).padStart(digits, '0')}`,
          `Join both parts → ${left} | ${String(right).padStart(digits, '0')}`,
        ],
        exampleAnswer: `${n} × ${nine} = ${n * nine}`,
      };
    }
  }

  if (base.id === 'vilokanam' && inferred.numbers.length >= 1) {
    const n = inferred.numbers[0];
    const c = cubeRoot(n);
    if (c.exact && c.result !== null) {
      return {
        ...base,
        exampleProblem: `∛${n}`,
        exampleSteps: c.steps.map(s => s.detail),
        exampleAnswer: `∛${n} = ${c.result}`,
      };
    }
  }

  return base;
}

function detectSpotlightEntry(
  promptText: string,
  pinnedSutraName: string,
  aiSutraId: string | undefined,
  inferred: { sutra: string; numbers: number[] } | null,
): SpotlightEntry {
  const defaultEntry = SPOTLIGHT_BY_ID.get('nikhilam')!;

  if (aiSutraId && aiSutraId !== 'other' && SPOTLIGHT_BY_ID.has(aiSutraId)) {
    return buildDynamicSpotlight(SPOTLIGHT_BY_ID.get(aiSutraId)!, inferred);
  }

  const combined = `${pinnedSutraName} ${promptText}`.toLowerCase().trim();
  if (combined) {
    for (const entry of SPOTLIGHT_ENTRIES) {
      if (entry.aliases.some(alias => combined.includes(alias))) {
        return buildDynamicSpotlight(entry, inferred);
      }
    }
  }

  if (inferred && SPOTLIGHT_BY_ID.has(inferred.sutra)) {
    return buildDynamicSpotlight(SPOTLIGHT_BY_ID.get(inferred.sutra)!, inferred);
  }

  if (/x\^2|x²/.test(combined) && /=\s*0/.test(combined)) {
    return SPOTLIGHT_BY_ID.get('puranapuranabhyam')!;
  }
  if (/1\s*\/\s*(7|13|17|19|23|29)\b/.test(combined)) {
    return SPOTLIGHT_BY_ID.get('shesanyankena')!;
  }
  if (/\d+\s*[÷/]\s*\d+/.test(combined)) {
    return SPOTLIGHT_BY_ID.get('paravartya')!;
  }

  return defaultEntry;
}

function inferLocalProblem(raw: string): { sutra: string; numbers: number[]; displayName: string } | null {
  const text = raw.trim();
  if (!text) return null;

  const squareMatch = text.match(/^(-?\d+)\s*(?:\^2|²)$/);
  if (squareMatch) {
    const n = Number(squareMatch[1]);
    if (Math.abs(n) % 10 === 5) {
      return { sutra: 'ekadhikena', numbers: [n], displayName: 'Ekadhikena Purvena' };
    }
    return { sutra: 'urdhva', numbers: [Math.abs(n), Math.abs(n)], displayName: 'Urdhva-Tiryagbhyam' };
  }

  const cubeMatch = text.match(/^(?:∛|cube\s*root(?:\s*of)?)\s*(\d+)$/i);
  if (cubeMatch) {
    return { sutra: 'vilokanam', numbers: [Number(cubeMatch[1])], displayName: 'Vilokanam (Cube Root)' };
  }

  const multMatch = text.match(/^(\d+)\s*[×x*]\s*(\d+)$/i);
  if (multMatch) {
    const a = Number(multMatch[1]);
    const b = Number(multMatch[2]);
    if (a === b && a % 10 === 5) {
      return { sutra: 'ekadhikena', numbers: [a], displayName: 'Ekadhikena Purvena' };
    }
    if ((/^9+$/.test(String(b)) && a <= b) || (/^9+$/.test(String(a)) && b <= a)) {
      return { sutra: 'ekanyunena', numbers: [a, b], displayName: 'Ekanyunena Purvena' };
    }
    const max = Math.max(a, b, 1);
    const nearest = 10 ** Math.round(Math.log10(max));
    const closeToBase =
      nearest >= 10 && Math.abs(a - nearest) <= nearest * 0.2 && Math.abs(b - nearest) <= nearest * 0.2;
    return closeToBase
      ? { sutra: 'nikhilam', numbers: [a, b], displayName: 'Nikhilam Navatashcaramam' }
      : { sutra: 'urdhva', numbers: [a, b], displayName: 'Urdhva-Tiryagbhyam' };
  }

  return null;
}

function dispatchSutra(sutra: string, numbers: number[], textInput?: string): UnifiedResult | null {
  switch (sutra) {
    case 'nikhilam':
      return numbers.length >= 2 ? nikhilam(numbers[0], numbers[1]) : null;
    case 'ekadhikena':
      return numbers[0] !== undefined ? ekadhikenaSquare(numbers[0]) : null;
    case 'ekanyunena': {
      if (numbers.length < 2) return null;
      const [a, b] = numbers;
      if (/^9+$/.test(String(b))) return ekanyunena(a, String(b).length);
      if (/^9+$/.test(String(a))) return ekanyunena(b, String(a).length);
      return urdhva(a, b);
    }
    case 'urdhva':
      return numbers.length >= 2 ? urdhva(numbers[0], numbers[1]) : null;
    case 'vilokanam': {
      if (numbers[0] === undefined) return null;
      const c = cubeRoot(numbers[0]);
      return {
        answer: c.result,
        steps: c.steps,
        error: c.error ?? (c.exact ? undefined : 'Not a perfect integer cube.'),
      };
    }
    case 'kaprekar': {
      if (numbers[0] === undefined) return null;
      const k = kaprekar(numbers[0]);
      if (k.error) return { answer: null, steps: [], error: k.error };
      return {
        answer: k.steps[k.steps.length - 1] ?? null,
        steps: k.steps.map((val, idx) => ({
          title: `Iteration ${idx + 1}`,
          detail: `Descending − Ascending yields ${val}${val === 6174 ? ' (Kaprekar Constant reached!)' : ''}.`,
        })),
      };
    }
    case 'katapayadi': {
      if (!textInput?.trim()) return null;
      const k = katapayadi(textInput);
      return {
        answer: k.traditional,
        steps: [
          { title: 'Map consonants left-to-right', detail: `"${textInput}" maps to forward digits ${k.forward}.` },
          { title: 'Apply Ankanam Vamato Gatih', detail: `Reversing right-to-left yields traditional number ${k.traditional}.` },
        ],
      };
    }
    default:
      return null;
  }
}

function StandardSteps({ a, b }: { a: number; b: number }) {
  return (
    <div className="standard-grid">
      <div>
        <span>Operands</span>
        <strong>
          {a} × {b}
        </strong>
      </div>
      <div>
        <span>Exact product</span>
        <strong>{a * b}</strong>
      </div>
      <div>
        <span>School ops</span>
        <strong>{String(Math.abs(a)).length * String(Math.abs(b)).length + 1}</strong>
      </div>
    </div>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={onClose}>
      <div className="help-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>
        <p className="eyebrow">Architecture</p>
        <h2 id="help-title">Neuro-Symbolic Vedic AI</h2>
        <div className="pipeline">
          <span>
            <BrainCircuit size={16} /> Groq Vision & NLP
          </span>
          <ChevronRight size={15} />
          <span>
            <Sparkles size={16} /> Sutra Router
          </span>
          <ChevronRight size={15} />
          <span>
            <ShieldCheck size={16} /> Deterministic JS
          </span>
        </div>
        <p>
          Groq AI handles perception—reading handwritten images, decoding poetic <em>Lilavati</em> word problems, and
          explaining algebraic intuition. Deterministic TypeScript executes every Vedic Sutra locally so arithmetic
          never suffers from LLM hallucination.
        </p>
      </div>
    </div>
  );
}

const QUICK_SAMPLES = [
  { label: '97 × 94 (Nikhilam)', prompt: '97 × 94' },
  { label: '65² (Ekadhikena)', prompt: '65²' },
  { label: '37 × 99 (Ekanyunena)', prompt: '37 × 99' },
  { label: '∛1728 (Vilokanam)', prompt: 'Cube root of 1728' },
  {
    label: 'Lilavati Riddle',
    prompt:
      'One-fifth of a swarm of bees went to a lotus, one-third to a kadamba flower, three times the difference went to a kutaja, and 1 bee stayed hovering. How many bees were there?',
  },
];

function Home({
  queued,
  onClearQueued,
}: {
  queued: { prompt: string; sutraName: string } | null;
  onClearQueued: () => void;
}) {
  const [prompt, setPrompt] = useState(queued?.prompt || '97 × 94');
  const [pinnedSutra, setPinnedSutra] = useState(queued?.sutraName || '');
  const [result, setResult] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [image, setImage] = useState<UploadedImage | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (queued) {
      setPrompt(queued.prompt);
      setPinnedSutra(queued.sutraName);
      setResult(null);
      setError('');
      setMode('text');
      onClearQueued();
    }
  }, [queued, onClearQueued]);

  async function solve() {
    if (loading || (!prompt.trim() && !image)) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, image: image?.data, mimeType: image?.mime }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.error || `The AI service returned HTTP ${response.status}.`);
        return;
      }
      setResult(payload);
    } catch {
      setError('Could not reach /api/solve. Run via Vercel deployment or `npx vercel dev`.');
    } finally {
      setLoading(false);
    }
  }

  function chooseFile(file?: File) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > 8_000_000) {
      setError('Choose an image smaller than 8 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const originalUrl = String(reader.result);
      const img = new Image();
      img.onload = () => {
        const maxSide = 1024;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setImage({
            name: file.name,
            data: originalUrl.split(',')[1],
            mime: file.type,
            preview: originalUrl,
            sizeKB: Math.max(1, Math.round(file.size / 1024)),
          });
          setMode('image');
          setResult(null);
          setError('');
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedUrl = canvas.toDataURL('image/jpeg', 0.82);
        const base64 = compressedUrl.split(',')[1];
        setImage({
          name: file.name,
          data: base64,
          mime: 'image/jpeg',
          preview: compressedUrl,
          sizeKB: Math.max(1, Math.round((base64.length * 0.75) / 1024)),
        });
        setMode('image');
        setResult(null);
        setError('');
      };
      img.onerror = () => setError('Could not read this image. Try a JPEG, PNG, or WebP file.');
      img.src = originalUrl;
    };
    reader.readAsDataURL(file);
  }

  const inferred = useMemo(() => inferLocalProblem(prompt), [prompt]);
  const aiNumbers = Array.isArray(result?.numbers)
    ? result.numbers.filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
    : [];

  const activeSutra = result?.best_sutra ?? inferred?.sutra ?? 'other';
  const activeNumbers = result ? aiNumbers : (inferred?.numbers ?? []);
  const local = useMemo(
    () => dispatchSutra(activeSutra, activeNumbers, result?.text_input),
    [activeSutra, activeNumbers, result?.text_input],
  );

  const spotlight = useMemo(
    () => detectSpotlightEntry(prompt, pinnedSutra, result?.best_sutra, inferred),
    [prompt, pinnedSutra, result?.best_sutra, inferred],
  );

  const displayName =
    result?.sutra_display_name || inferred?.displayName || (pinnedSutra ? pinnedSutra : spotlight.name);
  const sanskritVerse =
    activeSutra !== 'other' && spotlight.sanskrit
      ? spotlight.sanskrit
      : (result?.sanskrit_verse || spotlight.sanskrit || '');
  const showStandardComparison =
    ['nikhilam', 'ekanyunena', 'urdhva'].includes(activeSutra) && activeNumbers.length >= 2;

  function copyAnswer(val: number | string) {
    navigator.clipboard?.writeText(String(val));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="page-grid view-enter">
      <main className="workspace">
        {helpOpen ? <HelpModal onClose={() => setHelpOpen(false)} /> : null}
        <div className="title-row">
          <div>
            <p className="eyebrow">
              <Zap size={12} /> AI Snap & Solve
            </p>
            <h1>Vedic Math Workspace</h1>
            <p className="subtitle">
              Type an equation, paste a <em>Lilavati</em> riddle, or drop a photo of handwritten math.
            </p>
          </div>
          <span
            className={`status ${error ? 'status-error' : ''}`}
            role="status"
            aria-label={error ? 'AI service unavailable' : 'AI service ready'}
            title={error ? 'AI service unavailable' : 'AI service ready'}
          >
            <span className="status-dot" />
          </span>
        </div>

        {error ? (
          <div className="error-banner" role="alert">
            <AlertCircle size={17} />
            <span>{error}</span>
          </div>
        ) : null}

        <section
          className={`input-card ${dragging ? 'dragging' : ''}`}
          onDragOver={e => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault();
            setDragging(false);
            chooseFile(e.dataTransfer.files?.[0]);
          }}
        >
          <div className="input-head">
            <div className="mode-tabs">
              <button className={mode === 'text' ? 'active' : ''} onClick={() => setMode('text')}>
                <Calculator size={16} /> Text / Riddle
              </button>
              <button className={mode === 'image' ? 'active' : ''} onClick={() => inputRef.current?.click()}>
                <ImagePlus size={16} /> Snap / Image
              </button>
            </div>
            <button className="help-button" onClick={() => setHelpOpen(true)} aria-label="How the AI works">
              <CircleHelp size={18} />
            </button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={e => chooseFile(e.target.files?.[0])}
          />

          {image ? (
            <div className="image-preview-bar">
              <img className="image-thumb" src={image.preview} alt="Uploaded math preview" />
              <div className="image-meta">
                <strong>{image.name}</strong>
                <span>{image.sizeKB} KB · Ready for AI Vision</span>
              </div>
              <button
                className="image-remove"
                aria-label="Remove image"
                onClick={() => {
                  setImage(null);
                  setMode('text');
                  setResult(null);
                  setError('');
                }}
              >
                <X size={16} />
              </button>
            </div>
          ) : null}

          <textarea
            value={prompt}
            onChange={e => {
              setPrompt(e.target.value);
              setPinnedSutra('');
              setMode(image ? 'image' : 'text');
              setResult(null);
              setError('');
            }}
            onKeyDown={e => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                solve();
              }
            }}
            placeholder="Try 97 × 94, 65², 37 × 99, Cube root of 1728, or paste a Lilavati riddle..."
          />

          <div className="quick-prompts">
            {QUICK_SAMPLES.map(sample => (
              <button
                key={sample.label}
                type="button"
                onClick={() => {
                  setPrompt(sample.prompt);
                  setPinnedSutra('');
                  setResult(null);
                  setError('');
                }}
              >
                {sample.label}
              </button>
            ))}
          </div>

          <div className="input-actions">
            <button type="button" className="camera-button" onClick={() => inputRef.current?.click()}>
              <Upload size={15} /> Upload or drop photo
            </button>
            <div className="action-right">
              <span className="shortcut-hint">Ctrl + Enter</span>
              <button
                type="button"
                className="solve-button"
                onClick={solve}
                disabled={loading || (!prompt.trim() && !image)}
              >
                {loading ? <RefreshCw className="spin" size={16} /> : <Sparkles size={16} />}
                {loading ? 'Analyzing...' : 'Solve with AI'}
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="loading-card" aria-live="polite">
            <div className="loading-head">
              <RefreshCw className="spin" size={16} />
              Groq AI is analyzing the problem & selecting the optimal Indian Sutra...
            </div>
            <div className="skeleton-line w-60" />
            <div className="skeleton-line w-90" />
            <div className="skeleton-line w-75" />
          </section>
        ) : local?.answer !== null && local?.answer !== undefined ? (
          <section className="result-card">
            <div className="result-head">
              <div>
                <div className="result-badges">
                  <span className="tag">
                    <ShieldCheck size={12} /> DETERMINISTIC VERIFIED
                  </span>
                  {result ? (
                    <span className="tag ai-tag">
                      <Sparkles size={11} /> AI ROUTED
                    </span>
                  ) : null}
                </div>
                <div className="result-title-line">
                  <h2>
                    {result?.extracted_problem || prompt} = <em>{local.answer}</em>
                  </h2>
                  <button type="button" className="copy-btn" onClick={() => copyAnswer(local.answer!)}>
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="sutra-badge">
                <Sparkles size={14} /> {displayName}
              </div>
            </div>

            {result && sanskritVerse ? (
              <div className="sanskrit-ribbon">
                <strong>{sanskritVerse}</strong>
                <span>Confidence: {result.confidence ?? 'high'}</span>
              </div>
            ) : null}

            <div className="solution-layout">
              <div className="steps-panel">
                <h3 className="panel-heading">Step-by-step Vedic Execution</h3>
                {local.steps.map((step, i) => (
                  <div className="step" style={{ animationDelay: `${i * 55}ms` }} key={`${step.title}-${i}`}>
                    <span>{i + 1}</span>
                    <div>
                      <strong>{step.title}</strong>
                      <p>{step.detail}</p>
                    </div>
                  </div>
                ))}
                {local.error ? <p className="error-inline">{local.error}</p> : null}
              </div>

              <div className="compare-panel">
                <h3 className="panel-heading">Efficiency & AI Intuition</h3>
                {showStandardComparison ? (
                  <>
                    <div className="comparison">
                      <div className="metric-tile accent">
                        <span>Vedic steps</span>
                        <strong>{local.steps.length}</strong>
                      </div>
                      <div className="metric-tile">
                        <span>Standard ops</span>
                        <strong>
                          {String(Math.abs(activeNumbers[0])).length * String(Math.abs(activeNumbers[1])).length + 1}
                        </strong>
                      </div>
                    </div>
                    <StandardSteps a={activeNumbers[0]} b={activeNumbers[1]} />
                  </>
                ) : null}

                {result?.explanation ? (
                  <div className="ai-insight-box">
                    <h4>
                      <BrainCircuit size={14} /> Why this Sutra works
                    </h4>
                    <p>{result.explanation}</p>
                  </div>
                ) : (
                  <div className="ai-insight-box">
                    <h4>
                      <Sparkles size={14} /> Instant Local Preview
                    </h4>
                    <p>
                      Click <strong>Solve with AI</strong> to get the Sanskrit verse, algebraic proof, and historical
                      IKS context from Groq AI.
                    </p>
                  </div>
                )}

                {result?.historical_note ? <div className="history-footnote">{result.historical_note}</div> : null}
              </div>
            </div>
          </section>
        ) : result ? (
          <section className="result-card">
            <div className="result-head">
              <div>
                <span className="tag ai-tag">
                  <Sparkles size={11} /> AI TUTOR SOLUTION
                </span>
                <div className="result-title-line">
                  <h2>{result.extracted_problem || 'Indian Mathematical Problem'}</h2>
                </div>
              </div>
              <div className="sutra-badge">
                <Sparkles size={14} /> {displayName}
              </div>
            </div>

            {sanskritVerse ? (
              <div className="sanskrit-ribbon">
                <strong>{sanskritVerse}</strong>
                <span>IKS Reasoning Mode</span>
              </div>
            ) : null}

            <div className="solution-layout">
              <div className="steps-panel">
                <h3 className="panel-heading">Guided Walkthrough</h3>
                {result.ai_steps?.length ? (
                  result.ai_steps.map((step, i) => (
                    <div className="step" style={{ animationDelay: `${i * 55}ms` }} key={`${step.title}-${i}`}>
                      <span>{i + 1}</span>
                      <div>
                        <strong>{step.title}</strong>
                        <p>{step.detail}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="tool-note">{local?.error || result.explanation}</p>
                )}
              </div>
              <div className="compare-panel">
                <h3 className="panel-heading">Mathematical Insight</h3>
                {result.explanation ? (
                  <div className="ai-insight-box">
                    <h4>
                      <BrainCircuit size={14} /> Explanation
                    </h4>
                    <p>{result.explanation}</p>
                  </div>
                ) : null}
                {result.historical_note ? <div className="history-footnote">{result.historical_note}</div> : null}
              </div>
            </div>
          </section>
        ) : (
          <section className="empty-result">
            <BrainCircuit size={30} />
            <p>
              {local?.error ||
                'Ready to solve. Click "Solve with AI" for word problems, proofs, or handwritten image recognition.'}
            </p>
          </section>
        )}
      </main>

      <aside className="insights">
        <div className="aside-head">
          <h3>Sutra Spotlight</h3>
          <span>{spotlight.badge}</span>
        </div>

        <div className="sutra-quote-card" key={`${spotlight.id}-${spotlight.exampleProblem}`}>
          <div className="sutra-quote">
            <b>{spotlight.sanskrit}</b>
            <p>{spotlight.name}</p>
          </div>
          <p className="translation">{spotlight.meaning}</p>

          <div className="spotlight-formula">
            <span>Formula / Rule</span>
            <code>{spotlight.formula}</code>
          </div>

          <div className="mini-proof">
            <div className="mini-proof-head">
              <span>Worked Example</span>
            </div>
            <div className="mini-proof-problem">{spotlight.exampleProblem}</div>
            <ul className="spotlight-steps">
              {spotlight.exampleSteps.map((stepText, idx) => (
                <li key={idx}>
                  <b>{idx + 1}</b>
                  <span>{stepText}</span>
                </li>
              ))}
            </ul>
            <div className="spotlight-answer">⇒ {spotlight.exampleAnswer}</div>
          </div>
        </div>

        <div className="recent">
          <h3>Try Related Examples</h3>
          {spotlight.quickExamples.map(item => (
            <button
              key={item}
              onClick={() => {
                setPrompt(item);
                setPinnedSutra('');
                setResult(null);
                setError('');
              }}
            >
              <span>{item}</span>
              <ChevronRight size={15} />
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

function SutrasLab({ onSendToAI }: { onSendToAI: (example: string, sutraName: string) => void }) {
  const [active, setActive] = useState<'Nikhilam' | 'Ekadhikena' | 'Ekanyunena' | 'Urdhva'>('Nikhilam');
  const [a, setA] = useState(97);
  const [b, setB] = useState(94);
  const [square, setSquare] = useState(65);
  const [nineDigits, setNineDigits] = useState(2);
  const [query, setQuery] = useState('');
  const [selectedSutra, setSelectedSutra] = useState<(typeof SUTRAS)[number] | null>(null);

  const local = useMemo(() => {
    if (active === 'Nikhilam') return nikhilam(a, b);
    if (active === 'Ekadhikena') return ekadhikenaSquare(square);
    if (active === 'Ekanyunena') return ekanyunena(a, nineDigits);
    return urdhva(a, b);
  }, [active, a, b, square, nineDigits]);

  const filtered = useMemo(
    () => SUTRAS.filter(s => `${s[0]} ${s[1]}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  return (
    <div className="lab-layout view-enter">
      <main>
        <p className="eyebrow">Vedic Sutras Lab</p>
        <h1>Interactive Sutra Workbench</h1>
        <p className="subtitle">Experiment with deterministic Vedic algorithms and explore all 16 Sutras & 13 Sub-Sutras.</p>

        <div className="sutra-tabs">
          {(['Nikhilam', 'Ekadhikena', 'Ekanyunena', 'Urdhva'] as const).map(name => (
            <button key={name} className={active === name ? 'active' : ''} onClick={() => setActive(name)}>
              {name}
            </button>
          ))}
        </div>

        <section className="calculator-card" key={active}>
          {active === 'Ekadhikena' ? (
            <>
              <h2>Ekadhikena Purvena</h2>
              <label className="field-label">Square any integer ending in 5</label>
              <input type="number" value={square} onChange={e => setSquare(Number(e.target.value))} />
            </>
          ) : active === 'Ekanyunena' ? (
            <>
              <h2>Ekanyunena Purvena</h2>
              <label className="field-label">Multiply an integer by 9, 99, 999, or 9999</label>
              <div className="number-inputs">
                <input type="number" value={a} min={1} onChange={e => setA(Number(e.target.value))} />
                <span>×</span>
                <select value={nineDigits} onChange={e => setNineDigits(Number(e.target.value))}>
                  {[1, 2, 3, 4].map(digits => (
                    <option key={digits} value={digits}>
                      {'9'.repeat(digits)}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <h2>{active === 'Nikhilam' ? 'Nikhilam Navatashcaramam' : 'Urdhva-Tiryagbhyam'}</h2>
              <label className="field-label">
                {active === 'Nikhilam'
                  ? 'Dynamic base selection near powers of 10'
                  : 'Universal vertical-and-crosswise digit convolution'}
              </label>
              <div className="number-inputs">
                <input type="number" value={a} onChange={e => setA(Number(e.target.value))} />
                <span>×</span>
                <input type="number" value={b} onChange={e => setB(Number(e.target.value))} />
              </div>
            </>
          )}

          {local.answer !== null ? (
            <>
              <div className="answer-box">{local.answer}</div>
              <div className="lab-steps">
                {local.steps.map((step, i) => (
                  <div key={`${step.title}-${i}`} style={{ animationDelay: `${i * 45}ms` }}>
                    <span>{i + 1}</span>
                    <div>
                      <strong>{step.title}</strong>
                      <p>{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="error-inline">{local.error}</p>
          )}
        </section>

        <div className="search-row">
          <Search size={18} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search all 16 Vedic Sutras by Sanskrit name or meaning..."
          />
        </div>
      </main>

      <aside className="sutra-list">
        <div className="sutra-list-header">
          <h3>16 Core Sutras</h3>
          <span>{filtered.length} shown</span>
        </div>

        {selectedSutra ? (
          <div className="sutra-detail">
            <button className="detail-close" onClick={() => setSelectedSutra(null)} aria-label="Close details">
              <X size={15} />
            </button>
            <strong>{selectedSutra[0]}</strong>
            <p>{selectedSutra[1]}</p>
            <button
              type="button"
              className="try-sutra-btn"
              onClick={() => onSendToAI(selectedSutra[2], selectedSutra[0])}
            >
              Try in AI Solver <ArrowRight size={13} />
            </button>
          </div>
        ) : null}

        {filtered.map(([name, meaning, example], i) => (
          <button
            key={name}
            className={`sutra-item ${selectedSutra?.[0] === name ? 'selected' : ''}`}
            onClick={() => setSelectedSutra([name, meaning, example])}
          >
            <span>{String(i + 1).padStart(2, '0')}</span>
            <div>
              <strong>{name}</strong>
              <p>{meaning}</p>
            </div>
          </button>
        ))}

        <h3 className="sub-heading">13 Sub-Sutras (Upasutras)</h3>
        <div className="sub-grid">
          {SUB_SUTRAS.map(name => (
            <span key={name}>{name}</span>
          ))}
        </div>
      </aside>
    </div>
  );
}

function madhavaPi(terms: number) {
  let sum = 0;
  for (let k = 0; k < terms; k++) {
    sum += (k % 2 === 0 ? 1 : -1) / (2 * k + 1);
  }
  return 4 * sum;
}

function binomial(n: number, k: number) {
  let value = 1;
  for (let i = 1; i <= k; i++) value = (value * (n - i + 1)) / i;
  return value;
}

function ScripturesLab() {
  const [cube, setCube] = useState(1728);
  const [kap, setKap] = useState(3524);
  const [word, setWord] = useState('Mayamalavagowla');
  const [meruRows, setMeruRows] = useState(6);
  const [sideA, setSideA] = useState(3);
  const [sideB, setSideB] = useState(4);
  const [piTerms, setPiTerms] = useState(120);

  const cubeResult = useMemo(() => cubeRoot(cube), [cube]);
  const kapResult = useMemo(() => kaprekar(kap), [kap]);
  const kataResult = useMemo(() => katapayadi(word), [word]);
  const piValue = useMemo(() => madhavaPi(piTerms), [piTerms]);

  const hypotenuse = Math.sqrt(sideA * sideA + sideB * sideB);
  const baudhayana = 1 + 1 / 3 + 1 / (3 * 4) - 1 / (3 * 4 * 34);
  const sqrt2Error = Math.abs((baudhayana - Math.SQRT2) / Math.SQRT2) * 100;
  const piError = Math.abs(piValue - Math.PI);
  const triangleX = 28 + Math.round((200 * sideA) / 12);
  const triangleTop = 128 - Math.round((98 * sideB) / 12);

  return (
    <div className="scripture-page view-enter">
      <p className="eyebrow">Ancient Scriptures Lab</p>
      <h1>Mathematics Across Indian Tradition</h1>
      <p className="subtitle">
        Explore geometry from the <em>Sulba Sutras</em>, infinite series from the Kerala School, Pingala’s
        combinatorics, and classical number ciphers.
      </p>

      <div className="tool-grid">
        <section className="tool-card">
          <div className="tool-head">
            <div className="tool-icon">
              <Landmark size={20} />
            </div>
            <div>
              <h2>Baudhayana Sulba Sutra</h2>
              <span className="tool-era">c. 800 BCE · Yajurveda Altar Geometry</span>
            </div>
          </div>
          <div className="slider-row">
            <label>
              Base a = {sideA}
              <input type="range" min={1} max={12} value={sideA} onChange={e => setSideA(Number(e.target.value))} />
            </label>
            <label>
              Height b = {sideB}
              <input type="range" min={1} max={12} value={sideB} onChange={e => setSideB(Number(e.target.value))} />
            </label>
          </div>
          <svg className="triangle-svg" viewBox="0 0 280 155" role="img" aria-label="Right triangle visualization">
            <polygon
              points={`28,128 ${triangleX},128 ${triangleX},${triangleTop}`}
              fill="#eef2ff"
              stroke="#4361ee"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <text x={(28 + triangleX) / 2 - 12} y="146">
              a = {sideA}
            </text>
            <text x={triangleX + 8} y={(128 + triangleTop) / 2 + 4}>
              b = {sideB}
            </text>
            <text x={(28 + triangleX) / 2 - 18} y={(128 + triangleTop) / 2 - 8}>
              c = {hypotenuse.toFixed(3)}
            </text>
          </svg>
          <div className="formula-box">
            <strong>Baudhayana √2 Formula: 1 + 1/3 + 1/(3·4) − 1/(3·4·34)</strong>
            <span>{baudhayana.toFixed(10)}</span>
            <small>
              Modern √2: {Math.SQRT2.toFixed(10)} · Error: {sqrt2Error.toFixed(6)}%
            </small>
          </div>
        </section>

        <section className="tool-card">
          <div className="tool-head">
            <div className="tool-icon">
              <FlaskConical size={20} />
            </div>
            <div>
              <h2>Madhava–Gregory π Series</h2>
              <span className="tool-era">14th CE · Kerala School of Mathematics</span>
            </div>
          </div>
          <label className="range-label">
            Series Terms: {piTerms}
            <input
              type="range"
              min={1}
              max={500}
              value={piTerms}
              onChange={e => setPiTerms(Number(e.target.value))}
            />
          </label>
          <div className="answer-box">{piValue.toFixed(8)}</div>
          <div className="formula-box">
            <strong>Convergence Check</strong>
            <small>
              Modern π: {Math.PI.toFixed(8)} · Absolute diff: {piError.toFixed(6)}
            </small>
          </div>
        </section>

        <section className="tool-card">
          <div className="tool-head">
            <div className="tool-icon">
              <Calculator size={20} />
            </div>
            <div>
              <h2>Vilokanam — Mental Cube Root</h2>
              <span className="tool-era">Vedic Upasutra · Exact Cube Inspection</span>
            </div>
          </div>
          <input type="number" value={cube} onChange={e => setCube(Number(e.target.value))} />
          <div style={{ marginTop: 4 }}>
            <div className="answer-box">{cubeResult.exact ? cubeResult.result : cubeResult.error || 'Not a perfect cube'}</div>
          </div>
          {cubeResult.steps.map((step, i) => (
            <p className="tool-note" key={`${step.title}-${i}`}>
              <strong>{step.title}:</strong> {step.detail}
            </p>
          ))}
        </section>

        <section className="tool-card">
          <div className="tool-head">
            <div className="tool-icon">
              <RefreshCw size={20} />
            </div>
            <div>
              <h2>Kaprekar’s Constant (6174)</h2>
              <span className="tool-era">1949 · D. R. Kaprekar (Indian Number Theory)</span>
            </div>
          </div>
          <input
            type="number"
            min={1000}
            max={9999}
            value={kap}
            onChange={e => setKap(Number(e.target.value) || 0)}
          />
          {kapResult.error ? (
            <p className="error-inline">{kapResult.error}</p>
          ) : (
            <div className="convergence">
              {kapResult.steps.map((n, i) => (
                <span className="convergence-step" key={`${n}-${i}`}>
                  <span className={`convergence-pill ${n === 6174 ? 'final' : ''}`}>{n}</span>
                  {i < kapResult.steps.length - 1 ? <ArrowRight size={13} color="#94a3b8" /> : null}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="tool-card">
          <div className="tool-head">
            <div className="tool-icon">
              <BookOpen size={20} />
            </div>
            <div>
              <h2>Katapayadi Sankhya Cipher</h2>
              <span className="tool-era">Ancient Chronogram & Carnatic Raga Encoding</span>
            </div>
          </div>
          <div className="preset-row">
            <button type="button" onClick={() => setWord('Mayamalavagowla')}>
              Mayamalavagowla → 15
            </button>
            <button type="button" onClick={() => setWord('Rama')}>
              Rama → 52
            </button>
            <button type="button" onClick={() => setWord('Ganita')}>
              Ganita → 153
            </button>
          </div>
          <input
            value={word}
            onChange={e => setWord(e.target.value)}
            placeholder="Enter a Sanskrit or English word..."
            style={{ width: '100%' }}
          />
          <div className="cipher-grid">
            <div className="cipher-box">
              <span>Left-to-right</span>
              <strong>{kataResult.forward}</strong>
            </div>
            <div className="cipher-box highlight">
              <span>Traditional (Reversed)</span>
              <strong>{kataResult.traditional}</strong>
            </div>
          </div>
        </section>

        <section className="tool-card">
          <div className="tool-head">
            <div className="tool-icon">
              <FileImage size={20} />
            </div>
            <div>
              <h2>Pingala’s Meru Prastara</h2>
              <span className="tool-era">c. 300 BCE · Chandas Shastra Combinatorics</span>
            </div>
          </div>
          <label className="range-label">
            Rows: {meruRows}
            <input
              type="range"
              min={2}
              max={8}
              value={meruRows}
              onChange={e => setMeruRows(Number(e.target.value))}
            />
          </label>
          <div className="meru">
            {Array.from({ length: meruRows }).map((_, r) => (
              <div key={r}>
                {Array.from({ length: r + 1 }).map((__, c) => (
                  <span key={c}>{binomial(r, c)}</span>
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

type QuizKind = 'nikhilam' | 'ekadhikena' | 'ekanyunena' | 'urdhva' | 'vilokanam';

type GeneratedQuestion = {
  id: string;
  q: string;
  aiPrompt: string;
  kind: QuizKind;
  hint: string;
  methodName: string;
  choices: number[];
  answer: number;
  steps: Step[];
};

type QuizAttempt = {
  question: GeneratedQuestion;
  selected: number | null;
  timedOut: boolean;
  isCorrect: boolean;
  timeSpent: number;
};

type QuizAIState = {
  loading: boolean;
  data?: AIResponse;
  error?: string;
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildChoices(answer: number, kind: QuizKind): number[] {
  const pool =
    kind === 'ekadhikena'
      ? [100, -100, 200, -200, 30, -30, 300, -300, 1000, -1000]
      : kind === 'vilokanam'
        ? [1, -1, 2, -2, 3, -3, 10, -10]
        : [10, -10, 100, -100, 20, -20, 2, -2, 90, -90, 1000, -1000];

  const picked = new Set<number>([answer]);
  for (const offset of shuffle(pool)) {
    if (picked.size >= 4) break;
    const candidate = answer + offset;
    if (candidate > 0 && candidate !== answer) picked.add(candidate);
  }
  let bump = 1;
  while (picked.size < 4) {
    picked.add(answer + bump * (kind === 'ekadhikena' ? 100 : 10));
    bump++;
  }
  return shuffle(Array.from(picked));
}

function createQuestionByKind(kind: QuizKind): GeneratedQuestion {
  if (kind === 'nikhilam') {
    const mode = randInt(0, 2);
    const a = mode === 0 ? randInt(88, 99) : mode === 1 ? randInt(101, 112) : randInt(989, 999);
    const b = mode === 0 ? randInt(88, 99) : mode === 1 ? randInt(101, 112) : randInt(989, 999);
    const solved = nikhilam(a, b);
    const base = pickBase(a, b);
    const answer = solved.answer ?? a * b;
    return {
      id: `nikhilam:${Math.min(a, b)}x${Math.max(a, b)}`,
      q: `${a} × ${b}`,
      aiPrompt: `${a} × ${b}`,
      kind,
      hint: `Nikhilam (Base ${base})`,
      methodName: 'Nikhilam Navatashcaramam Dashatah',
      choices: buildChoices(answer, kind),
      answer,
      steps: solved.steps,
    };
  }

  if (kind === 'ekadhikena') {
    const p = randInt(1, 19);
    const n = p * 10 + 5;
    const solved = ekadhikenaSquare(n);
    const answer = solved.answer ?? n * n;
    return {
      id: `ekadhikena:${n}`,
      q: `${n}²`,
      aiPrompt: `${n}²`,
      kind,
      hint: 'Ekadhikena Purvena',
      methodName: 'Ekadhikena Purvena',
      choices: buildChoices(answer, kind),
      answer,
      steps: solved.steps,
    };
  }

  if (kind === 'ekanyunena') {
    const digits = Math.random() < 0.65 ? 2 : 3;
    const n = digits === 2 ? randInt(12, 98) : randInt(105, 998);
    const nines = '9'.repeat(digits);
    const solved = ekanyunena(n, digits);
    const answer = solved.answer ?? n * Number(nines);
    return {
      id: `ekanyunena:${n}x${nines}`,
      q: `${n} × ${nines}`,
      aiPrompt: `${n} × ${nines}`,
      kind,
      hint: 'Ekanyunena Purvena',
      methodName: 'Ekanyunena Purvena',
      choices: buildChoices(answer, kind),
      answer,
      steps: solved.steps,
    };
  }

  if (kind === 'urdhva') {
    const a = randInt(12, 48);
    let b = randInt(12, 48);
    if (a === b && a % 10 === 5) b += 1;
    const solved = urdhva(a, b);
    const answer = solved.answer ?? a * b;
    return {
      id: `urdhva:${Math.min(a, b)}x${Math.max(a, b)}`,
      q: `${a} × ${b}`,
      aiPrompt: `${a} × ${b}`,
      kind,
      hint: 'Urdhva-Tiryagbhyam',
      methodName: 'Urdhva-Tiryagbhyam',
      choices: buildChoices(answer, kind),
      answer,
      steps: solved.steps,
    };
  }

  const root = randInt(11, 39);
  const cube = root ** 3;
  const solved = cubeRoot(cube);
  return {
    id: `vilokanam:${cube}`,
    q: `∛${cube}`,
    aiPrompt: `Cube root of ${cube}`,
    kind: 'vilokanam',
    hint: 'Vilokanam (Cube Root)',
    methodName: 'Vilokanam Upasutra',
    choices: buildChoices(root, 'vilokanam'),
    answer: root,
    steps: solved.steps,
  };
}

function loadSeenQuestionIds(): Set<string> {
  try {
    const raw = localStorage.getItem('iks-quiz-seen');
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

function saveSeenQuestionIds(seen: Set<string>) {
  try {
    const list = Array.from(seen).slice(-250);
    localStorage.setItem('iks-quiz-seen', JSON.stringify(list));
  } catch {
    // Ignore browser storage quota or privacy errors.
  }
}

function generateFreshQuizRound(count = 5): GeneratedQuestion[] {
  const seen = loadSeenQuestionIds();
  if (seen.size > 220) seen.clear();

  const kinds = shuffle<QuizKind>(['nikhilam', 'ekadhikena', 'ekanyunena', 'urdhva', 'vilokanam']).slice(0, count);
  const round: GeneratedQuestion[] = [];
  const roundIds = new Set<string>();

  for (const kind of kinds) {
    let candidate = createQuestionByKind(kind);
    for (let attempt = 0; attempt < 40; attempt++) {
      if (!seen.has(candidate.id) && !roundIds.has(candidate.id)) break;
      candidate = createQuestionByKind(kind);
    }
    round.push(candidate);
    roundIds.add(candidate.id);
    seen.add(candidate.id);
  }

  saveSeenQuestionIds(seen);
  return round;
}

function Quiz() {
  const [bestScore, setBestScore] = useState(() => Number(localStorage.getItem('iks-best-score') || 0));
  const [questions, setQuestions] = useState<GeneratedQuestion[]>(() => generateFreshQuizRound(5));
  const [sessionScore, setSessionScore] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [time, setTime] = useState(20);
  const [finished, setFinished] = useState(false);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [aiExplain, setAiExplain] = useState<Record<string, QuizAIState>>({});

  useEffect(() => {
    if (finished || selected !== null || time <= 0) return;
    const id = window.setTimeout(() => setTime(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [time, selected, finished]);

  const current = questions[questionIdx];

  function pick(choice: number) {
    if (selected !== null || time === 0 || finished) return;
    setSelected(choice);
    if (choice === current.answer) setSessionScore(value => value + 1);
  }

  function nextQuestion() {
    const attempt: QuizAttempt = {
      question: current,
      selected,
      timedOut: selected === null && time === 0,
      isCorrect: selected === current.answer,
      timeSpent: 20 - time,
    };
    const nextAttempts = [...attempts, attempt];
    setAttempts(nextAttempts);

    if (questionIdx === questions.length - 1) {
      if (sessionScore > bestScore) {
        setBestScore(sessionScore);
        localStorage.setItem('iks-best-score', String(sessionScore));
      }
      setFinished(true);
      return;
    }

    setQuestionIdx(value => value + 1);
    setSelected(null);
    setTime(20);
  }

  function startNewRound() {
    setQuestions(generateFreshQuizRound(5));
    setSessionScore(0);
    setQuestionIdx(0);
    setSelected(null);
    setTime(20);
    setAttempts([]);
    setAiExplain({});
    setFinished(false);
  }

  async function explainWithAI(q: GeneratedQuestion) {
    if (aiExplain[q.id]?.loading || aiExplain[q.id]?.data) return;
    setAiExplain(prev => ({ ...prev, [q.id]: { loading: true } }));

    try {
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q.aiPrompt }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload) {
        setAiExplain(prev => ({
          ...prev,
          [q.id]: { loading: false, error: payload?.error || `AI service returned HTTP ${response.status}.` },
        }));
        return;
      }
      setAiExplain(prev => ({ ...prev, [q.id]: { loading: false, data: payload } }));
    } catch {
      setAiExplain(prev => ({
        ...prev,
        [q.id]: { loading: false, error: 'Could not reach /api/solve. Check your dev server or Vercel deployment.' },
      }));
    }
  }

  if (finished) {
    const avgTime = attempts.length
      ? (attempts.reduce((sum, a) => sum + a.timeSpent, 0) / attempts.length).toFixed(1)
      : '0.0';
    const accuracy = questions.length ? Math.round((sessionScore / questions.length) * 100) : 0;

    return (
      <div className="quiz-page view-enter">
        <div className="quiz-head">
          <div>
            <p className="eyebrow">Speed Quiz · Complete Review</p>
            <h1>Challenge Results &amp; Vedic Solutions</h1>
            <p className="subtitle">
              Inspect the deterministic Vedic method for every question, or ask Groq AI for deeper intuition.
            </p>
          </div>
          <button className="next-button" onClick={startNewRound}>
            <RefreshCw size={15} /> New Fresh Quiz
          </button>
        </div>

        <section className="quiz-summary-card">
          <div className="summary-main">
            <div className="completion-trophy"><Trophy size={34} /></div>
            <div>
              <h2>{sessionScore} / {questions.length}</h2>
              <p className="quiz-sub" style={{ textAlign: 'left' }}>
                {sessionScore === questions.length
                  ? 'Flawless run! Pure mental Vedic speed.'
                  : sessionScore >= 3
                    ? 'Solid work! Review the Vedic shortcuts below to hit 5/5.'
                    : 'Great practice! Study the step-by-step Sutras below and try a fresh set.'}
              </p>
            </div>
          </div>

          <div className="summary-stats">
            <div className="metric-tile accent"><span>Accuracy</span><strong>{accuracy}%</strong></div>
            <div className="metric-tile"><span>Avg. Time</span><strong>{avgTime}s</strong></div>
            <div className="metric-tile">
              <span>Best Score</span><strong>{Math.max(bestScore, sessionScore)} / {questions.length}</strong>
            </div>
          </div>
        </section>

        <div className="review-list">
          {attempts.map((item, idx) => {
            const aiState = aiExplain[item.question.id];
            return (
              <article
                className={`review-card ${item.isCorrect ? 'is-correct' : 'is-wrong'}`}
                style={{ animationDelay: `${idx * 55}ms` }}
                key={item.question.id}
              >
                <div className="review-top">
                  <div className="review-title-group">
                    <span className={`review-status ${item.isCorrect ? 'ok' : item.timedOut ? 'timeout' : 'bad'}`}>
                      {item.isCorrect ? (
                        <><Check size={12} /> Correct</>
                      ) : item.timedOut ? (
                        <><Clock3 size={12} /> Timed Out</>
                      ) : (
                        <><X size={12} /> Incorrect</>
                      )}
                    </span>
                    <h3>Q{idx + 1}. {item.question.q} = <em>{item.question.answer}</em></h3>
                  </div>
                  <div className="sutra-badge"><Sparkles size={13} /> {item.question.methodName}</div>
                </div>

                <div className="review-answers-row">
                  <span>Your answer:{' '}<strong className={item.isCorrect ? 'ans-ok' : 'ans-bad'}>
                    {item.timedOut ? 'No answer (time up)' : item.selected}
                  </strong></span>
                  <span>Correct answer: <strong className="ans-ok">{item.question.answer}</strong></span>
                  <span>Time: <strong>{item.timeSpent}s</strong></span>
                </div>

                <div className="review-method-box">
                  <div className="review-method-head">
                    <h4><ShieldCheck size={14} /> Vedic Method ({item.question.hint})</h4>
                    <button
                      type="button"
                      className="ai-explain-btn"
                      disabled={aiState?.loading || Boolean(aiState?.data)}
                      onClick={() => explainWithAI(item.question)}
                    >
                      {aiState?.loading ? (
                        <><RefreshCw className="spin" size={13} /> Asking AI...</>
                      ) : aiState?.data ? (
                        <><Check size={13} /> AI Explained</>
                      ) : (
                        <><Sparkles size={13} /> Explain with AI</>
                      )}
                    </button>
                  </div>

                  <div className="review-steps">
                    {item.question.steps.map((step, sIdx) => (
                      <div className="review-step" key={`${step.title}-${sIdx}`}>
                        <span>{sIdx + 1}</span>
                        <div><strong>{step.title}:</strong> {step.detail}</div>
                      </div>
                    ))}
                  </div>

                  {aiState?.error ? <p className="error-inline">{aiState.error}</p> : null}

                  {aiState?.data ? (
                    <div className="review-ai-box">
                      <div className="review-ai-head">
                        <BrainCircuit size={14} />
                        <strong>Groq AI Intuition</strong>
                        {(SPOTLIGHT_BY_ID.get(item.question.kind)?.sanskrit || aiState.data.sanskrit_verse) ? (
                          <span className="review-verse">
                            {SPOTLIGHT_BY_ID.get(item.question.kind)?.sanskrit || aiState.data.sanskrit_verse}
                          </span>
                        ) : null}
                      </div>
                      <p>{aiState.data.explanation}</p>
                      {aiState.data.historical_note ? (
                        <div className="history-footnote">{aiState.data.historical_note}</div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        <div className="review-bottom-actions">
          <button className="next-button" onClick={startNewRound}>
            <RefreshCw size={15} /> Play Another Fresh Round
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-page view-enter">
      <div className="quiz-head">
        <div>
          <p className="eyebrow">Speed Quiz · Dynamic Generator</p>
          <h1>Vedic Math Sprint</h1>
          <p className="subtitle">5 brand-new non-repeating problems across 5 Sutras under a 20-second clock.</p>
        </div>
        <div className="score-pill">
          <Trophy size={20} />
          <strong>{sessionScore}</strong>
          <span>session · {bestScore} best</span>
        </div>
      </div>

      <section className="quiz-card" key={current.id}>
        <div className="quiz-meta">
          <span>Question {questionIdx + 1} of {questions.length}</span>
          <span className={`timer ${time <= 5 ? 'urgent' : ''}`}>
            <Clock3 size={15} /> 00:{String(time).padStart(2, '0')}
          </span>
        </div>

        <div className="progress">
          <span style={{ width: `${((questionIdx + 1) / questions.length) * 100}%` }} />
        </div>

        <span className="quiz-hint-badge">{current.hint}</span>
        <h2>{current.q}</h2>
        <p className="quiz-sub">
          {time === 0
            ? 'Time is up — correct answer highlighted.'
            : selected !== null
              ? selected === current.answer
                ? 'Correct! Clean Vedic mental math.'
                : 'Not quite — check the highlighted answer.'
              : 'Choose the exact value'}
        </p>

        <div className="choices">
          {current.choices.map((choice, i) => {
            const revealCorrect = (selected !== null || time === 0) && choice === current.answer;
            const selectedWrong = selected === choice && choice !== current.answer;
            return (
              <button
                key={i}
                disabled={selected !== null || time === 0}
                className={revealCorrect ? 'correct' : selectedWrong ? 'wrong' : ''}
                onClick={() => pick(choice)}
              >
                {choice}
              </button>
            );
          })}
        </div>

        <div className="quiz-footer">
          <button className="next-button" disabled={selected === null && time > 0} onClick={nextQuestion}>
            {questionIdx === questions.length - 1 ? 'View Full Solutions' : 'Next Question'}{' '}
            <ChevronRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>('snap');
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [queued, setQueued] = useState<{ prompt: string; sutraName: string } | null>(null);

  const nav = [
    { id: 'snap' as const, label: 'AI Snap & Solve', icon: Sparkles },
    { id: 'sutras' as const, label: 'Sutras Lab', icon: Calculator },
    { id: 'scriptures' as const, label: 'Scriptures Lab', icon: Landmark },
    { id: 'quiz' as const, label: 'Speed Quiz', icon: Trophy },
  ];

  function sendToAI(example: string, sutraName: string) {
    setQueued({ prompt: example, sutraName });
    setTab('snap');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="app-shell">
      {helpOpen ? <HelpModal onClose={() => setHelpOpen(false)} /> : null}
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMenuOpen(value => !value)} aria-label="Toggle navigation">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="brand">
          <div className="brand-mark">ग</div>
          <span className="brand-name">
            Ganita<span>AI</span>
          </span>
        </div>

        <nav className={menuOpen ? 'open' : ''}>
          {nav.map(item => (
            <button
              key={item.id}
              className={tab === item.id ? 'active' : ''}
              onClick={() => {
                setTab(item.id);
                setMenuOpen(false);
              }}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="topbar-right">
          <button className="info-pill" onClick={() => setHelpOpen(true)}>
            <ShieldCheck size={15} />
            <span>Neuro-Symbolic</span>
          </button>
        </div>
      </header>

      {tab === 'snap' ? (
        <Home queued={queued} onClearQueued={() => setQueued(null)} />
      ) : tab === 'sutras' ? (
        <SutrasLab onSendToAI={sendToAI} />
      ) : tab === 'scriptures' ? (
        <ScripturesLab />
      ) : (
        <Quiz />
      )}
    </div>
  );
}