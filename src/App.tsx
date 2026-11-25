import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Calculator,
  Camera,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Copy,
  Crosshair,
  FileImage,
  FlaskConical,
  ImagePlus,
  Landmark,
  Menu,
  Moon,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Search,
  ShieldCheck,
  Shuffle,
  Sparkles,
  SkipForward,
  Sun,
  Trophy,
  Upload,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import './App.css';
import CommandPalette, { type PaletteTab } from './components/CommandPalette';
import OpticalStage from './components/OpticalStage';
import SutraDiagram from './components/SutraDiagram';
import { isSfxEnabled, playClick, playError, playHoverTick, playSolveChime, playSuccess, playToggle, setSfxEnabled } from './utils/sfx';
import { spawnRipple, useMagnetic, useScrambleValue, useSpotlightSurface } from './utils/physics';
import {
  cubeRoot,
  ekadhikenaSquare,
  ekanyunena,
  kaprekarDetailed,
  katapayadiDetailed,
  nikhilam,
  pickBase,
  puranapuranabhyam,
  sankalanaSymmetric,
  urdhva,
  yaavadunam,
  type Step,
} from './math';

type Tab = PaletteTab;
type SutraCategory = 'All' | 'Arithmetic' | 'Algebra' | 'Calculus';

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

type SolveHistoryItem = {
  id: string;
  prompt: string;
  answer: string;
  sutraName: string;
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

type SutraCatalogItem = {
  name: string;
  sanskrit: string;
  meaning: string;
  example: string;
  category: Exclude<SutraCategory, 'All'>;
};

const SUTRAS_CATALOG: SutraCatalogItem[] = [
  { name: 'Ekadhikena Purvena', sanskrit: 'एकाधिकेन पूर्वेण', meaning: 'By one more than the previous', example: '65²', category: 'Arithmetic' },
  { name: 'Nikhilam Navatashcaramam Dashatah', sanskrit: 'निखिलं नवतश्चरमं दशतः', meaning: 'All from 9 and the last from 10', example: '97 × 94', category: 'Arithmetic' },
  { name: 'Urdhva-Tiryagbhyam', sanskrit: 'ऊर्ध्वतिर्यग्भ्याम्', meaning: 'Vertically and crosswise', example: '23 × 41', category: 'Arithmetic' },
  { name: 'Paraavartya Yojayet', sanskrit: 'परावर्त्य योजयेत्', meaning: 'Transpose and adjust', example: 'Explain Paraavartya Yojayet with an example (13799 ÷ 113)', category: 'Algebra' },
  { name: 'Shunyam Saamyasamuccaye', sanskrit: 'शून्यं साम्यसमुच्चये', meaning: 'If the sum is the same, sum is zero', example: 'Solve (x + 2) + (x + 3) = 0 using Shunyam Saamyasamuccaye', category: 'Algebra' },
  { name: 'Anurupye Shunyamanyat', sanskrit: 'आनुरूप्ये शून्यमन्यत्', meaning: 'If one is in ratio, the other is zero', example: 'Solve 5x + 6y = 3 and 10x + 18y = 6 using Anurupye Shunyamanyat', category: 'Algebra' },
  { name: 'Sankalana-Vyavakalanabhyam', sanskrit: 'सङ्कलनव्यवकलनाभ्याम्', meaning: 'By addition and subtraction', example: '45x - 23y = 113 and 23x - 45y = 91', category: 'Algebra' },
  { name: 'Puranapuranabhyam', sanskrit: 'पूरणापूरणाभ्याम्', meaning: 'By the completion or non-completion', example: 'x² + 2x - 8 = 0', category: 'Algebra' },
  { name: 'Chalana-Kalanabhyam', sanskrit: 'चलनकलनाभ्याम्', meaning: 'Differences and similarities', example: 'Explain Chalana-Kalanabhyam in quadratic roots', category: 'Calculus' },
  { name: 'Yaavadunam', sanskrit: 'यावदूनम्', meaning: 'Whatever the extent of its deficiency', example: '98²', category: 'Arithmetic' },
  { name: 'Vyashtisamashtih', sanskrit: 'व्यष्टिसमष्टिः', meaning: 'Part and whole', example: 'Explain Vyashtisamashtih with an average example', category: 'Calculus' },
  { name: 'Shesanyankena Charamena', sanskrit: 'शेषाण्यङ्केन चरमेण', meaning: 'The remainders by the last digit', example: 'Convert 1/7 to a decimal using Shesanyankena Charamena', category: 'Arithmetic' },
  { name: 'Sopantyadvayamantyam', sanskrit: 'सोपान्त्यद्वयमन्त्यम्', meaning: 'The ultimate and twice the penultimate', example: 'Explain Sopantyadvayamantyam with a rational equation', category: 'Algebra' },
  { name: 'Ekanyunena Purvena', sanskrit: 'एकन्यूनेन पूर्वेण', meaning: 'By one less than the previous', example: '37 × 99', category: 'Arithmetic' },
  { name: 'Gunitasamuccayah', sanskrit: 'गुणितसमुच्चयः', meaning: 'The product of the sum is the sum', example: 'Verify (x + 2)(x + 3) = x² + 5x + 6 using Gunitasamuccayah', category: 'Algebra' },
  { name: 'Gunakasamuccayah', sanskrit: 'गुणकसमुच्चयः', meaning: 'The factors of the sum equal the sum of factors', example: 'Factorize x² + 5x + 6 and verify with Gunakasamuccayah', category: 'Algebra' },
];

const SUTRAS: [string, string, string][] = SUTRAS_CATALOG.map(s => [s.name, s.meaning, s.example]);

const SUB_SUTRAS_CATALOG = [
  { name: 'Anurupyena', meaning: 'Proportionately (working base scaling)', prompt: 'Explain Anurupyena sub-sutra with 48 × 46' },
  { name: 'Shishyate Sheshasanjnah', meaning: 'The remainder remains constant', prompt: 'Explain Shishyate Sheshasanjnah sub-sutra with an example' },
  { name: 'Adyamadyenantyamantyena', meaning: 'The first by the first and the last by the last', prompt: 'Factorize 2x² + 5x + 2 using Adyamadyenantyamantyena' },
  { name: 'Kevalaih Saptakam Gunyat', meaning: 'For 7, the multiplier is 143', prompt: 'Explain Kevalaih Saptakam Gunyat with 1/7' },
  { name: 'Veshtanam', meaning: 'By osculation (divisibility test)', prompt: 'Test divisibility of 273 by 13 using Veshtanam' },
  { name: 'Yavadunam Tavadunam', meaning: 'Lessen by the deficiency', prompt: 'Square 96 using Yavadunam Tavadunam' },
  { name: 'Yavadunam Tavadunikritya Vargancha Yojayet', meaning: 'Lessen by deficiency and append its square', prompt: '98²' },
  { name: 'Antyayordashake’pi', meaning: 'Last digits sum to 10 with same prefix', prompt: 'Multiply 43 × 47 using Antyayordashake’pi' },
  { name: 'Antyayoreva', meaning: 'Only the last terms', prompt: 'Explain Antyayoreva in linear rational equations' },
  { name: 'Samuccayagunitah', meaning: 'Sum of coefficients product', prompt: 'Explain Samuccayagunitah sub-sutra' },
  { name: 'Lopanasthapanabhyam', meaning: 'By alternate elimination and retention', prompt: 'Factorize x² + 5xy + 6y² + 3x + 7y + 2 using Lopanasthapanabhyam' },
  { name: 'Vilokanam', meaning: 'By mere observation', prompt: 'Cube root of 1728' },
  { name: 'Gunitasamuccayah Samuccayagunitah', meaning: 'Product of coefficient sums verification', prompt: 'Verify (x + 1)(x + 4) = x² + 5x + 4 using Gunitasamuccayah' },
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
      '45x - 23y = 113 and 23x - 45y = 91',
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
      '45x - 23y = 113 and 23x - 45y = 91',
      '17x + 13y = 47 and 13x + 17y = 43',
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
    quickExamples: ['x² + 2x - 8 = 0', 'x² + 6x - 16 = 0', 'Explain Chalana-Kalanabhyam in quadratic roots'],
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
      'x² + 2x - 8 = 0',
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
    quickExamples: ['98²', '104²', '996²', '65²'],
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

  if (base.id === 'yaavadunam' && inferred.numbers.length >= 1) {
    const n = inferred.numbers[0];
    const baseNum = pickBase(n, n);
    const diff = n - baseNum;
    return {
      ...base,
      exampleProblem: `${n}²`,
      exampleSteps: [
        `Nearest base = ${baseNum}; deviation d = ${diff >= 0 ? `+${diff}` : diff}`,
        `Shift further: ${n} ${diff >= 0 ? '+' : '−'} ${Math.abs(diff)} = ${n + diff}`,
        `Square deviation: (${diff})² = ${diff * diff}`,
      ],
      exampleAnswer: `${n}² = ${n * n}`,
    };
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

  const squareMatch = text.match(/^(?:square\s+)?(-?\d+)\s*(?:\^2|²)(?:\s+using\s+yaavadunam)?$/i);
  if (squareMatch) {
    const n = Number(squareMatch[1]);
    if (Math.abs(n) % 10 === 5) {
      return { sutra: 'ekadhikena', numbers: [n], displayName: 'Ekadhikena Purvena' };
    }
    const base = pickBase(Math.abs(n), Math.abs(n));
    if (base >= 10 && Math.abs(Math.abs(n) - base) <= base * 0.2) {
      return { sutra: 'yaavadunam', numbers: [Math.abs(n)], displayName: 'Yaavadunam' };
    }
    return { sutra: 'urdhva', numbers: [Math.abs(n), Math.abs(n)], displayName: 'Urdhva-Tiryagbhyam' };
  }

  const sankalanaMatch = text.match(
    /^(-?\d+)\s*x\s*([+-]\s*\d+)\s*y\s*=\s*(-?\d+)\s*(?:and|,|;)\s*(-?\d+)\s*x\s*([+-]\s*\d+)\s*y\s*=\s*(-?\d+)$/i,
  );
  if (sankalanaMatch) {
    const a1 = Number(sankalanaMatch[1]);
    const b1 = Number(sankalanaMatch[2].replace(/\s+/g, ''));
    const c1 = Number(sankalanaMatch[3]);
    const a2 = Number(sankalanaMatch[4]);
    const b2 = Number(sankalanaMatch[5].replace(/\s+/g, ''));
    const c2 = Number(sankalanaMatch[6]);
    if (a1 === b2 && b1 === a2 && a1 !== b1 && a1 !== -b1) {
      return { sutra: 'sankalana', numbers: [a1, b1, c1, c2], displayName: 'Sankalana-Vyavakalanabhyam' };
    }
  }

  const quadMatch = text.match(
    /^(-?\d*)\s*x(?:\^2|²)\s*([+-]\s*\d+)\s*x\s*([+-]\s*\d+)\s*=\s*0$/i,
  );
  if (quadMatch) {
    const aStr = quadMatch[1].trim();
    const a = aStr === '' ? 1 : aStr === '-' ? -1 : Number(aStr);
    const b = Number(quadMatch[2].replace(/\s+/g, ''));
    const c = Number(quadMatch[3].replace(/\s+/g, ''));
    if (Number.isFinite(a) && a !== 0 && Number.isFinite(b) && Number.isFinite(c)) {
      return { sutra: 'puranapuranabhyam', numbers: [a, b, c], displayName: 'Puranapuranabhyam' };
    }
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
    case 'yaavadunam':
      return numbers[0] !== undefined ? yaavadunam(numbers[0]) : null;
    case 'sankalana':
      return numbers.length >= 4 ? sankalanaSymmetric(numbers[0], numbers[1], numbers[2], numbers[3]) : null;
    case 'puranapuranabhyam':
      return numbers.length >= 3 ? puranapuranabhyam(numbers[0], numbers[1], numbers[2]) : null;
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
      const k = kaprekarDetailed(numbers[0]);
      if (k.error) return { answer: null, steps: [], error: k.error };
      return {
        answer: k.steps[k.steps.length - 1]?.result ?? null,
        steps: k.steps.map((step, idx) => ({
          title: `Iteration ${idx + 1}`,
          detail: `${step.desc} − ${step.asc} = ${step.result}${step.result === 6174 ? ' (Kaprekar Constant reached!)' : ''}.`,
        })),
      };
    }
    case 'katapayadi': {
      if (!textInput?.trim()) return null;
      const k = katapayadiDetailed(textInput);
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

function loadSolveHistory(): SolveHistoryItem[] {
  try {
    const raw = localStorage.getItem('ganita-history');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch {
    return [];
  }
}

function saveSolveHistory(items: SolveHistoryItem[]) {
  try {
    localStorage.setItem('ganita-history', JSON.stringify(items.slice(0, 6)));
  } catch {
    // Ignore browser storage errors.
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
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  function close() {
    playClick();
    onClose();
  }

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        playClick();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={close}>
      <div className="help-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head-row">
          <p className="eyebrow">
            <span className="section-index">SYS //</span>Architecture
          </p>
          <button
            ref={closeButtonRef}
            type="button"
            className="modal-close"
            onPointerDown={e => spawnRipple(e)}
            onClick={close}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>
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
  { label: '98² (Yaavadunam)', prompt: '98²' },
  { label: '37 × 99 (Ekanyunena)', prompt: '37 × 99' },
  { label: '45x - 23y = 113…', prompt: '45x - 23y = 113 and 23x - 45y = 91' },
  {
    label: 'Lilavati Riddle',
    prompt:
      'One-fifth of a swarm of bees went to a lotus, one-third to a kadamba flower, three times the difference went to a kutaja, and 1 bee stayed hovering. How many bees were there?',
  },
];

function Home({
  initialPrompt,
  initialSutra,
  autoSolveOnMount,
}: {
  initialPrompt?: string;
  initialSutra?: string;
  autoSolveOnMount?: boolean;
}) {
  const [prompt, setPrompt] = useState(initialPrompt || '97 × 94');
  const [pinnedSutra, setPinnedSutra] = useState(initialSutra || '');
  const [result, setResult] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [history, setHistory] = useState<SolveHistoryItem[]>(loadSolveHistory);
  const [hoveredStepIdx, setHoveredStepIdx] = useState<number | null>(null);
  const [playbackIdx, setPlaybackIdx] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const autoRanRef = useRef(false);
  const inputSurface = useSpotlightSurface({ tilt: false });
  const resultSurface = useSpotlightSurface({ tilt: true });
  const spotlightSurface = useSpotlightSurface({ tilt: true });
  const solveMagnetic = useMagnetic(5);
  const uploadMagnetic = useMagnetic(5);

  const recordHistory = useCallback((promptText: string, answerText: string, sutraName: string) => {
    const cleanPrompt = promptText.trim();
    if (!cleanPrompt || !answerText) return;
    setHistory(prev => {
      const next = [
        { id: `${Date.now()}`, prompt: cleanPrompt, answer: answerText, sutraName },
        ...prev.filter(item => item.prompt.toLowerCase() !== cleanPrompt.toLowerCase()),
      ].slice(0, 6);
      saveSolveHistory(next);
      return next;
    });
  }, []);

  const solveWithPrompt = useCallback(
    async (overridePrompt?: string, overrideImage?: UploadedImage | null) => {
      const activePrompt = (overridePrompt ?? prompt).trim();
      const activeImg = overrideImage !== undefined ? overrideImage : image;
      if (loading || (!activePrompt && !activeImg)) return;
      setLoading(true);
      setError('');
      setResult(null);
      setPlaybackIdx(null);
      setPlaying(false);
      try {
        const response = await fetch('/api/solve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: activePrompt, image: activeImg?.data, mimeType: activeImg?.mime }),
        });
        const payload = (await response.json().catch(() => null)) as (AIResponse & { error?: string }) | null;
        if (!response.ok || !payload) {
          setError(payload?.error || `The AI service returned HTTP ${response.status}.`);
          playError();
          return;
        }
        setResult(payload);
        playSolveChime();
        const aiNums = Array.isArray(payload.numbers)
          ? payload.numbers.filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
          : [];
        const resolved = dispatchSutra(payload.best_sutra ?? 'other', aiNums, payload.text_input);
        const answerLabel =
          resolved?.answer !== null && resolved?.answer !== undefined
            ? String(resolved.answer)
            : payload.ai_steps?.[payload.ai_steps.length - 1]?.title || 'AI Walkthrough';
        recordHistory(
          payload.extracted_problem || activePrompt || 'Handwritten Photo',
          answerLabel,
          payload.sutra_display_name || 'Vedic AI',
        );
      } catch {
        setError('Could not reach /api/solve. Run via Vercel deployment or `npm run dev`.');
        playError();
      } finally {
        setLoading(false);
      }
    },
    [image, loading, prompt, recordHistory],
  );

  useEffect(() => {
    if (autoRanRef.current || !autoSolveOnMount || !initialPrompt) return;
    if (inferLocalProblem(initialPrompt)) return;
    autoRanRef.current = true;
    const id = window.setTimeout(() => {
      void solveWithPrompt(initialPrompt, null);
    }, 0);
    return () => window.clearTimeout(id);
  }, [autoSolveOnMount, initialPrompt, solveWithPrompt]);

  const chooseFile = useCallback((file?: File) => {
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
            name: file.name || 'pasted-math.png',
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
        const compressedUrl = canvas.toDataURL('image/jpeg', 0.84);
        const base64 = compressedUrl.split(',')[1];
        setImage({
          name: file.name || 'pasted-math.jpg',
          data: base64,
          mime: 'image/jpeg',
          preview: compressedUrl,
          sizeKB: Math.max(1, Math.round((base64.length * 0.75) / 1024)),
        });
        setMode('image');
        setResult(null);
        setError('');
        playClick();
      };
      img.onerror = () => setError('Could not read this image. Try a JPEG, PNG, or WebP file.');
      img.src = originalUrl;
    };
    reader.readAsDataURL(file);
  }, []);

  function rotateImage90() {
    if (!image) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      const rotatedUrl = canvas.toDataURL('image/jpeg', 0.84);
      const base64 = rotatedUrl.split(',')[1];
      setImage({
        ...image,
        data: base64,
        preview: rotatedUrl,
        sizeKB: Math.max(1, Math.round((base64.length * 0.75) / 1024)),
      });
      playClick();
    };
    img.src = image.preview;
  }

  useEffect(() => {
    const onWindowPaste = (e: ClipboardEvent) => {
      if (document.querySelector('[role="dialog"]')) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            chooseFile(file);
            return;
          }
        }
      }
    };
    window.addEventListener('paste', onWindowPaste);
    return () => window.removeEventListener('paste', onWindowPaste);
  }, [chooseFile]);

  const inferred = useMemo(() => inferLocalProblem(prompt), [prompt]);
  const activeSutra = result?.best_sutra ?? inferred?.sutra ?? 'other';
  const activeNumbers = useMemo(() => {
    if (result) {
      return Array.isArray(result.numbers)
        ? result.numbers.filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
        : [];
    }
    return inferred?.numbers ?? [];
  }, [inferred, result]);
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
  const standardOperationCount =
    activeNumbers.length >= 2
      ? String(Math.abs(activeNumbers[0])).length * String(Math.abs(activeNumbers[1])).length + 1
      : 0;
  const scrambledAnswer = useScrambleValue(local?.answer ?? null);

  const activeSteps = local?.steps?.length ? local.steps : (result?.ai_steps ?? []);
  const activeStepCount = activeSteps.length;

  useEffect(() => {
    if (!playing || activeStepCount === 0) return;
    const id = window.setInterval(() => {
      setPlaybackIdx(prev => {
        const next = prev === null ? 0 : prev + 1;
        if (next >= activeStepCount) {
          setPlaying(false);
          return activeStepCount - 1;
        }
        playHoverTick();
        return next;
      });
    }, 1150);
    return () => window.clearInterval(id);
  }, [playing, activeStepCount]);

  const effectiveDiagramStep = hoveredStepIdx ?? playbackIdx;

  function copyAnswer(val: number | string) {
    navigator.clipboard?.writeText(String(val));
    setCopied(true);
    playSuccess();
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="page-grid view-enter">
      <main className="workspace">
        {helpOpen ? <HelpModal onClose={() => setHelpOpen(false)} /> : null}
        <div className="title-row">
          <div>
            <p className="eyebrow">
              <span className="section-index">01 //</span>
              <Zap size={12} /> AI Snap & Solve
            </p>
            <h1>Vedic Math Workspace</h1>
            <p className="subtitle">
              Type an equation, paste a <em>Lilavati</em> riddle, or press <kbd>Ctrl+V</kbd> to drop a handwritten math screenshot.
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
          className={`input-card optical-surface ${dragging ? 'dragging' : ''}`}
          {...inputSurface}
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
              <button type="button" className={mode === 'text' ? 'active' : ''} onClick={() => setMode('text')}>
                <Calculator size={16} /> Text / Riddle
              </button>
              <button type="button" className={mode === 'image' ? 'active' : ''} onClick={() => inputRef.current?.click()}>
                <ImagePlus size={16} /> Snap / Image
              </button>
            </div>
            <div className="input-head-right">
              <span className="paste-hint">Ctrl+V image supported</span>
              <button type="button" className="help-button" onClick={() => setHelpOpen(true)} aria-label="How the AI works">
                <CircleHelp size={18} />
              </button>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={e => chooseFile(e.target.files?.[0])}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
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
              <div className="image-bar-actions">
                <button
                  type="button"
                  className="image-rotate"
                  aria-label="Rotate image 90 degrees"
                  title="Rotate 90°"
                  onClick={rotateImage90}
                >
                  <RotateCw size={15} />
                </button>
                <button
                  type="button"
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
              {loading ? (
                <div className="ocr-scan" aria-live="polite">
                  <span>SCANNING GLYPHS // ROUTING SUTRA...</span>
                  <i />
                </div>
              ) : null}
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
              setPlaybackIdx(null);
              setPlaying(false);
            }}
            onKeyDown={e => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                void solveWithPrompt();
              }
            }}
            placeholder="Try 97 × 94, 98², 65², 45x - 23y = 113 and 23x - 45y = 91, or paste a Lilavati riddle..."
          />

          <div className="quick-prompts">
            {QUICK_SAMPLES.map(sample => (
              <button
                key={sample.label}
                type="button"
                className={prompt === sample.prompt ? 'selected' : ''}
                onPointerDown={e => {
                  playClick();
                  spawnRipple(e);
                }}
                onClick={() => {
                  setPrompt(sample.prompt);
                  setPinnedSutra('');
                  setResult(null);
                  setError('');
                  setPlaybackIdx(null);
                  setPlaying(false);
                }}
              >
                {sample.label}
              </button>
            ))}
          </div>

          <div className="input-actions">
            <div className="upload-group">
              <button
                type="button"
                className="camera-button"
                {...uploadMagnetic}
                onPointerDown={e => {
                  playClick();
                  spawnRipple(e);
                }}
                onClick={() => inputRef.current?.click()}
              >
                <span className="btn-inner" data-magnetic-inner>
                  <Upload size={15} /> Upload / Paste
                </span>
              </button>
              <button
                type="button"
                className="camera-button capture-btn"
                onPointerDown={e => {
                  playClick();
                  spawnRipple(e);
                }}
                onClick={() => cameraRef.current?.click()}
              >
                <Camera size={15} /> Camera
              </button>
            </div>
            <div className="action-right">
              <span className="shortcut-hint">Ctrl + Enter</span>
              <button
                type="button"
                className="solve-button"
                {...solveMagnetic}
                onPointerDown={e => {
                  playClick();
                  spawnRipple(e, true);
                }}
                onClick={() => void solveWithPrompt()}
                disabled={loading || (!prompt.trim() && !image)}
              >
                <span className="btn-inner" data-magnetic-inner>
                  {loading ? <RefreshCw className="spin" size={16} /> : <Sparkles size={16} />}
                  {loading ? 'Analyzing...' : 'Solve with AI'}
                </span>
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="loading-card" aria-live="polite">
            <div className="loading-head">
              <RefreshCw className="spin" size={16} />
              Groq AI is analyzing the problem &amp; selecting the optimal Indian Sutra...
            </div>
            <div className="skeleton-line w-60" />
            <div className="skeleton-line w-90" />
            <div className="skeleton-line w-75" />
          </section>
        ) : local?.answer !== null && local?.answer !== undefined ? (
          <section className="result-card optical-surface" {...resultSurface}>
            <div className="result-head bg-optical-dots">
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
                    {result?.extracted_problem || prompt} = <em>{scrambledAnswer}</em>
                  </h2>
                  <button
                    type="button"
                    className="copy-btn"
                    onPointerDown={e => spawnRipple(e)}
                    onClick={() => copyAnswer(local.answer!)}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="sutra-badge">
                <Sparkles size={14} /> {displayName}
              </div>
            </div>

            {sanskritVerse ? (
              <div className="sanskrit-ribbon">
                <strong>{sanskritVerse}</strong>
                <span>{result ? `Confidence: ${result.confidence ?? 'high'}` : 'Local Preview · 0ms'}</span>
              </div>
            ) : null}

            <SutraDiagram sutra={activeSutra} numbers={activeNumbers} activeStep={effectiveDiagramStep} />

            <div className="solution-layout">
              <div className="steps-panel">
                <div className="steps-panel-head">
                  <h3 className="panel-heading">Step-by-step Vedic Execution</h3>
                  {local.steps.length > 1 ? (
                    <div className="playback-bar">
                      <button
                        type="button"
                        className={`playback-btn ${playing ? 'active' : ''}`}
                        onClick={() => {
                          playClick();
                          if (playing) {
                            setPlaying(false);
                          } else {
                            if (playbackIdx === null || playbackIdx >= local.steps.length - 1) setPlaybackIdx(0);
                            setPlaying(true);
                          }
                        }}
                      >
                        {playing ? <Pause size={11} /> : <Play size={11} />}
                        {playing ? 'Pause' : 'Animate'}
                      </button>
                      <button
                        type="button"
                        className="playback-btn"
                        onClick={() => {
                          playClick();
                          setPlaying(false);
                          setPlaybackIdx(prev => (prev === null ? 0 : Math.min(local.steps.length - 1, prev + 1)));
                        }}
                        title="Next step"
                      >
                        <SkipForward size={11} />
                      </button>
                      {playbackIdx !== null ? (
                        <button
                          type="button"
                          className="playback-btn"
                          onClick={() => {
                            playClick();
                            setPlaying(false);
                            setPlaybackIdx(null);
                          }}
                          title="Show all steps"
                        >
                          <RotateCcw size={11} />
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {local.steps.map((step, i) => {
                  const isDimmed = playbackIdx !== null && i > playbackIdx;
                  const isLinked = effectiveDiagramStep === i;
                  return (
                    <div
                      className={`step ${isLinked ? 'step-linked' : ''} ${isDimmed ? 'step-dimmed' : ''}`}
                      style={{ animationDelay: `${i * 55}ms` }}
                      key={`${step.title}-${i}`}
                      onPointerEnter={() => setHoveredStepIdx(i)}
                      onPointerLeave={() => setHoveredStepIdx(null)}
                      onFocus={() => setHoveredStepIdx(i)}
                      onBlur={() => setHoveredStepIdx(null)}
                      tabIndex={0}
                    >
                      <span>{String(i + 1).padStart(2, '0')}</span>
                      <div>
                        <strong>{step.title}</strong>
                        <p>{step.detail}</p>
                      </div>
                    </div>
                  );
                })}
                {local.error ? <p className="error-inline">{local.error}</p> : null}
              </div>

              <div className="compare-panel">
                <h3 className="panel-heading">Efficiency &amp; AI Intuition</h3>
                {showStandardComparison ? (
                  <>
                    <div className="comparison">
                      <div className="metric-tile accent">
                        <span>Vedic steps</span>
                        <strong>{local.steps.length}</strong>
                      </div>
                      <div className="metric-tile">
                        <span>Standard ops</span>
                        <strong>{standardOperationCount}</strong>
                      </div>
                    </div>
                    <div className="efficiency-bars" aria-label="Vedic step count compared with standard operations">
                      <div className="efficiency-bar-row">
                        <span>Vedic steps</span>
                        <div className="efficiency-track">
                          <i style={{ width: `${Math.min(100, (local.steps.length / standardOperationCount) * 100)}%` }} />
                        </div>
                        <strong>{local.steps.length}</strong>
                      </div>
                      <div className="efficiency-bar-row standard">
                        <span>Standard ops</span>
                        <div className="efficiency-track">
                          <i style={{ width: '100%' }} />
                        </div>
                        <strong>{standardOperationCount}</strong>
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
                      Click <strong>Solve with AI</strong> to get the algebraic proof, Groq reasoning, and historical IKS
                      context.
                    </p>
                  </div>
                )}

                {result?.historical_note ? <div className="history-footnote">{result.historical_note}</div> : null}
              </div>
            </div>
          </section>
        ) : result ? (
          <section className="result-card optical-surface" {...resultSurface}>
            <div className="result-head bg-optical-dots">
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
                    <div
                      className={`step ${hoveredStepIdx === i ? 'step-linked' : ''}`}
                      style={{ animationDelay: `${i * 55}ms` }}
                      key={`${step.title}-${i}`}
                      onPointerEnter={() => setHoveredStepIdx(i)}
                      onPointerLeave={() => setHoveredStepIdx(null)}
                      onFocus={() => setHoveredStepIdx(i)}
                      onBlur={() => setHoveredStepIdx(null)}
                      tabIndex={0}
                    >
                      <span>{String(i + 1).padStart(2, '0')}</span>
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
            <div className="empty-lead">
              <BrainCircuit size={26} />
              <p>
                {local?.error ||
                  'Ready to solve. Click "Solve with AI" for word problems, proofs, or handwritten image recognition—or pick a track below:'}
              </p>
            </div>
            <div className="capability-grid">
              <button
                type="button"
                className="capability-card"
                onClick={() => {
                  setPrompt('97 × 94');
                  playClick();
                }}
              >
                <span>01 · Arithmetic</span>
                <strong>Base Shortcuts</strong>
                <small>97 × 94 · 98²</small>
              </button>
              <button
                type="button"
                className="capability-card"
                onClick={() => {
                  playClick();
                  inputRef.current?.click();
                }}
              >
                <span>02 · Vision OCR</span>
                <strong>Snap / Paste Math</strong>
                <small>Ctrl+V or Upload</small>
              </button>
              <button
                type="button"
                className="capability-card"
                onClick={() => {
                  playClick();
                  const riddle = QUICK_SAMPLES[QUICK_SAMPLES.length - 1].prompt;
                  setPrompt(riddle);
                  void solveWithPrompt(riddle, null);
                }}
              >
                <span>03 · Sanskrit Verse</span>
                <strong>Lilavati Riddles</strong>
                <small>Run Swarm of Bees</small>
              </button>
              <button
                type="button"
                className="capability-card"
                onClick={() => {
                  setPrompt('45x - 23y = 113 and 23x - 45y = 91');
                  playClick();
                }}
              >
                <span>04 · Algebra</span>
                <strong>Symmetric Systems</strong>
                <small>Sankalana · Quadratic</small>
              </button>
            </div>
          </section>
        )}
      </main>

      <aside className="insights">
        <Crosshair className="workspace-crosshair" size={9} data-crosshair aria-hidden="true" />
        <div className="aside-head">
          <h3>Sutra Spotlight</h3>
          <span>{spotlight.badge}</span>
        </div>

        <div
          className="sutra-quote-card optical-surface"
          key={`${spotlight.id}-${spotlight.exampleProblem}`}
          {...spotlightSurface}
        >
          <div className="sutra-quote">
            <b>{spotlight.sanskrit}</b>
            <p>{spotlight.name}</p>
          </div>
          <p className="translation">{spotlight.meaning}</p>

          <div className={`spotlight-formula bg-optical-dots ${effectiveDiagramStep !== null ? 'formula-linked' : ''}`}>
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
                <li
                  key={idx}
                  className={effectiveDiagramStep === idx ? 'spotlight-step-active' : ''}
                >
                  <b>{String(idx + 1).padStart(2, '0')}</b>
                  <span>{stepText}</span>
                </li>
              ))}
            </ul>
            <div className="spotlight-answer">⇒ {spotlight.exampleAnswer}</div>
          </div>
        </div>

        {history.length > 0 ? (
          <div className="recent">
            <div className="history-head">
              <h3>Recent AI Solves</h3>
              <button
                type="button"
                className="history-clear"
                onClick={() => {
                  setHistory([]);
                  saveSolveHistory([]);
                }}
              >
                Clear
              </button>
            </div>
            {history.map(item => (
              <button
                type="button"
                className="recent-item"
                key={item.id}
                onPointerEnter={playHoverTick}
                onPointerDown={e => {
                  playClick();
                  spawnRipple(e);
                }}
                onClick={() => {
                  setPrompt(item.prompt);
                  setPinnedSutra(item.sutraName);
                  setResult(null);
                  setError('');
                  if (!inferLocalProblem(item.prompt)) {
                    void solveWithPrompt(item.prompt, null);
                  }
                }}
              >
                <div className="history-chip-meta">
                  <span>{item.prompt}</span>
                  <small>
                    = {item.answer} · {item.sutraName}
                  </small>
                </div>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        ) : null}

        <div className="recent">
          <h3>Try Related Examples</h3>
          {spotlight.quickExamples.map(item => (
            <button
              type="button"
              className="recent-item"
              key={item}
              onPointerEnter={playHoverTick}
              onPointerDown={e => {
                playClick();
                spawnRipple(e);
              }}
              onClick={() => {
                setPrompt(item);
                setPinnedSutra('');
                setResult(null);
                setError('');
                if (!inferLocalProblem(item)) {
                  void solveWithPrompt(item, null);
                }
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

function SutrasLab({ onSendToAI }: { onSendToAI: (example: string, sutraName: string, autoSolve?: boolean) => void }) {
  const [active, setActive] = useState<'Nikhilam' | 'Ekadhikena' | 'Ekanyunena' | 'Urdhva'>('Nikhilam');
  const [a, setA] = useState(97);
  const [b, setB] = useState(94);
  const [square, setSquare] = useState(65);
  const [nineDigits, setNineDigits] = useState(2);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SutraCategory>('All');
  const [selectedSutra, setSelectedSutra] = useState<{ name: string; sanskrit?: string; meaning: string; example: string } | null>(null);
  const [hoveredLabStep, setHoveredLabStep] = useState<number | null>(null);
  const calculatorSurface = useSpotlightSurface({ tilt: false });
  const tabMagnetic = useMagnetic(3);

  const local = useMemo(() => {
    if (active === 'Nikhilam') return nikhilam(a, b);
    if (active === 'Ekadhikena') return ekadhikenaSquare(square);
    if (active === 'Ekanyunena') return ekanyunena(a, nineDigits);
    return urdhva(a, b);
  }, [active, a, b, square, nineDigits]);

  const filtered = useMemo(
    () =>
      SUTRAS_CATALOG.filter(
        s =>
          (category === 'All' || s.category === category) &&
          `${s.name} ${s.sanskrit} ${s.meaning}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [category, query],
  );
  const answerDisplay = useScrambleValue(local.answer ?? null);

  const activeSutraId =
    active === 'Nikhilam'
      ? 'nikhilam'
      : active === 'Ekadhikena'
        ? 'ekadhikena'
        : active === 'Ekanyunena'
          ? 'ekanyunena'
          : 'urdhva';
  const diagramNumbers =
    active === 'Ekadhikena'
      ? [square]
      : active === 'Ekanyunena'
        ? [a, Number('9'.repeat(nineDigits))]
        : [a, b];

  function randomizeLab() {
    playClick();
    if (active === 'Nikhilam') {
      const base = Math.random() < 0.5 ? 100 : 1000;
      setA(base - randInt(2, 12));
      setB(base - randInt(2, 12));
    } else if (active === 'Ekadhikena') {
      setSquare(randInt(1, 19) * 10 + 5);
    } else if (active === 'Ekanyunena') {
      const digits = randInt(2, 3);
      setNineDigits(digits);
      setA(digits === 2 ? randInt(12, 95) : randInt(105, 980));
    } else {
      setA(randInt(12, 89));
      setB(randInt(12, 89));
    }
  }

  return (
    <div className="lab-layout view-enter">
      <main>
        <div className="lab-title-row">
          <div>
            <p className="eyebrow">
              <span className="section-index">02 //</span>Vedic Sutras Lab
            </p>
            <h1>Interactive Sutra Workbench</h1>
            <p className="subtitle">
              Experiment with deterministic Vedic algorithms and explore all 16 Sutras &amp; 13 Sub-Sutras.
            </p>
          </div>
          <div className="lab-engine-status">
            <Crosshair size={14} data-crosshair />
            <span>ENGINE / 01</span>
            <b>LOCAL DETERMINISTIC</b>
          </div>
        </div>

        <div className="sutra-tabs">
          {(['Nikhilam', 'Ekadhikena', 'Ekanyunena', 'Urdhva'] as const).map(name => (
            <button
              type="button"
              key={name}
              className={active === name ? 'active' : ''}
              {...tabMagnetic}
              onPointerEnter={playHoverTick}
              onPointerDown={e => {
                playClick();
                spawnRipple(e, active !== name);
              }}
              onClick={() => {
                setActive(name);
                setHoveredLabStep(null);
              }}
            >
              <span className="btn-inner" data-magnetic-inner>
                {name}
              </span>
            </button>
          ))}
        </div>

        <section className="calculator-card sutra-workbench optical-surface" key={active} {...calculatorSurface}>
          <div className="workbench-top">
            <div>
              <h2>
                {active === 'Nikhilam'
                  ? 'Nikhilam Navatashcaramam'
                  : active === 'Ekadhikena'
                    ? 'Ekadhikena Purvena'
                    : active === 'Ekanyunena'
                      ? 'Ekanyunena Purvena'
                      : 'Urdhva-Tiryagbhyam'}
              </h2>
              <label className="field-label">
                {active === 'Ekadhikena'
                  ? 'Square any integer ending in 5'
                  : active === 'Ekanyunena'
                    ? 'Multiply an integer by 9, 99, 999, or 9999'
                    : active === 'Nikhilam'
                      ? 'Dynamic base selection near powers of 10'
                      : 'Universal vertical-and-crosswise digit convolution'}
              </label>
            </div>
            <button type="button" className="mini-toggle" onClick={randomizeLab}>
              <Shuffle size={12} /> Randomize
            </button>
          </div>

          <div className="lab-presets">
            {active === 'Nikhilam' ? (
              <>
                <button type="button" onClick={() => { setA(97); setB(94); }}>97 × 94</button>
                <button type="button" onClick={() => { setA(104); setB(108); }}>104 × 108</button>
                <button type="button" onClick={() => { setA(996); setB(989); }}>996 × 989</button>
              </>
            ) : active === 'Ekadhikena' ? (
              <>
                <button type="button" onClick={() => setSquare(65)}>65²</button>
                <button type="button" onClick={() => setSquare(125)}>125²</button>
                <button type="button" onClick={() => setSquare(995)}>995²</button>
              </>
            ) : active === 'Ekanyunena' ? (
              <>
                <button type="button" onClick={() => { setA(37); setNineDigits(2); }}>37 × 99</button>
                <button type="button" onClick={() => { setA(458); setNineDigits(3); }}>458 × 999</button>
                <button type="button" onClick={() => { setA(7321); setNineDigits(4); }}>7321 × 9999</button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => { setA(23); setB(41); }}>23 × 41</button>
                <button type="button" onClick={() => { setA(124); setB(235); }}>124 × 235</button>
                <button type="button" onClick={() => { setA(87); setB(64); }}>87 × 64</button>
              </>
            )}
          </div>

          {active === 'Ekadhikena' ? (
            <input type="number" value={square} onChange={e => setSquare(Number(e.target.value))} />
          ) : active === 'Ekanyunena' ? (
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
          ) : (
            <div className="number-inputs">
              <input type="number" value={a} onChange={e => setA(Number(e.target.value))} />
              <span>×</span>
              <input type="number" value={b} onChange={e => setB(Number(e.target.value))} />
            </div>
          )}

          {local.answer !== null ? (
            <>
              <div className="answer-box" aria-live="polite">
                <span className="answer-prefix">=</span>
                {answerDisplay}
              </div>

              <SutraDiagram
                sutra={activeSutraId}
                numbers={diagramNumbers}
                activeStep={hoveredLabStep}
                className="lab-workbench-diagram"
              />

              <div className="lab-steps">
                {local.steps.map((step, i) => (
                  <div
                    key={`${step.title}-${i}`}
                    style={{ animationDelay: `${i * 45}ms` }}
                    onPointerEnter={() => {
                      playHoverTick();
                      setHoveredLabStep(i);
                    }}
                    onPointerLeave={() => setHoveredLabStep(null)}
                  >
                    <span>{String(i + 1).padStart(2, '0')}</span>
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

        <div className="sutra-search-label">
          <span>SEARCH THE CANON</span>
          <span>{filtered.length.toString().padStart(2, '0')} / 16 MATCHES</span>
        </div>
        <div className="search-row">
          <Search size={18} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search all 16 Vedic Sutras by Sanskrit name or meaning..."
          />
        </div>
        <div className="category-pills">
          {(['All', 'Arithmetic', 'Algebra', 'Calculus'] as const).map(cat => (
            <button
              key={cat}
              type="button"
              className={category === cat ? 'active' : ''}
              onClick={() => {
                playClick();
                setCategory(cat);
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </main>

      <aside className="sutra-list">
        <Crosshair className="workspace-crosshair" size={9} data-crosshair aria-hidden="true" />
        <div className="sutra-list-header">
          <h3>Core Sutras</h3>
          <span>{filtered.length} shown</span>
        </div>

        {selectedSutra ? (
          <div className="sutra-detail">
            <button
              type="button"
              className="detail-close"
              onPointerDown={e => spawnRipple(e)}
              onClick={() => setSelectedSutra(null)}
              aria-label="Close details"
            >
              <X size={15} />
            </button>
            {selectedSutra.sanskrit ? <span className="sutra-detail-sanskrit">{selectedSutra.sanskrit}</span> : null}
            <strong>{selectedSutra.name}</strong>
            <p>{selectedSutra.meaning}</p>
            <button
              type="button"
              className="try-sutra-btn"
              onPointerDown={e => {
                playClick();
                spawnRipple(e, true);
              }}
              onClick={() => onSendToAI(selectedSutra.example, selectedSutra.name, true)}
            >
              Try in AI Solver <ArrowRight size={13} />
            </button>
          </div>
        ) : null}

        {filtered.map((item, i) => (
          <button
            type="button"
            key={item.name}
            className={`sutra-item ${selectedSutra?.name === item.name ? 'selected' : ''}`}
            onPointerEnter={playHoverTick}
            onPointerDown={e => {
              playClick();
              spawnRipple(e);
            }}
            onClick={() => setSelectedSutra(item)}
          >
            <span>{String(i + 1).padStart(2, '0')}</span>
            <div>
              <strong>{item.name}</strong>
              <p>{item.meaning}</p>
            </div>
          </button>
        ))}

        <h3 className="sub-heading">13 Sub-Sutras (Upasutras)</h3>
        <div className="sub-grid">
          {SUB_SUTRAS_CATALOG.map(sub => (
            <button
              type="button"
              key={sub.name}
              className={selectedSutra?.name === sub.name ? 'active' : ''}
              onClick={() => {
                playClick();
                setSelectedSutra({ name: sub.name, meaning: sub.meaning, example: sub.prompt });
              }}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

function madhavaPiSeries(terms: number, accelerated: boolean) {
  let sum = 0;
  const points: number[] = [];
  const sampleStride = Math.max(1, Math.floor(terms / 48));
  for (let k = 0; k < terms; k++) {
    sum += (k % 2 === 0 ? 1 : -1) / (2 * k + 1);
    if (k % sampleStride === 0 || k === terms - 1) {
      const sign = k % 2 === 0 ? -1 : 1;
      const n = 2 * (k + 1);
      const correction = accelerated ? sign * (n / (n * n + 1)) : 0;
      points.push(4 * (sum + correction));
    }
  }
  const lastSign = (terms - 1) % 2 === 0 ? -1 : 1;
  const lastN = 2 * terms;
  const finalCorrection = accelerated ? lastSign * (lastN / (lastN * lastN + 1)) : 0;
  return { value: 4 * (sum + finalCorrection), points };
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
  const [hoveredMeru, setHoveredMeru] = useState<{ r: number; c: number } | null>(null);
  const [showFibDiagonal, setShowFibDiagonal] = useState(false);
  const [fibIdx, setFibIdx] = useState(4);
  const [sideA, setSideA] = useState(3);
  const [sideB, setSideB] = useState(4);
  const [showAreaSquares, setShowAreaSquares] = useState(false);
  const [piTerms, setPiTerms] = useState(60);
  const [madhavaAccel, setMadhavaAccel] = useState(true);
  const toolSurface = useSpotlightSurface({ tilt: true });

  const cubeResult = useMemo(() => cubeRoot(cube), [cube]);
  const kapResult = useMemo(() => kaprekarDetailed(kap), [kap]);
  const kataResult = useMemo(() => katapayadiDetailed(word), [word]);
  const piSeries = useMemo(() => madhavaPiSeries(piTerms, madhavaAccel), [piTerms, madhavaAccel]);

  const hypotenuse = Math.sqrt(sideA * sideA + sideB * sideB);
  const baudhayana = 1 + 1 / 3 + 1 / (3 * 4) - 1 / (3 * 4 * 34);
  const sqrt2Error = Math.abs((baudhayana - Math.SQRT2) / Math.SQRT2) * 100;
  const piError = Math.abs(piSeries.value - Math.PI);

  const scale = showAreaSquares ? 7.2 : 13;
  const originX = showAreaSquares ? 86 : 42;
  const originY = showAreaSquares ? 128 : 130;
  const triW = Math.round(sideA * scale);
  const triH = Math.round(sideB * scale);
  const vx = originX + triW;
  const vy = originY - triH;

  // Madhava polyline points
  const chartW = 340;
  const chartH = 92;
  const minPi = 2.6;
  const maxPi = 4.05;
  const yForPi = (val: number) =>
    Math.max(6, Math.min(chartH - 6, chartH - ((val - minPi) / (maxPi - minPi)) * (chartH - 12) - 6));
  const piRefY = yForPi(Math.PI);
  const polylinePts = piSeries.points
    .map((val, idx) => {
      const x = piSeries.points.length <= 1 ? chartW / 2 : 10 + (idx / (piSeries.points.length - 1)) * (chartW - 20);
      return `${x.toFixed(1)},${yForPi(val).toFixed(1)}`;
    })
    .join(' ');

  const fibSum = useMemo(() => {
    let sum = 0;
    for (let k = 0; k <= Math.floor(fibIdx / 2); k++) {
      const r = fibIdx - k;
      if (r < meruRows && k <= r) sum += binomial(r, k);
    }
    return sum;
  }, [fibIdx, meruRows]);

  const cubePrefix = Math.floor(Math.max(0, cube) / 1000);
  const cubeTail = String(Math.max(0, cube) % 1000).padStart(3, '0');

  return (
    <div className="scripture-page view-enter">
      <div className="scripture-title-row">
        <div>
          <p className="eyebrow">
            <span className="section-index">03 //</span>Ancient Scriptures Lab
          </p>
          <h1>Mathematics Across Indian Tradition</h1>
          <p className="subtitle">
            Explore geometry from the <em>Sulba Sutras</em>, Kerala School series convergence, Pingala’s combinatorics,
            and classical number ciphers.
          </p>
        </div>
        <div className="scripture-engine-status">
          <Crosshair size={14} data-crosshair />
          <span>ARCHIVE / 06 TOOLS</span>
          <b>LIVE EXPLORATION</b>
        </div>
      </div>

      <div className="tool-grid">
        <section className="tool-card scripture-tool optical-surface" {...toolSurface}>
          <div className="tool-head">
            <div className="tool-icon">
              <Landmark size={20} />
            </div>
            <div>
              <h2>Baudhayana Sulba Sutra</h2>
              <span className="tool-era">c. 800 BCE · Yajurveda Altar Geometry</span>
            </div>
          </div>
          <div className="tool-controls-inline">
            <div className="preset-row" style={{ marginBottom: 0 }}>
              <button type="button" onClick={() => { setSideA(3); setSideB(4); }}>(3, 4, 5)</button>
              <button type="button" onClick={() => { setSideA(5); setSideB(12); }}>(5, 12, 13)</button>
              <button type="button" onClick={() => { setSideA(8); setSideB(10); }}>(8, 10)</button>
            </div>
            <button
              type="button"
              className={`mini-toggle ${showAreaSquares ? 'active' : ''}`}
              onClick={() => {
                playClick();
                setShowAreaSquares(v => !v);
              }}
            >
              Area Squares {showAreaSquares ? 'ON' : 'OFF'}
            </button>
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
          <svg className="triangle-svg" viewBox="0 0 320 185" role="img" aria-label="Right triangle visualization">
            <defs>
              <pattern id="geometry-grid" width="12" height="12" patternUnits="userSpaceOnUse">
                <path d="M 12 0 L 0 0 0 12" fill="none" stroke="#ea580c" strokeOpacity="0.12" strokeWidth="0.6" />
              </pattern>
            </defs>
            {showAreaSquares ? (
              <>
                <rect x={originX} y={originY} width={triW} height={triW} fill="rgba(234,88,12,0.08)" stroke="#ea580c" strokeOpacity="0.45" strokeWidth="1" />
                <rect x={vx} y={vy} width={triH} height={triH} fill="rgba(234,88,12,0.08)" stroke="#ea580c" strokeOpacity="0.45" strokeWidth="1" />
              </>
            ) : null}
            <polygon
              points={`${originX},${originY} ${vx},${originY} ${vx},${vy}`}
              fill="url(#geometry-grid)"
              stroke="#ea580c"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
            <polyline
              points={`${vx - 10},${originY} ${vx - 10},${originY - 10} ${vx},${originY - 10}`}
              fill="none"
              stroke="#ea580c"
              strokeWidth="1.5"
            />
            <text x={Math.min(270, (originX + vx) / 2 - 12)} y={originY + 16}>
              a = {sideA}
            </text>
            <text x={Math.min(266, vx + 8)} y={(originY + vy) / 2 + 4}>
              b = {sideB}
            </text>
            <text x={Math.max(8, (originX + vx) / 2 - 36)} y={Math.max(14, (originY + vy) / 2 - 8)}>
              c = {hypotenuse.toFixed(2)}
            </text>
          </svg>
          <div className="formula-box bg-optical-dots">
            <strong>Baudhayana √2 Formula: 1 + 1/3 + 1/(3·4) − 1/(3·4·34)</strong>
            <span>{baudhayana.toFixed(10)}</span>
            <small>
              Modern √2: {Math.SQRT2.toFixed(10)} · Error: {sqrt2Error.toFixed(6)}%
            </small>
          </div>
        </section>

        <section className="tool-card scripture-tool optical-surface" {...toolSurface}>
          <div className="tool-head">
            <div className="tool-icon">
              <FlaskConical size={20} />
            </div>
            <div>
              <h2>Madhava–Gregory π Series</h2>
              <span className="tool-era">14th CE · Kerala School of Mathematics</span>
            </div>
          </div>
          <div className="tool-controls-inline">
            <label className="range-label" style={{ flex: 1 }}>
              Series Terms: {piTerms}
              <input
                type="range"
                min={1}
                max={500}
                value={piTerms}
                onChange={e => setPiTerms(Number(e.target.value))}
              />
            </label>
            <button
              type="button"
              className={`mini-toggle ${madhavaAccel ? 'active' : ''}`}
              onClick={() => {
                playClick();
                setMadhavaAccel(v => !v);
              }}
            >
              Madhava Correction {madhavaAccel ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="answer-box">{piSeries.value.toFixed(8)}</div>
          <svg className="madhava-svg" viewBox={`0 0 ${chartW} ${chartH}`} role="img" aria-label="Madhava series convergence waveform">
            <line x1="8" y1={piRefY} x2={chartW - 8} y2={piRefY} stroke="currentColor" strokeOpacity="0.28" strokeDasharray="4 4" />
            <text x="12" y={piRefY - 4} fontSize="9" fill="currentColor" opacity="0.6" fontFamily="var(--font-mono)">
              π = 3.141592…
            </text>
            {piSeries.points.length > 1 ? (
              <polyline fill="none" stroke="#ea580c" strokeWidth="2" strokeLinejoin="round" points={polylinePts} />
            ) : null}
          </svg>
          <div className="formula-box bg-optical-dots">
            <strong>{madhavaAccel ? 'Madhava-Accelerated Convergence' : 'Raw Leibniz-Madhava Partial Sum'}</strong>
            <small>
              Modern π: {Math.PI.toFixed(8)} · Absolute diff: {piError.toFixed(7)}
            </small>
          </div>
        </section>

        <section className="tool-card scripture-tool optical-surface" {...toolSurface}>
          <div className="tool-head">
            <div className="tool-icon">
              <Calculator size={20} />
            </div>
            <div>
              <h2>Vilokanam — Mental Cube Root</h2>
              <span className="tool-era">Vedic Upasutra · Exact Cube Inspection</span>
            </div>
          </div>
          <div className="preset-row">
            <button type="button" onClick={() => setCube(1728)}>1728</button>
            <button type="button" onClick={() => setCube(3375)}>3375</button>
            <button type="button" onClick={() => setCube(19683)}>19683</button>
            <button type="button" onClick={() => setCube(103823)}>103823</button>
          </div>
          <input type="number" value={cube} onChange={e => setCube(Number(e.target.value))} />
          <span className="cube-split-badge">
            Split: <b>{cubePrefix}</b> | <b>{cubeTail}</b>
          </span>
          <div style={{ marginTop: 4 }}>
            <div className="answer-box">{cubeResult.exact ? cubeResult.result : cubeResult.error || 'Not a perfect cube'}</div>
          </div>
          {cubeResult.steps.map((step, i) => (
            <p className="tool-note" key={`${step.title}-${i}`}>
              <strong>{step.title}:</strong> {step.detail}
            </p>
          ))}
        </section>

        <section className="tool-card scripture-tool optical-surface" {...toolSurface}>
          <div className="tool-head">
            <div className="tool-icon">
              <RefreshCw size={20} />
            </div>
            <div>
              <h2>Kaprekar’s Constant (6174)</h2>
              <span className="tool-era">1949 · D. R. Kaprekar (Indian Number Theory)</span>
            </div>
          </div>
          <div className="tool-controls-inline">
            <input
              type="number"
              min={1000}
              max={9999}
              value={kap}
              onChange={e => setKap(Number(e.target.value) || 0)}
            />
            <button
              type="button"
              className="mini-toggle"
              onClick={() => {
                playClick();
                let next = randInt(1000, 9998);
                while (new Set(String(next).split('')).size === 1) next = randInt(1000, 9998);
                setKap(next);
              }}
            >
              <Shuffle size={12} /> Random 4-Digit
            </button>
          </div>
          {kapResult.error ? (
            <p className="error-inline">{kapResult.error}</p>
          ) : (
            <div className="convergence">
              {kapResult.steps.map((step, i) => (
                <span className="convergence-step" key={`${step.result}-${i}`}>
                  <span className={`convergence-pill ${step.result === 6174 ? 'final' : ''}`}>
                    <span>{step.result}</span>
                    <small>
                      {step.desc} − {step.asc}
                    </small>
                  </span>
                  {i < kapResult.steps.length - 1 ? <ArrowRight size={13} className="convergence-arrow" /> : null}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="tool-card scripture-tool optical-surface" {...toolSurface}>
          <div className="tool-head">
            <div className="tool-icon">
              <BookOpen size={20} />
            </div>
            <div>
              <h2>Katapayadi Sankhya Cipher</h2>
              <span className="tool-era">Ancient Chronogram &amp; Carnatic Raga Encoding</span>
            </div>
          </div>
          <div className="preset-row">
            <button type="button" onPointerDown={e => { playClick(); spawnRipple(e); }} onClick={() => setWord('Mayamalavagowla')}>
              Mayamalavagowla → 15
            </button>
            <button type="button" onPointerDown={e => { playClick(); spawnRipple(e); }} onClick={() => setWord('Rama')}>
              Rama → 52
            </button>
            <button type="button" onPointerDown={e => { playClick(); spawnRipple(e); }} onClick={() => setWord('Ganita')}>
              Ganita → 153
            </button>
            <button type="button" onPointerDown={e => { playClick(); spawnRipple(e); }} onClick={() => setWord('Kalyani')}>
              Kalyani → 5131
            </button>
          </div>
          <input
            value={word}
            onChange={e => setWord(e.target.value)}
            placeholder="Enter a Sanskrit or English word..."
            style={{ width: '100%' }}
          />
          <div className="token-strip" aria-label="Consonant digit breakdown">
            {kataResult.tokens.slice(0, 14).map((tok, i) => (
              <span key={i} className={`token-pill ${tok.digit === null ? 'ignored' : ''}`}>
                {tok.token}
                {tok.digit !== null ? <b>→{tok.digit}</b> : null}
              </span>
            ))}
          </div>
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

        <section className="tool-card scripture-tool optical-surface" {...toolSurface}>
          <div className="tool-head">
            <div className="tool-icon">
              <FileImage size={20} />
            </div>
            <div>
              <h2>Pingala’s Meru Prastara</h2>
              <span className="tool-era">c. 300 BCE · Chandas Shastra Combinatorics</span>
            </div>
          </div>
          <div className="tool-controls-inline">
            <label className="range-label" style={{ flex: 1 }}>
              Rows: {meruRows}
              <input
                type="range"
                min={2}
                max={8}
                value={meruRows}
                onChange={e => {
                  const nextRows = Number(e.target.value);
                  setMeruRows(nextRows);
                  setFibIdx(f => Math.min(f, nextRows - 1));
                }}
              />
            </label>
            <button
              type="button"
              className={`mini-toggle ${showFibDiagonal ? 'active' : ''}`}
              onClick={() => {
                playClick();
                setShowFibDiagonal(v => !v);
              }}
            >
              Virahanka Diagonal {showFibDiagonal ? `= ${fibSum}` : ''}
            </button>
          </div>
          {showFibDiagonal ? (
            <label className="range-label" style={{ marginBottom: 4 }}>
              Diagonal Index n = {fibIdx} (Fibonacci Sum = {fibSum})
              <input
                type="range"
                min={0}
                max={meruRows - 1}
                value={fibIdx}
                onChange={e => setFibIdx(Number(e.target.value))}
              />
            </label>
          ) : null}
          <div className="meru">
            {Array.from({ length: meruRows }).map((_, r) => (
              <div className="meru-row" key={r}>
                {Array.from({ length: r + 1 }).map((__, c) => {
                  const isActive = hoveredMeru?.r === r && hoveredMeru?.c === c;
                  const isParent =
                    hoveredMeru !== null &&
                    hoveredMeru.r === r + 1 &&
                    (hoveredMeru.c === c || hoveredMeru.c === c + 1);
                  const isFib = showFibDiagonal && r + c === fibIdx;
                  return (
                    <span
                      key={c}
                      className={`meru-cell ${isActive ? 'meru-active' : ''} ${isParent ? 'meru-parent' : ''} ${isFib ? 'meru-fib' : ''}`}
                      onPointerEnter={() => {
                        playHoverTick();
                        setHoveredMeru({ r, c });
                      }}
                      onPointerLeave={() => setHoveredMeru(null)}
                    >
                      {binomial(r, c)}
                    </span>
                  );
                })}
                <span className="meru-row-sum">= {2 ** r}</span>
              </div>
            ))}
          </div>
          {hoveredMeru && hoveredMeru.r > 0 ? (
            <p className="tool-note">
              <strong>Addend Identity:</strong>{' '}
              {hoveredMeru.c > 0 ? binomial(hoveredMeru.r - 1, hoveredMeru.c - 1) : 0} +{' '}
              {hoveredMeru.c < hoveredMeru.r ? binomial(hoveredMeru.r - 1, hoveredMeru.c) : 0} ={' '}
              {binomial(hoveredMeru.r, hoveredMeru.c)}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}

type QuizKind = 'nikhilam' | 'ekadhikena' | 'ekanyunena' | 'urdhva' | 'vilokanam';
type QuizFocus = 'all' | QuizKind;

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

function createQuestionByKind(kind: QuizKind, hard: boolean): GeneratedQuestion {
  if (kind === 'nikhilam') {
    const mode = hard ? randInt(1, 2) : randInt(0, 2);
    const a = mode === 0 ? randInt(88, 99) : mode === 1 ? randInt(101, 114) : randInt(986, 999);
    const b = mode === 0 ? randInt(88, 99) : mode === 1 ? randInt(101, 114) : randInt(986, 999);
    const solved = nikhilam(a, b);
    const base = pickBase(a, b);
    const answer = Number(solved.answer ?? a * b);
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
    const p = hard ? randInt(10, 24) : randInt(1, 16);
    const n = p * 10 + 5;
    const solved = ekadhikenaSquare(n);
    const answer = Number(solved.answer ?? n * n);
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
    const digits = hard || Math.random() < 0.4 ? 3 : 2;
    const n = digits === 2 ? randInt(12, 98) : randInt(105, 998);
    const nines = '9'.repeat(digits);
    const solved = ekanyunena(n, digits);
    const answer = Number(solved.answer ?? n * Number(nines));
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
    const a = hard ? randInt(24, 78) : randInt(12, 46);
    let b = hard ? randInt(24, 78) : randInt(12, 46);
    if (a === b && a % 10 === 5) b += 1;
    const solved = urdhva(a, b);
    const answer = Number(solved.answer ?? a * b);
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

  const root = hard ? randInt(21, 59) : randInt(11, 35);
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
    // Ignore browser storage errors.
  }
}

function generateFreshQuizRound(count: number, focus: QuizFocus, hard: boolean): GeneratedQuestion[] {
  const seen = loadSeenQuestionIds();
  if (seen.size > 220) seen.clear();

  const pool: QuizKind[] =
    focus === 'all' ? ['nikhilam', 'ekadhikena', 'ekanyunena', 'urdhva', 'vilokanam'] : [focus];
  const round: GeneratedQuestion[] = [];
  const roundIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    const kind = focus === 'all' ? shuffle(pool)[0] : focus;
    const orderedKind = focus === 'all' && i < pool.length ? pool[i] : kind;
    let candidate = createQuestionByKind(orderedKind, hard);
    for (let attempt = 0; attempt < 40; attempt++) {
      if (!seen.has(candidate.id) && !roundIds.has(candidate.id)) break;
      candidate = createQuestionByKind(orderedKind, hard);
    }
    round.push(candidate);
    roundIds.add(candidate.id);
    seen.add(candidate.id);
  }

  saveSeenQuestionIds(seen);
  return focus === 'all' ? shuffle(round) : round;
}

function Quiz() {
  const [bestScore, setBestScore] = useState(() => Number(localStorage.getItem('iks-best-score') || 0));
  const [roundSize, setRoundSize] = useState<5 | 10>(5);
  const [focus, setFocus] = useState<QuizFocus>('all');
  const [hardMode, setHardMode] = useState(false);
  const timeLimit = hardMode ? 12 : 20;

  const [questions, setQuestions] = useState<GeneratedQuestion[]>(() => generateFreshQuizRound(5, 'all', false));
  const [sessionScore, setSessionScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [time, setTime] = useState(20);
  const [finished, setFinished] = useState(false);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [aiExplain, setAiExplain] = useState<Record<string, QuizAIState>>({});
  const [copiedSummary, setCopiedSummary] = useState(false);

  const quizSurface = useSpotlightSurface({ tilt: false });
  const reviewSurface = useSpotlightSurface({ tilt: true });
  const quizSummarySurface = useSpotlightSurface({ tilt: true });
  const nextMagnetic = useMagnetic(4);

  useEffect(() => {
    if (finished || selected !== null || time <= 0) return;
    const id = window.setTimeout(() => setTime(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [time, selected, finished]);

  const current = questions[questionIdx];

  const pick = useCallback(
    (choice: number) => {
      if (selected !== null || time === 0 || finished || !current) return;
      setSelected(choice);
      playClick();
      if (choice === current.answer) {
        setSessionScore(value => value + 1);
        setStreak(s => s + 1);
        playSuccess();
      } else {
        setStreak(0);
        playError();
      }
    },
    [current, finished, selected, time],
  );

  const nextQuestion = useCallback(() => {
    if (!current) return;
    playClick();
    const attempt: QuizAttempt = {
      question: current,
      selected,
      timedOut: selected === null && time === 0,
      isCorrect: selected === current.answer,
      timeSpent: timeLimit - time,
    };
    const nextAttempts = [...attempts, attempt];
    setAttempts(nextAttempts);

    if (questionIdx === questions.length - 1) {
      if (sessionScore > bestScore) {
        setBestScore(sessionScore);
        localStorage.setItem('iks-best-score', String(sessionScore));
      }
      setFinished(true);
      playSuccess();
      return;
    }

    setQuestionIdx(value => value + 1);
    setSelected(null);
    setTime(timeLimit);
  }, [attempts, bestScore, current, questionIdx, questions.length, selected, sessionScore, time, timeLimit]);

  useEffect(() => {
    if (finished || !current) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]')) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (['1', '2', '3', '4'].includes(e.key) && selected === null && time > 0) {
        const idx = Number(e.key) - 1;
        if (current.choices[idx] !== undefined) {
          e.preventDefault();
          pick(current.choices[idx]);
        }
      } else if ((e.key === 'Enter' || e.key === ' ') && (selected !== null || time === 0)) {
        e.preventDefault();
        nextQuestion();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [current, finished, nextQuestion, pick, selected, time]);

  function startCustomRound(nextSize = roundSize, nextFocus = focus, nextHard = hardMode) {
    playClick();
    const nextLimit = nextHard ? 12 : 20;
    setRoundSize(nextSize);
    setFocus(nextFocus);
    setHardMode(nextHard);
    setQuestions(generateFreshQuizRound(nextSize, nextFocus, nextHard));
    setSessionScore(0);
    setStreak(0);
    setQuestionIdx(0);
    setSelected(null);
    setTime(nextLimit);
    setAttempts([]);
    setAiExplain({});
    setFinished(false);
  }

  function retryMissedQuestions() {
    const missed = attempts.filter(a => !a.isCorrect).map(a => a.question);
    if (!missed.length) return;
    playClick();
    setQuestions(missed);
    setSessionScore(0);
    setStreak(0);
    setQuestionIdx(0);
    setSelected(null);
    setTime(timeLimit);
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
        playError();
        setAiExplain(prev => ({
          ...prev,
          [q.id]: { loading: false, error: payload?.error || `AI service returned HTTP ${response.status}.` },
        }));
        return;
      }
      setAiExplain(prev => ({ ...prev, [q.id]: { loading: false, data: payload } }));
      playSuccess();
    } catch {
      playError();
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
    const missedCount = attempts.filter(a => !a.isCorrect).length;

    return (
      <div className="quiz-page view-enter">
        <div className="quiz-head">
          <div>
            <p className="eyebrow">
              <span className="section-index">04 //</span>Speed Quiz · Complete Review
            </p>
            <h1>Challenge Results &amp; Vedic Solutions</h1>
            <p className="subtitle">
              Inspect the deterministic Vedic method for every question, or ask Groq AI for deeper intuition.
            </p>
          </div>
          <button
            type="button"
            className="next-button"
            {...nextMagnetic}
            onPointerDown={e => spawnRipple(e, true)}
            onClick={() => startCustomRound()}
          >
            <span className="btn-inner" data-magnetic-inner>
              <RefreshCw size={15} /> New Fresh Quiz
            </span>
          </button>
        </div>

        <section className="quiz-summary-card optical-surface" {...quizSummarySurface}>
          <div className="summary-main">
            <div className="completion-trophy">
              <Trophy size={34} />
            </div>
            <div>
              <h2>
                {sessionScore} / {questions.length}
              </h2>
              <p className="quiz-sub" style={{ textAlign: 'left' }}>
                {sessionScore === questions.length
                  ? 'Flawless run! Pure mental Vedic speed.'
                  : sessionScore >= Math.ceil(questions.length * 0.6)
                    ? 'Solid work! Review the Vedic shortcuts below to hit 100%.'
                    : 'Great practice! Study the step-by-step Sutras below and retry.'}
              </p>
            </div>
          </div>

          <div className="summary-stats">
            <div className="metric-tile accent">
              <span>Accuracy</span>
              <strong>{accuracy}%</strong>
            </div>
            <div className="metric-tile">
              <span>Avg. Time</span>
              <strong>{avgTime}s</strong>
            </div>
            <div className="metric-tile">
              <span>Best Score</span>
              <strong>{Math.max(bestScore, sessionScore)}</strong>
            </div>
          </div>
        </section>

        <div className="review-list">
          {attempts.map((item, idx) => {
            const aiState = aiExplain[item.question.id];
            return (
              <article
                className={`review-card optical-surface ${item.isCorrect ? 'is-correct' : 'is-wrong'}`}
                style={{ animationDelay: `${idx * 55}ms` }}
                {...reviewSurface}
                key={`${item.question.id}-${idx}`}
              >
                <div className="review-top">
                  <div className="review-title-group">
                    <span className={`review-status ${item.isCorrect ? 'ok' : item.timedOut ? 'timeout' : 'bad'}`}>
                      {item.isCorrect ? (
                        <>
                          <Check size={12} /> Correct
                        </>
                      ) : item.timedOut ? (
                        <>
                          <Clock3 size={12} /> Timed Out
                        </>
                      ) : (
                        <>
                          <X size={12} /> Incorrect
                        </>
                      )}
                    </span>
                    <h3>
                      Q{idx + 1}. {item.question.q} = <em>{item.question.answer}</em>
                    </h3>
                  </div>
                  <div className="sutra-badge">
                    <Sparkles size={13} /> {item.question.methodName}
                  </div>
                </div>

                <div className="review-answers-row">
                  <span>
                    Your answer:{' '}
                    <strong className={item.isCorrect ? 'ans-ok' : 'ans-bad'}>
                      {item.timedOut ? 'No answer (time up)' : item.selected}
                    </strong>
                  </span>
                  <span>
                    Correct answer: <strong className="ans-ok">{item.question.answer}</strong>
                  </span>
                  <span>
                    Time: <strong>{item.timeSpent}s</strong>
                  </span>
                </div>

                <div className="review-method-box">
                  <div className="review-method-head">
                    <h4>
                      <ShieldCheck size={14} /> Vedic Method ({item.question.hint})
                    </h4>
                    <button
                      type="button"
                      className="ai-explain-btn"
                      disabled={aiState?.loading || Boolean(aiState?.data)}
                      onPointerDown={e => spawnRipple(e)}
                      onClick={() => {
                        playClick();
                        void explainWithAI(item.question);
                      }}
                    >
                      {aiState?.loading ? (
                        <>
                          <RefreshCw className="spin" size={13} /> Asking AI...
                        </>
                      ) : aiState?.data ? (
                        <>
                          <Check size={13} /> AI Explained
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} /> Explain with AI
                        </>
                      )}
                    </button>
                  </div>

                  <div className="review-steps">
                    {item.question.steps.map((step, sIdx) => (
                      <div className="review-step" key={`${step.title}-${sIdx}`}>
                        <span>{String(sIdx + 1).padStart(2, '0')}</span>
                        <div>
                          <strong>{step.title}:</strong> {step.detail}
                        </div>
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
          {missedCount > 0 ? (
            <button type="button" className="retry-missed-btn" onClick={retryMissedQuestions}>
              <RotateCcw size={15} /> Retry {missedCount} Missed Question{missedCount > 1 ? 's' : ''}
            </button>
          ) : null}
          <button
            type="button"
            className="retry-missed-btn"
            onClick={() => {
              navigator.clipboard?.writeText(
                `GanitaAI Speed Quiz: ${sessionScore}/${questions.length} (${accuracy}% accuracy, ${avgTime}s avg)`,
              );
              setCopiedSummary(true);
              playSuccess();
              window.setTimeout(() => setCopiedSummary(false), 1600);
            }}
          >
            {copiedSummary ? <Check size={15} /> : <Copy size={15} />}
            {copiedSummary ? 'Score Copied' : 'Copy Summary'}
          </button>
          <button
            type="button"
            className="next-button"
            {...nextMagnetic}
            onPointerDown={e => spawnRipple(e, true)}
            onClick={() => startCustomRound()}
          >
            <span className="btn-inner" data-magnetic-inner>
              <RefreshCw size={15} /> Play Another Fresh Round
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-page view-enter">
      <div className="quiz-head">
        <div>
          <p className="eyebrow">
            <span className="section-index">04 //</span>Speed Quiz · Dynamic Generator
          </p>
          <h1>Vedic Math Sprint</h1>
          <p className="subtitle">
            {roundSize} fresh non-repeating problems under a {timeLimit}-second clock. Press <kbd>1–4</kbd> &amp;{' '}
            <kbd>Enter</kbd> for keyboard speed.
          </p>
        </div>
        <div className="score-pill">
          <Trophy size={20} />
          <strong>{sessionScore}</strong>
          <span>session · {bestScore} best</span>
          {streak >= 2 ? <span className="streak-chip">{streak}x Streak</span> : null}
        </div>
      </div>

      <div className="quiz-controls-bar">
        <div className="quiz-pill-group" role="group" aria-label="Sutra focus">
          {(
            [
              ['all', 'All Sutras'],
              ['nikhilam', 'Nikhilam'],
              ['ekadhikena', 'Ekadhikena'],
              ['ekanyunena', 'Ekanyunena'],
              ['urdhva', 'Urdhva'],
              ['vilokanam', 'Vilokanam'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={focus === id ? 'active' : ''}
              onClick={() => startCustomRound(roundSize, id, hardMode)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="quiz-pill-group" role="group" aria-label="Length and speed">
          <button type="button" className={roundSize === 5 ? 'active' : ''} onClick={() => startCustomRound(5, focus, hardMode)}>
            5Q
          </button>
          <button type="button" className={roundSize === 10 ? 'active' : ''} onClick={() => startCustomRound(10, focus, hardMode)}>
            10Q
          </button>
          <button type="button" className={!hardMode ? 'active' : ''} onClick={() => startCustomRound(roundSize, focus, false)}>
            20s
          </button>
          <button type="button" className={hardMode ? 'active' : ''} onClick={() => startCustomRound(roundSize, focus, true)}>
            Master 12s
          </button>
        </div>
      </div>

      <section className="quiz-card optical-surface" key={current.id} {...quizSurface}>
        <div className="quiz-meta">
          <span>
            Question {questionIdx + 1} of {questions.length}
          </span>
          <span className={`timer ${time <= 5 ? 'urgent' : ''}`}>
            <Clock3 size={15} /> 00:{String(time).padStart(2, '0')}
          </span>
        </div>

        <div className="progress">
          <span style={{ width: `${((questionIdx + 1) / questions.length) * 100}%` }} />
        </div>
        <div className="timer-drain" aria-hidden="true">
          <span className={time <= 5 ? 'urgent' : ''} style={{ width: `${(time / timeLimit) * 100}%` }} />
        </div>

        <span className="quiz-hint-badge">{current.hint}</span>
        <h2>{current.q}</h2>
        <p className="quiz-sub" aria-live="polite">
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
                type="button"
                key={i}
                disabled={selected !== null || time === 0}
                aria-pressed={selected === choice}
                className={revealCorrect ? 'correct' : selectedWrong ? 'wrong' : ''}
                onPointerEnter={playHoverTick}
                onPointerDown={e => spawnRipple(e)}
                onClick={() => pick(choice)}
              >
                <span className="choice-keycap">{i + 1}</span>
                {choice}
              </button>
            );
          })}
        </div>

        <div className="quiz-footer">
          <span className="quiz-kbd-tip">Keys 1–4 to answer · Enter for next</span>
          <button
            type="button"
            className="next-button"
            {...nextMagnetic}
            disabled={selected === null && time > 0}
            onPointerDown={e => spawnRipple(e, true)}
            onClick={nextQuestion}
          >
            <span className="btn-inner" data-magnetic-inner>
              {questionIdx === questions.length - 1 ? 'View Full Solutions' : 'Next Question'}
              <ChevronRight size={16} />
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}

const VALID_TABS = new Set<Tab>(['snap', 'sutras', 'scriptures', 'quiz']);

function getInitialTab(): Tab {
  if (typeof window === 'undefined') return 'snap';
  const hash = window.location.hash.replace('#', '') as Tab;
  return VALID_TABS.has(hash) ? hash : 'snap';
}

function getInitialTheme(): 'light' | 'dark' {
  try {
    return localStorage.getItem('ganita-theme') === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export default function App() {
  const [tab, setTabState] = useState<Tab>(getInitialTab);
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sfxEnabled, setSfxEnabledState] = useState(isSfxEnabled);
  const [queued, setQueued] = useState<{ key: number; prompt: string; sutraName: string; autoSolve?: boolean } | null>(null);
  const coordRef = useRef<HTMLSpanElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const navUnderlineRef = useRef<HTMLSpanElement>(null);

  const nav = [
    { id: 'snap' as const, label: 'AI Snap & Solve', icon: Sparkles },
    { id: 'sutras' as const, label: 'Sutras Lab', icon: Calculator },
    { id: 'scriptures' as const, label: 'Scriptures Lab', icon: Landmark },
    { id: 'quiz' as const, label: 'Speed Quiz', icon: Trophy },
  ];

  const setTab = useCallback((nextTab: Tab) => {
    setTabState(nextTab);
    if (window.location.hash !== `#${nextTab}`) {
      window.history.pushState(null, '', `#${nextTab}`);
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const next = window.location.hash.replace('#', '') as Tab;
      if (VALID_TABS.has(next)) setTabState(next);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.dataset.theme = 'dark';
    } else {
      delete document.documentElement.dataset.theme;
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', theme === 'dark' ? '#09090b' : '#ffffff');
    try {
      localStorage.setItem('ganita-theme', theme);
    } catch {
      // Ignore storage errors.
    }
  }, [theme]);

  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(v => !v);
      }
    };
    window.addEventListener('keydown', onGlobalKey);
    return () => window.removeEventListener('keydown', onGlobalKey);
  }, []);

  useEffect(() => {
    let disposed = false;
    const updateUnderline = () => {
      const active = navRef.current?.querySelector<HTMLButtonElement>('[data-active="true"]');
      const underline = navUnderlineRef.current;
      if (!active || !underline) return;
      underline.style.width = `${active.offsetWidth}px`;
      underline.style.transform = `translateX(${active.offsetLeft}px)`;
    };
    updateUnderline();
    void document.fonts.ready.then(() => {
      if (!disposed) window.requestAnimationFrame(updateUnderline);
    });
    window.addEventListener('resize', updateUnderline);
    return () => {
      disposed = true;
      window.removeEventListener('resize', updateUnderline);
    };
  }, [tab]);

  useEffect(() => {
    if (!menuOpen) return;
    const mobileViewport = window.matchMedia('(max-width: 900px)');
    if (!mobileViewport.matches) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    const closeOnDesktop = () => {
      if (!mobileViewport.matches) setMenuOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    mobileViewport.addEventListener('change', closeOnDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
      mobileViewport.removeEventListener('change', closeOnDesktop);
    };
  }, [menuOpen]);

  const toggleSfx = useCallback(() => {
    setSfxEnabledState(prev => {
      const next = !prev;
      setSfxEnabled(next);
      playToggle(next);
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    playClick();
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const sendToAI = useCallback(
    (example: string, sutraName: string, autoSolve = true) => {
      setQueued(prev => ({ key: (prev?.key ?? 0) + 1, prompt: example, sutraName, autoSolve }));
      setTab('snap');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setTab],
  );

  const renderNavItems = () =>
    nav.map(item => (
      <button
        type="button"
        key={item.id}
        data-active={tab === item.id}
        className={tab === item.id ? 'active' : ''}
        onPointerDown={e => {
          playClick();
          spawnRipple(e);
        }}
        onClick={() => {
          setTab(item.id);
          setMenuOpen(false);
        }}
      >
        <item.icon size={16} />
        {item.label}
      </button>
    ));

  return (
    <>
      <OpticalStage coordRef={coordRef} />
      <div className="optical-frame">
        <div className="registration-marks" aria-hidden="true">
          <span className="registration-top-left">
            <Crosshair size={9} data-crosshair />
          </span>
          <span className="registration-top-right">
            <Crosshair size={9} data-crosshair />
          </span>
          <span className="registration-split">
            <Crosshair size={9} data-crosshair />
          </span>
          <span className="registration-bottom-left">
            <Crosshair size={9} data-crosshair />
          </span>
          <span className="registration-bottom-right">
            <Crosshair size={9} data-crosshair />
          </span>
        </div>
        <div className="app-shell">
          {helpOpen ? <HelpModal onClose={() => setHelpOpen(false)} /> : null}
          {paletteOpen ? (
            <CommandPalette
              open={paletteOpen}
              onClose={() => setPaletteOpen(false)}
              onSelectTab={setTab}
              onSendToAI={sendToAI}
              onToggleTheme={toggleTheme}
              onToggleSfx={toggleSfx}
              theme={theme}
              sfxEnabled={sfxEnabled}
              sutras={SUTRAS}
              subSutras={SUB_SUTRAS_CATALOG}
            />
          ) : null}

          <header className="topbar">
            <button
              type="button"
              className="mobile-menu"
              onPointerDown={e => {
                playClick();
                spawnRipple(e);
              }}
              onClick={() => setMenuOpen(value => !value)}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="brand">
              <div className="brand-mark">
                <span className="brand-glyph">ग</span>
              </div>
              <span className="brand-name">
                Ganita<span>AI</span>
              </span>
            </div>

            <nav ref={navRef} className={menuOpen ? 'open' : ''}>
              {renderNavItems()}
              <span ref={navUnderlineRef} className="nav-underline" aria-hidden="true" />
            </nav>

            <div className="topbar-right">
              <span ref={coordRef} className="pointer-coordinates" aria-hidden="true">
                X:0000 Y:0000
              </span>
              <button
                type="button"
                className="cmd-trigger"
                onClick={() => {
                  playClick();
                  setPaletteOpen(true);
                }}
                aria-label="Open command palette"
                title="Quick Jump (Ctrl+K / Cmd+K)"
              >
                <Search size={13} />
                <kbd>⌘K</kbd>
              </button>
              <button
                type="button"
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                title={`Switch to ${theme === 'light' ? 'Obsidian Dark' : 'Optical Light'} theme`}
              >
                {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
              </button>
              <button
                type="button"
                className="sfx-toggle"
                onClick={toggleSfx}
                aria-label={`${sfxEnabled ? 'Disable' : 'Enable'} sound effects`}
                title="Toggle sound effects"
              >
                {sfxEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                <span>SFX</span>
              </button>
              <button
                type="button"
                className="info-pill"
                aria-label="About GanitaAI's neuro-symbolic architecture"
                onPointerDown={e => {
                  playClick();
                  spawnRipple(e);
                }}
                onClick={() => setHelpOpen(true)}
              >
                <span className="neuro-led" />
                <ShieldCheck aria-hidden="true" className="neuro-icon" size={14} />
                <span className="neuro-label">NEURO-SYMBOLIC</span>
              </button>
            </div>
          </header>

          {menuOpen ? (
            <div className="mobile-nav-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          ) : null}
          <aside
            id="mobile-navigation"
            className={`mobile-drawer${menuOpen ? ' open' : ''}`}
            aria-label="Mobile navigation"
            aria-hidden={!menuOpen}
          >
            <div className="mobile-drawer-head">
              <div className="mobile-drawer-brand">
                <div className="brand-mark">
                  <span className="brand-glyph">ग</span>
                </div>
                <span className="brand-name">
                  Ganita<span>AI</span>
                </span>
              </div>
              <button
                className="mobile-drawer-close"
                type="button"
                onPointerDown={e => {
                  playClick();
                  spawnRipple(e);
                }}
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mobile-drawer-nav">
              <p className="drawer-section-label">NAVIGATION // 04 MODULES</p>
              {nav.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={`mobile-drawer-item${tab === item.id ? ' active' : ''}`}
                  onPointerDown={e => {
                    playClick();
                    spawnRipple(e);
                  }}
                  onClick={() => {
                    setTab(item.id);
                    setMenuOpen(false);
                  }}
                >
                  <span className="drawer-item-index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="drawer-item-icon">
                    <item.icon size={16} />
                  </span>
                  <span className="drawer-item-label">{item.label}</span>
                  <ChevronRight className="drawer-item-arrow" size={14} />
                </button>
              ))}
            </div>
            <div className="mobile-drawer-foot">
              <button
                type="button"
                className="drawer-engine bg-optical-dots"
                onPointerDown={e => {
                  playClick();
                  spawnRipple(e);
                }}
                onClick={() => {
                  setMenuOpen(false);
                  setHelpOpen(true);
                }}
                aria-label="About GanitaAI's neuro-symbolic architecture"
              >
                <span className="drawer-engine-status">
                  <span className="neuro-led" />
                  <span>NEURO-SYMBOLIC ENGINE</span>
                  <ChevronRight size={14} />
                </span>
                <span className="drawer-engine-caption">AI perception · deterministic calculations</span>
              </button>
              <button
                type="button"
                className="drawer-sfx-toggle"
                onPointerDown={e => spawnRipple(e)}
                onClick={toggleTheme}
              >
                <span className="drawer-sfx-label">
                  APPEARANCE <strong>{theme === 'light' ? 'OPTICAL WHITE' : 'OBSIDIAN DARK'}</strong>
                </span>
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              <button
                type="button"
                className="drawer-sfx-toggle"
                onPointerDown={e => spawnRipple(e)}
                onClick={toggleSfx}
                aria-label={`${sfxEnabled ? 'Disable' : 'Enable'} sound effects`}
              >
                <span className="drawer-sfx-label">
                  SOUND EFFECTS <strong>SFX: {sfxEnabled ? 'ON' : 'OFF'}</strong>
                </span>
                {sfxEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>
          </aside>

          {tab === 'snap' ? (
            <Home
              key={queued?.key ?? 0}
              initialPrompt={queued?.prompt}
              initialSutra={queued?.sutraName}
              autoSolveOnMount={queued?.autoSolve}
            />
          ) : tab === 'sutras' ? (
            <SutrasLab onSendToAI={sendToAI} />
          ) : tab === 'scriptures' ? (
            <ScripturesLab />
          ) : (
            <Quiz />
          )}
        </div>
      </div>
    </>
  );
}
